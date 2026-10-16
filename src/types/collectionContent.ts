export type CollectionContentTab = 'summary' | 'products' | 'production' | 'campaigns' | 'files';
export type CollectionEntryKind = 'product' | 'production' | 'campaign';
export type CollectionEntryStatus = 'planned' | 'in_progress' | 'completed';

interface EntryBase {
  title: string;
  notes: string;
  status: CollectionEntryStatus;
  date: string | null;
}
export type CollectionEntryInput = EntryBase & (
  { kind: 'product'; sku: string; quantity: number | null; unitPrice: number | null }
  | { kind: 'production' | 'campaign' }
);
export type CollectionEntry = CollectionEntryInput & { id: string };
export interface CollectionFile { id: string; assetId: string }
export interface CollectionContent { entries: CollectionEntry[]; files: CollectionFile[] }
export interface CollectionView { collectionId: string | null; tab: CollectionContentTab }
