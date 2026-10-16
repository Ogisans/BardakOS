/** Fixed local catalogue. No external URL, executable file or user upload is accepted. */
export const COLLECTION_ASSETS = [
  { id: 'tshirt-sheet', name: 'Tişört teknik çizimi', path: '/collection-assets/tshirt-sheet.svg', type: 'Çizim', image: true },
  { id: 'hoodie-sheet', name: 'Hoodie teknik çizimi', path: '/collection-assets/hoodie-sheet.svg', type: 'Çizim', image: true },
  { id: 'sweatshirt-sheet', name: 'Sweatshirt teknik çizimi', path: '/collection-assets/sweatshirt-sheet.svg', type: 'Çizim', image: true },
  { id: 'shooting-plan', name: 'Ürün çekim planı', path: '/collection-assets/shooting-plan.txt', type: 'Metin', image: false },
] as const;
export const collectionAsset = (id: string) => COLLECTION_ASSETS.find(asset => asset.id === id);
