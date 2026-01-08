import JSZip from 'jszip';
import saveAs from 'file-saver';
import { AnkiCard, AnkiNoteType } from './types';
import { createAnkiDatabase } from './anki-db';

/**
 * Generates an Anki-compatible .apkg file.
 *
 * The .apkg is a ZIP file containing:
 * 1. 'collection.anki2' - The SQLite database.
 * 2. 'media' - A JSON file mapping numeric indices to filenames.
 * 3. Actual media files referenced in the database.
 *
 * @param cards - The list of cards to export
 * @param deckName - The name to be used for the filename and deck inside Anki
 * @param noteType - The definition of the Note Type (fields, templates)
 */
export const generateAnkiDeck = async (
  cards: AnkiCard[],
  deckName: string,
  noteType: AnkiNoteType
) => {
  if (cards.length === 0) {
    alert("No cards to export!");
    return;
  }

  const zip = new JSZip();
  const mediaMap: Record<string, string> = {};
  let mediaIndex = 0;

  // 1. Generate SQLite Database
  try {
    const dbData = await createAnkiDatabase(cards, deckName, noteType);
    zip.file("collection.anki2", dbData);
  } catch (e) {
    console.error("Failed to generate Anki database", e);
    alert("Error creating Anki database. Please ensure your browser supports WASM.");
    return;
  }

  // 2. Process Media
  cards.forEach((card, index) => {
    // Process Screenshot Image
    if (card.screenshotDataUrl) {
      const extension = "jpg";
      const filename = `sub2anki_${index}_${Date.now()}.${extension}`;

      const zipName = mediaIndex.toString();
      const base64Data = card.screenshotDataUrl.split(',')[1];

      zip.file(zipName, base64Data, { base64: true });

      mediaMap[zipName] = filename;
      mediaIndex++;
    }

    // Process Audio Blob
    if (card.audioBlob) {
      const extension = "wav";
      const filename = `sub2anki_audio_${index}_${Date.now()}.${extension}`;

      const zipName = mediaIndex.toString();
      zip.file(zipName, card.audioBlob);

      mediaMap[zipName] = filename;
      mediaIndex++;
    }
  });

  // 3. Add Media Map
  zip.file("media", JSON.stringify(mediaMap));

  // 4. Generate and Download
  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, `${deckName || 'Sub2Anki_Export'}.apkg`);
};