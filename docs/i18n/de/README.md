[English](../../README.md) · [Türkçe](../tr/README.md) · **Deutsch** · [简体中文](../zh-CN/README.md) · [Español](../es/README.md) · [Français](../fr/README.md)

# Xerify-Dokumentation

> Maßgeblich ist die englische Dokumentation. Weichen Übersetzung und getestetes Verhalten voneinander ab, gilt die englische Fassung.

Englisch ist die verbindliche Sprache für öffentliche Schemas, ADRs, die Sicherheitsrichtlinie und die unveränderlichen Verifikationsnachweise. Die übersetzten Handbücher decken den gesamten Workflow für Anwender ab und lassen dabei Befehlsnamen, JSON-Felder, Provider- und Modellbezeichner, Exit-Codes sowie Konfigurationsschlüssel unangetastet. Weichen Übersetzung und getesteter Vertrag voneinander ab, gilt die englische Fassung – Abweichungen bitte melden.

## Anwenderhandbücher

- [Installation und Updates](installation.md)
- [Projektkonfiguration](configuration.md)
- [CLI-Referenz](cli-reference.md)
- [Provider-Adapter](provider-adapters.md)
- [Provider und Zugangskanäle](channels.md)
- [JSON- und Exit-Code-Vertrag](json-contract.md)
- [Lokale Run-Historie](run-history.md)
- [MCP](mcp.md)
- [Kompatibilitäts- und Support-Grenzen](compatibility.md)
- [Architektur](architecture.md)
- [Ausgearbeitete Verifikationsbeispiele](examples/README.md)
- [Anleitung ohne Provider-Konto](examples/no-account-walkthrough.md) – jedes Ergebnis ganz ohne Provider-Kontingent
- [Fehlerarten](examples/failure-modes.md) – jeder typisierte Fehler mit Ursache und Lösung
- [Dogfooding](examples/dogfooding.md) – 26 Verifikationsrunden gegen zwei Kanäle, und was dabei abgelehnt wurde
- [Sicherheitsrichtlinie](security.md)

## Normative und maschinenlesbare Materialien

- [Akzeptierte Architekturentscheidungen](../../decisions/)
- [Veröffentlichte JSON-Schemas](../../../schemas/)
- [Maschinenlesbarer Beispielindex](../../examples/index.jsonl)
- [Unveränderliche Beispielnachweise](../../examples/evidence/) – nur Englisch, hash-verankert
- [Deterministischer Mock-Provider](../../../tools/mock-provider.mjs)

Das Produkt heißt **Xerify**, die npm-Distribution **`xerify-cli`** und der installierte Befehl **`xerify`**.

Jev ist als Standardadapter `jev` mit Anbieteridentität `typesafe` enthalten. `--to jev` wählt `typesafe:jev-latest`; `--to jev:MODEL_ID` wählt ein bestimmtes Modell. Jev unterstützt nur `verify`. Wahrscheinlichkeiten, Confidence, zurückgegebenes Modell und Richtlinie stehen im optionalen Feld `decision`. Unterhalb der Schwellenwerte liefert Xerify `unclear`. Jev erzeugt keine Erklärungen oder Quellenangaben.

[Jev / 0.3.0](jev.md)

[Jev](jev.md) · [Jev tests](jev-testing.md) · [Benchmark](benchmark.md) · [0.3.0](launch-0.3.0.md)
