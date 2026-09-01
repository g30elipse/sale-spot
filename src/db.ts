// Tiny IndexedDB key-value store: three keys (settings, items, orders).
// ponytail: whole-slice writes; move orders to per-record store when history grows past a few thousand.
const NAME = 'bytes-pos'
const STORE = 'kv'
let dbp: Promise<IDBDatabase> | undefined

function open(): Promise<IDBDatabase> {
  return (dbp ||= new Promise((res, rej) => {
    const r = indexedDB.open(NAME, 1)
    r.onupgradeneeded = () => r.result.createObjectStore(STORE)
    r.onsuccess = () => res(r.result)
    r.onerror = () => rej(r.error)
  }))
}

export async function kvGet<T>(key: string): Promise<T | undefined> {
  const db = await open()
  return new Promise((res, rej) => {
    const r = db.transaction(STORE).objectStore(STORE).get(key)
    r.onsuccess = () => res(r.result as T | undefined)
    r.onerror = () => rej(r.error)
  })
}

export async function kvSet(key: string, val: unknown): Promise<void> {
  const db = await open()
  return new Promise((res, rej) => {
    const t = db.transaction(STORE, 'readwrite')
    t.objectStore(STORE).put(val, key)
    t.oncomplete = () => res()
    t.onerror = () => rej(t.error)
  })
}
