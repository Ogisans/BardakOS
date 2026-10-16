import type { Collection, CollectionInput } from '../types/collections.ts';
import { normalizeCollection } from '../domain/collections.ts';
import type { CollectionContent, CollectionEntryInput } from '../types/collectionContent.ts';
import { emptyCollectionContent, normalizeContentEntry } from '../domain/collectionContent.ts';
import { collectionAsset } from '../demo/collectionAssets.ts';

/** A future persistent adapter implements the same domain contract; no SDK reaches the UI. */
export interface CollectionsRepository {
  list(): Promise<Collection[]>;
  create(input: CollectionInput): Promise<Collection>;
  update(id: string, input: CollectionInput): Promise<Collection>;
  remove(id: string): Promise<void>;
  getContent(id: string): Promise<CollectionContent>;
  saveEntry(id: string, input: CollectionEntryInput, entryId?: string): Promise<CollectionContent>;
  removeEntry(id: string, entryId: string): Promise<CollectionContent>;
  attachFile(id: string, assetId: string): Promise<CollectionContent>;
  removeFile(id: string, fileId: string): Promise<CollectionContent>;
}

export class CollectionNotFoundError extends Error {
  constructor() { super('Koleksiyon bulunamadı. Listeyi yenileyin.'); this.name = 'CollectionNotFoundError'; }
}

export function createMemoryCollectionsRepository(
  seed: Collection[],
  options: { id?: () => string; now?: () => string; content?: Record<string, CollectionContent> } = {},
): CollectionsRepository {
  let records = structuredClone(seed);
  const id = options.id ?? (() => crypto.randomUUID());
  const now = options.now ?? (() => new Date().toISOString());
  const contents = new Map(seed.map(record => [record.id, structuredClone(options.content?.[record.id] ?? emptyCollectionContent())]));
  const content = (recordId: string) => {
    if (!records.some(record => record.id === recordId)) throw new CollectionNotFoundError();
    return contents.get(recordId)!;
  };
  return {
    async list() { return structuredClone(records); },
    async create(input) {
      const timestamp = now();
      const record: Collection = { ...normalizeCollection(input), id: id(), createdAt: timestamp, updatedAt: timestamp, source: null, manuallyEdited: false };
      records = [record, ...records];
      contents.set(record.id, emptyCollectionContent());
      return structuredClone(record);
    },
    async update(recordId, input) {
      const existing = records.find(record => record.id === recordId);
      if (!existing) throw new CollectionNotFoundError();
      const record: Collection = { ...existing, ...normalizeCollection(input), updatedAt: now(), manuallyEdited: true };
      records = records.map(item => item.id === recordId ? record : item);
      return structuredClone(record);
    },
    async remove(recordId) {
      if (!records.some(record => record.id === recordId)) throw new CollectionNotFoundError();
      records = records.filter(record => record.id !== recordId);
      contents.delete(recordId);
    },
    async getContent(recordId) { return structuredClone(content(recordId)); },
    async saveEntry(recordId, input, entryId) {
      const current = content(recordId);
      const normalized = normalizeContentEntry(input);
      const existing = entryId ? current.entries.find(entry => entry.id === entryId) : undefined;
      if (entryId && (!existing || existing.kind !== normalized.kind)) throw new Error('Bu bölümde kayıt bulunamadı.');
      const entry = { ...normalized, id: entryId ?? id() };
      current.entries = entryId ? current.entries.map(item => item.id === entryId ? entry : item) : [...current.entries, entry];
      return structuredClone(current);
    },
    async removeEntry(recordId, entryId) {
      const current = content(recordId);
      if (!current.entries.some(entry => entry.id === entryId)) throw new Error('Kayıt bulunamadı.');
      current.entries = current.entries.filter(entry => entry.id !== entryId);
      return structuredClone(current);
    },
    async attachFile(recordId, assetId) {
      const current = content(recordId);
      if (!collectionAsset(assetId)) throw new Error('Çalışma dosyası bulunamadı.');
      if (current.files.some(file => file.assetId === assetId)) throw new Error('Bu dosya koleksiyona zaten eklenmiş.');
      current.files = [...current.files, { id: id(), assetId }];
      return structuredClone(current);
    },
    async removeFile(recordId, fileId) {
      const current = content(recordId);
      if (!current.files.some(file => file.id === fileId)) throw new Error('Dosya bulunamadı.');
      current.files = current.files.filter(file => file.id !== fileId);
      return structuredClone(current);
    },
  };
}
