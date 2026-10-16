import { useState } from 'react';
import { ImageOff, Shirt } from 'lucide-react';
import { productImageForName } from '@/demo/productImages';

export function ProductVisual({ name, className = '' }: { name: string; className?: string }) {
  const image = productImageForName(name);
  return image ? <ResolvedVisual key={image.src} image={image} className={className} /> : <div role="img" aria-label="Görsel henüz eklenmedi" className={`flex flex-col items-center justify-center gap-2 bg-gray-50 text-gray-400 dark:bg-zinc-950 dark:text-zinc-500 ${className}`}><Shirt aria-hidden="true" className="h-8 w-8" /><span className="text-xs">Görsel henüz eklenmedi</span></div>;
}
function ResolvedVisual({ image, className }: { image: NonNullable<ReturnType<typeof productImageForName>>; className: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <div role="img" aria-label="Görsel görüntülenemedi" className={`flex flex-col items-center justify-center gap-2 bg-gray-50 text-gray-400 dark:bg-zinc-950 dark:text-zinc-500 ${className}`}><ImageOff aria-hidden="true" className="h-8 w-8" /><span className="text-xs">Görsel görüntülenemedi</span></div>;
  return <div className={`overflow-hidden bg-[#f5f2ec] ${className}`}><img src={image.src} alt={image.alt} loading="lazy" decoding="async" onError={() => setFailed(true)} className="h-full w-full object-contain" /></div>;
}
