import JSZip from 'jszip';
import saveAs from 'file-saver';
import { AnkiCard, AnkiNoteType } from './types.ts';
import { createAnkiDatabase } from './anki-db.ts';
import { getMedia } from './db.ts';

export type ExportDeckErrorCode =
  | 'NO_CARDS'
  | 'DATABASE_CREATION_FAILED'
  | 'PACKAGE_GENERATION_FAILED';

export class ExportDeckError extends Error {
  code: ExportDeckErrorCode;
  cause?: unknown;

  constructor(code: ExportDeckErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'ExportDeckError';
    this.code = code;
    this.cause = cause;
  }
}

export const isExportDeckError = (error: unknown): error is ExportDeckError =>
  error instanceof ExportDeckError;

/**
 * Generates an Anki-compatible .apkg file.
 * 
 * The .apkg is a ZIP file containing:
 * 1. 'collection.anki2' - The SQLite database.
 * 2. 'media' - A JSON file mapping numeric indices to filenames.
 * 3. Actual media files referenced in the database.
 * 
 * @param cards - The list of cards to export
 * @param tags - The tags to add to each card
 * @param deckName - The name to be used for the filename and deck inside Anki
 * @param noteType - The definition of the Note Type (fields, templates)
 */
export const generateAnkiDeck = async (
  cards: AnkiCard[],
  tags: string[],
  deckName: string,
  noteType: AnkiNoteType
) => {
  if (cards.length === 0) {
    throw new ExportDeckError('NO_CARDS', 'Deck export requires at least one card.');
  }

  const zip = new JSZip();
  const mediaMap: Record<string, string> = {};
  let mediaIndex = 0;
  
  // Capture a single timestamp for this export session to ensure consistency
  // between the SQLite DB (which uses this for filenames) and the Zip media map.
  const creationTime = Date.now();

  // 1. Generate SQLite Database
  // Note: createAnkiDatabase logic remains mostly the same, relying on properties of 'card'
  // We need to ensure that the logic there checks refs existence.
  try {
    const dbData = await createAnkiDatabase(cards, tags, deckName, noteType, creationTime);
    zip.file("collection.anki2", dbData);
  } catch (e) {
    console.debug('[export] Failed to generate Anki database', e);
    throw new ExportDeckError(
      'DATABASE_CREATION_FAILED',
      'Failed to create collection database for deck export.',
      e,
    );
  }

  // 2. Process Media (Async loop)
  // We use a for-loop to handle async await correctly
  for (let index = 0; index < cards.length; index++) {
    const card = cards[index];

    // Process Image (Screenshot)
    if (card.screenshotRef) {
      const data = await getMedia(card.screenshotRef);
      if (data && typeof data === 'string') {
          const extension = "jpg";
          const filename = `subs2anki_${index}_${creationTime}.${extension}`;
          
          const zipName = mediaIndex.toString();
          const base64Data = data.split(',')[1];
          
          zip.file(zipName, base64Data, { base64: true });
          mediaMap[zipName] = filename;
          mediaIndex++;
      }
    }

    // Process Audio Blob
    if (card.audioRef) {
      const blob = await getMedia(card.audioRef);
      if (blob && blob instanceof Blob) {
          const extension = "wav";
          const filename = `subs2anki_audio_${index}_${creationTime}.${extension}`;

          const zipName = mediaIndex.toString();
          zip.file(zipName, blob);

          mediaMap[zipName] = filename;
          mediaIndex++;
      }
    }
  }

  // 3. Add Media Map
  zip.file("media", JSON.stringify(mediaMap));

  // 4. Generate and Download
  try {
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `${deckName || 'Subs2Anki_Export'}.apkg`);
  } catch (e) {
    throw new ExportDeckError(
      'PACKAGE_GENERATION_FAILED',
      'Failed to package deck export file.',
      e,
    );
  }
};
