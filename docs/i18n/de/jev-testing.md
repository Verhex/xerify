# Jev-Tests und Live-Ergebnisse

Diese Seite dokumentiert Integrationsprüfungen und einen am **2026-09-18** freigegebenen Live-Lauf. Die zehn engen, selbst verfassten synthetischen Fälle sind weder repräsentativer Genauigkeitsbenchmark noch Kalibrierungsstudie oder Sicherheitsprüfung.

## Offline-Vertragsabdeckung

`npm run check` verwendet synthetische HTTP-Antworten; es ruft TypeSafe nicht auf und lädt keine `.env`.

|                    |                                                                                                                                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Typisierte Anfrage | Benannter claim/context-State, Choice, angefordertes Modell, kein Schlüssel im Körper                                                                                                       |
| Urteile            | `confirmed`, `refuted`, natives unclear; ursprüngliche Auswahl getrennt erhalten                                                                                                            |
| Schwellen          | Exakte Standard-/Sondergrenzen, unmittelbar darunter, Einheitswahrscheinlichkeiten, Gleichstände selbst bei Nullschwellen                                                                   |
| Antwortvalidierung | Fehlendes Modell/Antwort/Confidence, ungültiger Typ/Auswahl, negative oder Textwahrscheinlichkeiten, fehlende/zusätzliche Optionen, falsche Summe, nichtmaximale Auswahl, ungültige Nutzung |
| Nutzung            | Fehlende/teilweise/Nullwerte, keine erfundenen Summen oder Preise                                                                                                                           |
| Identität          | Gleicher Anbieter und unbekannte Provenienz vor Fetch abgewiesen; `ask`/request nicht unterstützt                                                                                           |
| Konfiguration/Auth | Feste typesafe-Identität, Schwellenbereiche, Endpoint-/Env-Syntax, Env-Vorrang, fehlender Schlüssel, reine Präsenzprüfung                                                                   |
| Grenzen            | Eingabe vor Fetch abgelehnt; übergroße Ausgabe unclear, Exit 6, Kürzung gemeldet                                                                                                            |
| Transport          | 401/403, 400/422; wiederholbare 408/409/429/500/503/529; ungültiges/leeres JSON, Netzwerkfehler, Vorab-/laufender Abbruch, Timeout; keine Wiederholung                                      |
| Datenschutz        | Kein roher HTTP-Fehlerkörper oder Netzwerk-Ausnahmetext im Ergebnis, kein Schlüssel im Körper, kein decision im Audit                                                                       |
| CLI/Bibliothek     | Standard-/Versionsaliase, drei Urteile, Enthaltung, Auth-/Rate-Limit-Exits, Entscheidungsschema                                                                                             |
| MCP                | STDIO-Protokolltest trägt Urteile, Enthaltung, Metadaten und Capabilities; lokales HTTP behält decision bei Enthaltung                                                                      |
| Live-Runner        | Vorschau ohne Schlüssel/Build; Live-Modus lehnt fehlende Freigabe oder Schlüssel ab                                                                                                         |
| Distribution       | Dotenv-Schutz bei erzwungenem Staging, npm-Manifesten und Website-Pfaden; Installations-Smoke prüft CLI/MCP                                                                                 |

Der Kürzungsregressionstest fand einen echten Defekt: Bei einer übergroßen, nicht mehr als JSON lesbaren HTTP-Antwort ging `truncation.output` beim Erzeugen des Fehlerergebnisses verloren. Core bewahrt diese typisierten Metadaten jetzt. Das Urteil bleibt `unclear` mit `INVALID_PROVIDER_RESPONSE`.

## Live-Szenarien

Start: **2026-09-18 11:48:32 UTC** (14:48:32 Europe/Istanbul). Verwendet wurden der kompilierte Xerify-CLI-Handler, der normale Jev-Adapter und TypeSafe-Endpunkt. Deklarierte Quelle: `openai:gpt-6`; Ziel: `typesafe:jev-1.13.0`; gemeldetes Modell: `jev-1.13.0`. Richtlinie: Wahrscheinlichkeit **≥0.90**, Confidence **≥0.80**, eindeutiges Maximum. Sollwerte standen vorher fest; jeder Fall lief einmal, ohne Wiederholung, Fallback, Schwellenanpassung oder nachträgliche Promptänderung. Nur die zehn Paare aus der [Szenarioquelle](../../../scripts/jev-scenarios.mjs) wurden übermittelt. Reihenfolge der Wahrscheinlichkeiten: **confirmed / refuted / unclear**.

| Szenario                                      | Erwartet  | Jev-Auswahl → Xerify-Urteil | Wahrscheinlichkeiten | Confidence | ms  | Exit |
| --------------------------------------------- | --------- | --------------------------- | -------------------- | ---------- | --- | ---- |
| Explizite Unterstützung                       | confirmed | confirmed → confirmed       | 1 / 0 / 0            | 1.00       | 942 | 0    |
| Expliziter Widerspruch                        | refuted   | refuted → refuted           | 0 / 1 / 0            | 1.00       | 365 | 10   |
| Leere Evidenz                                 | unclear   | unclear → unclear           | 0 / 0 / 1            | 1.00       | 317 | 11   |
| Unpassende Evidenz                            | unclear   | unclear → unclear           | 0 / 0 / 1            | 1.00       | 371 | 11   |
| Teilweise gestützte Mehrfachbehauptung        | unclear   | unclear → unclear           | 0 / 0 / 1            | 0.99       | 336 | 11   |
| Materieller Widerspruch in Mehrfachbehauptung | refuted   | refuted → refuted           | 0 / 1 / 0            | 1.00       | 351 | 10   |
| Türkische Unterstützung                       | confirmed | confirmed → confirmed       | 1 / 0 / 0            | 0.99       | 308 | 0    |
| SQL-Spaltenentfernung                         | refuted   | refuted → refuted           | 0 / 1 / 0            | 1.00       | 597 | 10   |
| Eingebettete Urteilsanweisung                 | refuted   | refuted → refuted           | 0 / 1 / 0            | 1.00       | 360 | 10   |
| Confidence-Schwellenlogik                     | confirmed | confirmed → confirmed       | 0.99 / 0.01 / 0      | 0.98       | 335 | 0    |

Alle zehn Ergebnisse entsprachen den Erwartungen: **3 confirmed, 4 refuted, 3 unclear**. Überall `failure: null`, keine Kürzung. Gemeldete Nutzung: **5.151 Eingabe- und 417 Ausgabetokens**. Pro Ergebnis blieben `totalTokens` und `costUsd` null; kein Dollarpreis wurde abgeleitet. Einzelzeiten **308–942 ms** sind ein Einzellauf, kein Latenzbenchmark oder SLA. Keiner dieser Fälle löste eine Schwellenenthaltung aus: Drei unclear waren native Entscheidungen. Schwellen und Gleichstände werden deterministisch geprüft. Eine eingebettete Anweisung wurde ignoriert; allgemeine Injection-Abwehr ist nicht gemessen. Wahrscheinlichkeit 1 ist eine Modellausgabe, kein Gewissheitsbeweis. Dies ist eine redaktionelle Zusammenfassung; rohe Antworten, Schlüssel und private Laufdaten werden nicht eingecheckt. Die frühere [Dokumentations-/Code-Prüfung](jev.md) ist separat und nicht in den Summen enthalten.

## Bewusst reproduzieren

Evidenz und Sollwerte ohne Schlüssel oder Anfrage ansehen:

```sh
node scripts/live-jev-scenarios.mjs
```

Nach Eigentümerfreigabe möglicher Kosten aus dem Quell-Checkout starten:

```sh
npm run build
XERIFY_LIVE_CONFIRM_BILLABLE=YES node --env-file=.env scripts/live-jev-scenarios.mjs --live
```

Node 20.6+ unterstützt explizites env-file-Laden. Der Runner fixiert jev-1.13.0, führt höchstens zehn sequenzielle Auswertungen aus und stoppt beim ersten Betriebs-/Authfehler. Temporäre Konfiguration deaktiviert Historie und ignoriert normale Nutzer-/Projektkonfiguration; an die CLI-Umgebung geht nur der TypeSafe-Schlüssel. .env wird nie kopiert. Jede Anfrage hat 30 Sekunden Timeout. Ausgewählte normalisierte Metadaten werden in einer nur für den Eigentümer lesbaren Zeitstempeldatei unter ignoriertem `.xerify/live-jev-scenarios/` gespeichert, ohne rohe HTTP-Antwort oder Evidenz. Runner-Exits: 0 alle Sollwerte erfüllt, 11 semantische Abweichung, 1 unvollständig/Betriebsfehler, 2 fehlende Live-Freigabe, 3 fehlender Schlüssel. Die einzelnen Verifikationsexits bleiben erhalten. Abweichungen prüfen, nicht bis zur gewünschten Antwort wiederholen. Normale Checks, Installations-Smoke und Releases rufen diesen Runner nicht auf.

## Fehler in Anwendungen auswerten

|                                       | CLI exit |                                                                           |
| ------------------------------------- | -------- | ------------------------------------------------------------------------- |
| confirmed                             | 0        | Durch Evidenz gestützt; Umfang prüfen                                     |
| refuted                               | 10       | Widerspruch ausgewählt; Behauptung prüfen                                 |
| unclear, `failure: null`              | 11       | Fehlende/mehrdeutige Evidenz oder Enthaltung; decision und Evidenz prüfen |
| SAME_PROVIDER / PROVENANCE_UNPROVABLE | 2        | Anbieteridentität korrigieren; keine Auswertung                           |
| AUTH_UNAVAILABLE / 401 / 403          | 3        | Auth-Fehlerhülle, kein Verifikationsergebnis; Zugangsdaten korrigieren    |
| TIMEOUT / CANCELLED                   | 4        | Betriebliches unclear; keine automatische Wiederholung                    |
| PROVIDER_FAILURE                      | 5        | Betriebliches unclear; Retrybarkeit nur Metadatum                         |
| INVALID_PROVIDER_RESPONSE             | 6        | Betriebliches unclear; Grenzen und Kompatibilität prüfen                  |

Mit `failure` Betriebsfehler von sinnvoller Enthaltung unterscheiden. Für Schwellenentscheidungen `decision.choice`, Auswahlwahrscheinlichkeit, Confidence und Richtlinie ansehen. Beispiele und MCP-Einrichtung: [Jev-Leitfaden](jev.md).
