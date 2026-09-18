# Xerify 0.3.0 campaign

Status: release copy for Xerify 0.3.0. Social posts below have not been sent. The first live Jev check is recorded in [the integration guide](jev.md).
Ten additional owner-approved synthetic scenarios matched expectations; their probabilities,
durations, and limitations are recorded in [the test report](jev-testing.md). These checks do not
establish general model accuracy or calibrated confidence.

## Core message

**Verify before you trust.**

**LLM review or Jev decision. One verification contract.**

Xerify takes an existing AI claim, bounded evidence, and a different invocation provider. It returns
`confirmed`, `refuted`, or `unclear` through CLI, library, and MCP. Born as Deckent's native
verification layer, it also runs independently.

## English announcement

AI systems need a way to check their own outputs before software acts on them.

Xerify 0.3.0 brings TypeSafe’s Jev alongside LLM verifiers.

Same bounded evidence. Same different-provider rule. Same three outcomes:
`confirmed` · `refuted` · `unclear`.

With Jev, the JSON result also carries the model’s probability distribution and confidence.
Below the configured thresholds, Xerify returns `unclear`. Your application decides what happens
next; there is no hidden fallback call.

```sh
git diff --cached | xerify --json verify \
  --from openai:AUTHOR_MODEL \
  --to jev \
  --claim "This migration preserves nullable email values"
```

Set `TYPESAFE_API_KEY` in the process environment and install `xverify-cli@0.3.0`. Provide the
schema and other relevant evidence when a diff alone cannot settle the claim.

Xerify started inside Deckent. Now the same verification layer works as a standalone CLI,
TypeScript library, and MCP server.

**Verify before you trust.** Open source. MIT licensed. Built by Verhex.

<https://github.com/Verhex/xerify>

## Türkçe duyuru

AI çıktısını yazılımın kullanacağı bir karara dönüştürmeden önce kontrol edebilmeliyiz.

Xerify 0.3.0: LLM doğrulayıcılarının yanına TypeSafe’in Jev karar modeli geliyor.

Aynı sınırlandırılmış kanıt. Aynı farklı sağlayıcı kuralı. Aynı üç sonuç:
`confirmed` · `refuted` · `unclear`.

Jev kullanıldığında olasılık dağılımı ve confidence değeri de JSON sonucunda korunuyor.
Yapılandırılan eşiklerin altında Xerify `unclear` döndürüyor. Sonraki adımı uygulaman belirliyor;
arka planda başka bir sağlayıcıya otomatik çağrı yapılmıyor.

`xerify --json verify --from openai:AUTHOR_MODEL --to jev --claim "…"`

Xerify, Deckent’in yerleşik doğrulama katmanı olarak doğdu. Artık bağımsız CLI, TypeScript
kütüphanesi ve MCP sunucusu olarak da kullanılabiliyor.

**Güvenmeden önce doğrula.** Açık kaynak. MIT lisanslı. Verhex tarafından geliştiriliyor.

<https://github.com/Verhex/xerify>

## Short posts

English:

> Verify before you trust. Xerify 0.3.0 brings Jev alongside LLM verifiers.
> Bounded evidence → a different provider → confirmed / refuted / unclear.
> CLI · library · MCP. Born in Deckent. Open source.
> https://github.com/Verhex/xerify

Türkçe:

> Güvenmeden önce doğrula. Xerify 0.3.0’da LLM doğrulayıcılarına Jev’i ekliyoruz.
> Sınırlandırılmış kanıt → farklı sağlayıcı → confirmed / refuted / unclear.
> CLI · kütüphane · MCP. Deckent’ten doğdu. Açık kaynak.
> https://github.com/Verhex/xerify

## Media and captions

- [Animated GIF](../assets/readme/xerify-verification-flow.gif): 960 × 540, 16 seconds, loop.
- [Jev poster](../assets/readme/xerify-verification-flow-poster.png): 1200 × 675.
- [Social still](../assets/readme/xerify-verification-flow-social.png): 1920 × 1080.
- [LLM still](../assets/readme/xerify-verification-flow-llm.png): 1200 × 675.

English caption: “LLM review or Jev decision. One target per run. Illustrative values.”

Türkçe açıklama: “LLM incelemesi veya Jev kararı. Her çalıştırmada tek hedef. Sayılar temsilidir.”

The animation shows two separate runs, not a cascade. In the Jev scene, the selected probability
0.78 and confidence 0.62 fail the default 0.90 / 0.80 policy, so the result is `unclear`.
These are illustrative numbers, deliberately separate from the live check. The approved X
geometry and existing paper/ink/emerald visual system are retained.

## Repository descriptions

GitHub About:

> Verify before you trust. Cross-provider verification with bounded evidence and typed verdicts.
> CLI, library & MCP. LLM and Jev verification in 0.3.0.

Package description:

> Verify before you trust. Cross-provider verification with LLMs and Jev. CLI, library, MCP.

MCP description:

> Verify before you trust. Bounded cross-provider checks with LLMs and Jev over MCP.

## Publication boundaries

Publish availability claims only after the corresponding release is available. Jev does not
provide generated explanations or citations. Confidence is not a correctness guarantee.
The live check supports one campaign/code consistency claim; it is not a benchmark or validation
of the entire release. Keep `.env`, raw provider responses, and local run records out of media,
Git, npm, site uploads, and social posts.
