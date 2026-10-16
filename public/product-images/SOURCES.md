# Ürün görselleri — kaynak ve üretim kaydı

15 Ekim 2026. Dört görsel OpenAI'nin yerleşik imagegen aracıyla bu uygulama için üretildi (CLI/API fallback kullanılmadı). Gerçek işletme/kişi/ürün fotoğrafı değildir; üçüncü taraf stok fotoğrafı veya harici lisanslı görsel kullanılmadı. Marka baskısı, kişi, metin ve ödeme/işletme verisi yoktur. Mevcut yerel SVG teknik çizimleri Dosyalar bölümünde korundu.

Üretim çıktıları görsel içerik/kadraj değiştirilmeden JPEG kalite 88 ile sıkıştırıldı. Proje bu yerel JPEG dosyalarını kullanır; dış görsel URL'sine veya kullanıcı makinesindeki üretim klasörüne runtime bağımlılığı yoktur.

## basic-tshirt

Dosya: `public/product-images/basic-tshirt-v1.jpg`

Son prompt:

```text
Use case: product-mockup. Asset type: local apparel catalogue thumbnail for a clothing studio management app. Create ONE photorealistic premium studio flat-lay product photograph, square composition, top-down front view, a single unbranded garment neatly laid on a warm off-white matte background, soft diffuse daylight from upper left, delicate natural shadow, realistic cotton fabric texture, catalogue quality. Entire garment fully visible and centered, garment occupies about 65% of the image height, generous clean margins for responsive cropping. No human, mannequin, hanger, props, packaging, logos, lettering, labels, watermark, collage or additional garments. Subject: an ivory white basic short-sleeve crew-neck cotton t-shirt, clean straight silhouette, ribbed collar.
```

## oversize-hoodie

Dosya: `public/product-images/oversize-hoodie-v1.jpg`

Son prompt:

```text
Use case: product-mockup. Asset type: local apparel catalogue thumbnail for a clothing studio management app. Create ONE photorealistic premium studio flat-lay product photograph, square composition, top-down front view, a single unbranded garment neatly laid on a warm off-white matte background, soft diffuse daylight from upper left, delicate natural shadow, realistic cotton fabric texture, catalogue quality. Entire garment fully visible and centered, garment occupies about 65% of the image height, generous clean margins for responsive cropping. No human, mannequin, hanger, props, packaging, logos, lettering, labels, watermark, collage or additional garments. Subject: a muted sage-green oversize pullover hoodie with hood, kangaroo pocket and ribbed cuffs and hem. No zipper.
```

## crew-sweatshirt

Dosya: `public/product-images/crew-sweatshirt-v1.jpg`

Son prompt:

```text
Use case: product-mockup. Asset type: local apparel catalogue thumbnail for a clothing studio management app. Create ONE photorealistic premium studio flat-lay product photograph, square composition, top-down front view, a single unbranded garment neatly laid on a warm off-white matte background, soft diffuse daylight from upper left, delicate natural shadow, realistic cotton fabric texture, catalogue quality. Entire garment fully visible and centered, garment occupies about 65% of the image height, generous clean margins for responsive cropping. No human, mannequin, hanger, props, packaging, logos, lettering, labels, watermark, collage or additional garments. Subject: a slate-blue crew-neck long-sleeve sweatshirt, ribbed collar, cuffs and hem. No hood, no zipper.
```

## zip-sweatshirt

Dosya: `public/product-images/zip-sweatshirt-v1.jpg`

Son prompt:

```text
Use case: product-mockup. Asset type: local apparel catalogue thumbnail for a clothing studio management app. Create ONE photorealistic premium studio flat-lay product photograph, square composition, top-down front view, a single unbranded garment neatly laid on a warm off-white matte background, soft diffuse daylight from upper left, delicate natural shadow, realistic cotton fabric texture, catalogue quality. Entire garment fully visible and centered, garment occupies about 65% of the image height, generous clean margins for responsive cropping. No human, mannequin, hanger, props, packaging, logos, lettering, labels, watermark, collage or additional garments. Subject: a charcoal grey full-zip long-sleeve sweatshirt with a short stand collar, ribbed cuffs and hem, subtle center front zipper. No hood.
```

Eşleştirme: tişört / hoodie / sweatshirt / fermuarlı sweatshirt adları. Tanınmayan ürünlerde boş durum, yükleme hatasında ayrı hata görünümü vardır; hatalı ürün tipine başka bir görsel atanmaz.

