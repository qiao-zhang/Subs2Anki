import {AnkiCard, AnkiNoteType} from './types';
import {getMedia} from './db';

/**
 * Communicates with Anki via the AnkiConnect plugin.
 * Requires Anki to be running with AnkiConnect installed.
 */

interface AnkiConnectResponse<T> {
  result: T;
  error: string | null;
}

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      // Strip "data:*/*;base64," header
      const base64 = stringToBase64(dataUrl)
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const stringToBase64 = (dataUrl: string): string => {
  return dataUrl.split(',')[1];
}

async function invoke<T>(action: string, params: any = {}, url: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({action, version: 6, params}),
      mode: 'cors', // AnkiConnect must be configured to allow CORS
    });
  } catch (e) {
    console.error(`AnkiConnect Error (${action}):`, e);
    throw e;
  }

  if (!response.ok) {
    const message = `HTTP error! status: ${response.status}`;
    console.log(message);
    throw new Error(message);
  }

  const json = await response.json() as AnkiConnectResponse<T>;

  if (json.error) {
    console.log(json.error);
    throw new Error(json.error);
  }

  return json.result;
}

/**
 * Checks if AnkiConnect is reachable and compatible.
 */
export const checkConnection = async (url: string): Promise<boolean> => {
  try {
    const version = await invoke<number>('version', {}, url);
    return version >= 6;
  } catch (e) {
    return false;
  }
};

/**
 * Syncs a list of cards to Anki.
 *
 * 1. Creates/Verifies Deck.
 * 2. Creates/Verifies Model (Note Type).
 * 3. Uploads Media.
 * 4. Adds Notes.
 */
export const syncToAnki = async (
  url: string,
  deckName: string,
  noteType: AnkiNoteType,
  cards: AnkiCard[],
  onProgress: (current: number, total: number) => void
) => {
  // 1. Create Deck
  await invoke('createDeck', {deck: deckName}, url);

  // 2. Create a new empty deck. Will not overwrite a deck that exists with the same name
  const modelNames = await invoke<string[]>('modelNames', {}, url);
  console.log(modelNames);
  if (modelNames.find(n => n === noteType.name) === undefined) {
    await invoke('createModel', {
      modelName: noteType.name,
      inOrderFields: noteType.fields.map(f => f.name),
      css: noteType.css,
      cardTemplates: noteType.templates.map(t => ({
        Name: t.Name,
        Front: t.Front,
        Back: t.Back
      }))
    }, url);
  }

  // 3. Process Cards
  const total = cards.length;
  for (let i = 0; i < total; i++) {
    const card = cards[i];
    onProgress(i + 1, total);

    const timestamp = Date.now();
    const fields: Record<string, string> = {};

    // Prepare Fields and Media
    for (const field of noteType.fields) {
      let value = '';
      if (field.source) {
        switch (field.source) {
          case 'Text':
            value = card.text;
            break;
          case 'Translation':
            value = card.translation;
            break;
          case 'Notes':
            value = card.notes;
            break;
          case 'Furigana':
            value = card.furigana || card.text;
            break;
          case 'Time':
            value = card.timestampStr;
            break;
          case 'Sequence':
            value = card.audioRef ? `sub2anki_audio_${card.id}_${timestamp}.wav` : '';
            break;
          case 'Image':
            // Handle Image
            if (card.screenshotRef) {
              const data = await getMedia(card.screenshotRef);
              if (data && typeof data === 'string') {
                const filename = `sub2anki_${card.id}_${timestamp}.jpg`;
                const base64 = stringToBase64(data);

                // We upload manually via storeMediaFile instead of addNote params for better control
                await invoke('storeMediaFile', {filename, data: base64}, url);
                value = `<img src="${filename}" alt="${card.text}">`;
              }
            }
            break;
          case 'Audio':
            if (card.audioRef) {
              const blob = await getMedia(card.audioRef);
              if (blob && blob instanceof Blob) {
                const filename = `sub2anki_audio_${card.id}_${timestamp}.wav`;
                const base64 = await blobToBase64(blob);

                await invoke('storeMediaFile', {filename, data: base64}, url);
                value = `[sound:${filename}]`;
              }
            }
            break;
        }
      }
      fields[field.name] = value;
    }

    // 4. Add Note
    try {
      const result = await invoke('addNote', {
        note: {
          deckName: deckName,
          modelName: noteType.name,
          fields: fields,
          tags: ['Sub2AnkiAI'],
          options: {
            allowDuplicate: false,
            duplicateScope: 'deck'
          }
        }
      }, url);

      // TODO: If the note was added successfully (result is the note ID), we could potentially use this info
      // but for now we just proceed with the sync
    } catch (e) {
      console.error(`Failed to add note for card ${card.id}`, e);
      // Continue to next card
    }
  }
};
