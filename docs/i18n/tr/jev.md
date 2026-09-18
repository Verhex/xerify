# Xerify 0.3.0 ile Jev

Jev, TypeSafe'ın tipli karar modelidir. Xerify desteklenen arka uçların çevresindeki doğrulama katmanıdır: sınırlandırılmış kanıt, sağlayıcı ayrımı, kararlı sonuçlar ve çalıştırma geçmişi sağlar. İkisi de makinenin kullanabileceği kararlara odaklanır, ancak problemin farklı kısımlarını çözer.

Jev desteği Xerify 0.3.0 sürümüne dahildir. Adaptör sentetik HTTP yanıtlarıyla test edilir. Bir dokümantasyon/kod tutarlılık kontrolü ve ayrı on senaryolu canlı çalıştırma 2026-09-18 tarihinde tamamlandı. [Test kapsamı ve canlı sonuçlar](jev-testing.md) ayrıntıları içerir. Alan doğruluğu ve eşik kalibrasyonu henüz ölçülmedi.

## Anahtar kurulumu

Kaynak checkout'ta `npm ci` ve `npm run build` çalıştırın. `.env.example` dosyasını `.env` olarak kopyalayıp `TYPESAFE_API_KEY` değerini yerelde girin. `.env` Git tarafından ignore edilir ve npm paketinden çıkarılır. Gizli tutun; POSIX'te `chmod 600 .env` kullanın. Anahtarı kanıta veya komut argümanına koymayın.

Gerçek `.env` yalnızca sahibinin ana çalışma dizininde kalır. `main` dahil hiçbir Git dalına, başka worktree'ye, npm paketine, kaynak arşivine, site yüklemesine veya Docker bağlamına girmez. Git dotenv dosyalarını ignore eder; paket istisnaları izin verilen npm dizinlerindeki iç içe dosyaları da kapsar. Docker hem kök hem iç içe dosyaları dışlar. Git kaynak arşivleri dotenv yollarını dışlar. Git index'ine yalnızca kökteki, atamaları boş `.env.example` alınabilir.

`npm run secrets:check`, gerçek dotenv dosyalarını okumadan Git index'ini, site ağacını ve gerçek npm dry-run manifestini kontrol eder. `check` ve `prepack` içinde çalışır; kurulum testi paket manifestini de denetler. Pages iş akışı yüklemeden önce oluşturulan çıktıyı kontrol eder. Yerel pre-commit hook, `git add -f` ile zorla stage edilen dotenv dosyalarını bile engeller. Yeni checkout'ta mevcut hook'ları kontrol ettikten sonra `git config --local core.hooksPath .githooks` ile etkinleştirin. Sahibinin checkout'unda etkindir. Hook'lar atlanabildiğinden CI ve paket istisnaları ayrı kontroller olarak kalır. Anahtarı başka dosyalara kopyalamayın; `.env` dosyasını doğrulama kanıtı olarak vermeyin.

Xerify süreç ortamını okur; `.env` dosyasını **otomatik okumaz**. Node'un `--env-file` bayrağıyla açıkça yükleyin. Node 20.6 veya üzeri gerekir; Node 24 önerilir:

```sh
node --env-file=.env ./dist/cli/entry.js --json providers probe --provider jev
```

Bu yalnızca anahtarın varlığını bildirir. Anahtarın geçerliliğini kontrol etmez ve TypeSafe isteği yapmaz. Mevcut süreç ortam değişkeni dosyadaki değerden önceliklidir.

Aşağıdaki komutu çalıştırmak ücretli olabilecek tek bir değerlendirme yapar:

```sh
git diff --cached | node --env-file=.env ./dist/cli/entry.js --json verify \
  --from openai:AUTHOR_MODEL \
  --to jev \
  --claim "This migration preserves existing data"
```

Anahtar ortamda zaten varsa kurulu CLI komutu `xerify --json verify --from openai:AUTHOR_MODEL --to jev --claim "…"` şeklindedir. `AUTHOR_MODEL` yerine iddiayı üreten modeli yazın. Karar için yeterli kanıt sağlayın; boş diff doğruluk kanıtı değildir. Mevcut çalıştırma geçmişi yakalama ayarları geçerliliğini korur.

## Kimlik ve desteklenen işlemler

Varsayılan adaptör kimliği ve config türü `jev` olur. Çağrı sağlayıcısı `typesafe` olur; doğrudan uç noktayı, kimlik doğrulamayı ve faturalandırmayı TypeSafe kontrol eder. CLI'da `--to jev`, `typesafe:jev-latest` olarak açılır; `--to jev:jev-1.13.0` belirli sürümü seçer. Aynı normalizasyon `--from` için de geçerlidir; alias aynı sağlayıcı yasağını aşamaz. Açık `typesafe:MODEL_ID` de çalışır.

Kütüphane ve MCP isteğinde `to` için `{ "provider": "typesafe", "model": "jev-latest" }` kullanılır. İstenen alias `to.model` içinde kalır; yanıtta bildirilen model `decision.model` içine yazılır. Jev yalnızca `verify` destekler. `ask` ve `request`, HTTP isteğinden önce `UNSUPPORTED` döndürür. Capabilities alanı `operations: ["verify"]` bildirir; bu isteğe bağlı alanı taşımayan adaptörlerin mevcut davranışı sürer. Sağlayıcı çeşitliliği bağımsız model kökenini veya doğruluğu kanıtlamaz.

## Karar politikası

Xerify, `POST https://api.typesafe.ai/v1/systemone` adresine `{model, state: {claim, context}, questions: {verdict: …}}` gönderir. Choice sorusu, sağlanan kanıta karşı iddiayı çürütmeyi dener; ölçütleri `confirmed`, `refuted`, `unclear` olur.

Geçerli yanıtın seçimi yalnızca seçilen olasılık en az **0.90**, confidence en az **0.80** ise ve en yüksek olasılıkta eşitlik yoksa korunur. Aksi halde sonuç `unclear` olur. Jev'in kendi `unclear` seçimi de öyle kalır. Eşik altı sonuçlarda `failure: null`, çıkış kodu 11 olur. Bu varsayılanlar yapılandırılabilir sezgisel kurallardır; bağımsız kalibre edilmiş doğruluk garantileri değildir. TypeSafe confidence dağılımı özetler; bir seçeneğin olasılığıyla aynı kavram değildir.

Temsili, sentetik sonuç parçası:

```json
{
  "verdict": "refuted",
  "decision": {
    "kind": "choice",
    "model": "jev-1.13.0",
    "choice": "refuted",
    "probabilities": { "confirmed": 0.01, "refuted": 0.98, "unclear": 0.01 },
    "confidence": 0.95,
    "policy": { "minProbability": 0.9, "minConfidence": 0.8 }
  }
}
```

`decision`, şema sürümü 1'e isteğe bağlı eklemedir. Nihai karar çekimser kalsa bile olasılıklar sağlayıcının ilk seçimini gösterir. Her olasılık [0,1] içinde olmalı, üçü de bulunmalı, toplamın birden farkı en fazla 0.000001 olmalı ve seçilen seçenek maksimum olmalıdır. Alanlar arası kısıtlar dışa aktarılan JSON Schema'ya ek olarak çalışma zamanında uygulanır. Bozuk yanıt ve bağlantı hataları mevcut tipli hataları ve çıkış kodlarını korur. Otomatik tekrar veya başka sağlayıcıya geçiş yoktur.

Jev açıklama veya kanıt atfı üretmez. Xerify açıkça etiketlenmiş şablon özet ve sınırlamalar sağlar; findings/evidence dizileri boştur. Tipli çıktı gerçeğin ispatı değildir. İsteğe bağlı metadata yakalama politikasına göre normalize geçmişte saklanır; audit JSONL karar nesnesini saklamaz. Kullanım alanları maliyet tahmin edilmeden raporlanır.

## Yapılandırma, kütüphane ve MCP

Varsayılan adaptör için sağlayıcı ayarı gerekmez. Politikasını `.xerify/xverify-config.json` içinde değiştirmek için bu sağlayıcı girdisini mevcut yapılandırmanızla birleştirin:

```json
{
  "providers": {
    "jev": {
      "kind": "jev",
      "apiKeyEnvironment": "TYPESAFE_API_KEY",
      "minProbability": 0.9,
      "minConfidence": 0.8
    }
  }
}
```

Ortam anahtarı, isteğe bağlı düz `apiKey` değerinden önceliklidir. Tanılama maskelemesi ve yalnızca sahibine açık config izinleri diğer doğrudan API adaptörleriyle aynıdır. İsteğe bağlı `endpoint`, güvenilen proxy veya yerel test sunucusuna izin verir; değiştirmek anahtarı ve kanıtı o URL'ye gönderir. Çağrı servisi farklıysa ayrıca tanımlanan gateway adaptörü kullanın. İstek gövdesi ve HTTP yanıtı bayt sınırına tabidir; aşırı büyük girdi ücretli çağrı yapılmadan reddedilir. Sağlayıcı token sınırları Xerify'ın bayt sınırından bağımsızdır.

```ts
import { executeVerify, JevAdapter, ProviderRegistry, VerifyRequestSchema } from 'xerify-cli';

const result = await executeVerify(
  VerifyRequestSchema.parse({
    from: { provider: 'openai', model: 'AUTHOR_MODEL', provenance: 'declared' },
    to: { provider: 'typesafe', model: 'jev-latest' },
    claim: 'The migration preserves nullable values',
    context: 'ALTER TABLE users ALTER name SET NOT NULL;'
  }),
  new ProviderRegistry([new JevAdapter()])
);
console.log(result.verdict, result.decision);
```

MCP için sunucu süreç ortamına `TYPESAFE_API_KEY` verin ve aynı yapılandırılmış istekle `xerify_verify` çağırın. Kaynak checkout'ta STDIO da açık dotenv yüklemesini destekler: `node --env-file=.env ./dist/cli/entry.js mcp stdio`. Ek MCP aracı gerekmez.

## Ajan skilleri

Resmi skili Codex, Claude Code ve Cursor için projeye tek yöntemle kurun:

```sh
npx skills add typesafe-ai/skills --skill typesafe-ai --agent codex claude-code cursor --yes
```

Bu, TypeSafe'ın Claude dışındaki ajanlar için önerdiği komutun çoklu ajan seçimidir. Dosyaları kurar; model entegrasyonu veya API anahtarı kurmaz. Aynı kurulum için ayrıca Claude marketplace eklentisini kurmayın. Codex ve Cursor `.agents/skills/typesafe-ai`, Claude Code ortak kopyaya bağlı `.claude/skills/typesafe-ai` kullanır. Kurucu upstream kaynağını `skills-lock.json` içine kaydeder; `experimental_install` kilitli skilleri geri yükleyebilir.

Bu checkout'ta ayrıca `.agents/skills/xerify-jev` altında, Claude Code'a bağlı yerel yardımcı skil vardır. Resmi skili değiştirmeden Xerify sağlayıcı kimliğini, politikasını, şemasını ve doğrulama gereksinimlerini kaydeder. İki skil kurulumu ve yerel `AGENTS.md` işaretçisi ignore edilen geliştirme durumudur; npm içeriği değildir. Yardımcı skil bu checkout'a özeldir; resmi lockfile'ı geri yüklemek onu yeniden oluşturmaz. Codex'te TypeSafe rehberliği için `$typesafe-ai`, proje entegrasyonu için `$xerify-jev` seçin. Yeni skiller sonraki turda kullanılabilir olur; başka çalışan ajanın projeyi yeniden yüklemesi gerekebilir.

## Doküman incelemesi ve karar kapsamı

Resmi skil ve canlı dokümanlar 2026-09-18'de incelendi: giriş, State, Choice, HTTP API, confidence, modeller, sınırlamalar ve citation-check cookbook. İndirilen skil inceleme sırasında resmi GitHub sürümüyle bayt bayt aynıydı.

| Alan             | İnceleme sonucu                                                                                                                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Protokol         | Doğrudan HTTP uç noktası, bearer auth, adlandırılmış state ve Choice yanıt eşlemesi korunur; chat-completions sarmalayıcısı gerekmez.                                                                              |
| Soru             | `claim` ve `context` açıkça adlandırılır; ilişkileri değerlendirilir. Destek yokluğu tek başına çelişki değildir.                                                                                                  |
| Politika         | Yapılandırılabilir 0.90 olasılık / 0.80 confidence korunur; bunlar TypeSafe zorunluluğu veya ölçülmüş doğruluk değildir.                                                                                           |
| Açıklanabilirlik | Adaptör özeti ve boş evidence/findings korunur; Jev gerekçe üretmez.                                                                                                                                               |
| Doğrulama        | Sentetik HTTP testleri entegrasyon sözleşmesini kontrol eder. Dokümantasyon/kod tutarlılık kontrolü ve on canlı senaryo beklentiyle eşleşti; alan doğruluğu, kalibrasyon ve genel saldırı dayanıklılığı ölçülmedi. |

Faydalı Jev görevi, tek odaklı kaynak-iddia değerlendirmesidir. Örneğin verilen migration'a karşı “Bu migration `email` kolonunu kaldırır” iddiasını kontrol edin. “Sürüm güvenli, hızlı ve geriye uyumlu” birden çok boyutu birleştirir; uygun kanıtla ayrı kontrollere bölün veya geniş akıl yürütme için açıkça LLM doğrulayıcısı seçin. Xerify 0.3.0 iddiaları otomatik bölmez, birden çok doğrulamayı toplu yapmaz.

Kesin aritmetik, tarih karşılaştırması, sayma ve lookup kodda kalmalıdır. Tüm repo yerine ilgili kaynak parçalarını sağlayın. TypeSafe, Jev 1.13 için sayısal kesinlik, dolaylılık, dikkat dağıtan bağlam ve saldırgan içerik sınırlamalarını belgeler; bunların veya performans iddialarının sonraki modellere değişmeden uygulanacağını varsaymayın. Prompt sınırları belirsizliği azaltır, kanıtlanmış injection savunması değildir.

`jev-latest` kurulum için uygundur; eşik değerlendirirken alias güncellemesinin modeli sessizce değiştirmemesi için sürümü sabitleyin. Confidence'ı yönlendirme sinyali olarak kullanmadan önce hedef alanda destek, çelişki, eksik/karışık kanıt ve saldırgan örnekleri değerlendirin. Bu repoda canlı değerlendirme yine sahibinin onayını gerektirir.

## Ürün yönü ve kaynaklar

Birleşim şudur: Jev tipli kararı verir; Xerify doğrulama sözleşmesini sağlar. Otomatik üst modele geçiş, deterministik değerlendiriciler, insan incelemesi ve çoklu sağlayıcı toplulukları olası gelecek işleridir; 0.3.0 özelliği değildir. Uygulama `unclear` sonrasında ayrı LLM doğrulamasını açıkça isteyebilir; Xerify başka sağlayıcıda sessizce harcama yapmaz.

2026-09-18'de incelenen resmi kaynaklar:

[Introduction](https://docs.typesafe.ai/introduction) · [Skill](https://github.com/typesafe-ai/skills/blob/main/skills/typesafe-ai/SKILL.md) · [State](https://docs.typesafe.ai/concepts/state) · [Choice](https://docs.typesafe.ai/primitives/choice) · [Citation checks](https://docs.typesafe.ai/cookbooks/citation_check) · [Model limitations](https://docs.typesafe.ai/model-jaggedness/jev-1.13) · [HTTP API](https://docs.typesafe.ai/api) · [Confidence](https://docs.typesafe.ai/confidence) · [Models](https://docs.typesafe.ai/models)

Mimari karar [ADR 0003](../../decisions/0003-typed-decision-verifiers.md) belgesindedir.

## İlk canlı tutarlılık kontrolü

2026-09-18'de sahibi Xerify CLI üzerinden `--to jev` ile bir doğrulamayı onayladı. Yazar kimliği `openai:gpt-6`, hedef `typesafe:jev-latest` olarak bildirildi; yanıt `jev-1.13.0` modelini bildirdi. Yalnızca 490 baytlık kod parçası ve bir dokümantasyon cümlesi sağlandı. Kontrol, olasılık veya confidence yapılandırılan minimumun altında kalınca `unclear` dönmesi ifadesinin uygulamayla desteklenip desteklenmediğini sordu.

Normalize sonuç `confirmed` (çıkış 0) oldu: `confirmed=0.91`, `refuted=0.06`, `unclear=0.03`, confidence `0.87`. Politika minimum olasılık `0.90`, confidence `0.80` idi. Xerify 882 ms, 649 giriş token'ı ve 41 çıkış token'ı bildirdi; kesilme veya hata yoktu. Maliyet bildirilmedi.

Bu, başarılı bir canlı isteği ve dar kapsamlı anlamsal kontrolü kaydeder. Tüm sürümü doğrulamaz; model doğruluğunu, politika kalibrasyonunu, gecikme dağılımını veya injection dayanıklılığını ölçmez. İkinci sağlayıcı veya tekrar çağrılmadı. Anahtar yerel `.env` içinde kaldı; ham yanıtlar ve yerel kayıt yayımlama varlığı değildir. Sayılar editoryal özettir; commit edilen ham sağlayıcı yanıtı değildir.
