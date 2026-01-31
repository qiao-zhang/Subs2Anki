import JSZip from 'jszip';
import saveAs from 'file-saver';
import { AnkiCard, AnkiNoteType } from './types.ts';
import { createAnkiDatabase } from './anki-db.ts';
import { getMedia } from './db.ts';

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
  
  // Capture a single timestamp for this export session to ensure consistency
  // between the SQLite DB (which uses this for filenames) and the Zip media map.
  const creationTime = Date.now();

  // 1. Generate SQLite Database
  // Note: createAnkiDatabase logic remains mostly the same, relying on properties of 'card'
  // We need to ensure that the logic there checks refs existence.
  try {
    const dbData = await createAnkiDatabase(cards, deckName, noteType, creationTime);
    zip.file("collection.anki2", dbData);
  } catch (e) {
    console.error("Failed to generate Anki database", e);
    alert("Error creating Anki database. Please ensure your browser supports WASM.");
    return;
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
          const filename = `sub2anki_${index}_${creationTime}.${extension}`;
          
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
          const filename = `sub2anki_audio_${index}_${creationTime}.${extension}`;

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
  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, `${deckName || 'Sub2Anki_Export'}.apkg`);
};
