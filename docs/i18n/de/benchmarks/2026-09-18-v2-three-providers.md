# Anbieterübergreifende Ergebnisse: 2026-09-18

`xerify-cross-provider-v2` · [Methode und Grenzen](../benchmark.md) · [Abgeleitete Messungen](../../../benchmarks/2026-09-18-v2-three-providers.json)

Keine rohen Anbieterantworten. Vom Eigentümer gewählte Teilmenge: 72 von 144 historischen Messungen; Cursor-Routen ausgeschlossen, kein neuer Lauf.

| Route                 | Treffer / Versuche | Übersprungen | Gültig | Fehler | Kontexttreffer / Versuche | Falsches confirmed | Zusätzliches unclear | Gültige p50 / p95 ms | Eingabetokens (Abdeckung) | Ausgabetokens (Abdeckung) | USD (Abdeckung)            |
| --------------------- | ------------------ | ------------ | ------ | ------ | ------------------------- | ------------------ | -------------------- | -------------------- | ------------------------- | ------------------------- | -------------------------- |
| openai-to-anthropic   | 10/12              | 0            | 12     | 0      | 8/9                       | 0                  | 2                    | 73055 / 108271       | 178924 (12/12)            | 36477 (12/12)             | 2.6223577500000004 (12/12) |
| openai-to-typesafe    | 12/12              | 0            | 12     | 0      | 9/9                       | 0                  | 0                    | 794 / 1392           | 7375 (12/12)              | 500 (12/12)               | — (0/12)                   |
| anthropic-to-openai   | 10/12              | 0            | 12     | 0      | 8/9                       | 0                  | 2                    | 11296 / 19177        | 191012 (12/12)            | 2369 (12/12)              | — (0/12)                   |
| anthropic-to-typesafe | 12/12              | 0            | 12     | 0      | 9/9                       | 0                  | 0                    | 766 / 1074           | 7375 (12/12)              | 500 (12/12)               | — (0/12)                   |
| typesafe-to-openai    | 10/12              | 0            | 12     | 0      | 8/9                       | 0                  | 2                    | 10957 / 13510        | 191006 (12/12)            | 2241 (12/12)              | — (0/12)                   |
| typesafe-to-anthropic | 10/12              | 0            | 12     | 0      | 8/9                       | 0                  | 2                    | 77798 / 129163       | 177060 (12/12)            | 32718 (12/12)             | 2.7045484999999996 (12/12) |

Betriebsfehler mindern den Lieferungserfolg, auch wenn ihr Ersatzurteil unclear lautet. Gültige Latenzperzentile schließen Fehler aus; separate Zeiten stehen im JSON. Fehlende Token-/Kostenwerte sind unbekannt, nicht null. Ohne Kostenabdeckung ist kein Dollarvergleich möglich.

## Szenariomatrix

| Szenario            | Erwartet  | openai-to-anthropic | openai-to-typesafe | anthropic-to-openai | anthropic-to-typesafe | typesafe-to-openai | typesafe-to-anthropic |
| ------------------- | --------- | ------------------- | ------------------ | ------------------- | --------------------- | ------------------ | --------------------- |
| support             | confirmed | unclear             | confirmed          | unclear             | confirmed             | unclear            | unclear               |
| contradiction       | refuted   | refuted             | refuted            | refuted             | refuted               | refuted            | refuted               |
| missing             | unclear   | unclear             | unclear            | unclear             | unclear               | unclear            | unclear               |
| turkish             | confirmed | unclear             | confirmed          | unclear             | confirmed             | unclear            | unclear               |
| exception           | refuted   | refuted             | refuted            | refuted             | refuted               | refuted            | refuted               |
| partial             | unclear   | unclear             | unclear            | unclear             | unclear               | unclear            | unclear               |
| indirection         | confirmed | confirmed           | confirmed          | confirmed           | confirmed             | confirmed          | confirmed             |
| injection           | refuted   | refuted             | refuted            | refuted             | refuted               | refuted            | refuted               |
| conflicting-sources | unclear   | unclear             | unclear            | unclear             | unclear               | unclear            | unclear               |
| distractors         | confirmed | confirmed           | confirmed          | confirmed           | confirmed             | confirmed          | confirmed             |
| sql                 | refuted   | refuted             | refuted            | refuted             | refuted               | refuted            | refuted               |
| unmeasured-outcome  | unclear   | unclear             | unclear            | unclear             | unclear               | unclear            | unclear               |

Vergleich mit synthetischen Labels, keine Schätzung der Produktionsgenauigkeit. Schemafehler messen fehlgeschlagene Vertragserfüllung, nicht die Richtigkeit einer unlesbaren Antwort. Gleiche Ziele unter verschiedenen deklarierten Quellen erhalten identische Eingaben. Abweichungen vor Schlussfolgerungen prüfen.
