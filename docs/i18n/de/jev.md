# Jev mit Xerify 0.3.0

Jev ist das typisierte Entscheidungsmodell von TypeSafe. Xerify bildet die Verifikationsschicht um unterstützte Backends: begrenzte Evidenz, Anbietertrennung, stabile Urteile und Laufhistorie. Beide liefern maschinell nutzbare Entscheidungen, lösen aber unterschiedliche Teile des Problems.

Jev-Unterstützung ist in Xerify 0.3.0 enthalten. Synthetische HTTP-Antworten testen den Adapter. Eine vom Eigentümer freigegebene Kampagnenprüfung und ein separater Lauf mit zehn Live-Szenarien wurden am 2026-09-18 abgeschlossen. Siehe [Testabdeckung und Ergebnisse](jev-testing.md). Domänengenauigkeit und Schwellenkalibrierung wurden nicht gemessen.

## Schlüssel einrichten

Im Quell-Checkout `npm ci` und `npm run build` ausführen. `.env.example` nach `.env` kopieren und `TYPESAFE_API_KEY` lokal setzen. Git ignoriert `.env`; das npm-Paket schließt sie aus. Privat halten, unter POSIX mit `chmod 600 .env`. Schlüssel niemals als Evidenz oder Befehlsargument verwenden.

Die echte `.env` gehört ausschließlich in das Hauptarbeitsverzeichnis des Eigentümers: in keinen Git-Branch, auch nicht `main`, keinen weiteren Worktree, kein npm-Paket, Quellarchiv, Website-Upload oder Docker-Kontext. Git ignoriert dotenv-Dateien. Paketausschlüsse erfassen auch verschachtelte Dateien in erlaubten npm-Verzeichnissen; Docker erfasst Stamm- und Unterverzeichnisse. Git-Quellarchive schließen dotenv-Pfade aus. Im Git-Index ist nur `.env.example` im Stamm mit leeren Zuweisungen erlaubt.

`npm run secrets:check` prüft Git-Index, Website-Baum und tatsächliches npm-Dry-Run-Manifest, ohne echte dotenv-Dateien zu lesen. Es läuft in `check` und `prepack`; der Installationstest prüft ebenfalls das Paketmanifest. Der Pages-Workflow prüft die fertige Ausgabe vor dem Upload. Ein lokaler Pre-Commit-Hook blockiert auch mit `git add -f` vorgemerkte dotenv-Dateien. Nach Prüfung bestehender Hooks in neuen Checkouts mit `git config --local core.hooksPath .githooks` aktivieren; im Eigentümer-Checkout ist er aktiviert. Hooks lassen sich umgehen, deshalb bleiben CI und Paketausschlüsse unabhängige Kontrollen. Zugangsdaten nicht in andere Dateien kopieren und `.env` nicht als Evidenz übergeben.

Xerify liest die Prozessumgebung, `.env` jedoch **nicht automatisch**. Explizit mit Node `--env-file` laden; erforderlich ist Node 20.6+, empfohlen Node 24:

```sh
node --env-file=.env ./dist/cli/entry.js --json providers probe --provider jev
```

Dies meldet nur das Vorhandensein des Schlüssels, prüft weder seine Gültigkeit noch TypeSafe per Anfrage. Vorhandene Prozessvariablen haben Vorrang vor der Datei.

Dieser Befehl führt bei Ausführung eine möglicherweise kostenpflichtige Auswertung durch:

```sh
git diff --cached | node --env-file=.env ./dist/cli/entry.js --json verify \
  --from openai:AUTHOR_MODEL \
  --to jev \
  --claim "This migration preserves existing data"
```

Ist der Schlüssel bereits in der Umgebung, lautet der installierte CLI-Aufruf `xerify --json verify --from openai:AUTHOR_MODEL --to jev --claim "…"`. Genügend Evidenz liefern: Ein leerer Diff beweist keine Korrektheit. Vorhandene Aufzeichnungseinstellungen für die Laufhistorie gelten weiterhin.

## Identität und unterstützte Operationen

Standard-Adapter-ID und Konfigurationstyp heißen `jev`. Der Aufrufanbieter ist `typesafe`, weil TypeSafe den direkten Endpunkt, die Authentifizierung und Abrechnung kontrolliert. CLI `--to jev` wird zu `typesafe:jev-latest`; `--to jev:jev-1.13.0` wählt eine feste Version. Dieselbe Normalisierung gilt für `--from`: Aliase umgehen die Anbietertrennung nicht. Explizites `typesafe:MODEL_ID` funktioniert ebenfalls.

Bibliothek und MCP verwenden für `to` `{ "provider": "typesafe", "model": "jev-latest" }`. Der angeforderte Alias bleibt in `to.model`; `decision.model` enthält das in der Antwort gemeldete Modell. Jev unterstützt ausschließlich `verify`. `ask` und `request` liefern vor HTTP-Aufrufen `UNSUPPORTED`. Capabilities melden `operations: ["verify"]`; ohne dieses optionale Feld bleibt bisheriges Verhalten bestehen. Unterschiedliche Anbieter beweisen weder unabhängige Modellherkunft noch Korrektheit.

## Entscheidungsrichtlinie

Xerify sendet `{model, state: {claim, context}, questions: {verdict: …}}` an `POST https://api.typesafe.ai/v1/systemone`. Eine Choice-Frage versucht die Behauptung anhand der gelieferten Evidenz zu widerlegen; Kriterien sind `confirmed`, `refuted`, `unclear`.

Eine gültige Auswahl bleibt nur erhalten, wenn ihre Wahrscheinlichkeit mindestens **0.90**, Confidence mindestens **0.80** beträgt und das Maximum eindeutig ist. Andernfalls lautet das Urteil `unclear`. Eine native `unclear`-Auswahl bleibt unverändert. Unterhalb der Schwellen gilt `failure: null`, Exit 11. Diese konfigurierbaren Heuristiken sind keine unabhängig kalibrierten Genauigkeitsgarantien. TypeSafe-Confidence fasst die Verteilung zusammen und unterscheidet sich von der Wahrscheinlichkeit einer Option.

Illustrativer synthetischer Ergebnisausschnitt:

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

`decision` ergänzt Schemaversion 1 optional. Die Wahrscheinlichkeiten beschreiben die ursprüngliche Auswahl, auch wenn Xerify sich enthält. Alle drei müssen vorhanden und in [0,1] sein; die Summe darf höchstens 0.000001 von eins abweichen; die gewählte Option muss ein Maximum sein. Feldübergreifende Bedingungen gelten zusätzlich zum exportierten JSON Schema zur Laufzeit. Ungültige Antworten und Transportfehler behalten bestehende Fehlertypen und Exit-Codes. Es gibt keine automatischen Wiederholungen oder Ersatzaufrufe.

Jev erzeugt weder Erklärungen noch Evidenzzitate. Xerify liefert ausdrücklich als Vorlage gekennzeichnete Zusammenfassungen und Einschränkungen; findings/evidence bleiben leer. Typisierte Ausgabe ist kein Wahrheitsbeweis. Optionale Metadaten bleiben entsprechend der Aufzeichnungsrichtlinie in der normalisierten Historie; Audit-JSONL speichert das Entscheidungsobjekt nicht. Nutzungswerte werden ohne Kostenschätzung berichtet.

## Konfiguration, Bibliothek und MCP

Der Standardadapter benötigt keine Anbieterkonfiguration. Zum Überschreiben seiner Richtlinie diesen Eintrag in die vorhandene `.xerify/xverify-config.json` integrieren:

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

Umgebungszugangsdaten haben Vorrang vor einem optionalen wörtlichen `apiKey`. Diagnosemaskierung und nur dem Eigentümer zugängliche Dateirechte entsprechen den anderen direkten API-Adaptern. Ein optionaler `endpoint` erlaubt vertrauenswürdige Proxys oder lokale Testserver; eine Änderung sendet Schlüssel und Evidenz an diese URL. Bei einem anderen Aufrufdienst einen separat deklarierten Gateway-Adapter verwenden. Anfragekörper und HTTP-Antwort sind bytebegrenzt; übergroße Eingaben werden vor kostenpflichtigen Aufrufen abgelehnt. Anbieter-Tokenlimits gelten unabhängig vom Xerify-Bytelimit.

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

Für MCP `TYPESAFE_API_KEY` in der Serverumgebung bereitstellen und `xerify_verify` mit derselben strukturierten Anfrage aufrufen. Im Quell-Checkout funktioniert explizites dotenv-Laden auch für STDIO: `node --env-file=.env ./dist/cli/entry.js mcp stdio`. Kein zusätzliches MCP-Werkzeug erforderlich.

## Agent-Skills

Den offiziellen Skill für Codex, Claude Code und Cursor mit genau einer Methode installieren:

```sh
npx skills add typesafe-ai/skills --skill typesafe-ai --agent codex claude-code cursor --yes
```

Dies ist die Mehrfach-Agent-Auswahl des von TypeSafe für andere Agenten empfohlenen Befehls. Er installiert Dateien, keine Modellintegration oder API-Zugangsdaten. Für dieselbe Einrichtung nicht zusätzlich das Claude-Marketplace-Plugin installieren. Codex und Cursor verwenden `.agents/skills/typesafe-ai`; Claude Code verwendet die verknüpfte gemeinsame Kopie unter `.claude/skills/typesafe-ai`. Die Quelle wird in `skills-lock.json` festgehalten; `experimental_install` kann gesperrte Versionen wiederherstellen.

Dieser Checkout enthält zusätzlich den lokalen Begleit-Skill `.agents/skills/xerify-jev`, mit Claude Code verknüpft. Er dokumentiert Anbieteridentität, Richtlinie, Schema und Prüfanforderungen, ohne den offiziellen Skill zu ändern. Beide Installationen und der lokale `AGENTS.md`-Verweis sind ignorierter Entwicklungszustand, kein npm-Inhalt. Der Begleit-Skill ist checkoutlokal; das offizielle Lockfile stellt ihn nicht wieder her. In Codex `$typesafe-ai` für allgemeine TypeSafe-Hilfe oder `$xerify-jev` für diese Integration auswählen. Neue Skills stehen ab dem nächsten Turn bereit; laufende Agenten müssen eventuell das Projekt neu laden.

## Dokumentationsprüfung und Urteilsumfang

Offizieller Skill und Live-Dokumentation wurden am 2026-09-18 geprüft: Einführung, State, Choice, HTTP API, Confidence, Modelle, Einschränkungen und Citation-Check-Cookbook. Der bereitgestellte Download entsprach bytegenau der offiziellen GitHub-Version.

| Bereich       | Ergebnis                                                                                                                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Protokoll     | Direkten HTTP-Endpunkt, Bearer-Authentifizierung, benannten State und Choice-Zuordnung beibehalten; kein Chat-Completions-Wrapper nötig.                                                          |
| Frage         | `claim` und `context` ausdrücklich nennen und ihre Beziehung prüfen; fehlende Unterstützung allein ist kein Widerspruch.                                                                          |
| Richtlinie    | 0.90 Wahrscheinlichkeit / 0.80 Confidence als konfigurierbare Defaults, keine TypeSafe-Vorgabe oder gemessene Genauigkeit.                                                                        |
| Erklärbarkeit | Adapterzusammenfassung und leere evidence/findings behalten; Jev erzeugt keine Begründung.                                                                                                        |
| Validierung   | Synthetische HTTP-Tests prüfen den Vertrag. Kampagnenprüfung und zehn Live-Fälle entsprachen den Erwartungen; Domänengenauigkeit, Kalibrierung und allgemeine Angriffsfestigkeit sind ungemessen. |

Ein sinnvoller Jev-Auftrag bewertet eine fokussierte Quelle-Behauptung-Beziehung, beispielsweise ob die gelieferte Migration die Spalte `email` entfernt. „Diese Veröffentlichung ist sicher, schnell und rückwärtskompatibel“ verbindet mehrere Dimensionen: in konkrete Prüfungen mit passender Evidenz aufteilen oder ausdrücklich einen LLM-Prüfer für breiteres Schlussfolgern wählen. Xerify 0.3.0 teilt Behauptungen nicht automatisch auf und bündelt keine Verifikationen.

Exakte Arithmetik, Datumsvergleiche, Zählen und Nachschlagen gehören in Code. Relevante Ausschnitte statt des gesamten Repositorys liefern. TypeSafe dokumentiert für Jev 1.13 Schwächen bei numerischer Präzision, Indirektion, ablenkendem Kontext und adversarialen Inhalten. Nicht voraussetzen, dass Grenzen oder Leistungsaussagen unverändert für zukünftige Modelle gelten. Promptgrenzen reduzieren Mehrdeutigkeit, sind aber keine nachgewiesene Injection-Abwehr.

`jev-latest` vereinfacht den Einstieg; bei Schwellentests eine Version festlegen, damit Aliasänderungen das Modell nicht unbemerkt wechseln. Unterstützte, widerlegte, fehlende, gemischte und adversariale Evidenz in der Zieldomäne prüfen, bevor Confidence zum Routing dient. Live-Auswertungen benötigen in diesem Repository weiterhin Eigentümerfreigabe.

## Produktrichtung und Quellen

Die Kombination lautet: Jev liefert die typisierte Entscheidung, Xerify den Verifikationsvertrag. Automatische Eskalation, deterministische Prüfer, menschliche Prüfung und Anbieterensembles bleiben mögliche Zukunftsarbeit, keine 0.3.0-Funktionen. Anwendungen können nach `unclear` ausdrücklich einen separaten LLM-Aufruf anfordern; Xerify gibt nicht stillschweigend Geld bei weiteren Anbietern aus.

Offizielle Quellen, geprüft am 2026-09-18:

[Introduction](https://docs.typesafe.ai/introduction) · [Skill](https://github.com/typesafe-ai/skills/blob/main/skills/typesafe-ai/SKILL.md) · [State](https://docs.typesafe.ai/concepts/state) · [Choice](https://docs.typesafe.ai/primitives/choice) · [Citation checks](https://docs.typesafe.ai/cookbooks/citation_check) · [Model limitations](https://docs.typesafe.ai/model-jaggedness/jev-1.13) · [HTTP API](https://docs.typesafe.ai/api) · [Confidence](https://docs.typesafe.ai/confidence) · [Models](https://docs.typesafe.ai/models)

Architekturentscheidung: [ADR 0003](../../decisions/0003-typed-decision-verifiers.md). Entwurf: [Ankündigung](launch-0.3.0.md).

## Erste Live-Kampagnenprüfung

Am 2026-09-18 genehmigte der Eigentümer eine CLI-Verifikation mit `--to jev`. Deklarierter Autor: `openai:gpt-6`; Ziel: `typesafe:jev-latest`; zurückgemeldetes Modell: `jev-1.13.0`. Nur ein 490-Byte-Codeausschnitt und ein Kampagnensatz wurden übermittelt. Geprüft wurde, ob die Implementierung bei Unterschreiten einer der beiden konfigurierten Schwellen `unclear` liefert.

Normalisiertes Ergebnis: `confirmed`, Exit 0; `confirmed=0.91`, `refuted=0.06`, `unclear=0.03`, Confidence `0.87`. Die Richtlinie blieb bei `0.90` / `0.80`. Xerify meldete 882 ms, 649 Eingabe- und 41 Ausgabetokens; keine Kürzung und kein Fehler. Kosten wurden nicht berichtet.

Dies dokumentiert einen erfolgreichen Live-Aufruf und eine eng begrenzte semantische Prüfung. Es validiert weder das gesamte Release noch Modellgenauigkeit, Schwellenkalibrierung, Latenzverteilungen oder Injection-Sicherheit. Kein zweiter Anbieter und kein Wiederholungsaufruf wurden verwendet. Zugangsdaten blieben in der lokalen `.env`; rohe Antworten und lokale Laufdaten sind keine Publikationsdateien. Die Zahlen sind eine redaktionelle Zusammenfassung, keine eingecheckte Rohantwort.
