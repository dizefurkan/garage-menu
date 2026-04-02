# Vercel İçin Ortam Kurulumu Kılavuzu

Bu rehber, Garage Menu projesini Vercel'de adım adım nasıl ayarlayacağınızı gösterir.

## 🚀 Adım 1: Vercel Dashboard'a Gidin

1. https://vercel.com/login adresine gidin
2. GitHub/GitLab hesabınızla oturum açın
3. Dashboard'dan projenizi seçin

## 🔐 Adım 2: Environment Variables'ı Ayarlayın

### Navigasyon

```
Settings → Environment Variables
```

### Production Ortamı Kurulumu

Aşağıdaki değişkenleri **Production** sekmesine ekleyin:

#### 2.1. GOOGLE_DRIVE_MENU_URL

1. **Variable Name**: `GOOGLE_DRIVE_MENU_URL`
2. **Value**: Google Drive'daki menü dosyasının linki
   ```
   https://drive.google.com/file/d/1A2B3C4D5E6F7G8H9I0J/view?usp=sharing
   ```
3. **Environment**: `Production` ✓

**Kaydet** butonuna basın.

#### 2.2. ADMIN_USER

1. **Variable Name**: `ADMIN_USER`
2. **Value**: Güvenli bir kullanıcı adı
   ```
   garage_admin_prod
   ```
3. **Environment**: `Production` ✓

**Kaydet** butonuna basın.

#### 2.3. ADMIN_PASS

1. **Variable Name**: `ADMIN_PASS`
2. **Value**: **Güçlü, rastgele bir şifre** (en az 16 karakter)
   ```
   K7$mPqX9@nL2#vW5$bJ8&kR3!x9%Qp2
   ```
3. **Environment**: `Production` ✓

**Kaydet** butonuna basın.

### Sonuç Olması Gereken Durum

```
Environment Variables

Production:
├─ GOOGLE_DRIVE_MENU_URL: https://drive.google.com/file/d/1A2B3C4D5E6F7G8H9I0J/view?usp=sharing
├─ ADMIN_USER: garage_admin_prod
└─ ADMIN_PASS: K7$mPqX9@nL2#vW5$bJ8&kR3!x9%Qp2
```

## 🔄 Adım 3: Projeyi Yeniden Dağıtın

Environment değişkenleri yüklendikten sonra projeyi yeniden dağıtmalısınız:

### Seçenek 1: Vercel Dashboard'dan

1. **Deployments** sekmesine gidin
2. En son deployment'ın sağında **⋮** (üç nokta) butonuna tıklayın
3. **Redeploy** seçin

### Seçenek 2: Terminal'den

```bash
vercel deploy --prod
```

### Seçenek 3: GitHub Push (Eğer GitHub Integration Kurulu Ise)

```bash
git add .
git commit -m "Update environment variables"
git push origin main
```

---

## 🧪 Adım 4: Test Edin

### Admin Panele Erişim

1. Projenizin URL'sine gidin (örn: `https://garage-menu.vercel.app`)
2. `/admin` sayfasına gidin (`https://garage-menu.vercel.app/admin`)
3. Tarayıcıdan soracağı dialoga girin:
   ```
   Kullanıcı Adı: garage_admin_prod
   Şifre: K7$mPqX9@nL2#vW5$bJ8&kR3!x9%Qp2
   ```
4. **Publish** düğmesine basın
5. "done" mesajı görüntülenirse başarılı demektir ✅

### API Endpoints'i Test Edin

Terminal'de test edin:

```bash
# Menü API'si
curl https://garage-menu.vercel.app/api/menu

# Resim API'si
curl "https://garage-menu.vercel.app/api/image?id=YOUR_IMAGE_FILE_ID"

# Publish API'si (Basic Auth ile)
curl -u garage_admin_prod:K7$mPqX9@nL2#vW5$bJ8&kR3!x9%Qp2 \
  -X POST https://garage-menu.vercel.app/api/publish
```

---

## 📱 Adım 5: Preview / Staging Ortamı (Opsiyonel)

Eğer test için ayrı bir ortam kurmak istiyorsanız:

### Preview Ortamı Kurulumu

1. Environment Variables sayfasında yeni değişken ekleyin
2. **Environment**'ın yanındaki açılır menüden **Preview** seçin
3. Farklı değerler girin (örn: test admin şifresi, test menü dosyası)

---

## 🐛 Troubleshooting

### Problem: 401 Unauthorized Hatası

**Nedeni**: Yanlış admin kimlik bilgileri veya environment değişkenleri ayarlı değil

**Çözüm**:

```bash
# Vercel logs'ları kontrol edin
vercel logs

# Local'de test edin
ADMIN_USER=garage_admin_prod ADMIN_PASS=your_password npm run dev
```

### Problem: "Failed to load menu" Hatası

**Nedeni**: Google Drive dosyasında sorun veya GOOGLE_DRIVE_MENU_URL yanlış

**Çözüm**:

1. Google Drive dosyasının herkese açık (public) olduğunu kontrol edin
2. Linki tarayıcıda test edin
3. Environment Variable'ı yeniden kontrol edin

### Problem: Publish Düğmesi Çalışmıyor

**Okunması Gereken Durumlar**:

1. Tamamen siteye yeniden giriş yapın (tam logout/login)
2. Vercel logs'ları kontrol edin (`vercel logs`)
3. Network tab'ında (F12) `/api/publish` isteğini kontrol edin

---

## 📊 Vercel Logs'ları Kontrol Etme

Sorunları gidermek için Vercel logs'ları kontrol edebilirsiniz:

```bash
# Son 50 satırı göster
vercel logs --tail

# Belirli deployment'ın logs'larını göster
vercel logs --since 1h
```

---

## 🔒 Güvenlik Kontrol Listesi

- ✅ Şifreler Production ortamında güçlü mü? (en az 16 karakter, karışık)
- ✅ Google Drive dosyası sadece gerekli kişilere açık mı?
- ✅ Environment Variable'lar Vercel'de Production'a ayarlandı mı?
- ✅ `.env.local` dosyası `.gitignore`'da var mı?
- ✅ Şifreler kimseyle paylaşılmadı mı?

---

## 💡 İpuçları

### Eğer Çok Sık Publish Yapacaksanız

Vercel'in automatic deployments'ını kullanabilirsiniz:

1. Settings → Git Integration
2. "Automatic Deployments" etkinleştirin
3. Her git push'da otomatik olarak dağıtılacak

### Custom Domain Eklemek

1. Settings → Domains
2. Kendi domain'inizi ekleyin
3. DNS records'ları güncelleyin (rehber sayfada yer alacaktır)

### Monitoring

Trafik ve performance metrikleri:

- Analytics sekmesinde real-time veriler görebilirsiniz

---

**Son Güncelleme**: 2 Nisan 2026
