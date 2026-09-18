# Tests Jev et résultats en direct

Cette page décrit la couverture et une exécution autorisée le **2026-09-18**. Les dix affirmations synthétiques rédigées sont étroites ; elles ne constituent ni benchmark représentatif de précision, ni calibration, ni évaluation de sécurité.

## Couverture hors ligne

`npm run check` utilise des réponses HTTP synthétiques, sans appel TypeSafe ni chargement de `.env`.

|                    |                                                                                                                                                                             |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Requête typée      | État claim/context nommé, Choice, modèle demandé, aucune clé dans le corps                                                                                                  |
| Décisions          | `confirmed`, `refuted` et unclear natif ; choix original distinct du verdict final                                                                                          |
| Seuils             | Bornes exactes par défaut/personnalisées, juste dessous, probabilités unitaires, égalités même à seuil zéro                                                                 |
| Validation         | Modèle/réponse/confidence absents, type/choix invalide, probabilités négatives ou texte, options absentes/supplémentaires, somme erronée, choix non maximal, usage invalide |
| Usage              | Absence, valeurs partielles ou nulles ; aucun total ou prix inventé                                                                                                         |
| Identité           | Même fournisseur et provenance inconnue refusés avant fetch ; `ask`/request non pris en charge                                                                              |
| Configuration/auth | Identité typesafe fixe, plages des seuils, syntaxe endpoint/env, priorité environnement, clé absente, sonde de présence                                                     |
| Limites            | Entrée refusée avant fetch ; sortie excessive unclear, code 6, troncature indiquée                                                                                          |
| Transport          | 401/403, 400/422 ; 408/409/429/500/503/529 réessayables ; JSON vide/invalide, panne réseau, annulation préalable/en cours, timeout ; aucun nouvel essai automatique         |
| Confidentialité    | Aucun corps HTTP brut ou texte d’exception réseau dans l’erreur ; aucune clé dans le corps ; audit sans decision                                                            |
| CLI/bibliothèque   | Alias par défaut/fixes, trois verdicts, abstention, sorties auth/limitation, schéma de décision                                                                             |
| MCP                | Banc protocole STDIO conserve verdicts, abstention, métadonnées et capacités ; HTTP local conserve decision sur abstention                                                  |
| Exécuteur          | Aperçu sans clé/build ; mode direct refuse accord ou clé manquants                                                                                                          |
| Distribution       | Protection dotenv contre staging forcé, manifestes npm et chemins du site ; smoke valide CLI/MCP empaquetés                                                                 |

Le test de régression a trouvé un défaut réel : un corps HTTP trop grand, devenu JSON invalide, perdait `truncation.output` lors de la construction de l’erreur. Le cœur conserve désormais les métadonnées de troncature. Le résultat reste `unclear` avec `INVALID_PROVIDER_RESPONSE`.

## Exécution des scénarios

Début **2026-09-18 11:48:32 UTC** (14:48:32 Europe/Istanbul), via le gestionnaire CLI compilé de Xerify, l’adaptateur Jev normal et l’endpoint TypeSafe. Source déclarée `openai:gpt-6`, cible `typesafe:jev-1.13.0`, modèle retourné `jev-1.13.0`. Politique inchangée : probabilité **≥0.90**, confidence **≥0.80**, maximum unique. Étiquettes écrites avant exécution ; un seul essai par cas, sans secours, réglage des seuils ou modification après résultat. Seules les dix paires du [fichier de scénarios](../../../scripts/jev-scenarios.mjs) ont été envoyées. Ordre des probabilités : **confirmed / refuted / unclear**.

| Scénario                                  | Attendu   | Choix Jev → verdict Xerify | Probabilités    | Confidence | ms  | Sortie |
| ----------------------------------------- | --------- | -------------------------- | --------------- | ---------- | --- | ------ |
| Soutien explicite                         | confirmed | confirmed → confirmed      | 1 / 0 / 0       | 1.00       | 942 | 0      |
| Contradiction explicite                   | refuted   | refuted → refuted          | 0 / 1 / 0       | 1.00       | 365 | 10     |
| Preuve vide                               | unclear   | unclear → unclear          | 0 / 0 / 1       | 1.00       | 317 | 11     |
| Preuve sans rapport                       | unclear   | unclear → unclear          | 0 / 0 / 1       | 1.00       | 371 | 11     |
| Affirmation composée partiellement étayée | unclear   | unclear → unclear          | 0 / 0 / 1       | 0.99       | 336 | 11     |
| Contradiction matérielle composée         | refuted   | refuted → refuted          | 0 / 1 / 0       | 1.00       | 351 | 10     |
| Soutien en turc                           | confirmed | confirmed → confirmed      | 1 / 0 / 0       | 0.99       | 308 | 0      |
| Suppression de colonne SQL                | refuted   | refuted → refuted          | 0 / 1 / 0       | 1.00       | 597 | 10     |
| Instruction de verdict injectée           | refuted   | refuted → refuted          | 0 / 1 / 0       | 1.00       | 360 | 10     |
| Code du seuil de confidence               | confirmed | confirmed → confirmed      | 0.99 / 0.01 / 0 | 0.98       | 335 | 0      |

Les dix verdicts correspondaient aux attentes : **3 confirmed, 4 refuted, 3 unclear**. Tous avaient `failure: null`, sans troncature. Usage rapporté : **5 151 tokens d’entrée et 417 de sortie**. `totalTokens` et `costUsd` restaient null dans chaque résultat ; aucun prix déduit. Durées **308–942 ms**, un seul passage, sans prétention de benchmark de latence ou de niveau de service. Aucun cas n’a déclenché l’abstention par seuil : les trois unclear étaient natifs. Les seuils et égalités sont testés de manière déterministe. Une instruction injectée a été ignorée ; la résistance générale aux injections n’est pas mesurée. Une probabilité 1 ne prouve pas la certitude. Le tableau est une synthèse rédigée ; réponses brutes, clés et dossiers privés ne sont pas commités. La [vérification de campagne](jev.md) précédente est séparée et exclue des totaux.

## Reproduire volontairement

Afficher preuves et étiquettes sans clé ni requête :

```sh
node scripts/live-jev-scenarios.mjs
```

Après accord du propriétaire pour les appels potentiellement facturables, compiler et lancer :

```sh
npm run build
XERIFY_LIVE_CONFIRM_BILLABLE=YES node --env-file=.env scripts/live-jev-scenarios.mjs --live
```

Node 20.6+ permet le chargement explicite env-file. L’exécuteur fixe jev-1.13.0, limite à dix évaluations séquentielles et s’arrête à la première erreur opérationnelle/auth. Sa configuration temporaire désactive l’historique et ignore les configurations utilisateur/projet ; seule la clé TypeSafe passe à l’environnement CLI. Il ne copie jamais .env. Timeout de 30 secondes par requête. Les métadonnées normalisées choisies vont dans un fichier horodaté réservé au propriétaire sous `.xerify/live-jev-scenarios/`, ignoré ; aucune réponse HTTP brute ou preuve dans le rapport. Codes de l’exécuteur : 0 toutes attentes satisfaites, 11 divergence sémantique, 1 incomplet/erreur opérationnelle, 2 accord manquant, 3 clé manquante. Les codes individuels de vérification restent enregistrés. Une divergence demande inspection, pas répétition jusqu’à accord. Ce programme est exclu des checks normaux, smoke d’installation et opérations de release.

## Interpréter les erreurs

|                                       | CLI exit |                                                                                |
| ------------------------------------- | -------- | ------------------------------------------------------------------------------ |
| confirmed                             | 0        | Étayé par les preuves ; vérifier la portée                                     |
| refuted                               | 10       | Contradiction sélectionnée ; revoir l’affirmation                              |
| unclear, `failure: null`              | 11       | Preuves insuffisantes/ambiguës ou abstention ; inspecter decision et compléter |
| SAME_PROVIDER / PROVENANCE_UNPROVABLE | 2        | Corriger l’identité ; aucune évaluation envoyée                                |
| AUTH_UNAVAILABLE / 401 / 403          | 3        | Enveloppe d’erreur auth, pas verdict ; corriger les identifiants               |
| TIMEOUT / CANCELLED                   | 4        | unclear opérationnel ; aucun nouvel essai automatique                          |
| PROVIDER_FAILURE                      | 5        | unclear opérationnel ; possibilité de réessayer seulement indiquée             |
| INVALID_PROVIDER_RESPONSE             | 6        | unclear opérationnel ; vérifier limites/compatibilité                          |

Utiliser `failure` pour distinguer erreur et abstention sémantique. Examiner `decision.choice`, probabilité choisie, confidence et politique pour expliquer le seuil. Exemples et MCP : [guide Jev](jev.md).
