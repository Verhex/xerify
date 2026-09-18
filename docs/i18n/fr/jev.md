# Jev avec Xerify 0.3.0

Jev est le modèle de décision typée de TypeSafe. Xerify fournit la couche de vérification autour des moteurs pris en charge : preuves bornées, séparation des fournisseurs, verdicts stables et historique. Tous deux visent des décisions exploitables par le logiciel, mais résolvent des parties différentes du problème.

La prise en charge de Jev est incluse dans Xerify 0.3.0. L’adaptateur est testé avec des réponses HTTP synthétiques. Une vérification de cohérence documentation/code et dix scénarios en direct distincts ont été exécutés le 2026-09-18. Voir [couverture et résultats](jev-testing.md). La précision métier et la calibration des seuils restent non mesurées.

## Configurer une clé

Depuis les sources, exécuter `npm ci` et `npm run build`. Copier `.env.example` vers `.env` puis définir `TYPESAFE_API_KEY` localement. Git ignore `.env` et le paquet npm l’exclut. Garder le fichier privé ; sous POSIX utiliser `chmod 600 .env`. Ne jamais placer une clé dans les preuves ou un argument de commande.

Le vrai fichier `.env` appartient uniquement au répertoire de travail principal du propriétaire : aucun commit, même sur `main`, autre worktree, paquet npm, archive source, upload du site ou contexte Docker. Les exclusions npm couvrent les fichiers imbriqués dans les répertoires autorisés ; Docker exclut les fichiers racine et imbriqués. Les archives Git excluent les chemins dotenv. Seul `.env.example` à la racine avec affectations vides peut entrer dans l’index Git.

`npm run secrets:check` vérifie l’index Git, l’arborescence du site et le manifeste npm dry-run réel sans lire les fichiers dotenv privés. Il s’exécute dans `check` et `prepack` ; le test d’installation vérifie aussi le manifeste du paquet. Pages contrôle la sortie assemblée avant upload. Le hook pre-commit local bloque même les fichiers ajoutés avec `git add -f`. Après inspection des hooks existants, l’activer dans un nouveau checkout avec `git config --local core.hooksPath .githooks`. Il est activé chez le propriétaire. Les hooks étant contournables, CI et exclusions du paquet restent indépendants. Ne pas copier les identifiants ailleurs ni fournir `.env` comme preuve.

Xerify lit l’environnement du processus ; il ne charge **pas automatiquement** `.env`. Le charger explicitement avec `--env-file` de Node, version 20.6+ ; Node 24 est recommandé :

```sh
node --env-file=.env ./dist/cli/entry.js --json providers probe --provider jev
```

La sonde signale uniquement la présence de la clé ; elle ne vérifie pas sa validité et n’envoie aucune requête TypeSafe. Une variable déjà présente dans l’environnement prévaut sur le fichier.

Cette commande réalise une évaluation potentiellement facturable :

```sh
git diff --cached | node --env-file=.env ./dist/cli/entry.js --json verify \
  --from openai:AUTHOR_MODEL \
  --to jev \
  --claim "This migration preserves existing data"
```

Si la clé est déjà dans l’environnement, utiliser `xerify --json verify --from openai:AUTHOR_MODEL --to jev --claim "…"`. Fournir assez de preuves pour juger l’affirmation ; un diff vide ne prouve rien. Les paramètres existants de capture de l’historique continuent de s’appliquer.

## Identité et opérations prises en charge

L’identifiant et le type de configuration de l’adaptateur par défaut sont `jev`. Le fournisseur d’invocation est `typesafe`, qui contrôle l’endpoint direct, l’authentification et la facturation. `--to jev` devient `typesafe:jev-latest` ; `--to jev:jev-1.13.0` fixe une version. La même normalisation s’applique à `--from`, sans permettre de contourner l’interdiction du même fournisseur. `typesafe:MODEL_ID` explicite fonctionne aussi.

La bibliothèque et MCP utilisent `{ "provider": "typesafe", "model": "jev-latest" }` pour `to`. L’alias demandé reste dans `to.model` ; `decision.model` enregistre le modèle annoncé dans la réponse. Jev ne prend en charge que `verify`. `ask` et `request` renvoient `UNSUPPORTED` avant toute requête HTTP. Les capacités exposent `operations: ["verify"]` ; les adaptateurs sans ce champ facultatif conservent leur comportement. Des fournisseurs différents ne prouvent ni des lignées de modèles indépendantes ni la justesse.

## Politique de décision

Xerify envoie `{model, state: {claim, context}, questions: {verdict: …}}` à `POST https://api.typesafe.ai/v1/systemone`. Une question Choice tente de réfuter l’affirmation à partir des preuves, avec les critères `confirmed`, `refuted`, `unclear`.

Une réponse valide conserve son choix si la probabilité choisie atteint **0.90**, la confidence **0.80**, et si le maximum est unique. Sinon le verdict devient `unclear`. Un choix natif `unclear` reste inchangé. Sous les seuils, `failure: null` et sortie 11. Ces valeurs sont des heuristiques configurables, pas des garanties de précision calibrées indépendamment. La confidence de TypeSafe résume la distribution ; elle diffère de la probabilité d’une option.

Extrait synthétique illustratif :

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

`decision` est un ajout facultatif à la version 1 du schéma. Les probabilités décrivent le choix initial, même lorsque le verdict final s’abstient. Toutes trois sont obligatoires, dans [0,1], avec une somme à moins de 0.000001 de un ; le choix doit être maximal. Les contraintes entre champs sont appliquées à l’exécution en plus du JSON Schema exporté. Sorties mal formées et erreurs de transport conservent les erreurs typées et codes existants. Aucun nouvel essai ou appel de secours automatique.

Jev ne produit ni explication ni citations de preuves. Xerify fournit un résumé de modèle explicitement étiqueté et des limites, avec tableaux findings/evidence vides. Le typage ne prouve pas la vérité. Les métadonnées facultatives sont conservées dans l’historique normalisé selon la politique de capture ; l’audit JSONL ne garde pas l’objet decision. L’usage est rapporté sans estimation de coût.

## Configuration, bibliothèque et MCP

Aucune configuration fournisseur n’est nécessaire pour l’adaptateur par défaut. Pour modifier la politique dans `.xerify/xverify-config.json`, fusionner cette entrée avec la configuration existante :

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

Les identifiants d’environnement priment sur un `apiKey` littéral facultatif. Masquage des diagnostics et permissions réservées au propriétaire suivent les autres adaptateurs API directs. Un `endpoint` facultatif permet un proxy de confiance ou serveur de test local ; changer cette URL y envoie la clé et les preuves. Si le service d’invocation change, déclarer séparément un adaptateur gateway. Les octets du corps et de la réponse sont bornés ; une entrée trop grande est refusée avant tout appel payant. Les limites de tokens du fournisseur restent indépendantes des limites d’octets de Xerify.

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

Pour MCP, exposer `TYPESAFE_API_KEY` dans l’environnement du serveur et appeler `xerify_verify` avec la même requête structurée. Depuis les sources, STDIO accepte le chargement explicite : `node --env-file=.env ./dist/cli/entry.js mcp stdio`. Aucun outil MCP supplémentaire requis.

## Skills des agents

Installer le skill officiel dans le projet pour Codex, Claude Code et Cursor avec une seule méthode :

```sh
npx skills add typesafe-ai/skills --skill typesafe-ai --agent codex claude-code cursor --yes
```

C’est la sélection de plusieurs agents de la commande recommandée par TypeSafe pour les agents autres que Claude. Elle installe des fichiers, pas une intégration modèle ou un identifiant API. Ne pas installer également le plugin Claude marketplace pour la même configuration. Codex et Cursor utilisent `.agents/skills/typesafe-ai` ; Claude Code utilise `.claude/skills/typesafe-ai`, lié à la copie commune. L’origine est enregistrée dans `skills-lock.json` ; `experimental_install` peut restaurer les skills verrouillés.

Ce checkout comporte aussi `.agents/skills/xerify-jev`, un compagnon local lié à Claude Code. Il décrit identité fournisseur, politique, schéma et validations sans modifier le skill officiel. Les installations et le pointeur local `AGENTS.md` sont ignorés et exclus de npm. Ce compagnon est propre au checkout ; restaurer le lockfile officiel ne le recrée pas. Choisir `$typesafe-ai` pour TypeSafe ou `$xerify-jev` pour l’intégration dans Codex. Les nouveaux skills sont disponibles au prochain tour ; un agent déjà actif peut devoir recharger le projet.

## Documentation examinée et portée du jugement

Le skill officiel et la documentation en ligne ont été examinés le 2026-09-18 : introduction, State, Choice, HTTP API, confidence, modèles, limites et cookbook citation-check. Le fichier fourni correspondait octet pour octet à la version GitHub officielle.

| Domaine       | Résultat                                                                                                                                                                                                                 |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Protocole     | Conserver HTTP direct, bearer auth, state nommé et conversion Choice ; aucun wrapper chat-completions nécessaire.                                                                                                        |
| Question      | Nommer `claim` et `context`, juger leur relation ; le manque de soutien seul n’est pas une contradiction.                                                                                                                |
| Politique     | Garder 0.90 / 0.80 configurables ; aucune obligation TypeSafe ni précision mesurée.                                                                                                                                      |
| Explicabilité | Résumé de l’adaptateur et tableaux evidence/findings vides ; Jev ne génère pas de justification.                                                                                                                         |
| Validation    | Les réponses HTTP synthétiques testent le contrat ; la vérification de cohérence et dix cas en direct correspondaient aux attentes. Précision métier, calibration et résistance générale aux attaques restent inconnues. |

Une bonne tâche Jev est un jugement ciblé entre une source et une affirmation, par exemple « La migration fournie supprime la colonne `email` ». « Cette version est sûre, rapide et rétrocompatible » combine plusieurs dimensions : séparer les vérifications avec des preuves adaptées ou choisir explicitement un LLM pour un raisonnement plus large. Xerify 0.3.0 ne découpe pas automatiquement les affirmations et ne groupe pas plusieurs vérifications.

Garder arithmétique exacte, comparaisons de dates, comptages et recherches déterministes dans le code. Fournir des extraits pertinents plutôt que tout le dépôt. TypeSafe documente les limites de Jev 1.13 : précision numérique, indirection, contexte distrayant et contenu adversarial. Ne pas supposer que limites ou annonces de performance s’appliquent inchangées aux futurs modèles. Les frontières du prompt réduisent l’ambiguïté sans constituer une défense démontrée contre l’injection.

`jev-latest` est pratique au départ ; fixer une version lors de l’évaluation pour éviter qu’un alias ne change silencieusement le modèle. Tester soutien, contradiction, preuves absentes ou mixtes et exemples adversariaux du domaine avant d’utiliser la confidence pour router. Les évaluations en direct nécessitent toujours l’accord du propriétaire dans ce dépôt.

## Orientation produit et sources

La composition utile : Jev produit une décision typée, Xerify fournit le contrat de vérification. Escalade automatique, évaluateurs déterministes, revue humaine et ensembles multifournisseurs restent des pistes futures, pas des fonctions 0.3.0. L’application peut demander explicitement un autre LLM après `unclear` ; Xerify ne dépense pas silencieusement chez un autre fournisseur.

Sources officielles consultées le 2026-09-18 :

[Introduction](https://docs.typesafe.ai/introduction) · [Skill](https://github.com/typesafe-ai/skills/blob/main/skills/typesafe-ai/SKILL.md) · [State](https://docs.typesafe.ai/concepts/state) · [Choice](https://docs.typesafe.ai/primitives/choice) · [Citation checks](https://docs.typesafe.ai/cookbooks/citation_check) · [Model limitations](https://docs.typesafe.ai/model-jaggedness/jev-1.13) · [HTTP API](https://docs.typesafe.ai/api) · [Confidence](https://docs.typesafe.ai/confidence) · [Models](https://docs.typesafe.ai/models)

Voir [ADR 0003](../../decisions/0003-typed-decision-verifiers.md).

## Première vérification de cohérence en direct

Le 2026-09-18, le propriétaire a autorisé une vérification CLI avec `--to jev`. Auteur déclaré : `openai:gpt-6` ; cible : `typesafe:jev-latest` ; modèle retourné : `jev-1.13.0`. Seuls un extrait de code et une phrase de documentation, 490 octets au total, ont été fournis. La question vérifiait que passer sous l’un des seuils configurés produit `unclear`.

Résultat normalisé : `confirmed`, sortie 0 ; probabilités `confirmed=0.91`, `refuted=0.06`, `unclear=0.03`, confidence `0.87`. Politique `0.90` / `0.80`. Xerify a rapporté 882 ms, 649 tokens d’entrée, 41 de sortie, aucune troncature ni erreur. Aucun coût rapporté.

Cela documente un appel réussi et un jugement sémantique étroit. Cela ne valide ni toute la version, ni la précision, ni la calibration, ni une distribution de latence, ni la résistance à l’injection. Aucun second fournisseur ou nouvel essai. Les identifiants restent dans `.env` local ; réponses brutes et dossier local ne sont pas des éléments de publication. Ces chiffres sont une synthèse rédigée, pas une réponse brute commitée.
