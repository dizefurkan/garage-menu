# Backlog — Tartışılacak Özellikler

> Oluşturma: 2026-07-26 · Son güncelleme: 2026-07-30
>
> **Durum:** Madde 5, 9, 4 ve madde 2'nin taban kısmı **yapıldı ve `main`'e
> merge edildi** (commit `34dea0d`). 6 migration canlı Supabase'e uygulandı.
> Kalan işler için aşağıdaki "Sıradaki İş Kuyruğu" bölümüne bakınız.

## Özet

| #     | Özellik                     | Grup      | Şema değişikliği     | Efor | Kapsam kararı                              |
| ----- | --------------------------- | --------- | -------------------- | ---- | ------------------------------------------ |
| 1 + 3 | Ürün önerileri (cross-sell) | Satış     | Evet (tablo + `tenant_id`) | L | ✅ Manuel **ve** otomatik, manuel öncelikli |
| 2     | Kalori (kcal) gösterimi     | Menü      | Evet (3 kolon)       | M    | ✅ Karma: varyantta mutlak, ekte delta      |
| 4     | Kategori görselleri + sıralama | Menü   | Evet (6 kolon)       | M    | ✅ **Addon değil** — tema stili + sıralama    |
| 5     | QR sipariş aç/kapat         | Operasyon | Evet (kolon)         | S    | ✅ Sipariş Ayarları'nda, sidebar'a dokunma  |
| 6     | Garson çağırma              | Operasyon | Evet (tablo + rol)   | M    | ✅ Kendi addon'u + `waiter` rolü            |
| 7     | Bölüm bazlı masa görünümü   | Operasyon | Evet (bölüm/section) | M    | ✅ Ayrı route yok — aynı sayfalar + 403     |
| 9     | Lottie boş durum + 403      | Kesişen   | Hayır                | S-M  | ✅ Ürün/Kategori/Sipariş tabloları + 403    |
| 8     | Adisyon sistemi             | Uzun vade | Evet (çok)           | XL   | ❄️ **Donduruldu** — müşteri talebi bekleniyor |

**Not:** Listedeki 1 ve 3 aynı özelliğin iki farklı ifadesi (3, 1'in pazarlama metni). Tek kalem olarak birleştirdim. Madde 9 sonradan eklendi (403 kararının yan ürünü).

**Efor değişiklikleri:** Madde 2 S→M (opsiyon bazlı kalori), madde 1+3 M→L (otomatik motor + `tenant_id` düzeltmesi), madde 7 L→M (ayrı route iptal edildi).

---

## Grup A — Menü Zenginleştirme

### 2) Kalori (kcal) gösterimi · Efor: M

**Mevcut durum.** `products` tablosunda beslenme alanı yok: `id, tenant_id, category_id, price, image_url, is_published, availability_status, unavailable_until`. Alerjen sistemi zaten var (`product_allergens`, migration `20250103000000_add_allergens.sql`) — kcal doğal olarak onun yanına oturur, aynı UI bloğunu paylaşabilir.

**Gereken.**
- Migration: `products.calories`, `product_option_values.calories`, `product_option_groups.calorie_mode` (aşağıdaki karara bakınız). Protein/karbonhidrat/yağ'a şimdilik girmiyoruz.
- Ürün formunda taban kalori alanı + her opsiyon satırında kalori alanı + grup başına mod seçimi; hepsi boş bırakılabilir.
- Public menü: ürün kartında ve detayında `320 kcal` rozeti; opsiyon seçimine göre canlı güncellenir. Boşsa hiç gösterilmez.
- i18n: `tr.json` + `en.json`.

### 🚧 Uygulama durumu (2026-07-28): taban kalori yapıldı, opsiyon kısmı **engellendi**

Uygulamaya başlayınca çıkan bulgu: **ürün varyant/opsiyon sistemi aslında yok.**

`product_option_groups` ve `product_option_values` tabloları `20250110000000_add_product_options.sql` ile açılmış ve `lib/database.types.ts`'te tanımlı. Ama:

- Admin tarafında opsiyon grubu oluşturma/düzenleme arayüzü **yok** (ürün formunda hiçbir iz yok).
- Public menüde opsiyon seçme arayüzü **yok** (`product-card.tsx`, `cart-context.tsx` opsiyon bilmiyor).
- Canlı veritabanında iki tabloda da **sıfır satır** var.

Yani şema ve sipariş tarafı tesisatı (`order_items.selected_options`) hazır, kullanıcıya dönük hiçbir parçası yapılmamış.

**Sonuç:** Aşağıdaki karma model (varyantta mutlak, ekte delta) geçerliliğini koruyor ama **şimdi uygulanamaz** — `product_option_values.calories` ve `product_option_groups.calorie_mode` kolonlarını eklemek, kimsenin dolduramayacağı boş şema üretmek olurdu.

**Yapılan:** Sadece `products.calories` (taban değer) + ürün formu alanı + public menü rozeti. Uçtan uca çalışıyor.

**Bekleyen:** Opsiyon bazlı kalori + `calorie_mode` + canlı yeniden hesaplama. Bunlar varyant sistemi UI'ı ile **aynı anda** gelmeli. Bkz. yeni madde 10.

### ✅ Karar: Karma model — varyantta **mutlak**, ek malzemede **delta**

> **Düzeltme (2026-07-27):** Önce saf `calorie_delta` önermiştim, gerekçem `price_delta` ile tutarlılıktı. Sektöre bakınca bu yanlış çıktı — aşağıdaki araştırma sonucu model değişti.

**Sektör nasıl kurguluyor?**

| Kaynak | Model |
| --- | --- |
| **ABD FDA menü etiketleme kuralı** (21 CFR 101.11) | Boy/varyantlar için **her boyun kendi mutlak kalorisi** (veya aralık: "250-500 kcal"). Ek malzemeler için **"eklenen kalori"** yani delta. |
| **Uber Eats (ABD)** | FDA kuralını uyguluyor: üründe mutlak, modifier'da `+120 Cal` |
| **Starbucks / McDonald's** | Boy başına mutlak (Tall 190 / Grande 250 / Venti 320), ek malzemede delta (krema +80) |
| **Yemeksepeti / Trendyol Yemek / Getir Yemek** | **Yapılandırılmış kalori alanı yok.** Türkiye'de restoranlar için zorunlu kalori etiketlemesi bulunmuyor; girilen kalori varsa açıklama metnine yazılıyor. |
| **QR menü SaaS'ları (Menulux, Adisyo vb.)** | Genelde üründe tek opsiyonel sayı; opsiyon kırılımı yok |

İki çıkarım:

1. **Türkiye'de bu bir uyum zorunluluğu değil, farklılaştırıcı.** Rakiplerin çoğunda düzgün kalori kırılımı yok. Doğru yaparsak ayrışırız.
2. **Ciddi olan herkes aynı karma modeli kullanıyor:** varyantta mutlak, ek malzemede delta. Sebebi de sağlam — restoranın elindeki besin değeri tablosu porsiyon başına **mutlak** değer verir ("Büyük boy: 750 kcal"). Delta istersek işletmeyi çıkarma yapmaya zorlarız, bu da hata kaynağıdır. Ek malzeme ise zaten doğal olarak delta düşünülür ("ekstra peynir 90 kcal ekler").

**Şema.**
```sql
ALTER TABLE products              ADD COLUMN calories      INTEGER;  -- taban, nullable
ALTER TABLE product_option_values ADD COLUMN calories      INTEGER;  -- nullable
ALTER TABLE product_option_groups ADD COLUMN calorie_mode  TEXT DEFAULT 'add';
  -- 'replace' → varyant grubu, seçilen opsiyonun değeri tabanı **ezer**
  -- 'add'     → ek malzeme grubu, değer tabana **eklenir**
```

`calorie_mode` varsayılanı formda akıllıca önerilir: grup `selection_type='single' AND is_required=true` ise (gerçek bir varyant grubu) `replace`, aksi halde `add`. Ama görünür ve değiştirilebilir olmalı — örtük türetme sürpriz üretir.

**Fiyattan farklı olması sorun değil.** Fiyat gerçekten delta olarak *düşünülüyor* ("büyük boy 30 lira fazla"), kalori ise mutlak olarak *biliniyor*. Aynı satırda farklı davranmaları doğru; form etiketleri bunu açıkça söylerse ("Fiyat farkı" / "Kalori") kafa karışıklığı olmaz.

```
Porsiyon (varyant · kaloriyi ezer)
  [Küçük]  [Fiyat farkı: 0,00 ₺]    [Kalori: 450 kcal]  [☑ Varsayılan]
  [Orta]   [Fiyat farkı: +15,00 ₺]  [Kalori: 600 kcal]  [ ]
  [Büyük]  [Fiyat farkı: +30,00 ₺]  [Kalori: 750 kcal]  [ ]

Ekstralar (ekleme · kaloriye eklenir)
  [Ekstra peynir]  [Fiyat farkı: +20,00 ₺]  [Kalori: +90 kcal]
```

**Hesaplama sırası:** taban → `replace` grupları (sonuncusu kazanır, normalde tek varyant grubu olur) → `add` grupları toplanır.

**Gösterim.** Müşteri hesaplanmış toplamı görür:

```
Toplam: 690 kcal                    ← seçime göre canlı güncellenir

Porsiyon:  ○ Küçük  450 kcal        ← replace: opsiyonun kendi değeri
           ● Orta   600 kcal
           ○ Büyük  750 kcal
Ekstralar: ☑ Ekstra peynir  +90 kcal ← add: üstüne eklenir
```

Seçim değiştikçe toplam canlı güncellenir. `add` gruplarında seçilen tüm değerler toplanır. `is_default=true` olan opsiyonlar ürün kartındaki ilk gösterime dahil edilir.

**Kritik: NULL ≠ 0.** Restoranların çoğu kalori girmeyecek.
- `products.calories` **NULL** → o üründe kalori hiç gösterilmez, opsiyon değerleri de yok sayılır. "0 kcal" **asla** yazılmaz.
- Taban dolu, opsiyonun `calories`'i NULL → `add` grubunda 0 kabul edilir; `replace` grubunda taban korunur.
- Yani kaloriyi açan tek anahtar taban değerdir. Formda da böyle davranmalı: taban boşken opsiyon kalori alanları pasif/gizli.

**`add` gruplarında negatif değer desteklenir** — "Soğansız −20 kcal", "Sossuz −60 kcal". `price_delta` zaten negatifi destekliyor, tutarlı.

### 4) Kategori görselleri + kategori-önce menü düzeni · Efor: M

**Mevcut durum.** ⚠️ **Düzeltme (2026-07-28):** Bu bölümün ilk hâlinde `categories` tablosunun sadece `id, tenant_id, created_at, updated_at` içerdiğini yazmıştım. **Yanlıştı** — kaynak olarak `lib/database.types.ts`'i almıştım ve o dosya gerçek şemayı yansıtmıyor.

Canlı veritabanındaki gerçek durum:
- `categories`: `id, tenant_id, display_order, is_draft, published_at, created_by, updated_by, created_at, updated_at` → **`display_order` zaten vardı**, `image_url` gerçekten yoktu ve bu migration'da eklendi.
- `products`: `id, tenant_id, category_id, price, currency, image_url, is_draft, published_at, display_order, is_available, contains_no_allergens, model_*, created_by, updated_by, ...` → **`display_order` burada da zaten vardı.**
- `products.availability_status` ve `unavailable_until` **hiç var olmadı** — bunlar sadece tip dosyasındaki kurgu kayıtlardı. Gerçek alan `is_available BOOLEAN`.

Görsel yükleme altyapısı hazır: `components/ui/image-upload.tsx` ürün formunda kullanılıyor, aynısı kategoriye takılır.

**Gereken.**
- Migration: `categories.image_url text null`, `categories.display_order integer default 0`.
- Admin kategori formuna `ImageUpload` (ürün detayındakinin aynısı) + 21:9 kırpma/uyarı notu.
- Tenant ayarı: `menu_layout` → `'products'` (mevcut) | `'categories'` (yeni).
- Public menüde yeni giriş ekranı:
  ```
  ┌──────────────────────────────────────────┐
  │  [21:9 kategori görseli]                 │
  │  Ana Yemekler                          → │
  │  12 ürün                                 │
  └──────────────────────────────────────────┘
  ```
  Satır başına bir kategori. Tıklayınca **mevcut UI'ın aynısı** açılır (kategoriler navbar'da, altında ürünler) — tek fark, navbar'ın en soluna "← Kategoriler" linki eklenir.
- i18n: `categories`, `backToCategories`, `productCount` vb.

### ✅ Karar: Üç sıralama modu

`display_order` ekleniyor, ama tek başına değil — işletme sıralama **yöntemini** seçebilmeli:

```sql
ALTER TABLE tenants ADD COLUMN category_sort TEXT DEFAULT 'manual';
  -- 'manual' | 'alphabetical' | 'popularity'
```

| Mod | Kaynak | Not |
| --- | --- | --- |
| `manual` | `categories.display_order` | Varsayılan. Sürükle-bırak sıralama. |
| `alphabetical` | `category_translations.name` | **Dile göre** sıralanır — aktif dilin çevirisine bakar. |
| `popularity` | `order_items` → sipariş adedi | Siparişler addon'u + veri gerektirir. |

**⚠️ Türkçe alfabetik sıralama tuzağı.** Varsayılan Postgres/JS sıralaması Türkçe'yi yanlış sıralar: `Ç` `C`'den hemen sonra değil, `İ`/`I` ayrımı bozuk, `Ö` `Ş` `Ü` yanlış yere düşer. Kategoriler zaten çok dilli (`category_translations`), yani sıralama **aktif dile göre** yapılmalı. En temiz yol: SQL yerine çevrilmiş adı çektikten sonra JS'te `localeCompare(lang)` ile sıralamak. Postgres tarafında `COLLATE "tr-TR-x-icu"` da çalışır ama dil başına ayrı sorgu demek.

**⚠️ `popularity` düşme (fallback) zinciri.** Siparişler addon'u kapalıysa veya hiç sipariş yoksa bu mod boş sonuç üretir. Kural: veri yoksa sessizce `manual`'a düş. Panelde mod seçilirken addon kapalıysa seçenek pasif + açıklama gösterilmeli.

### ✅ Karar: Ürünlere de sıralama — aynı migration'da

⚠️ **Düzeltme:** `products.display_order` **zaten vardı** (ilk incelemede tip dosyasına bakıp yok sanmıştım). Migration'daki `ADD COLUMN IF NOT EXISTS` bu yüzden no-op oldu — zararsız. Gerçekten eklenen tek yeni ayar:

```sql
ALTER TABLE tenants ADD COLUMN product_sort TEXT DEFAULT 'manual';
```

**Ek öneriler — ürünler için anlamlı, kategoriler için değil:**

| Mod | Neden ürüne özel |
| --- | --- |
| `price_asc` / `price_desc` | Menülerde çok yaygın; kategoride fiyat kavramı yok |
| `newest` (`created_at DESC`) | "Yeni eklenenler" vitrini |

**Asıl öneri — mod değil, üstüne binen bir kural: "tükenenler sona".**

`products.availability_status` ve `unavailable_until` zaten var ama sıralamada kullanılmıyor. Tükenmiş/müsait olmayan ürünler, seçilen mod ne olursa olsun listenin **sonuna** düşmeli. Yemek uygulamalarının tamamı böyle davranır — müşteriyi alamayacağı ürünle karşılamak dönüşümü düşürür.

Bunu ayrı bir sıralama modu yapma; **her modun üstüne uygulanan sabit bir kural** yap:

```sql
-- Gerçek kolon `is_available BOOLEAN` (types dosyasındaki `availability_status`
-- hiç var olmadı). true önce gelsin diye DESC.
ORDER BY is_available DESC, <seçili mod>, display_order
```

Tek satırlık iş, kalıcı kazanç. Bence bu maddedeki en yüksek getirili detay.

### ✅ Karar (2026-07-28): Addon değil — **tema stili**

Kategori görselleri ve kategori-önce düzen ayrı ücretli paket **değil**. Menü düzeni bir **tema tercihi** olarak konumlanıyor: renk ve yazı tipi gibi, **Ayarlar → Tema** sayfasından seçilir ve herkese açıktır.

Bu, önceki paketleme tablosundaki "zayıf addon adayı" değerlendirmesiyle de tutarlı — kozmetik bir zenginleştirmeyi paywall'un arkasına koymak temel ürünü fakirleştirirdi.

**Depolama:** `theme_config` JSONB'sine gömmek yerine ayrı kolon: `tenants.menu_layout TEXT DEFAULT 'products'`. Gerekçe — `ThemeConfigSchema` hex renk ve yazı tipi doğruluyor (`HexColorSchema`, `FontSchema`); yapısal bir düzen bayrağı oraya kavramsal olarak uymuyor ve public menüde `themeConfig.primary` CSS değişkenleriyle birlikte okunuyor. Kullanıcı açısından yine de "tema" — sadece depolama ayrı.

**Not.** Görsel yoksa ne olacak? Kategori-önce düzeni seçilip görsel yüklenmemişse ekran çirkin olur. Ya (a) görselsiz kategoriler için düz renkli fallback + baş harf, ya (b) "en az 1 kategoride görsel yoksa bu düzeni seçtirme" validasyonu. (a) daha az sürtünmeli.

---

## Grup B — Satış Artırıcı

### 1 + 3) Ürün Önerileri · "Yanında çok yakışır" · Efor: L

**Sorduğun soru: sektörde bunu nasıl yapıyorlar?**

İki net desen var, çoğu ürün ikisini birden sunuyor:

| Yaklaşım | Kim yapıyor | Nasıl | Artı / Eksi |
| --- | --- | --- | --- |
| **Manuel eşleştirme, ürün formunda** | WooCommerce ("Linked Products" sekmesi → Upsells / Cross-sells), Shopify (Search & Discovery → complementary products), Magento ("Related Products") | Ürün düzenleme sayfasında bir sekme/blok; çoklu ürün seçici | Öngörülebilir, işletme kontrolünde. Ürün sayısı arttıkça bakım yükü |
| **Otomatik, sipariş verisinden** | Yemeksepeti / Getir ("Yanında iyi gider"), Toast POS, Square | Birlikte sipariş edilme (co-occurrence) sayılır, en sık eşleşen öneri olur | Sıfır bakım, veri arttıkça iyileşir. Soğuk başlangıç problemi |
| **Kategori kuralı** | Restoran POS upsell motorları (Toast, McDonald's kiosk) | "Her ana yemekte içecek öner" gibi tek kural | Tek seferde tüm menüyü kapsar. Kaba, kişiselleştirme yok |

**Ayrı sayfa mı, ürün detayında mı?** Sektör cevabı net: **ürün düzenleme sayfasında bir sekme.** WooCommerce, Shopify, Magento üçü de böyle. Ayrı bir "Öneriler" sayfası sadece *kural* tabanlı yaklaşımda (kategori kuralları, global ayarlar) anlamlı.

**Bizim için önerim — iki aşamalı:**

- **Faz 1 (manuel).** Ürün formuna "Yanında İyi Gider" bloğu, ürün seçici (`components/ui/combobox.tsx` var). Yeni tablo:
  ```sql
  product_recommendations (
    id, tenant_id, product_id, recommended_product_id, display_order
  )
  ```
  Public menüde ürün detayının altında yatay kart listesi. Sepete ekle butonu direkt orada.

- **Faz 2 (otomatik).** Burada gerçek bir avantajımız var: `order_items` tablosu zaten `order_id, product_id, quantity` tutuyor. Yani **co-occurrence verisi elimizde.** Bir SQL view / cron ile "X sipariş edenlerin %N'i Y de aldı" hesaplanıp manuel seçim yapılmamış ürünler için fallback öneri üretilebilir. Item 3'teki *"sistem akıllıca eşleştirir"* iddiasını gerçekten karşılayan kısım bu.

  ⚠️ Faz 2, **Siparişler addon'u aktif olan** işletmelerde çalışır — vitrin modundaki (sadece menü) müşteride sipariş verisi yok, orada sadece manuel çalışır. Pazarlama metnini buna göre kurmalıyız.

### ✅ Karar: İkisi birden — manuel **öncelikli**, otomatik **yedek**

Karıştırmıyoruz, **öncelik sırası** kuruyoruz. Ürün bazında:

```
Ürün X'in manuel önerisi var mı?
  ├─ Evet → sadece onları göster (otomatik hiç karışmaz)
  └─ Hayır → otomatik öneriler açık mı + yeterli veri var mı?
       ├─ Evet → otomatiği göster
       └─ Hayır → hiçbir şey gösterme
```

Karıştırmamanın sebebi **güven**: işletme bir ürüne manuel öneri girdiyse menüde tam olarak onu görmeli. Manuel + otomatik harmanlanırsa "bunu ben mi koydum, sistem mi?" sorusu çıkar ve özellik terk edilir.

**Şema.**
```sql
product_recommendations (id, tenant_id, product_id, recommended_product_id, display_order)
ALTER TABLE tenants ADD COLUMN auto_recommendations_enabled BOOLEAN DEFAULT TRUE;
```

**Otomatik motor.**
- Kaynak: `order_items` co-occurrence (aynı `order_id` içinde birlikte geçen ürün çiftleri).
- ✅ **`order_items.tenant_id` ekleniyor** — aşağıdaki karara bakınız.
- Hesaplama isteğe bağlı değil, **önceden hesaplanmış** olmalı: materialized view + `pg_cron` ile gecelik yenileme. Öneriler gerçek zamanlı olmak zorunda değil.
- **Minimum eşik:** bir çift en az N siparişte (N ≈ 5-10) birlikte geçmediyse gösterme. Eşiksiz otomatik öneri = gürültü = güven kaybı.
- Filtreler: ürünün kendisi hariç, `is_published=false` hariç, `availability_status` müsait olmayanlar hariç.

**Panelde şeffaflık.** Ürün formundaki "Yanında İyi Gider" bloğunun altında, salt-okunur olarak *"Otomatik öneriler (şu an): Ayran · Cacık"* gösterilir; yanında **📌 Sabitle** butonu — tıklayınca otomatik öneri manuel kayda dönüşür. Shopify'ın complementary products akışı da böyle çalışıyor. İşletme motoru görmeden güvenmez.

### ✅ Karar: `order_items`'a `tenant_id` eklenecek

Join ile idare etmek yerine kolonu ekliyoruz. Gerekçeler:

- **Proje kuralı.** `.claude/CLAUDE.md`: "Her table'da `tenant_id` olur." `order_items` bu kuralın tek istisnası; düzeltilmeli.
- **RLS performansı.** Şu an tenant kontrolü için her satırda `orders`'a alt sorgu gerekiyor. Kolon + indeks ile politika tek karşılaştırmaya iner.
- **Öneri motoru.** Materialized view doğrudan `GROUP BY tenant_id` yapabilir; join hatası riski ortadan kalkar.

**Denormalizasyon riski ve çözümü.** Kopyalanan `tenant_id`, `orders.tenant_id`'den sapabilir. Bunu yorum/disipline bırakmıyoruz, **veritabanı seviyesinde imkânsız kılıyoruz:**

```sql
-- 1. Kolonu ekle (önce nullable)
ALTER TABLE order_items ADD COLUMN tenant_id BIGINT;

-- 2. Mevcut satırları doldur
UPDATE order_items oi SET tenant_id = o.tenant_id
  FROM orders o WHERE oi.order_id = o.id;

ALTER TABLE order_items ALTER COLUMN tenant_id SET NOT NULL;

-- 3. Bileşik FK için orders'ta hedef gerekiyor
ALTER TABLE orders ADD CONSTRAINT orders_id_tenant_uniq UNIQUE (id, tenant_id);

-- 4. Sapmayı yapısal olarak engelle
ALTER TABLE order_items
  ADD CONSTRAINT order_items_tenant_matches_order
  FOREIGN KEY (order_id, tenant_id) REFERENCES orders (id, tenant_id) ON DELETE CASCADE;

-- 5. Yanlış tenant_id yazılmasın diye trigger ile otomatik doldur
--    (mevcut insert kodunun değişmesine gerek kalmaz)
```

4. adımdaki bileşik FK kilit nokta: yanlış `tenant_id` yazmak artık **veritabanı hatası** verir, sessizce sızmaz. 5. adımdaki trigger sayesinde `app/api/order/route.ts` içindeki mevcut insert'e dokunmaya gerek kalmaz — unutulma ihtimali sıfırlanır.

Sonrasında `order_items` RLS politikaları sadeleştirilir ve `lib/database.types.ts` yeniden üretilir.

> **Not:** Bu madde 1'in parçası ama aslında bağımsız bir güvenlik/hijyen düzeltmesi. Öneri motorunu yapmasak bile yapılmaya değer, ilk migration'a sıkıştırılabilir.

### ✅ Karar: Eşik sadece otomatik için

Manuel önerilerde eşik yok — işletme bilerek seçmiş, sipariş verisi olsa da olmasa da aynen gösterilir. Minimum eşik yalnızca co-occurrence motorunun çıktısına uygulanır.

**Sıralama.** Faz 1 (manuel) ve Faz 2 (otomatik) hâlâ ayrı ayrı sevk edilir — Faz 1 tek başına satılabilir ve Faz 2'nin altyapısını bozmaz. Karar, "Faz 2'yi de yapacağız" demek; "aynı anda çıkacak" demek değil.

---

## Grup C — Operasyon / Servis

### 5) QR Sipariş aç/kapat kontrolü · Efor: S

**Mevcut durum.** Sipariş özelliği `tenant_addons.addon_key = 'orders_management'` ile *lisans* seviyesinde açılıp kapanıyor (`lib/licensing/hasAddon.ts`). Ama işletmenin kendi kendine "bugün QR sipariş kapalı, menü sadece vitrin" diyebileceği bir **runtime toggle yok** — kod tabanında `orders_enabled` / `ordering_enabled` benzeri bir alan bulunmuyor.

Bu, senin yazdığın pazarlama vaadinin tam karşılığı: *"dilerseniz QR siparişi tek tuşla kapatırsınız — menü vitrin olur, siparişi garson alır."* Şu an bunu yapamıyoruz.

**Gereken.**
- Migration: `tenants.qr_ordering_enabled boolean default true`.
- **Sipariş Ayarları** sayfasının en üstüne (`app/admin/[lang]/orders/settings/page.tsx` zaten var) bir `Switch` + açıklama metni. Özelliğin "evi" burası olmalı — yeni sayfa açmaya gerek yok.
- Public menü: kapalıyken sepet/sipariş butonları gizlenir, menü salt-okunur vitrine döner.
- `app/api/order/route.ts` içinde de kontrol — UI'ı gizlemek yetmez, endpoint de reddetmeli.
- Dashboard'da durum rozeti ("QR Sipariş: Açık / Kapalı") — işletme yanlışlıkla kapalı bırakmasın.

### ✅ Karar: Sidebar'a dokunulmuyor

Özelliğin evi **Sipariş Ayarları** sayfası (zaten var). Ek görünürlük yalnızca dashboard rozeti. Sidebar zaten 4 alt maddeyle dolu, beşincisi kalabalık yapar.

**Lisans ≠ çalışma durumu.** İki kavram ayrı tutulmalı ve karıştırılmamalı:
- `tenant_addons.orders_management` → özelliği **satın aldı mı** (bizim kontrolümüzde)
- `tenants.qr_ordering_enabled` → şu an **açık mı** (işletmenin kontrolünde)

Addon kapalıysa Sipariş Ayarları sayfasına zaten erişilemiyor. Toggle yalnızca addon açıkken anlamlı; ikisi de doğru olmadan sipariş kabul edilmez.

### 6) Garson Çağırma · Efor: M

**Gereken.**
- Yeni tablo `waiter_calls (id, tenant_id, table_id, status, note, created_at, resolved_at, resolved_by)` + RLS + `tenant_id`.
- Public menüde masa bağlamındayken (QR ile gelindiyse) "Garson Çağır" butonu.
- Admin tarafında realtime bildirim — **altyapı hazır:** `OrderNotificationsListener` (`layout-client.tsx:169`) Supabase realtime + sesli toast desenini zaten kuruyor, aynısı kopyalanabilir.
- Bölüm + masa numarası gösterimi. Senin metnin *"bölüm ve masa numarasıyla anında bildirir"* diyor, ama `tables` şu an düz bir liste — bölüm kavramı **yok**. Bunu karşılamak için madde 7'yi beklemeye gerek yok: tek bir nullable kolon yeter.
  ```sql
  ALTER TABLE tables ADD COLUMN section TEXT;  -- "Bahçe", "Salon", "Teras"
  ```
  Masalar sayfasına serbest metin/combobox alanı. Madde 7'nin ihtiyaç duyduğu zengin bölüm yönetimi (sıralama, bölüm bazlı ekranlar) aynı kolonun üzerine kurulur — atılacak iş olmaz.

**Risk — kötüye kullanım.** Masadan sınırsız çağrı basılabilir. Masa başına oran sınırı (örn. 60 sn'de 1) **ve** açık çağrı varken butonu kilitleme, ikisi birden gerekir.

### ✅ Karar: Kendi addon'u (`waiter_calls`)

Orders addon'una bağlanmıyor — vitrin modundaki (sipariş almayan) işletme de garson çağırtmak ister. Bağımsız satılabilir.

### ✅ Karar: `waiter` rolü — PIN değil, mevcut rol sistemi

Senin önerin doğru ve benim PIN önerimden daha ucuz. Doğruladım, uygulanabilir:

**`tenant_users.role` bir `VARCHAR(20)`** — enum ya da CHECK constraint **yok** (`docs/COMPLETE_SCHEMA_WITH_RLS.sql:65`). Yani `'waiter'` eklemek için `ALTER TYPE` gerekmiyor, migration tarafı bedava.

**Ama asıl iş RLS'te, UI'da değil.** Kritik bulgu: **17 RLS politikası** `role IN ('owner', 'editor')` ifadesini birebir kopyalamış (17'sinin de içeriği aynı):

```
supabase/migrations/*.sql → 17 adet `role IN ('owner', 'editor')`
```

Bunun iki sonucu var:

- 🟢 **İyi haber:** `waiter` rolü varsayılan olarak **her yerden reddedilir** (fail-closed). Yanlışlıkla ürün silme, analitik görme gibi bir sızıntı olmaz. Güvenli başlangıç.
- 🔴 **Yapılacak iş:** Garsonun siparişleri görebilmesi için `orders` / `order_items` / `order_statuses` politikalarının açıkça `'waiter'` içerecek şekilde güncellenmesi gerekiyor.

**Üç katmanda birden zorlanmalı** — en sık atlanan üçüncüsü:

| Katman | Ne yapar | Atlanırsa |
| --- | --- | --- |
| 1. Navigasyon | `NAV_ITEMS_CONFIG` yetkiye göre filtrelenir | Garson tıklayamadığı menüleri görür (kozmetik) |
| 2. Sayfa/route guard | 403 ekranı | Garson URL'i elle yazarak sayfayı açar |
| 3. **RLS politikaları** | Veritabanı reddeder | **Garson API'ye doğrudan istek atıp veriyi çeker** |

1 ve 2 kullanıcı deneyimi; **gerçek güvenlik sınırı 3.** `hasUserPermission` helper'ı 1 ve 2'yi çözer ama RLS güncellenmezse özellik güvenli değildir.

**Önerilen yetki matrisi** (tartışmaya açık):

| Kaynak | owner | editor | viewer | **waiter** |
| --- | --- | --- | --- | --- |
| Siparişler | RW | RW | R | **RW** |
| Masalar | RW | RW | R | **R** |
| Garson çağrıları | RW | RW | R | **RW** |
| Ürünler / Kategoriler | RW | RW | R | **R** (menüyü bilmeli, düzenlememeli) |
| Analitik / Ciro | RW | R | R | **—** |
| Ayarlar / Takım | RW | — | — | **—** |

Garsonun analitiği ve ciroyu görmemesi kasıtlı.

**Bakım notu.** 17 politikanın rol listesini birebir kopyalaması bir bakım kokusu — bir sonraki rolde aynı acı tekrar yaşanır. `public.user_has_tenant_role(tenant_id, roles[])` gibi bir SQL helper'a çekmek mantıklı olur, ama bu 17 politikayı da yeniden yazmak demek. **Zorunlu değil**; ayrı bir temizlik işi olarak değerlendirilebilir.

**Ödünleşim — ortak cihaz.** E-posta/şifre, ortak tablette vardiya değişiminde sürtünme yaratır (çık/gir). Restoran sektörünün PIN kullanmasının sebebi bu. Ama v1 için kabul edilebilir ve PIN sonradan **aynı rol modelinin üstüne** eklenebilir — atılacak iş olmaz.

### Teslimat: panele düşer, ayrı garson ekranı yok

Çağrı mevcut panele düşer, `OrderNotificationsListener` (`layout-client.tsx:169`) deseni birebir kopyalanır: Supabase realtime + döngüsel ses + kalıcı toast. `waiter` rolü sayesinde garson da **aynı panele** kendi hesabıyla girip görebilir. Ayrı bir garson ekranı (madde 7) bunun ön koşulu değil.

⚠️ **`tenants.order_pin_code` bunun için kullanılmamalı.** O alan müşteri tarafı wifi/PIN doğrulaması için (`20250111000000_add_wifi_pin_verification.sql`) — farklı amaç, üzerine binmek ileride ikisini de bozar. İleride garson PIN'i eklenirse ayrı yaşamalı.

### 7) Bölüm Bazlı Masa Görünümü (eski adı: Garson Ekranı) · Efor: M

**Gereken.**
- **Bölüm (section) kavramı.** Madde 6'da eklenen `tables.section` kolonunun üstüne kurulur; burada zengin yönetim gelir (bölüm sıralaması, bölüm bazlı filtre).
- Mevcut Siparişler/Masalar sayfaları içinde bölüm sekmeleri → masa kartları ızgarası. Yeni sipariş gelen kart yanıp söner (realtime, madde 6 ile aynı kanal).
- Dokunmatik ergonomi: büyük hedefler, responsive kart ızgarası. **Ayrı route değil** — mevcut sayfaların tablet davranışı iyileştirilir.
- Ürün arama + porsiyon/opsiyon soruları → `product_option_groups` / `product_option_values` zaten var, tüketilmesi yeterli.

### ✅ Karar: Ayrı route yok — aynı sayfalar, yetkiye göre 403

Garson için ayrı bir arayüz **yapılmıyor**. Garson mevcut admin route'larına kendi hesabıyla girer; yetkisi olmayan sayfada tasarıma uygun bir **403 ekranı** görür.

**Ödünleşim, bilinçli olarak kabul edildi.** Ayrı route'un avantajı cihaza göre (telefon/tablet) optimize edilmiş bir arayüz olurdu; dezavantajı iki ayrı yerde geliştirme. Şimdilik tek yer korunuyor. Cihaz optimizasyonu gerekirse mevcut sayfaların responsive davranışı iyileştirilir, ayrı route açılmaz.

Bu kararla madde 7'nin kapsamı ciddi şekilde küçüldü — geriye kalan asıl iş **bölüm bazlı masa görünümü** ve sipariş kartlarının canlı davranışı. Efor L'den M'ye iner.

---

## Grup D — Uzun Vade

### 8) Adisyon Sistemi · Efor: XL · ❄️ **Donduruldu (2026-07-27)**

> **Karar:** Bu işe şimdi girilmiyor. Sadece yazılımla yapılabilecek kısımlar ("yumuşak adisyon") ileride değerlendirilir; fiskal/POS entegrasyonu **müşteriden somut talep gelene kadar** açılmaz. Aşağıdaki analiz, o gün geldiğinde referans olsun diye duruyor.

Sorduğun üç soruya net cevap:

**"İhtiyaç olur mu?"** Evet, ama satın alma sebebi olarak değil — *elde tutma* sebebi olarak. QR menü + sipariş alan bir işletme kaçınılmaz olarak "peki hesabı nasıl kapatacağım" noktasına geliyor. Rakip QR menü ürünlerinin (Adisyo, Menulux vb.) adisyona doğru büyümesinin sebebi bu. Ama bu, bugünkü müşteriyi kazandıran şey değil.

**"Ne kadarını yapabiliriz?"** Sandığından fazlası — çünkü yolun büyük kısmı zaten yapılmış. Mevcut: `orders`, `order_items`, `tables`, `order_statuses`, realtime, çoklu dil, RLS. **Kendi stack'imizde, hiçbir donanıma dokunmadan** eklenebilecekler:

- Masa başına **açık adisyon** (bir masada biriken birden fazla sipariş, tek hesapta toplanır)
- Anlık toplam, ürün ekleme/iptal, ikram/iskonto
- **Hesap kapatma**: ödeme yöntemi (nakit / kart / karışık), hesap bölüştürme
- Gün sonu özeti, masa devir hızı, ortalama adisyon tutarı — `analytics` altyapısı zaten var

Bu "yumuşak adisyon", tek başına gerçek bir pakettir ve senin *"Kağıt adisyon devri bitti, sipariş anında ekranda"* metnini karşılar.

**"POS entegrasyonu?"** Burası muğlaklığın kaynağı ve **kapsam dışı tutulmalı.** İki ayrı şey karıştırılıyor:

- **Yazarkasa / ÖKC (mali)** — Türkiye'de fiş kesmek TSM operatörü sertifikasyonu, cihaz üreticisiyle (Ingenico, Beko, Hugin, Profilo) anlaşma ve yetkili entegratör statüsü gerektirir. Bu bir yazılım işi değil, bir **iş geliştirme + uyum** işi. Aylar sürer.
- **POS yazılımı entegrasyonu** (Adisyo, Simpra, Sambapos vb.) — teknik olarak yapılabilir ama her biri ayrı API, ayrı sözleşme. Değeri, o POS'u kullanan müşteri sayısına bağlı.

> **Önerim:** Adisyonu backlog'da tut, ama "yumuşak adisyon" olarak tanımla ve fiskal/POS entegrasyonunu tamamen dışarıda bırak. Ödeme yakalama olsun, **fiş kesme olmasın**. Ödeyen bir müşteri "yazarkasaya bağlanmazsa almam" diyene kadar bu çizgiyi koru. O gün geldiğinde tek bir POS ile başlanır — hangisi, müşteri söyler.

---

---

## Grup E — Kesişen İş

### 9) Lottie'li Boş Durum + 403 Ekranları · Efor: S-M

Madde 6/7'deki 403 kararından çıktı ama kapsamı daha geniş — ayrı kalem olarak izlenmeli.

**Mevcut durum.** `lottie-react@2.4.1` **zaten kurulu** ve `components/landing/LottieHero.tsx` + `HeroVisual.tsx` içinde kullanılıyor. Ama admin tarafında paylaşılan bir boş-durum bileşeni **yok** (`EmptyState` / `empty-state` araması sonuçsuz).

**Kapsam.**
- `components/ui/empty-state.tsx` — tek bileşen, üç şey alır: Lottie animasyonu, başlık + açıklama, CTA butonu.
- Uygulanacak yerler: **Ürünler**, **Kategoriler**, **Siparişler** tabloları (senin listen) + **403 yetkisiz erişim** ekranı.
- CTA bağlamsal: ürün yoksa "İlk ürününü ekle", sipariş yoksa CTA yok (bekleme durumu, hata değil) — sipariş boşluğu iyi bir şey, aksiyon dayatmayalım.

**Dikkat edilecekler.**
- **Bundle boyutu.** Lottie JSON'ları kolayca 100 KB+ olur. `next/dynamic` ile lazy yüklenmeli, admin ilk yüküne girmemeli. Birkaç animasyon eklenecekse toplam ağırlık ölçülmeli.
- **`prefers-reduced-motion`.** Kullanıcı hareketi azaltmışsa animasyon oynatılmamalı; statik bir kare veya ikon fallback gerekir. Erişilebilirlik açısından zorunlu.
- **i18n.** Tüm başlık/açıklama/CTA metinleri `tr.json` + `en.json`'da (proje kuralı).
- **Tasarım dili.** Mevcut estetik monokrom/minimal. Renkli, "kurumsal illüstrasyon" tarzı hazır Lottie'ler bu dile çarpar — animasyon seçimi buna göre yapılmalı.

**403 ile boş durum farklı şeyler.** Aynı bileşeni paylaşabilirler ama tonları ayrışmalı: boş durum davet edicidir (CTA ile), 403 bilgilendiricidir (CTA yok, "yöneticinle görüş" tonunda). Aynı animasyonu kullanma.

---

---

## Grup F — Sonradan Keşfedilen

### 10) Ürün Varyant / Opsiyon Sistemi UI'ı · Efor: L · **Yeni (2026-07-28)**

Backlog'da yoktu; madde 2 uygulanırken ortaya çıktı.

**Durum:** Yarım kalmış bir özellik. Şema ve sipariş tesisatı var, kullanıcı arayüzü yok.

| Parça | Durum |
| --- | --- |
| `product_option_groups` / `product_option_values` tabloları | ✅ Var (migration `20250110000000`) |
| `lib/database.types.ts` tipleri | ✅ Var |
| `order_items.selected_options` (JSONB) | ✅ Var, sipariş API'si taşıyor |
| Admin: opsiyon grubu CRUD | ❌ **Yok** |
| Public menü: opsiyon seçme + fiyat güncelleme | ❌ **Yok** |
| Sepete seçim taşıma | ❌ **Yok** |
| Canlı veritabanında satır | ❌ **Sıfır** |

**Kapsam.**
- Ürün formunda opsiyon grubu bölümü: grup ekle/sil/sırala, grup başına `selection_type` (tek/çok) ve `is_required`; grup içinde seçenek satırları (ad, `price_delta`, `is_default`).
- Public menüde ürün detayında seçim arayüzü; seçime göre fiyatın canlı güncellenmesi.
- Sepete ve sipariş API'sine seçimlerin taşınması (`selected_options` şeması zaten bunu bekliyor).
- **Madde 2'nin kalan kısmı buraya bağlı:** `product_option_values.calories` + `product_option_groups.calorie_mode` bu iş yapılırken aynı migration'da eklenmeli.

**Neden önemli.** "Porsiyon: Küçük/Orta/Büyük", "Pişirme derecesi", "Ekstra malzeme" bir restoran menüsünün temel ihtiyacı. Şu an bir ürünün tek fiyatı ve tek hâli var. Bu, kalori kırılımından bağımsız olarak ürünün kendi eksiği.

**Açık soru — sana:** Bu iş sıraya girsin mi, girecekse nereye? Kalorinin opsiyon kırılımı buna bağlı, ama varyant sistemi kendi başına da gerekli görünüyor.

---

## Paketleme Kararı (2026-07-27)

| Özellik | Paket | `addon_key` |
| --- | --- | --- |
| Ürün önerileri | Ek paket | `product_recommendations` |
| Garson çağırma | Ek paket | `waiter_calls` |
| Kategori görselleri / menü düzeni | ~~Ek paket~~ → **Temel pakette** (2026-07-28) | — |
| Kalori gösterimi | **Temel pakette** | — |
| QR sipariş aç/kapat | **Temel pakette** (mevcut `orders_management` içinde) | — |
| Boş durum / 403 ekranları | **Temel pakette** | — |

> **Açık tartışma — sonraya bırakıldı:** "Her şeyi ek paket yapıp satmak doğru mu?" Tek gerçek risk **paket parçalanması**: temel ürün içi boş hissettirir ve fiyatlandırma sayfası labirente döner. Genel kabul, ek paketin ya gerçek marjinal maliyeti olması ya da yalnızca bir alt kümenin ihtiyaç duyması. Bu ölçüte göre garson çağırma ve ürün önerileri sağlam ek paket adayı; **kategori görselleri zayıf** (kozmetik, herkes ister). Şimdilik karar uygulanıyor, fiyatlandırma bütününü ayrıca konuşacağız.

## Garson Yetkisi — Karar

Sorduğun şey haklı: **ürün adı, açıklaması ve fiyatı zaten public menüde herkese açık.** Garsondan bunları panelde gizlemek güvenlik tiyatrosu olurdu. Dolayısıyla ürün/kategori sayfaları garsona **salt-okunur** açık.

Anlamlı olan kısıtlar bunlar değil, şunlar:

| Kısıt | Neden gerçek |
| --- | --- |
| **Yazma yetkisi yok** | Fiyat/ürün değiştirmek public menüyü etkiler |
| **`is_published=false` taslaklar** | Bunlar public değil — henüz yayınlanmamış ürün/fiyat garsona da görünmemeli |
| **Analitik / ciro** | Public menüde yok, işletme finansalı |

---

## Tüm Maddeler İçin Ortak Kurallar

Bunlar `.claude/CLAUDE.md`'den ve mevcut mimariden geliyor, her madde için geçerli:

- **i18n zorunlu.** Hiçbir hardcoded metin yok. Her key hem `messages/tr.json` hem `messages/en.json`'da.
- **Multi-tenant.** Yeni her tabloda `tenant_id` + RLS policy (referans: `supabase/migrations/20250115000000_enable_rls_security.sql`).
- **Migration.** Supabase CLI ile: `supabase migration new <ad>` → `supabase db push`. `docs/migrations/` eski arşiv, oraya yazılmaz.
- **UI.** shadcn/ui bileşenleri. ⚠️ `components/ui/sidebar.tsx` registry'den saptırılmış — sidebar'a dokunan iş çıkarsa önce registry ile diff al.

---

## Sıradaki İş Kuyruğu (2026-07-30)

Kullanıcının panel üzerinde gezip verdiği geri bildirimlerden çıktı. Sıra:
**hata > iyileştirme > özellik.**

### Yapıldı ✅
- Madde 5 (QR sipariş aç/kapat), madde 9 (EmptyState + 403), madde 4 (kategori
  görselleri + kategori-önce menü + sıralama modları), madde 2'nin taban kalori
  kısmı.
- Üç durumlu ürün durumu: satışta / tükendi / satışa kapalı.
- Hatalar: `order_items.tenant_id` + belirsiz FK (PGRST201), iki allowlist
  hatası (vitrin modu ve sipariş reddi çalışmıyordu), cache invalidation,
  `getLanguageName`, tip dosyası regen.

### Sırada bekleyen

1. **IMP — `/admin/[lang]/products/new` section düzeni.** Düzenleme sayfası
   (`products/[id]/page.tsx`) `Card` + `CardHeader` ile bölümlere ayrılmış
   (Temel bilgiler / Görsel / 3B model). Yeni ürün sayfası düz form; aynı
   yapıya getirilecek.

2. **IMP — `/admin/[lang]/settings` bölümlere ayrılsın.** Sayfa çok uzadı.
   ✅ **Karar (2026-07-30): ayrı alt route'lar** (`settings/theme`,
   `settings/languages`, `settings/contact` …). Ana `/settings` sayfası
   başlık + açıklama listesi olur, tıklayınca alt sayfaya gider. Gerekçe: URL
   paylaşılabilir ve tarayıcı geri tuşu doğal çalışır.

3. **FEAT — Ürün tablosunda checkbox + toplu işlem.** `components/ui/data-table.tsx`
   TanStack Table kullanıyor; satır seçimi onun `rowSelection` state'i ile
   yapılır. Seçim yapılınca üstte bir toplu işlem çubuğu belirir.

4. **FEAT — Toplu yüzdesel fiyat değişikliği.** Seçili ürünlere, ya da filtreye
   uyan tüm ürünlere ("şunlar hariç" desteğiyle) yüzdesel zam/indirim.
   Yeni bir API ucu gerekecek; `tenant_id` kontrolü ve yuvarlama kuralı
   (kuruş) düşünülmeli. Önizleme göstermeden uygulamamalı — geri alınamaz.

5. **Madde 10 — Ürün varyant/opsiyon sistemi UI'ı.** Aşağıdaki maddeye bakınız.
   Madde 2'nin kalan kısmı (`product_option_values.calories` +
   `product_option_groups.calorie_mode`) bununla aynı migration'da gelmeli.

6. **Madde 1 Faz 1** (manuel ürün önerileri) → **Madde 6** (waiter rolü +
   `waiter_calls`) → **Madde 7** (bölüm bazlı masa görünümü) →
   **Madde 1 Faz 2** (otomatik öneri motoru).

### Ayrıca sıradaki temizlikler
- `lib/db/schema.ts` **üçüncü** elle yazılmış şema kaynağı; `Tenant.id`'yi
  `bigint` diyor (PostgREST BIGINT'i `number` döndürür). `lib/db/queries.ts`
  hâlâ kullanıyor. Emekliye ayrılmalı.
- `ROADMAP.md` bayat: Phase 2-4'teki yapılmış işler hâlâ `[ ]` işaretli.

---

## Önerdiğim Sıra (tartışmaya açık)

0. **`order_items.tenant_id`** — Madde 1'in parçası ama bağımsız bir güvenlik/hijyen düzeltmesi. Öne alınabilir; küçük ve tek başına değerli.
1. **5 (QR sipariş toggle)** — En küçük iş, yazdığın pazarlama vaadini bugün karşılamıyoruz. Hemen kapatılmalı.
2. **9 (Lottie boş durum)** — Küçük, görünür, ve madde 6/7'nin ihtiyaç duyduğu 403 ekranını önden hazırlar. Sıraya erken almak sonraki maddeleri hızlandırır.
3. **2 (kcal)** — Karma model sonrası ~2-3 gün. Alerjen altyapısının yanına oturur.
4. **4 (kategori görselleri + sıralama)** — Görünür, satılabilir, tek migration (kategori + ürün birlikte).
5. **1+3 Faz 1 (manuel öneriler)** — Sepet ortalamasını yükseltme iddiasının ilk somut adımı.
6. **6 (garson çağırma + `waiter` rolü)** — Bağımsız addon. Rol sistemi burada kurulur, 17 RLS politikası burada gözden geçirilir.
7. **7 (bölüm bazlı masa görünümü)** — Ayrı route iptal olduğu için küçüldü. `waiter` rolüne bağımlı, 6'dan sonra.
8. **1+3 Faz 2 (otomatik öneriler)** — Yeterli sipariş verisi biriktikten sonra. `pg_cron` + materialized view.
9. ~~**8 (adisyon)**~~ — Donduruldu.

**Sıra değişiklikleri.**
- Madde 9 (Lottie/403) listeye eklendi ve **öne alındı** — madde 6 ve 7 zaten 403 ekranına ihtiyaç duyuyor, önce yapılırsa iki kere tasarlanmaz.
- Madde 6 artık 7'nin **ön koşulu**: `waiter` rolü 6'da kuruluyor, 7 onun üstüne biniyor. Önceki listede ilişki sadece "küçük olduğu için önce" idi.
- `order_items.tenant_id` 0. sıraya çekildi; öneri motorunu hiç yapmasak bile yapılmalı.

---

## Ayrıca

`ROADMAP.md` ciddi şekilde bayat: Phase 2-4'teki maddelerin (auth, ürün/kategori CRUD, tema, takım yönetimi, analytics) neredeyse tamamı yapılmış ama hâlâ `[ ]` işaretli. Temizlenmesini istersen ayrıca yapabilirim.
