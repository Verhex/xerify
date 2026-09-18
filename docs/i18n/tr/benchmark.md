# Sağlayıcılar arası benchmark

Bu, açıkça başlatılan bir **Xerify uçtan uca doğrulama benchmark’ıdır**; temel modellerin zekâ sıralaması değildir. Kurulu sağlayıcı kanallarını tamamen aynı, önceden yazılmış iddia ve kanıtla karşılaştırır. Sahibi canlı çağrıları onayladı ve sabit girdiyle yalnızca hedefin çağrılmasını seçti. Yayın ve paket sürümü, sonuçların ayrıca değerlendirilmesinden sonraki aşamadır.

## Matris ve değişmeyen girdiler

`xerify-cross-provider-v3`, `openai`, `anthropic` ve `typesafe` (Jev) içerir: **6 yön × 12 senaryo = 72 değerlendirme**. Her sağlayıcı diğer ikisiyle eşleşir; aynı sağlayıcıyla doğrulama dışlanır. Kaynak yalnızca beyan edilmiş test kimliğidir; üretim çağrısı yapılmaz. Yalnızca hedef çağrılır. Cursor bu kıyastan çıkarıldı; entegrasyonu ayrıca inceleniyor.

| Hedef        | Adaptör/kanal               | İstenen model   |
| ------------ | --------------------------- | --------------- |
| OpenAI       | `codex`, yerel Codex CLI    | `gpt-6-astra`   |
| Anthropic    | `claude`, yerel Claude Code | `claude-opus-5` |
| TypeSafe Jev | `jev`, doğrudan HTTPS API   | `jev-1.13.0`    |

İlk yerel sürümler: Codex CLI 0.154.0, Claude Code 2.1.276, Linux/WSL üzerinde Node 24.15.0. Codex `--ignore-user-config` ve `--ignore-rules` ile çağrılır; sahibinin kişisel reasoning effort ayarının uygulandığı varsayılmaz. Normalize sonuçta görünmeyen etkin inference ayarları ölçülmemiştir; sağlayıcı CLI varsayılanları geçerlidir. Mevcut CLI hesapları ve yerel TypeSafe API anahtarı kullanılır. Ölçülen bu yapılandırmalardır; eşit inference ayarları veya yalnızca API performansı değildir. Model adları sağlayıcı alias’ı olabilir; mevcut normalize sonuçta çözümlenen modeli yalnızca Jev bildirir. Gözlenmeyen model revizyonu iddia edilmez.

[Senaryolar](../../../scripts/benchmark-cases.mjs) dengelidir: dört `confirmed`, dört `refuted`, dört `unclear`. Destek, çelişki, eksik kanıt, Türkçe yetkiler, politika istisnası, kısmi destek, dolaylı çıkarım, gömülü talimat, çelişen kaynaklar, dikkat dağıtan bağlam, SQL silme ve ölçülmemiş sonuçlar kapsanır. Etiketler çağrıdan önce yazıldı; sağlanan metne göre beklenen ilişkiyi tanımlar, dış dünyada doğrulanmış gerçekliği değil. Sentetik şartnameye güvenmeyi reddetmek etiket uyumsuzluğudur; zorunlu olarak halüsinasyon değildir. Çelişen kaynakta öncelik ve gerçek deployment bilinmediğinden beklenen karar çekimserliktir.

Beklenen etiketler ve senaryo kimlikleri sağlayıcıya gönderilmez. UTF-8 iddia ve bağlam tüm yönlerde aynıdır; SHA-256 özetleri bunu denetler. Mevcut LLM prompt’unda veya Jev state’inde kaynak kimliği bulunmaz. Farklı kaynak satırlarıyla aynı hedefe gidenler aynı girdinin tekrar ölçümleridir; kaynağın nedensel etkisine kanıt değildir. Doküman çevrilirken test girdileri çevrilmez. LLM adaptörleri tam doğrulama şemasını, Jev tipli Choice’ı ister; Jev gerekçe üretmez. Ortak puanlanan çıktı Xerify’ın son üçlü kararıdır.

## Çalıştırma ve sonlu tamamlanma

Anahtar, build ve sağlayıcı çağrısı olmadan planı görün:

```sh
node scripts/benchmark-providers.mjs
```

Ücretli olabilecek çağrılar için sahibinin onayından sonra:

```sh
npm run build
XERIFY_LIVE_CONFIRM_BILLABLE=YES node --env-file=.env scripts/benchmark-providers.mjs --live
```

Benchmark `timeoutMs: 0` kullanır; Xerify yaşam döngüsü zamanlayıcısı kapalıdır. İsteğin sabit bekleme tavanı yoktur; hedef süreç veya HTTP yanıtı tamamlanınca ilerler. Matris sonludur; otomatik tekrar, fallback veya beklenen cevap gelene kadar döngü yoktur. Çağrılar sıralıdır; yön sırası her senaryoda döndürülür. Her CLI çağrısı yeni sağlayıcı çalışma dizini kullanır; Xerify konuşma/oturum tekrar kullanmaz. Uzak önbellekler ve sağlayıcının kendi tekrarları kontrol edilmez veya ayrıca ölçülmez.

Ctrl-C/SIGTERM mevcut çağrıyı iptal edip matrisi durdurur. Takılan sağlayıcı elle iptal gerektirebilir; zamanlayıcıyı kaldırmak sonlu sürede yanıt garantisi değildir. Girdi ve çıktı sınırları 32.768 ve 131.072 bayttır. Normal isteklerin varsayılanı 120 saniye kalır. Diğer yüzeylerde `xerify --timeout 0` veya `limits.timeoutMs: 0` açıkça süresiz beklemeyi seçer. Süresiz HTTP ve alt süreç tamamlanması/iptali deterministik regresyon testleriyle doğrulandı.

`XERIFY_BENCH_REPEATS` 1..3 kabul eder; varsayılan birdir. Model değişkenleri `XERIFY_BENCH_OPENAI_MODEL`, `XERIFY_BENCH_ANTHROPIC_MODEL`, `XERIFY_BENCH_TYPESAFE_MODEL`; `auto` reddedilir. Model/tekrar değişikliği farklı karşılaştırmadır ve belirtilmelidir. Sağlayıcının operasyonel olarak kullanılamaması hedefin kalan çağrılarını durdurur; hücreler başarılı değil skipped kaydedilir. Şema hataları çağrılmış başarısızlık olarak kalır.

Özel sonuçlar her hücreden sonra kaydedilir. Yalnızca hiç denenmemiş hücreleri açıkça sürdürün:

```sh
XERIFY_LIVE_CONFIRM_BILLABLE=YES node --env-file=.env scripts/benchmark-providers.mjs --live \
  --resume=.xerify/benchmarks/RUN_TIMESTAMP/report.json
```

Devam işlemi suite, senaryo, model, yön, tekrar, limit ve çekirdek adaptör/prompt özetlerini doğrular. Önceki hata ve uyumsuzlukları korur, tekrar çağırmaz. Yeni özel rapor önceki denemeleri ve kaynak zaman damgasını taşır. Çağrı ortasında kesinti uzak tarafta ücret oluşup oluşmadığını kanıtlayamaz; tamamlanmış kayıt yokluğu hiç istek gitmediği anlamına gelmez.

## Metrikler ve yorum

| Metrik                      | Tanım                                                                                                                                          |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Attempted / skipped / valid | Çağrılmış, çağrılmamış ve şemaya uygun `failure: null` sonuç sayıları                                                                          |
| Tam eşleşme                 | Geçerli son kararın önceden yazılmış etiketle eşleşmesi / tüm çağrılar; teknik hata teslim başarısını düşürür                                  |
| Bağlam uyumu                | Dokuz bağlam senaryosunda eşleşme ve çağrı paydası; genel anlama puanı değildir                                                                |
| Karışıklık matrisi          | Beklenen ve gerçek karar; teknik hata/skipped ayrı sütunlarda                                                                                  |
| Yanlış onay                 | Beklenti refuted veya unclear iken confirmed                                                                                                   |
| Gereksiz çekimserlik        | Beklenti confirmed veya refuted iken geçerli unclear                                                                                           |
| Kesin karar kapsamı         | Geçerli confirmed/refuted sayısı; beklenen unclear da doğru olabilir                                                                           |
| Gecikme                     | CLI işleyicisinin etrafında monoton duvar saati; süreç başlangıcı, ağ ve normalizasyon dahil; geçerlilerde p50/p95/min/max, hatalarda ayrı p50 |
| Token                       | Bildirilen giriş/çıkış toplamları ve kaç çağrıda bildirildiği; eksik null, sıfır değil                                                         |
| Maliyet                     | Yalnızca bildirilen USD ve kapsama; eksik fiyat/abonelik kotası tahmin edilmez                                                                 |

Yüzdelikler geçerli çağrılarda nearest-rank yöntemini kullanır. Yön başına on iki örnek kararlı p95 veya istatistiksel anlamlılık sağlamaz. Duvar süresi ilk token süresi değildir. Jev çıktı token’ları ile LLM gerekçe/açıklama token’ları farklı sözleşmelere hizmet eder. Codex girdisi cached token’ları zaten içerir; Claude girdisine bildirilen cache creation/read eklenir. Tokenizer, prompt ek yükü ve cache faturası farklıdır. Token/saniye yanıltıcı olacağından puanlanmaz.

Jev politikası olasılık ≥0.90, confidence ≥0.80 ve tek maksimum olarak kalır; ilk seçim nihai karardan ayrı korunur. Confidence bağımsız doğruluk etiketi değildir: [TypeSafe tanımı](https://docs.typesafe.ai/confidence). Dolaylılık, dikkat dağıtan bağlam ve saldırgan içerik için [Jev 1.13 sınırları](https://docs.typesafe.ai/model-jaggedness/jev-1.13) geçerlidir. İnsan gerekçe kalitesi veya LLM-as-judge puanı uydurulmaz. Küçük sentetik set üretim dağılımını temsil etmez. Sonuçlar paylaşılmadan önce tek tek uyumsuzluklar incelenmeli; önceden kazanan veya hız çarpanı varsayılmaz.

Çalışma sırasında aynı makinede doküman düzenleme ve yerel kontroller de yapıldı. Makine yükü izole edilmedi; süre gözlemleri bu çevresel değişkenliği içerir.

## Taşıma ve güvenlik sınırları

Yalnızca Jev adaptörü doğrudan HTTP kullanır. Codex ve Claude Code yerel çalıştırılabilir dosyalardır; kendi servislerine bağlanırlar. Üç kanalda da kanıt cihazdan çıkar. Sağlayıcının hesap, saklama, kota ve faturalandırma politikaları geçerlidir. Diğer arka uçlar doğrudan OpenAI API, Anthropic API, OpenAI uyumlu endpoint ve yapılandırılmış komut adaptörlerini içerir. Açıkça yapılandırılan yerel model/endpoint yerel inference sağlayabilir; uzak servisin yerel istemcisi bunu sağlamaz. Bu çalışma sırasında arka uç değiştirilmiyor. CLI, kütüphane, MCP STDIO ve HTTP MCP aynı çekirdeğe alternatif girişlerdir; MCP Jev HTTPS uç noktasını değiştirmez veya doğrulamayı yerel hesaplama yapmaz.

Her sağlayıcı süreç ortamında izin listesi ve geçici dizin kullanır; repo veya .env kopyası verilmez. TypeSafe anahtarı diğer alt süreçlere aktarılmaz. CLI yine kendi home yapılandırmasını ve auth deposunu kullanabilir; geçici dizin tam işletim sistemi izolasyonu iddiası değildir. Adaptör modları araç/sandbox davranışını sınırlar. HTTP MCP varsayılan loopback’tir; dış bağlama açık ayar ve bearer auth gerektirir.

Yalnızca sentetik kanıt gönderilir. Düzenek geçici config’te Xerify geçmişini/audit’i kapatır, normal Xerify kullanıcı/proje config’ini yok sayar ve .env kopyalamaz. Seçili normalize sonuçlar yalnızca sahibine açık, ignore edilmiş `.xerify/benchmarks/` dosyalarında kalır. Sağlayıcı özetleri, tam çıktılar, ham HTTP, auth depoları ve anahtarlar yayın varlığı değildir. Çıktılar şema denetiminden geçer, komut olarak yürütülmez. Prompt talimatı ve tip doğrulaması tam injection direnci veya doğruluk kanıtı değildir.

Kaydedilen uygulama özetleri başlangıçtaki dosyaları tanımlar. Çalışma sırasında düzeneğe açık Buffer import’u, miras alınan XERIFY_* ayarlarını filtreleme ve büyük/küçük harften bağımsız auto model reddi eklendi. Çalışan süreç yüklediği kodla devam etti; çağrı ortamında XERIFY_* override yoktu. Sağlayıcı adaptörleri, modele görünen prompt’lar, test girdileri ve karar eşikleri sabit kaldı. Sonraki çalıştırmanın düzenek özeti farklı olacağından ayrı kaydedilmelidir.

## Kaydedilen çalışmalar

Önceki v1 pilotunda altı yön ve 90 saniye sınırı vardı. Anthropic dördüncü çağrıda zaman aşımına uğrayınca kalan hücreler atlandı; bu kanal için eksiktir. Sahibi ardından 12 yön ve süresiz bekleme istedi. Pilot özel olarak saklanır, v2’ye katılmaz. Koşul değişikliği yeni suite başlatır; iki çalışma birleştirilmez.

İlk v2 çalışması 144 çağrıyla tamamlandı. Sahibinin isteğiyle Cursor içeren bütün yönler kamuya açık kıyastan çıkarıldı: seçilen alt küme **72 çağrı, sıfır atlanan** içeriyor. Yeniden çağrı yapılmadı, etiketler değiştirilmedi. [Sonuçlar](benchmarks/2026-09-18-v2-three-providers.md) · [Ölçümler](../../benchmarks/2026-09-18-v2-three-providers.json). Jev **24/24**, OpenAI ve Anthropic ayrı ayrı **20/24** etikete uydu. Son iki hedef support ve Türkçe yetki senaryolarında unclear verdi. Tekil geçerli çağrılardan hesaplanan medyanlar: Jev **783 ms**, OpenAI **11.123 ms**, Anthropic **75.444 ms**. Token toplamları ve raporlama kapsamı tabloda; eksik maliyet bilinmiyor demektir. v3 yeni üç sağlayıcılı çalışma başlatır, v2’yi devam ettirmez. Tam özel geçmiş kaydı değişmeden korunur.
