# Campagne Xerify 0.3.0

Texte de lancement de Xerify 0.3.0. Les messages sociaux ci-dessous ne sont pas encore envoyés. Les contrôles en direct ne prouvent pas une précision générale ou une confidence calibrée.

[Jev](jev.md) · [Tests](jev-testing.md) · [Benchmark](benchmark.md)

## Message central

**Vérifiez avant de faire confiance.**

**Revue LLM ou décision Jev. Un contrat de vérification.**

Xerify prend une affirmation IA existante, des preuves bornées et un autre fournisseur d’invocation. CLI, bibliothèque et MCP rendent confirmed, refuted ou unclear. Né comme couche native de Deckent, il fonctionne aussi seul.

## Annonce

Les sorties IA doivent être contrôlées avant de guider le logiciel. Xerify 0.3.0 intègre Jev de TypeSafe aux côtés des vérificateurs LLM. Mêmes preuves bornées, même séparation des fournisseurs, trois mêmes verdicts. Distribution de probabilités et confidence Jev sont conservées en JSON. Sous les seuils configurés, Xerify renvoie unclear. L’application choisit la suite, sans appel de secours caché.

```sh
git diff --cached | xerify --json verify \
  --from openai:AUTHOR_MODEL --to jev \
  --claim "This migration preserves nullable email values"
```

Définir TYPESAFE_API_KEY dans l’environnement et installer xverify-cli@0.3.0. Si un diff ne suffit pas, fournir le schéma et les autres preuves pertinentes. Xerify fonctionne comme CLI autonome, bibliothèque TypeScript et serveur MCP. Open source, licence MIT, développé par Verhex.

<https://github.com/Verhex/xerify>

## Message court

> Vérifiez avant de faire confiance. Xerify 0.3.0 intègre Jev et les vérificateurs LLM. Preuves bornées → autre fournisseur → confirmed / refuted / unclear. CLI · bibliothèque · MCP. Né dans Deckent. Open source.
> https://github.com/Verhex/xerify

## Médias et légende

- [GIF](../../../assets/readme/xerify-verification-flow.gif): 960 × 540; 16 s.
- [Jev](../../../assets/readme/xerify-verification-flow-poster.png): 1200 × 675.
- [Social](../../../assets/readme/xerify-verification-flow-social.png): 1920 × 1080.
- [LLM](../../../assets/readme/xerify-verification-flow-llm.png): 1200 × 675.

Revue LLM ou décision Jev. Une cible par exécution. Valeurs illustratives.

L’animation montre deux exécutions indépendantes, pas une cascade. Probabilité 0.78 et confidence 0.62 échouent aux seuils 0.90 / 0.80 : unclear. Ce ne sont pas des résultats en direct. Géométrie X approuvée et identité papier/encre/émeraude conservées.

## Descriptions du dépôt

GitHub About présente Xerify 0.3.0. Paquet et MCP décrivent le même contrat.

GitHub About:

> Verify before you trust. Cross-provider verification with bounded evidence and typed verdicts. CLI, library & MCP. LLM and Jev verification in 0.3.0.

npm:

> Verify before you trust. Cross-provider verification with LLMs and Jev. CLI, library, MCP.

MCP:

> Verify before you trust. Bounded cross-provider checks with LLMs and Jev over MCP.

## Limites de publication

Annoncer la disponibilité uniquement après la sortie effective. Jev ne génère ni justification ni citations ; confidence ne garantit pas la justesse. Le premier contrôle ne valide qu’une assertion campagne/code, pas toute la version. Le nouveau benchmark sera évalué séparément. Exclure .env, réponses brutes et dossiers locaux de Git/npm/site, médias et réseaux sociaux.
