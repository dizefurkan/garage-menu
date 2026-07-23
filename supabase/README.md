# Supabase CLI Workflow

Bu proje artık migration'ları **Supabase CLI** ile yönetir. Böylece migration'lar
Supabase Dashboard'da (`Database → Migrations`) da görünür.

- **Canonical migration klasörü:** `supabase/migrations/` (yeni migration'lar buraya)
- **Eski arşiv:** `docs/migrations/` — CLI'ya geçmeden önce elle uygulanan dosyalar.
  Bunların birebir kopyaları `supabase/migrations/` altında timestamp isimleriyle
  yer alır ve uzak veritabanında "applied" olarak işaretlidir (yeniden çalıştırılmadı).

## Project

- project-ref: `dvvjsnvvsbdwobighenf`
- Bağlantı sırrı `.env.local` içindeki `SUPABASE_DB_URL` (session pooler) üzerinden gelir.

## Kimlik doğrulama (bir kez)

```bash
supabase login                      # tarayıcı üzerinden
# veya
export SUPABASE_ACCESS_TOKEN="<personal-access-token>"   # dashboard → account/tokens
```

## Projeyi linkle (bir kez)

```bash
# DB parolası SUPABASE_DB_URL içindeki paroladır; prompt'u atlamak için env ver:
export SUPABASE_DB_PASSWORD="<db-password>"
supabase link --project-ref dvvjsnvvsbdwobighenf
```

## Yeni migration ekleme (her seferinde)

```bash
supabase migration new my_change      # supabase/migrations/<timestamp>_my_change.sql oluşturur
# ... SQL'i yaz ...
supabase db push                      # uzak veritabanına uygular ve geçmişe kaydeder
```

## Faydalı komutlar

```bash
supabase migration list               # local vs remote karşılaştırması
supabase db pull                      # remote'daki manuel değişiklikleri migration'a çeker
```
