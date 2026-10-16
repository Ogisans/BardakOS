# Kurgusal Supabase çalışma alanı

Bağlı teslim projesi zaten kuruludur. Mevcut projede migration/seed/reset'i tekrar çalıştırmayın.

Başka boş projeye kurulum gerekiyorsa proje sahibinin SQL Editor oturumunda sırasıyla migrations/202610160001_bardak_workspace.sql ve seed.sql uygulanır. Seed bir kurgusal workspace, dört koleksiyon, sekiz içerik ve dört dosya referansı oluşturur; gerçek işletme verisi içermez. Seed tekrarında mevcut düzenlemeler korunur ancak silinen başlangıç kayıtları geri eklenebilir.

İki hayali ve onaylı Auth kullanıcısını Dashboard'da ayrıca oluşturun. setup/memberships.sql yalnız bu kullanıcıların UUID'leri güvenilir SQL oturumunda girildiğinde admin/field üyeliğini kurar; parola bu SQL'e yazılmaz. Signup metadata rol vermez. Private şemasını Data API'ye açmayın; anonim tablo grant'i eklemeyin.

Proje URL'si ve yalnız publishable/legacy anon anahtarı Git dışındaki yerel env veya onaylanan hosting build ortamında verilir. Secret/service_role, DB parolası ve kişisel token tarayıcıya girmez. Gerekli VITE adları kök README'dedir. VITE_ENABLE_DEMO_ACCOUNTS=true yalnız alan doldurma panelini açar; gerçek Auth ve sunucu rolü korunur. Gerçek kullanıma geçerken kapatın.

Saha satış/stok/transfer/kasa, gider ve takvim oturum belleğindedir. Koleksiyon/profil ve içerik/referanslar bulutta kalıcıdır. Realtime, dosya upload veya gerçek ödeme entegrasyonu yoktur.

Kaynaklar: [Supabase React Auth](https://supabase.com/docs/guides/auth/quickstarts/react), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [API anahtarları](https://supabase.com/docs/guides/getting-started/api-keys).
