
import { openDB, DBSchema } from 'idb';

interface MediaDB extends DBSchema {
  media: {
    key: string;
    value: Blob | string;
  };
}

const DB_NAME = 'sub2anki-media-db';
const STORE_NAME = 'media';

export const initDB = async () => {
  return openDB<MediaDB>(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(STORE_NAME);
    },
  });
};

export const storeMedia = async (id: string, data: Blob | string): Promise<void> => {
  const db = await initDB();
  await db.put(STORE_NAME, data, id);
};

export const getMedia = async (id: string): Promise<Blob | string | undefined> => {
  const db = await initDB();
  return db.get(STORE_NAME, id);
};

export const deleteMedia = async (id: string): Promise<void> => {
  const db = await initDB();
  await db.delete(STORE_NAME, id);
};

export const clearMedia = async (): Promise<void> => {
    const db = await initDB();
    await db.clear(STORE_NAME);
};
