import JSZip from 'jszip';
import saveAs from 'file-saver';
import { AnkiCard } from './types';

export const generateAnkiDeck = async (cards: AnkiCard[], deckName: string) => {
  if (cards.length === 0) return;

  const zip = new JSZip();
  const mediaFolder = zip.folder("media");
  let csvContent = "# separator:Tab\n# html:true\n# tags:Sub2AnkiAI\n";

  cards.forEach((card, index) => {
      // Create a unique filename for the image
      const safeFilename = `image_${index}_${Date.now()}.jpg`;
      
      // Add image to zip if it exists
      if (card.screenshotDataUrl) {
          const base64Data = card.screenshotDataUrl.split(',')[1];
          mediaFolder?.file(safeFilename, base64Data, { base64: true });
      }

      // CSV Format: Text [TAB] Translation <br> Notes [TAB] <img src="..."> [TAB] [Sound:...]
      const front = card.text.replace(/\t/g, ' '); // sanitize tabs
      const back = `<b>${card.translation}</b><br><br><small>${card.notes.replace(/\n/g, '<br>')}</small>`;
      const media = card.screenshotDataUrl ? `<img src="${safeFilename}">` : '';
      
      csvContent += `${front}\t${back}\t${media}\n`;
  });

  zip.file("import.txt", csvContent);
  
  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, `AnkiDeck-${deckName || 'export'}.zip`);
};