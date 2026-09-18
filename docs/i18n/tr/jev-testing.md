# Jev testleri ve canlı sonuçlar

Bu sayfa **2026-09-18** tarihli entegrasyon kapsamını ve sahibinin onayladığı canlı çalıştırmayı kaydeder. On canlı örnek dar kapsamlı, önceden yazılmış sentetik iddialardır; temsili doğruluk benchmark’ı, kalibrasyon çalışması veya güvenlik değerlendirmesi değildir.

## Çevrimdışı sözleşme kapsamı

`npm run check` sentetik HTTP yanıtları kullanır; TypeSafe çağrısı yapmaz ve `.env` yüklemez.

|                   |                                                                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Tipli istek       | Adlandırılmış claim/context, Choice, istenen model; gövdede anahtar yok                                                                                |
| Kararlar          | `confirmed`, `refuted` ve yerel unclear; ilk seçim nihai karardan ayrı korunur                                                                         |
| Eşikler           | Varsayılan/özel tam sınırlar, hemen altı, birim olasılık, sıfır eşikte bile eşitlik                                                                    |
| Yanıt doğrulama   | Eksik model/yanıt/confidence; bozuk tür/seçim, negatif veya metin olasılık, eksik/fazla seçenek, yanlış toplam, maksimum olmayan seçim, bozuk kullanım |
| Kullanım          | Eksik/kısmi/sıfır kullanım; uydurma toplam veya fiyat yok                                                                                              |
| Kimlik            | Aynı sağlayıcı alias ve bilinmeyen provenans çağrıdan önce reddedilir; `ask` ve request desteklenmez                                                   |
| Ayar/auth         | typesafe kimliği, eşik aralıkları, endpoint/ortam sözdizimi, ortam önceliği, eksik anahtar, varlık kontrolü                                            |
| Sınırlar          | Girdi çağrıdan önce reddedilir; büyük çıktı unclear ve çıkış 6 olur, kesilme bildirilir                                                                |
| Bağlantı          | 401/403, 400/422; tekrar edilebilir 408/409/429/500/503/529; boş/bozuk JSON, ağ hatası, ön iptal, çağrı sırasında iptal, timeout; otomatik tekrar yok  |
| Gizlilik          | Hata sonucuna ham HTTP gövdesi/ağ istisna metni girmez; gövdede anahtar yok; audit decision içermez                                                    |
| CLI/kütüphane     | Varsayılan/sabit alias, üç karar, eşik çekimserliği, auth/rate-limit çıkışları, karar şeması                                                           |
| MCP               | STDIO protokol düzeneği kararları, çekimserliği, metadatayı ve yetenekleri taşır; yerel HTTP de çekimserlikte decision korur                           |
| Canlı çalıştırıcı | Anahtar/build olmadan önizleme; onay veya anahtar yoksa canlı mod reddedilir                                                                           |
| Dağıtım           | Zorla staging, npm manifesti ve site yollarında dotenv koruması; kurulum testi paketlenmiş CLI/MCP’yi denetler                                         |

Kesilme regresyon testi gerçek bir hata buldu: boyut sınırı nedeniyle JSON olarak çözülemeyen HTTP gövdesinde çekirdek hata sonucunu oluştururken `truncation.output` kayboluyordu. Artık tipli hatanın kesilme bilgisi korunur. Sonuç yine `unclear` ve `INVALID_PROVIDER_RESPONSE` olur.

## Canlı senaryolar

Çalıştırma **2026-09-18 11:48:32 UTC** (14:48:32 Europe/Istanbul) tarihinde derlenmiş Xerify CLI komut işleyicisi, normal Jev adaptörü ve TypeSafe uç noktasıyla başladı. Kaynak kimliği `openai:gpt-6` olarak beyan edildi; hedef `typesafe:jev-1.13.0`, dönen model `jev-1.13.0` idi. Politika olasılık **≥0.90**, confidence **≥0.80**, eşit olmayan maksimum olarak kaldı. Beklenen etiketler önceden yazıldı; her örnek bir kez çağrıldı. Tekrar, fallback, eşik ayarı veya sonuç sonrası prompt değişikliği yapılmadı. Yalnızca [senaryo kaynağındaki](../../../scripts/jev-scenarios.mjs) on claim/context çifti gönderildi. Olasılık sırası **confirmed / refuted / unclear**.

| Senaryo                        | Beklenen  | Jev seçimi → Xerify kararı | Olasılıklar     | Confidence | ms  | Çıkış |
| ------------------------------ | --------- | -------------------------- | --------------- | ---------- | --- | ----- |
| Açık destek                    | confirmed | confirmed → confirmed      | 1 / 0 / 0       | 1.00       | 942 | 0     |
| Açık çelişki                   | refuted   | refuted → refuted          | 0 / 1 / 0       | 1.00       | 365 | 10    |
| Boş kanıt                      | unclear   | unclear → unclear          | 0 / 0 / 1       | 1.00       | 317 | 11    |
| İlgisiz kanıt                  | unclear   | unclear → unclear          | 0 / 0 / 1       | 1.00       | 371 | 11    |
| Birleşik iddiada kısmi destek  | unclear   | unclear → unclear          | 0 / 0 / 1       | 0.99       | 336 | 11    |
| Birleşik iddiada somut çelişki | refuted   | refuted → refuted          | 0 / 1 / 0       | 1.00       | 351 | 10    |
| Türkçe destek                  | confirmed | confirmed → confirmed      | 1 / 0 / 0       | 0.99       | 308 | 0     |
| SQL kolon silme                | refuted   | refuted → refuted          | 0 / 1 / 0       | 1.00       | 597 | 10    |
| Gömülü karar talimatı          | refuted   | refuted → refuted          | 0 / 1 / 0       | 1.00       | 360 | 10    |
| Confidence eşiği kodu          | confirmed | confirmed → confirmed      | 0.99 / 0.01 / 0 | 0.98       | 335 | 0     |

On kararın tümü beklentiyle eşleşti: **3 confirmed, 4 refuted, 3 unclear**. Hepsinde `failure: null`, kesilme yok. Bildirilen toplam kullanım **5.151 giriş**, **417 çıkış token’ı**; her sonuçta `totalTokens` ve `costUsd` alanları `null` kaldı. Dolar maliyeti hesaplanmadı. Süreler **308–942 ms**; tek çalıştırma gecikme benchmark’ı veya hizmet seviyesi iddiası değildir. Bu canlı örneklerin hiçbiri düşük confidence nedeniyle çekimser kalmadı; üç unclear Jev’in kendi seçimiydi. Eşik altı ve eşitlik davranışı deterministik testlerle sınandı. Tek gömülü talimat başarıyla göz ardı edildi; genel injection dayanıklılığı ölçülmedi. Olasılık 1 model çıktısıdır, kesinlik kanıtı değildir. Tablo editoryal özettir; anahtar, ham yanıt ve özel kayıtlar commit edilmez. Önceki [dokümantasyon/kod kontrolü](jev.md) ayrıydı ve toplamlara dahil değildir.

## Bilinçli tekrar çalıştırma

Anahtar veya sağlayıcı çağrısı olmadan tüm kanıt ve beklenen etiketleri inceleyin:

```sh
node scripts/live-jev-scenarios.mjs
```

Sahibinin ücretli çağrı onayından sonra kaynak checkout’ta derleyip çalıştırın:

```sh
npm run build
XERIFY_LIVE_CONFIRM_BILLABLE=YES node --env-file=.env scripts/live-jev-scenarios.mjs --live
```

Node 20.6+ açık env-file yüklemesini destekler. Çalıştırıcı jev-1.13.0 sürümünü sabitler, en fazla on sıralı değerlendirme yapar, ilk teknik/auth hatasında durur. Geçmişi kapatan geçici config kullanır, normal kullanıcı/proje config’ini yok sayar ve CLI ortamına yalnızca TypeSafe anahtarını geçirir. .env kopyalanmaz. İstek başına süre sınırı 30 saniyedir. Seçilmiş normalize metadata, ignore edilen `.xerify/live-jev-scenarios/` altında yalnızca sahibine açık zaman damgalı dosyaya yazılır; ham HTTP yanıtı veya kanıt rapora yazılmaz. Çalıştırıcı çıkışları: bütün beklentiler eşleşirse 0, anlamsal uyumsuzluk 11, eksik/teknik hatalı çalışma 1, canlı onay eksikliği 2, anahtar eksikliği 3. Tek tek doğrulama çıkışları kayıtlarda korunur. Uyumsuzluk, model beklenen cevabı verene kadar tekrar etme gerekçesi değildir. Normal kontroller, kurulum testi ve release işlemleri bu çalıştırıcıyı çağırmaz.

## Uygulamada hataları yorumlama

|                                       | CLI exit |                                                                               |
| ------------------------------------- | -------- | ----------------------------------------------------------------------------- |
| confirmed                             | 0        | Sağlanan kanıtla desteklendi; kapsamı inceleyin                               |
| refuted                               | 10       | Çelişki seçildi; iddiayı inceleyin                                            |
| unclear, `failure: null`              | 11       | Eksik/belirsiz kanıt veya eşik çekimserliği; decision inceleyip kanıt ekleyin |
| SAME_PROVIDER / PROVENANCE_UNPROVABLE | 2        | Sağlayıcı kimliğini düzeltin; çağrı gönderilmez                               |
| AUTH_UNAVAILABLE / 401 / 403          | 3        | Auth hata zarfı; doğrulama sonucu değildir, yerel anahtarı düzeltin           |
| TIMEOUT / CANCELLED                   | 4        | Teknik unclear; otomatik tekrar yok                                           |
| PROVIDER_FAILURE                      | 5        | Teknik unclear; retryable sadece metadata                                     |
| INVALID_PROVIDER_RESPONSE             | 6        | Teknik unclear; limitleri ve uyumluluğu inceleyin                             |

Teknik hatayla anlamlı çekimserliği `failure` ile ayırın. Eşik kararını açıklamak için `decision.choice`, seçilen olasılık, confidence ve politikayı inceleyin. Kullanım ve MCP örnekleri [Jev rehberindedir](jev.md).
