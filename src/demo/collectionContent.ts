import type { CollectionContent } from '../types/collectionContent.ts';

// Fictional product and work plans, scoped to the existing collection IDs.
export const INITIAL_COLLECTION_CONTENT: Record<string, CollectionContent> = {
  'demo-coast': {
    entries: [
      { id: 'coast-product', kind: 'product', title: 'Bisiklet Yaka Tişört', sku: 'TS-01', quantity: 40, unitPrice: 300, status: 'planned', date: null, notes: 'Beyaz ve taş rengi. S–XL beden aralığı.' },
      { id: 'coast-production', kind: 'production', title: 'Kumaş ve renk seçimi', status: 'in_progress', date: '2026-10-20', notes: 'Pamuklu kumaş seçenekleri ve renk kartelası değerlendirilecek.' },
      { id: 'coast-campaign', kind: 'campaign', title: 'Tişört stüdyo çekimi', status: 'planned', date: '2026-10-24', notes: 'Ön, arka ve yaka detay kareleri hazırlanacak.' },
    ], files: [{ id: 'coast-file', assetId: 'tshirt-sheet' }],
  },
  'demo-orbit': {
    entries: [
      { id: 'orbit-product', kind: 'product', title: 'Oversize Kapüşonlu Hoodie', sku: 'HD-01', quantity: 60, unitPrice: 450, status: 'completed', date: '2026-04-10', notes: 'Geniş kesim, kanguru cep ve düz renk seçenekleri.' },
      { id: 'orbit-production', kind: 'production', title: 'Dikiş ve son kontrol', status: 'completed', date: '2026-04-08', notes: 'Cep, kapüşon ve etek dikişleri kontrol edildi.' },
      { id: 'orbit-campaign', kind: 'campaign', title: 'Hoodie sokak çekimi', status: 'in_progress', date: '2026-10-22', notes: 'Sabah ışığında tam boy ve hareketli kareler.' },
    ], files: [{ id: 'orbit-file-a', assetId: 'hoodie-sheet' }, { id: 'orbit-file-b', assetId: 'shooting-plan' }],
  },
  'demo-line': {
    entries: [
      { id: 'line-product', kind: 'product', title: 'Ribana Yaka Sweatshirt', sku: 'SW-01', quantity: 30, unitPrice: 400, status: 'completed', date: null, notes: 'Düz kesim; yaka, kol ve etekte ribana.' },
      { id: 'line-production', kind: 'production', title: 'Paketleme', status: 'completed', date: '2026-05-12', notes: 'Beden etiketleri ve paket içerikleri kontrol edildi.' },
    ], files: [{ id: 'line-file', assetId: 'sweatshirt-sheet' }],
  },
  'demo-zero': { entries: [], files: [] },
};
