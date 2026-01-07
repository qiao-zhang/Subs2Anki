import JSZip from 'jszip';
import saveAs from 'file-saver';
import { AnkiCard } from './types';

/**
 * Generates an Anki-compatible import package (ZIP file).
 * 
 * The ZIP contains:
 * 1. A 'media' folder with all screenshots.
 * 2. An 'import.txt' file formatted as TSV (Tab Separated Values) for Anki.
 * 
 * @param cards - The list of cards to export
 * @param deckName - The name to be used for the filename
 */
export const generateAnkiDeck = async (cards: AnkiCard[], deckName: string) => {
  if (cards.length === 0) return;

  const zip = new JSZip();
  const mediaFolder = zip.folder("media");
  
  // Header for Anki import: Separator is Tab, HTML allowed, Tag added.
  let csvContent = "# separator:Tab\n# html:true\n# tags:Sub2AnkiAI\n";

  cards.forEach((card, index) => {
      // Create a unique, safe filename for the image to avoid collisions
      const safeFilename = `image_${index}_${Date.now()}.jpg`;
      
      // Add screenshot to the media folder in the zip
      if (card.screenshotDataUrl) {
          // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
          const base64Data = card.screenshotDataUrl.split(',')[1];
          mediaFolder?.file(safeFilename, base64Data, { base64: true });
      }

      // Construct the Anki Card Fields
      // Field 1: Front (Text)
      const front = card.text.replace(/\t/g, ' '); // sanitize tabs to avoid breaking CSV
      
      // Field 2: Back (Translation + Notes) - Uses HTML for formatting
      const back = `<b>${card.translation}</b><br><br><small>${card.notes.replace(/\n/g, '<br>')}</small>`;
      
      // Field 3: Image (HTML image tag referencing the file in the media folder)
      const media = card.screenshotDataUrl ? `<img src="${safeFilename}">` : '';
      
      // Append row to CSV
      csvContent += `${front}\t${back}\t${media}\n`;
  });

  // Add the text file to the root of the zip
  zip.file("import.txt", csvContent);
  
  // Generate the binary blob and trigger browser download
  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, `AnkiDeck-${deckName || 'export'}.zip`);
};