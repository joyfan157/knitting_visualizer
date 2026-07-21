import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Swatch } from './types'
import { normalizeSwatch } from './migrate'

// Local-first storage: swatches live in the browser's IndexedDB.
// JSON export/import (in App.tsx) provides backup + portability.

interface KnittingDB extends DBSchema {
  swatches: {
    key: string
    value: Swatch
    indexes: { 'by-createdAt': string }
  }
}

let dbPromise: Promise<IDBPDatabase<KnittingDB>> | null = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<KnittingDB>('knitting-visualizer', 1, {
      upgrade(db) {
        const store = db.createObjectStore('swatches', { keyPath: 'id' })
        store.createIndex('by-createdAt', 'createdAt')
      },
    })
  }
  return dbPromise
}

/** All swatches, newest first (normalized to the current shape on read). */
export async function getAllSwatches(): Promise<Swatch[]> {
  const db = await getDB()
  const all = await db.getAllFromIndex('swatches', 'by-createdAt')
  return all.reverse().map(normalizeSwatch)
}

export async function saveSwatch(swatch: Swatch): Promise<void> {
  const db = await getDB()
  await db.put('swatches', swatch)
}

export async function deleteSwatch(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('swatches', id)
}

/** Bulk upsert, used by JSON import. Normalizes older shapes on the way in. */
export async function importSwatches(swatches: unknown[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('swatches', 'readwrite')
  await Promise.all(swatches.map((s) => tx.store.put(normalizeSwatch(s))))
  await tx.done
}
