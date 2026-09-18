# Xerify 0.3.0: Kampagne

Veröffentlichungstext für Xerify 0.3.0. Die folgenden Social-Media-Beiträge wurden noch nicht gesendet. Live-Prüfungen belegen keine allgemeine Genauigkeit oder kalibrierte Confidence.

[Jev](jev.md) · [Tests](jev-testing.md) · [Benchmark](benchmark.md)

## Kernbotschaft

**Prüfen, bevor Sie vertrauen.**

**LLM-Prüfung oder Jev-Entscheidung. Ein Verifikationsvertrag.**

Xerify nimmt eine vorhandene KI-Behauptung, begrenzte Evidenz und einen anderen Aufrufanbieter entgegen. CLI, Bibliothek und MCP liefern confirmed, refuted oder unclear. Entstanden als native Deckent-Verifikationsschicht, auch eigenständig nutzbar.

## Ankündigung

KI-Ausgaben sollten geprüft werden, bevor Software danach handelt. Xerify 0.3.0: TypeSafes Jev ergänzt die LLM-Prüfer. Dieselbe Evidenzgrenze, dieselbe Anbietertrennung, dieselben drei Urteile. Jevs Wahrscheinlichkeitsverteilung und Confidence bleiben im JSON. Unter den konfigurierten Schwellen antwortet Xerify unclear. Die Anwendung entscheidet weiter; kein versteckter Ersatzaufruf.

```sh
git diff --cached | xerify --json verify \
  --from openai:AUTHOR_MODEL --to jev \
  --claim "This migration preserves nullable email values"
```

TYPESAFE_API_KEY in der Prozessumgebung setzen und xverify-cli@0.3.0 installieren. Reicht ein Diff nicht aus, Schema und weitere relevante Evidenz ergänzen. Xerify ist als eigenständige CLI, TypeScript-Bibliothek und MCP-Server verfügbar. Open Source, MIT-Lizenz, entwickelt von Verhex.

<https://github.com/Verhex/xerify>

## Kurzbeitrag

> Prüfen, bevor Sie vertrauen. Xerify 0.3.0 verbindet Jev mit LLM-Prüfern. Begrenzte Evidenz → anderer Anbieter → confirmed / refuted / unclear. CLI · Bibliothek · MCP. Aus Deckent entstanden. Open Source.
> https://github.com/Verhex/xerify

## Medien und Bildunterschrift

- [GIF](../../../assets/readme/xerify-verification-flow.gif): 960 × 540; 16 s.
- [Jev](../../../assets/readme/xerify-verification-flow-poster.png): 1200 × 675.
- [Social](../../../assets/readme/xerify-verification-flow-social.png): 1920 × 1080.
- [LLM](../../../assets/readme/xerify-verification-flow-llm.png): 1200 × 675.

LLM-Prüfung oder Jev-Entscheidung. Ein Ziel je Lauf. Beispielwerte.

Die Animation zeigt zwei getrennte Läufe, keine Kaskade. Wahrscheinlichkeit 0.78 und Confidence 0.62 unterschreiten die Standardrichtlinie 0.90 / 0.80, daher unclear. Das sind keine Live-Ergebnisse. Freigegebene X-Geometrie und Papier-/Tinte-/Smaragdgestaltung bleiben erhalten.

## Repository-Beschreibungen

GitHub About beschreibt Xerify 0.3.0. Paket- und MCP-Beschreibungen erläutern denselben Vertrag.

GitHub About:

> Verify before you trust. Cross-provider verification with bounded evidence and typed verdicts. CLI, library & MCP. LLM and Jev verification in 0.3.0.

npm:

> Verify before you trust. Cross-provider verification with LLMs and Jev. CLI, library, MCP.

MCP:

> Verify before you trust. Bounded cross-provider checks with LLMs and Jev over MCP.

## Publikationsgrenzen

Verfügbarkeit erst nach tatsächlicher Veröffentlichung behaupten. Jev erzeugt keine Begründungen oder Zitate; Confidence garantiert keine Korrektheit. Die erste Live-Prüfung testet eine Kampagnen-/Codeaussage, nicht das gesamte Release. Der neue Anbieterbenchmark wird separat bewertet. .env, Rohantworten und lokale Laufdaten gehören weder in Git/npm/Website noch in Medien oder Beiträge.
