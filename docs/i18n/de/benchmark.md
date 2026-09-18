# Anbieterübergreifender Benchmark

Dies ist ein ausdrücklich gestarteter **Xerify-End-to-End-Verifikationsbenchmark**, keine Rangliste der Intelligenz zugrunde liegender Modelle. Verglichen werden installierte Anbieterkanäle mit exakt denselben verfassten Behauptungen und Belegen. Der Eigentümer genehmigte Live-Aufrufe und feste Eingaben, bei denen ausschließlich das Ziel aufgerufen wird. Veröffentlichung, Paketfreigabe und Social Posts folgen einer getrennten Ergebnisprüfung.

## Matrix und unveränderte Eingaben

`xerify-cross-provider-v3` enthält `openai`, `anthropic` und `typesafe` (Jev): **6 Richtungen × 12 Szenarien = 72 Auswertungen**. Jeder Anbieter wird mit den beiden anderen kombiniert; keine Selbstverifikation. Die Quelle ist nur eine deklarierte Testidentität, kein Generierungsaufruf. Nur das Ziel wird aufgerufen. Cursor ist ausgeschlossen und wird separat untersucht.

| Ziel         | Adapter/Kanal                 | Angefordertes Modell |
| ------------ | ----------------------------- | -------------------- |
| OpenAI       | `codex`, lokale Codex CLI     | `gpt-6-astra`        |
| Anthropic    | `claude`, lokaler Claude Code | `claude-opus-5`      |
| TypeSafe Jev | `jev`, direkte HTTPS API      | `jev-1.13.0`         |

Lokale Ausgangsversionen: Codex CLI 0.154.0, Claude Code 2.1.276, Node 24.15.0 unter Linux/WSL. Codex verwendet `--ignore-user-config` und `--ignore-rules`; persönliche Reasoning-Einstellungen gelten daher nicht als übernommen. Effektive, im normalisierten Ergebnis nicht sichtbare Inferenzparameter bleiben ungemessen; CLI-Defaults gelten. Bestehende CLI-Konten und der lokale TypeSafe-Schlüssel authentifizieren. Gemessen werden diese Konfigurationen, nicht gleiche Inferenzparameter oder reine API-Leistung. Modellnamen können Aliase sein; nur Jev meldet im normalisierten Xerify-Ergebnis ein aufgelöstes Modell. Nicht beobachtete Revisionen werden nicht behauptet.

Die [Testfälle](../../../scripts/benchmark-cases.mjs) enthalten je vier `confirmed`, `refuted`, `unclear`: Unterstützung, Widerspruch, fehlende Evidenz, türkische Berechtigungen, Richtlinienausnahmen, Teilbelege, Indirektion, eingebettete Anweisungen, widersprüchliche Quellen, Ablenkungen, SQL-Löschung und ungemessene Folgen. Sollwerte standen vor dem Lauf fest und beschreiben die Textbeziehung, keine extern belegte Realität. Eine konservative Weigerung, einer synthetischen Spezifikation zu vertrauen, ist eine Labelabweichung, nicht zwangsläufig eine Halluzination. Widersprüchliche Quellen erwarten Enthaltung, weil Priorität und tatsächlich eingesetzte Version unklar sind.

Sollwerte und Szenario-IDs werden nicht übermittelt. Identische UTF-8-Behauptungen und Kontexte werden über SHA-256 geprüft. Die Quellidentität steht weder im aktuellen LLM-Prompt noch im Jev-State. Gleiche Ziele in verschiedenen Quellzeilen sind Wiederholungsmessungen desselben Inputs, kein Nachweis einer kausalen Quellwirkung. Lokalisierte Dokumente übersetzen die Fixtures nicht. LLMs erhalten das volle Verifikationsschema, Jev eine typisierte Choice ohne Begründung. Bewertet wird das gemeinsame finale Drei-Wege-Urteil.

## Ausführung und endlicher Ablauf

Vorschau ohne Schlüssel, Build oder Anbieteraufruf:

```sh
node scripts/benchmark-providers.mjs
```

Nach Eigentümerfreigabe möglicher Kosten:

```sh
npm run build
XERIFY_LIVE_CONFIRM_BILLABLE=YES node --env-file=.env scripts/benchmark-providers.mjs --live
```

`timeoutMs: 0` deaktiviert Xerifys Laufzeitgrenze. Es gibt keine künstliche maximale Wartezeit: Der Zielprozess oder die HTTP-Antwort beendet den Aufruf. Die Matrix ist endlich, ohne automatische Wiederholung, Fallback oder Schleife bis zur gewünschten Antwort. Aufrufe laufen sequenziell; die Reihenfolge rotiert pro Szenario. Jede CLI-Invocation nutzt einen frischen Arbeitsbereich; Xerify verwendet keine Unterhaltung erneut. Remote-Caches und interne Anbieter-Retries werden weder gesteuert noch separat gemessen.

Ctrl-C/SIGTERM bricht den laufenden Aufruf ab und stoppt die Matrix. Hängende Anbieter können manuellen Abbruch erfordern; ohne Deadline ist Abschluss nicht garantiert. Eingabe-/Ausgabegrenzen bleiben 32.768/131.072 Bytes. Normale Defaults bleiben 120 Sekunden; `xerify --timeout 0` oder `limits.timeoutMs: 0` aktiviert unbegrenztes Warten auch auf anderen Oberflächen. Abschluss und Abbruch von HTTP und Unterprozessen ohne Deadline sind deterministisch getestet.

`XERIFY_BENCH_REPEATS` erlaubt 1..3, Standard 1. Modellvariablen: `XERIFY_BENCH_OPENAI_MODEL`, `XERIFY_BENCH_ANTHROPIC_MODEL`, `XERIFY_BENCH_TYPESAFE_MODEL`; `auto` wird abgelehnt. Änderungen an Modell oder Wiederholungen sind gesondert zu berichten. Betriebliche Nichtverfügbarkeit stoppt weitere Aufrufe des Ziels; übrige Zellen werden skipped, niemals erfolgreich. Schemafehler bleiben versuchte Fehler.

Private Ergebnisse werden nach jeder Zelle gesichert. Ausschließlich noch nicht versuchte Zellen fortsetzen:

```sh
XERIFY_LIVE_CONFIRM_BILLABLE=YES node --env-file=.env scripts/benchmark-providers.mjs --live \
  --resume=.xerify/benchmarks/RUN_TIMESTAMP/report.json
```

Resume prüft Suite, Fälle, Modelle, Routen, Wiederholungen, Limits und Adapter-/Prompt-Hashes. Vorherige Fehler und Abweichungen bleiben erhalten, ohne erneuten Aufruf. Ein neuer privater Bericht trägt die bisherigen Versuche und den Ursprungszeitstempel. Ein Abbruch während einer Anfrage beweist nicht, ob remote Kosten entstanden sind; fehlender Abschlussdatensatz bedeutet nicht, dass kein Request ankam.

## Metriken und Interpretation

| Metrik                      | Definition                                                                                                                           |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Attempted / skipped / valid | Ausgeführt, nicht ausgeführt, schemagültig mit `failure: null`                                                                       |
| Exakte Übereinstimmung      | Gültiges Endurteil entspricht Sollwert / alle Versuche; Betriebsfehler mindern den Lieferungserfolg                                  |
| Kontextübereinstimmung      | Treffer unter neun Kontextfällen mit Versuchszahl; kein allgemeiner Verständniswert                                                  |
| Konfusionsmatrix            | Soll gegen Ist; Fehler und skipped in eigenen Spalten                                                                                |
| Falsche Bestätigung         | confirmed bei erwartetem refuted oder unclear                                                                                        |
| Unnötige Enthaltung         | Gültiges unclear bei erwartetem confirmed oder refuted                                                                               |
| Entscheidende Abdeckung     | Anzahl gültiger confirmed/refuted; erwartetes unclear kann richtig sein                                                              |
| Latenz                      | Monotone Gesamtzeit um den CLI-Handler inklusive Start, Netzwerk und Normalisierung; gültige p50/p95/min/max und Fehler-p50 getrennt |
| Tokens                      | Gemeldete Eingabe-/Ausgabesummen samt Abdeckung; fehlend bleibt null, nicht null Tokens                                              |
| Kosten                      | Nur gemeldete USD samt Abdeckung; keine Schätzung fehlender Preise oder Aboquoten                                                    |

Perzentile verwenden nearest-rank für gültige Aufrufe. Zwölf Werte je Route belegen weder stabile p95 noch statistische Signifikanz. Gesamtzeit ist nicht Time-to-first-token. Jevs Ausgabetokens und Erklärung-/Reasoning-Tokens der LLMs erfüllen andere Verträge. Codex-Input enthält Cachetokens bereits; Claude addiert gemeldete Cache-Erstellungs-/Lesewerte. Tokenizer, Prompt-Overhead und Cacheabrechnung unterscheiden sich. Irreführende Tokens-pro-Sekunde-Ranglisten werden nicht erstellt.

Jev bleibt bei Wahrscheinlichkeit ≥0.90, Confidence ≥0.80 und eindeutigem Maximum; Originalauswahl bleibt getrennt. Confidence ist kein unabhängiges Wahrheitslabel: [TypeSafe-Definition](https://docs.typesafe.ai/confidence). Für Indirektion, Ablenkungen und Angriffe siehe [Jev-1.13-Grenzen](https://docs.typesafe.ai/model-jaggedness/jev-1.13). Es wird keine menschliche Begründungsqualität oder LLM-as-judge-Bewertung erfunden. Die kleine synthetische Stichprobe repräsentiert keine Produktion. Einzelabweichungen vor Marketing prüfen; kein Gewinner oder Geschwindigkeitsfaktor wird vorweggenommen.

Während des Laufs wurden auf demselben Rechner Dokumente bearbeitet und lokale Prüfungen ausgeführt. Die Hostlast war nicht isoliert; Latenzen enthalten diese Umgebungsvariabilität.

## Transport und Sicherheitsgrenzen

Nur Jev wird vom Adapter direkt per HTTP aufgerufen. Codex und Claude Code sind lokale Programme mit externen Diensten. Evidenz verlässt bei allen drei Kanälen den Rechner; Konten, Aufbewahrung, Limits und Abrechnung des Anbieters gelten. Weitere Backends sind direkte OpenAI API, Anthropic API, OpenAI-kompatible Endpunkte und konfigurierte Befehlsadapter. Ein ausdrücklich eingerichtetes lokales Modell kann lokal rechnen; ein lokaler Client eines entfernten Dienstes nicht. Diese Backends werden in diesem Lauf nicht eingewechselt. CLI, Bibliothek, MCP STDIO und HTTP sind alternative Eingänge desselben Kerns; MCP ersetzt Jevs HTTPS-Endpunkt nicht und macht die Berechnung nicht lokal.

Unterprozesse erhalten eine erlaubte Umgebungsmenge und temporäre Verzeichnisse, keine Kopie von Repository oder .env. TypeSafe-Schlüssel gehen nicht an die anderen CLIs. Deren Home-Konfiguration und Auth-Stores können weiterhin verwendet werden; temporärer Arbeitsbereich bedeutet keine vollständige OS-Isolation. Adaptermodi begrenzen Werkzeuge/Sandbox. HTTP MCP bindet standardmäßig Loopback; öffentliches Binding verlangt ausdrückliche Einstellung und Bearer-Authentifizierung.

Nur verfasste synthetische Evidenz wird gesendet. Der Runner deaktiviert Xerify-Historie/Audit temporär, ignoriert normale Projekt-/Nutzerkonfiguration und kopiert nie .env. Ausgewählte normalisierte Daten bleiben eigentümerprivat unter ignoriertem `.xerify/benchmarks/`. Generierte Zusammenfassungen, volle Ausgaben, HTTP-Rohkörper, Auth-Stores und Schlüssel sind keine Publikationsartefakte. Ergebnisse werden schemageprüft, nie als Befehle ausgeführt. Promptregeln und Typprüfung beweisen keine umfassende Injection-Abwehr oder Wahrheit.

Die gespeicherten Implementierungs-Hashes beschreiben die Dateien beim Start. Während des Laufs erhielt das Harness einen expliziten Buffer-Import, Filter für geerbte XERIFY__-Optionen und eine Prüfung von auto ohne Beachtung der Großschreibung. Der laufende Prozess behielt seinen geladenen Code; seine Umgebung enthielt keine XERIFY__-Overrides. Adapter, Modelleingaben, Testfälle und Entscheidungsschwellen blieben unverändert. Ein späterer Lauf hat daher einen anderen Harness-Hash und muss separat erfasst werden.

## Aufgezeichnete Läufe

Der frühere v1-Pilot nutzte sechs Routen und 90 Sekunden Deadline. Anthropic lief beim vierten Aufruf ins Timeout, weitere Zellen wurden übersprungen; dieser Kanal ist unvollständig. Danach verlangte der Eigentümer alle zwölf Routen ohne Deadline. Der Pilot bleibt privat und wird nicht mit v2 vermischt. Geänderte Bedingungen bedeuten eine neue Suite.

Der ursprüngliche v2-Lauf umfasste 144 Aufrufe. Auf Wunsch des Eigentümers wurden alle Cursor-Routen aus dem öffentlichen Vergleich entfernt: **72 Aufrufe, keine übersprungenen Zellen**. Keine neuen Aufrufe oder geänderten Labels. [Ergebnisse](benchmarks/2026-09-18-v2-three-providers.md) · [Messungen](../../benchmarks/2026-09-18-v2-three-providers.json). Jev **24/24**, OpenAI und Anthropic jeweils **20/24** Treffer. Beide antworteten bei support und türkischen Berechtigungen unclear. Mediane gültiger Einzelaufrufe: Jev **783 ms**, OpenAI **11.123 ms**, Anthropic **75.444 ms**. Token-Summen und Abdeckung stehen im Bericht; fehlende Kosten bleiben unbekannt. V3 startet neue Drei-Anbieter-Läufe und setzt v2 nicht fort. Der vollständige private Verlauf bleibt unverändert.
