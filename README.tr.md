<p align="center">
  <a href="README.md">English</a> ·
  <strong>Türkçe</strong> ·
  <a href="README.de.md">Deutsch</a> ·
  <a href="README.zh-CN.md">简体中文</a> ·
  <a href="README.es.md">Español</a> ·
  <a href="README.fr.md">Français</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/Verhex/xerify/main/assets/logos/full-horizontal/xerify-horizontal-light.svg" alt="Xerify" width="360">
</p>

<p align="center"><strong>Güvenmeden önce doğrula.</strong></p>

<p align="center">
  <img src="https://raw.githubusercontent.com/Verhex/xerify/main/assets/readme/xerify-verification-flow.gif?v=0.3.0" alt="Xerify 0.3.0: LLM doğrulaması veya Jev tipli kararları. Her çalıştırmada tek hedef; olasılıklar ve sonuçlar temsilidir." width="960">
</p>

Xerify; sınırlandırılmış, sağlayıcılar arası soru sorma ve doğrulama için shell odaklı, açık kaynaklı
bir araçtır. Bilgisayarınızda giriş yapılmış resmi sağlayıcı CLI'larını, doğrudan API'leri veya açıkça
yapılandırılmış bir çalıştırılabilir dosyayı kullanabilir. CLI, JavaScript/TypeScript kütüphanesi,
yerel STDIO MCP ve Streamable HTTP MCP aynı çekirdeği ve şemaları kullanır.

Xerify, **Verhex** tarafından topluluk katkılarıyla geliştirilir ve MIT Lisansı altında dağıtılır.
Xerify, Verhex'in ajan tabanlı işletim sistemi olan **Deckent**'in sağlayıcılar arası doğrulama
katmanıdır; burada bağımsız, kendi başına çalışan bir araç olarak sunulur ve Deckent'e hiçbir
bağımlılığı yoktur. Sonuç bir ikinci görüştür; matematiksel ispat, güvenlik sertifikası veya garanti
edilmiş gerçek değildir. Sağlayıcı çıktısı güvenilmeyen veridir ve hiçbir zaman çalıştırılmaz.

> Xerify 0.3.0, LLM doğrulamasının yanına Jev tipli kararlarını ekliyor. Bir dokümantasyon/kod tutarlılık kontrolü ve 10 ek canlı Jev senaryosu beklentilerle eşleşti. [Sonuç tablosu](docs/i18n/tr/jev-testing.md) ve [Türkçe kullanım rehberi](docs/i18n/tr/jev.md). Bu bir entegrasyon denemesidir, model doğruluğu ölçümü değildir.

Xerify, AI sistemleri için modelden bağımsız bir doğrulama katmanıdır: sınırlandırılmış kanıt, farklı bir çağrı sağlayıcısı ve tipli sonuç. LLM doğrulayıcıları ve Jev kararları aynı CLI, kütüphane ve MCP sözleşmelerini kullanır.

Jev, varsayılan `jev` adaptörüyle (`typesafe` sağlayıcısı) gelir. `--to jev`, `typesafe:jev-latest` seçer; `--to jev:MODEL_ID` belirli modeli seçer. Jev yalnızca `verify` destekler. Olasılıklar, confidence, dönen model ve politika isteğe bağlı `decision` alanında bulunur. Eşiklerin altında Xerify `unclear` döndürür. Jev açıklama veya kanıt atfı üretmez.

[Jev setup / 0.3.0](docs/i18n/tr/jev.md)

## Kurulum

İlk genel npm yayını sonrasında:

```sh
npm install --global xerify-cli@latest
xerify --version
xerify --json health
xerify init
```

Projeye sabitlenmiş geliştirme bağımlılığı:

```sh
npm install --save-dev --save-exact xerify-cli@0.3.1
npx xerify --version
```

Bağımlılık kaydetmeden çalıştırma:

```sh
npx --yes --package=xerify-cli@latest xerify --json health
```

Node.js 20 veya üstü gerekir; ana yayın hattı Node.js 24'tür. Ayrıntılar için [Türkçe tüketici
kılavuzuna](docs/i18n/tr/README.md) ve kanonik [kurulum belgesine](docs/installation.md) bakın.

## Hızlı başlangıç

Açık uçlu bir ikinci görüş isteyin; pipe edilen girdi sınırlandırılmış bağlam olur:

```sh
git diff --cached | xerify ask \
  --to anthropic:MODEL_ID \
  --question "Bu değişiklikteki en yüksek risk nedir?"
```

Somut bir iddiayı farklı bir çağrı sağlayıcısıyla çürütmeye çalışın:

```sh
git diff --cached | xerify --json verify \
  --from openai:AUTHOR_MODEL \
  --to anthropic:VERIFIER_MODEL \
  --claim "Bu değişiklik yarış durumunu regresyon oluşturmadan kapatıyor"
```

`--from` ve `--to`, çağrıyı yapan/yapmış olan kontrol ve faturalama hizmetini belirtir. Cursor Agent
üzerinden seçilen modelin adında GPT, Claude, Gemini veya Grok geçse bile sağlayıcı `cursor` olur.
Doğrudan Codex/OpenAI `openai`, doğrudan Claude/Anthropic `anthropic` kimliğidir. Aynı sağlayıcıyla
`verify`, model çağrısından önce reddedilir.

Bu ayrım kanal çeşitliliğini ölçer; model ağırlıklarının, eğitim verisinin veya kör noktaların
bağımsız olduğunu kanıtlamaz.

## Kararlar ve çıkış kodları

| Sonuç       | Exit | Çağıranın davranışı                              |
| ----------- | ---: | ------------------------------------------------ |
| `confirmed` |    0 | Devam adayı; mevcut kanıt içinde karşı örnek yok |
| `refuted`   |   10 | İddiayı engelle                                  |
| `unclear`   |   11 | Daha güçlü kanıt, tekrar veya insan incelemesi   |

Timeout, sağlayıcı hatası, geçersiz şema ve truncation ayrı sıfır-dışı kodlarla fail-closed kalır.
`unclear`, başarıya çevrilmez.

## Güvenli ve ücretsiz kurulum kontrolleri

Aşağıdaki komutlar model çağrısı yapmaz:

```sh
xerify --json health
xerify --json doctor
xerify --json providers list
xerify --json providers probe --all --timeout 5000
xerify --json config validate
```

`--network` yalnızca sınırlı endpoint erişilebilirlik kontrolü ekler; inference çağrısı yapmaz.
Canlı `ask` ve `verify` çağrıları abonelik kotası tüketebilir veya API ücreti doğurabilir.

## Yerel durum ve geçmiş

`xerify init`, proje kökünde ezmeden `.xerify/` oluşturur ve `.gitignore`, `.npmignore` ve
`.dockerignore` dosyalarına koruma ekler:

```text
.xerify/
├── xverify-config.json
├── logs/audit.jsonl
├── runs/HEAD.json
├── runs/000001/
└── archive/index.jsonl
```

Aktif kayıtlar `runs/` altında görünür; `xerify runs archive 1` bunları arşive taşır. Kompakt
`archive/index.jsonl`, insan ve AI araçlarının binlerce geçmiş kaydı tüm dosyaları açmadan aramasını
sağlar. Ham sağlayıcı taşıma çıktısı ve kimlik bilgileri geçmişe yazılmaz.

## Adaptör yolları ve model kimlikleri

Bir command adaptörü, projenizde değil özel ve boş bir dizinde çalışır; bu yüzden **`executable` ve
`args` içindeki her yol mutlak olmalıdır**. `./tools/verifier.mjs` gibi göreli bir yol bu özel
dizine göre çözümlenir ve süreç başlamadan başarısız olur. Hata artık gerçekte hangi dizine
baktığını söyleyen yorumlayıcıyı alıntılıyor:

```json
{
  "code": "PROVIDER_FAILURE",
  "providerMessage": "Error: Cannot find module '/tmp/xerify-command-rBJrxX/tools/verifier.mjs'"
}
```

Tam kimlikler Xerify'den değil sağlayıcıdan gelir; yalnızca Cursor bir listeleme komutu sunar:

| Adaptör                                            | Tam model kimliği nereden gelir                                                                                     |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `cursor`                                           | `agent models`                                                                                                      |
| `codex`                                            | Codex hesabınız ve CLI sürümünüz; `codex --help`, `--model` seçeneğini gösterir ve CLI reddettiği modeli adlandırır |
| `claude`                                           | Anthropic hesabınız ve CLI sürümünüz; `claude --help`, `--model` seçeneğini gösterir                                |
| `openai-api`, `anthropic-api`, `openai-compatible` | sağlayıcının kendi anahtarınız için sunduğu model listesi                                                           |

Bir sağlayıcı bir modeli reddettiğinde kendi cümlesi `providerMessage` altında geri bildirilir;
neyi kabul edeceğini öğrenmenin genellikle en hızlı yolu budur.

## MCP

Global kurulum için yerel STDIO:

```json
{
  "mcpServers": {
    "xerify": {
      "command": "xerify",
      "args": ["mcp", "stdio"]
    }
  }
}
```

Projeye yerel bir kurulumda `xerify`, `PATH` üzerinde bulunmaz. Bu durumda giriş noktasını doğrudan
hedefleyin — bu ayrıca `npx` dolaylamasını da atlar, dolayısıyla sunucu daha hızlı başlar:

```json
{
  "mcpServers": {
    "xerify": {
      "command": "node",
      "args": ["./node_modules/xerify-cli/dist/cli/entry.js", "mcp", "stdio"]
    }
  }
}
```

Sabit npm sürümüyle:

```json
{
  "mcpServers": {
    "xerify": {
      "command": "npx",
      "args": ["-y", "--package=xerify-cli@0.3.1", "xerify", "mcp", "stdio"]
    }
  }
}
```

Sunucu `xerify_ask`, `xerify_verify` ve ücretsiz `xerify_capabilities` araçlarını sunar. HTTP
varsayılan olarak `127.0.0.1` üzerinde çalışır; loopback dışı bind, hem `--allow-public` hem de
ortam değişkeninden bearer token gerektirir. Uç nokta `http://127.0.0.1:8787/mcp`'dir; kök yol
`404` döner. Sunucu başlangıçta tam URL'yi yazdırır — URL'yi elle birleştirmek yerine oradan okuyun.

## Xerify'i kim geliştiriyor

Xerify, **[Verhex](https://github.com/Verhex)** tarafından tasarlanır, geliştirilir ve sürdürülür.

Kökeni **Deckent**'e dayanır — Verhex'in ajan tabanlı işletim sistemine; orkestratörün dayandığı
yeteneklerden biri de bir iddiayı kontrol etmesi için ikinci bir sağlayıcıya sormaktır. Xerify, bu
yeteneğin bağımsız, açık kaynaklı halidir: kendi başına kurulur, Deckent'e ihtiyaç duymaz ve ona
hiçbir bağımlılık taşımaz.

Bu depoda yalnızca Xerify [MIT Lisansı](LICENSE) kapsamındadır. Deckent, ayrı bir Verhex ürünüdür ve
burada lisanslanmamıştır.

## Dokümantasyon

- [Türkçe kapsamlı kılavuz](docs/i18n/tr/README.md)
- [Altı dil ve kanonik İngilizce belgeler](docs/README.md)
- [Çalışılmış doğrulama örnekleri](docs/examples/README.md)
- [Güvenlik politikası](SECURITY.md)
- [MIT Lisansı](LICENSE)

Çeviriyle kanonik İngilizce sözleşme çelişirse test edilmiş İngilizce şema ve belgeler geçerlidir.

[Benchmark](docs/i18n/tr/benchmark.md)
