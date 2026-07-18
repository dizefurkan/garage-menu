#SQL'i incelemek
Dump gzip'li düz metin SQL — açıp bakabilirsiniz:

#### Sıkıştırmayı açmadan göz atmak

<code>gzcat backups/2026-07-18_120000/db.sql.gz | less</code>

#### Ya da dosya olarak açmak (db.sql oluşur, editörde inceleyebilirsiniz)

<code>gunzip -k backups/2026-07-18_120000/db.sql.gz</code>

İçinde <i>CREATE TABLE ...</i> şema tanımları ve <i>COPY products FROM stdin;...</i> blokları halinde satır satır veriler var. Örneğin sadece bir tablonun verisini görmek isterseniz: <code>gzcat db.sql.gz | grep -A 50 'COPY public.products'</code>

Geri yüklemek (restore)
Dump'ı psql ile hedef veritabanına akıtıyorsunuz:

<code>gzcat backups/2026-07-18_120000/db.sql.gz | /opt/homebrew/opt/libpq/bin/psql "$SUPABASE_DB_URL"</code>
İki önemli not:

Dump "insert-only"dır, tabloları silmez. Mevcut verinin üstüne yüklerseniz duplicate key hataları alırsınız. Tipik senaryolar:
Yeni/boş bir Supabase projesine yüklemek → doğrudan çalışır, en güvenli yol.
Aynı projeyi eski haline döndürmek → önce tabloları boşaltmak/düşürmek gerekir; bu yıkıcı bir işlem olduğu için ihtiyaç anında adım adım birlikte yaparız.
Storage dosyaları ayrı: backups/<tarih>/storage/ klasöründeki dosyaları geri yüklemek gerekirse Dashboard'dan elle yükleyebilirsiniz; isterseniz ileride bunun için de bir restore-storage script'i yazarım.
Ayrıca tek bir tabloyu geri almak isterseniz tüm dump'ı uygulamak zorunda değilsiniz — gzcat db.sql.gz çıktısından ilgili COPY bloğunu kesip yalnız onu psql'e verebilirsiniz.

Kullanım artık: npm run backup (ya da ./scripts/backup.sh). SUPABASE_DB_URL'i .env.local'e eklemeyi unutmayın, onsuz script net bir hata mesajıyla duruyor
