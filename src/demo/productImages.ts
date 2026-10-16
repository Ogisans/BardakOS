export const PRODUCT_IMAGES = {
  tshirt: { src: '/product-images/basic-tshirt-v1.jpg', alt: 'Beyaz bisiklet yaka tişört' },
  hoodie: { src: '/product-images/oversize-hoodie-v1.jpg', alt: 'Adaçayı yeşili oversize kapüşonlu hoodie' },
  sweatshirt: { src: '/product-images/crew-sweatshirt-v1.jpg', alt: 'Mavi ribana yaka sweatshirt' },
  zip: { src: '/product-images/zip-sweatshirt-v1.jpg', alt: 'Antrasit dik yaka fermuarlı sweatshirt' },
} as const;

/** Deterministic matching for this small fictional catalogue; unknown products stay empty. */
export function productImageForName(name: string) {
  const text = name.toLocaleLowerCase('tr-TR').normalize('NFD').replace(/\p{M}/gu, '').replace(/ı/g, 'i');
  const zipped = /fermuar|\bzip\b/.test(text);
  const hooded = /hoodie|kapuson/.test(text);
  if (zipped && hooded) return undefined; // No misleading pullover image for a zip hoodie.
  if (zipped) return PRODUCT_IMAGES.zip;
  if (hooded) return PRODUCT_IMAGES.hoodie;
  if (/sweatshirt/.test(text)) return PRODUCT_IMAGES.sweatshirt;
  if (/tisort|\bt[ -]?shirt\b/.test(text)) return PRODUCT_IMAGES.tshirt;
  return undefined;
}
