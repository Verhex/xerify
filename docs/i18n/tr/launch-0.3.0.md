# Xerify 0.3.0 tanıtımı

Xerify 0.3.0 yayın metni. Aşağıdaki sosyal paylaşımlar henüz gönderilmedi. Canlı kontroller genel doğruluk veya kalibre edilmiş confidence kanıtı değildir.

[Jev](jev.md) · [Tests](jev-testing.md) · [Benchmark](benchmark.md)

## Ana mesaj

**Güvenmeden önce doğrula.**

**LLM incelemesi veya Jev kararı. Tek doğrulama sözleşmesi.**

Xerify, mevcut AI iddiasını, sınırlandırılmış kanıtı ve farklı çağrı sağlayıcısını alır. CLI, kütüphane ve MCP üzerinden confirmed, refuted veya unclear döndürür. Deckent’in yerleşik doğrulama katmanı olarak doğdu; bağımsız da çalışır.

## Duyuru

AI çıktısını yazılımın kullanacağı karara dönüştürmeden önce kontrol edebilmeliyiz. Xerify 0.3.0: LLM doğrulayıcılarının yanına TypeSafe’in Jev karar modeli geliyor. Aynı kanıt sınırı, aynı farklı sağlayıcı kuralı, aynı üç sonuç. Jev’in olasılık dağılımı ve confidence değeri JSON içinde korunur. Yapılandırılan eşiklerin altında Xerify unclear döndürür; sonraki adımı uygulama belirler, gizli fallback çağrısı yoktur.

```sh
git diff --cached | xerify --json verify \
  --from openai:AUTHOR_MODEL --to jev \
  --claim "This migration preserves nullable email values"
```

TYPESAFE_API_KEY süreç ortamında olmalı; xverify-cli@0.3.0 paketini kurun. Diff tek başına yetmiyorsa şema ve ilgili diğer kanıtları da verin. Xerify artık bağımsız CLI, TypeScript kütüphanesi ve MCP sunucusu olarak kullanılabilir. Açık kaynak, MIT lisanslı, Verhex tarafından geliştiriliyor.

<https://github.com/Verhex/xerify>

## Kısa paylaşım

> Güvenmeden önce doğrula. Xerify 0.3.0’da LLM doğrulayıcılarına Jev’i ekliyoruz. Sınırlandırılmış kanıt → farklı sağlayıcı → confirmed / refuted / unclear. CLI · kütüphane · MCP. Deckent’ten doğdu. Açık kaynak.
> https://github.com/Verhex/xerify

## Görseller ve açıklama

- [GIF](../../../assets/readme/xerify-verification-flow.gif): 960 × 540; 16 s.
- [Jev](../../../assets/readme/xerify-verification-flow-poster.png): 1200 × 675.
- [Social](../../../assets/readme/xerify-verification-flow-social.png): 1920 × 1080.
- [LLM](../../../assets/readme/xerify-verification-flow-llm.png): 1200 × 675.

LLM incelemesi veya Jev kararı. Her çalıştırmada tek hedef. Sayılar temsilidir.

Animasyon bir zincir değil, iki ayrı çalıştırmadır. Jev sahnesindeki olasılık 0.78 ve confidence 0.62, varsayılan 0.90 / 0.80 politikasını geçmediğinden unclear çıkar. Bunlar canlı sonuçlar değildir. Onaylı X geometrisi ve mevcut kâğıt/mürekkep/zümrüt görsel dili korunur.

## Repo tanımları

GitHub açıklaması Xerify 0.3.0 sürümünü tanımlar. Paket ve MCP tanımları aynı doğrulama sözleşmesini anlatır.

GitHub About:

> Verify before you trust. Cross-provider verification with bounded evidence and typed verdicts. CLI, library & MCP. LLM and Jev verification in 0.3.0.

npm:

> Verify before you trust. Cross-provider verification with LLMs and Jev. CLI, library, MCP.

MCP:

> Verify before you trust. Bounded cross-provider checks with LLMs and Jev over MCP.

## Yayın sınırları

Kullanıma hazır olma iddiaları ancak ilgili sürüm yayımlandıktan sonra kullanılmalı. Jev gerekçe veya atıf üretmez; confidence doğruluk garantisi değildir. İlk canlı kontrol tek bir tanıtım/kod uyumunu sınar; bütün sürümün doğrulanması değildir. Yeni sağlayıcı benchmark’ı ayrı değerlendirilir. .env, ham yanıtlar ve yerel kayıtlar Git/npm/site/görsel/sosyal içeriklere girmez.
