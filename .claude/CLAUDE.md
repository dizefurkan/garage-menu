# Claude Code Guidelines - Garage Menu

Bu dosya Claude Code tarafından yapılan işler için kuralları ve best practices'i tanımlar.

## 🌍 I18n (Uluslararasılaştırma) - KURAL

**Hiçbir yerde hardcoded metinler OLMAZ.**

### Kural
- Tüm UI metinleri (labels, buttons, titles, descriptions) **messages dosyalarından** gelmelidir
- Desteklenen diller: `messages/en.json`, `messages/tr.json`
- Kod içinde `getTranslation()`, `useTranslation()` veya next-intl'in `useTranslations()` kullanılır

### Örnekler

❌ **YANLIŞ**
```tsx
<button>Sil</button>
<h1>Kontrol Paneli</h1>
const children = [
  { key: "orders", path: "orders", label: "Siparişler" },
];
```

✅ **DOĞRU**
```tsx
// messages/tr.json
{
  "common": { "delete": "Sil" },
  "dashboard": { "title": "Kontrol Paneli" },
  "navigation": { "orders": "Siparişler" }
}

// Component
const t = useTranslations();
<button>{t("common.delete")}</button>
<h1>{t("dashboard.title")}</h1>

// Config (getTranslation helper ile)
const children = [
  { key: "orders", path: "orders" },  // ← label kaldırıl, key kullanıl
];
// İçinde: getTranslation("orders")
```

### Kontrol Listesi
Her feature/sayfa eklediğinde:
- [ ] Tüm UI metinleri messages dosyasında key olarak tanımlandı mı?
- [ ] Her key hem tr.json hem en.json'da var mı?
- [ ] Component'te hardcoded string kaldı mı?
- [ ] Submenu/config items'larda label yerine key kullanıldı mı?

### Message Key Yapısı
```json
{
  "navigation": {
    "dashboard": "Kontrol Paneli",
    "orders": "Siparişler",
    "orders_list": "Siparişler",    // ← submenu item
    "tables": "Masalar",             // ← submenu item
    "order_settings": "Sipariş Ayarları"  // ← submenu item
  },
  "common": {
    "save": "Kaydet",
    "delete": "Sil",
    "cancel": "İptal"
  },
  "pages": {
    "productTitle": "Ürünler",
    "productNoItems": "Henüz ürün yoktur"
  }
}
```

---

## 📋 Kod Yazma Prensipleri

### Minimal & Focused
- Sadece talep edilen feature yazılır
- Gereksiz abstraction yapılmaz
- Over-engineering kaçınılır

### Shadcn/UI Pattern
- Sidebar, buttons, forms vs. şu components kullanılır: `shadcn/ui`
- Custom CSS yazılmaz, mevcut Tailwind + shadcn classes kullanılır
- Component consistency kontrol edilir (icon sizes, font sizes, spacing)

### Multi-Tenant & Security
- Her table'da `tenant_id` olur
- RLS policies Supabase'e uygulanır
- `getSessionWithTenant()` ile auth kontrol edilir
- Addon gating: `guardAddonAccess()` helper'ı kullanılır

### Database Migrations
- `docs/migrations/NNN_*.sql` formatında
- Idempotent (IF NOT EXISTS)
- RLS policies + migration_log include
- `005_add_product_models.sql` pattern'ı takip et

---

## 🚀 Başlamadan Önce

Yeni feature ekliyorsan:
1. ✅ Feature kuralı bu dosyada var mı? (i18n, multi-tenant, etc.)
2. ✅ Mevcut pattern'ı (örn. products) takip ediyor mu?
3. ✅ Tüm UI metinleri i18n'de?
4. ✅ Multi-tenant güvenliği kontrol edildi mi?

---

## 📞 Questions/Clarifications
Belirsizlik varsa, her seferinde sormaktan çekinme!
