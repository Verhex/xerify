[English](../../installation.md) · [Türkçe](../tr/installation.md) · **Deutsch** · [简体中文](../zh-CN/installation.md) · [Español](../es/installation.md) · [Français](../fr/installation.md)

# Installation und Updates

> Maßgeblich ist die englische Dokumentation. Weichen Übersetzung und getestetes Verhalten voneinander ab, gilt die englische Fassung.

Xerify benötigt Node.js 20 oder neuer; Node.js 24 ist die primäre Release-Laufzeitumgebung. Das öffentliche npm-Paket heißt `xerify-cli`, Produkt und installierter CLI-Befehl bleiben `xerify`.

## Migration von xverify-cli

Ab 0.3.1 heißt das npm-Paket `xerify-cli`. Global: zuerst `npm uninstall -g xverify-cli`, dann `npm install -g xerify-cli@latest`. Für eine Projektabhängigkeit: zuerst `npm uninstall xverify-cli`, dann `npm install --save-dev xerify-cli@latest`. Bibliotheksimporte und MCP-Paketpfade müssen von `xverify-cli` auf `xerify-cli` umgestellt werden. Der Befehl `xerify`, der Zustand unter `.xerify/` und der Dateiname `xverify-config.json` bleiben unverändert. Bereits veröffentlichte Versionen bleiben unter dem bisherigen Paketnamen verfügbar.

## Installationsart wählen

Global installieren, wenn Xerify als Arbeitsplatz-Tool projektübergreifend genutzt wird:

```sh
npm install --global xerify-cli@latest
xerify --version
xerify init
```

Als Dev-Dependency des Projekts installieren, wenn das Repository eine feste Xerify-Version vorgeben soll:

```sh
npm install --save-dev xerify-cli@latest
npx xerify --version
```

Für einen schnellen Funktionscheck ausführen, ohne eine Abhängigkeit zu hinterlassen:

```sh
npx --yes --package=xerify-cli@latest xerify --json health
```

`xerify-cli@latest` verwenden, das `@` nicht vergessen: Bei `npm install xerify-cli latest` installiert
npm zwei getrennte Paketnamen – das ist nicht dasselbe.

Für reproduzierbare Automatisierung eine feste Version statt `latest` angeben:

```sh
npm install --save-dev --save-exact xerify-cli@0.3.1
```

## Projektinitialisierung

Eine direkte projektlokale Installation startet einen abgesicherten Initialisierer. Er legt `.xerify/`
ausschließlich im Root des konsumierenden Projekts an, überschreibt nie eine bestehende Konfiguration,
ruft keinen Provider auf und ergänzt Ignore-Regeln für Git, npm und Docker. Globale, transitive und
ungespeicherte Installationen sowie Aufrufe über `npx` initialisieren das aktuelle Verzeichnis nicht;
das muss explizit angestoßen werden:

```sh
xerify init
```

`XERIFY_SKIP_AUTO_INIT=1` vor der Installation setzen, wenn die lifecycle-basierte Initialisierung nicht
erwünscht ist. npm kann nicht in jedem Fall zuverlässig zwischen Erst-, direkter und transitiver
Hoisting-Installation unterscheiden; Bibliotheken, die Xerify einbetten, sollten diese Variable daher
setzen und stattdessen über einen eigenen, expliziten Workflow initialisieren.

Das Ergebnis der Einrichtung prüfen, ohne dabei ein Modell aufzurufen:

```sh
xerify --json config validate
xerify --json health
xerify --json doctor
xerify --json providers probe --all --timeout 5000
```

Der `providers probe`-Befehl prüft standardmäßig nur die lokale Verfügbarkeit von Executable und Auth.
`--network` nur dann ergänzen, wenn gezielt die Erreichbarkeit des Endpunkts geprüft werden soll.

## Updates und Deinstallation

Für ein Update dieselbe Installationsart verwenden:

```sh
npm update --global xerify-cli
# oder innerhalb eines Projekts mit fester Version
npm install --save-dev xerify-cli@latest
```

Das Entfernen des npm-Pakets löscht weder Projekthistorie noch Konfiguration. `.xerify/` nur gesondert
prüfen und entfernen, wenn Run-Historie, Archiv, Konfiguration und Audit-Metadaten dort nicht mehr
gebraucht werden.

## MCP-Installation

Der lokale STDIO-MCP-Server nutzt dasselbe Paket – ein zweiter Server-Download entfällt:

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

Die Paketversion fixieren, damit die Host-Konfiguration in der Supply Chain überprüfbar bleibt. Der
Eintrag im MCP Registry ist reine Discovery-Metadaten, die auf dieses npm-Paket verweisen; er betreibt
keinen weiteren Xerify-Dienst und nutzt lokale Provider-Credentials nicht remote weiter. Einrichtung
von STDIO und HTTP siehe [MCP](mcp.md).

## Paketinhalt

Das npm-Artefakt enthält den kompilierten Runtime-/Library-Output, die öffentlichen Schemas, die
Anwenderdokumentation, den begleitenden Agent-Skill, den abgesicherten Initialisierer sowie Lizenz- und
Sicherheitshinweise. Bewusst ausgeschlossen sind Source-Tests, Release-Tooling, lokaler `.xerify/`-Zustand,
interne Agent-/Orchestrierungsdateien, Design-Workspaces, generierte Release-Artefakte und Material für
das Brand-Review.

Xerify wird von Verhex entwickelt und unter der MIT-Lizenz vertrieben. Es ist die
providerübergreifende Verifikationsschicht von Deckent, dem agentischen Betriebssystem von
Verhex, und wird hier als eigenständiges Werkzeug veröffentlicht; die Installation von Xerify
setzt Deckent nicht voraus und installiert es nicht mit. Das kanonische Repository und der
Issue-Tracker sind in den Paket-Metadaten verlinkt.
