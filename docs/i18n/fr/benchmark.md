# Benchmark entre fournisseurs

Ce **benchmark de vérification de bout en bout dans Xerify** est déclenché explicitement ; ce n’est pas un classement de l’intelligence des modèles. Il compare les canaux installés avec les mêmes affirmations et preuves rédigées. Le propriétaire a autorisé les appels et choisi des entrées fixes, seule la cible étant invoquée. Publication et paquet suivront une revue distincte des résultats.

## Matrice et entrées immuables

`xerify-cross-provider-v3` comprend `openai`, `anthropic` et `typesafe` (Jev) : **6 directions × 12 scénarios = 72 évaluations**. Chaque fournisseur est associé aux deux autres, sans auto-vérification. La source est uniquement une identité de test déclarée ; aucune génération source. Seule la cible est appelée. Cursor est exclu et étudié séparément.

| Cible        | Adaptateur/canal            | Modèle demandé  |
| ------------ | --------------------------- | --------------- |
| OpenAI       | `codex`, CLI locale         | `gpt-6-astra`   |
| Anthropic    | `claude`, Claude Code local | `claude-opus-5` |
| TypeSafe Jev | `jev`, API HTTPS directe    | `jev-1.13.0`    |

Versions initiales : Codex CLI 0.154.0, Claude Code 2.1.276, Node 24.15.0 sous Linux/WSL. Codex utilise `--ignore-user-config` et `--ignore-rules` ; les paramètres personnels de raisonnement ne sont donc pas présumés appliqués. Les paramètres effectifs absents du résultat normalisé restent non mesurés ; les défauts CLI s’appliquent. Comptes gérés par CLI et clé TypeSafe locale servent à l’authentification. Ces configurations sont mesurées, sans égalité des paramètres d’inférence ni prétention de comparaison API pure. Les noms peuvent être des alias ; seul Jev rapporte un modèle résolu dans le résultat normalisé. Aucune révision non observée n’est affirmée.

Les [cas rédigés](../../../scripts/benchmark-cases.mjs) sont équilibrés : quatre `confirmed`, quatre `refuted`, quatre `unclear`. Ils couvrent soutien, contradiction, absence de preuves, permissions en turc, exceptions de politique, soutien partiel, indirection, instructions injectées, sources contradictoires, distractions, suppression SQL et effets non mesurés. Les labels précèdent l’exécution et décrivent la relation au texte fourni, pas une vérité externe démontrée. Refuser prudemment une spécification synthétique est une divergence de label, pas nécessairement une hallucination. Des sources contradictoires appellent l’abstention lorsque priorité et déploiement réel sont inconnus.

Labels attendus et identifiants de cas ne sont jamais transmis aux fournisseurs. Affirmation et contexte UTF-8 sont identiques dans chaque direction, avec empreintes SHA-256. La source n’est pas dans le prompt LLM actuel ni dans le state Jev. Les mêmes cibles sous différentes sources sont des mesures répétées du même input, pas un effet causal de la source. Les traductions ne modifient pas les fixtures. Les LLM reçoivent le schéma complet ; Jev une Choice typée sans justification. Le résultat commun noté est le verdict final à trois options de Xerify.

## Exécution et terminaison finie

Aperçu sans clé, build ou appel :

```sh
node scripts/benchmark-providers.mjs
```

Après accord du propriétaire pour les coûts possibles :

```sh
npm run build
XERIFY_LIVE_CONFIRM_BILLABLE=YES node --env-file=.env scripts/benchmark-providers.mjs --live
```

`timeoutMs: 0` désactive le délai de cycle de vie Xerify. Il n’y a pas de plafond arbitraire d’attente ; le processus cible ou la réponse HTTP termine l’appel. La matrice est finie, sans nouvel essai, secours ou boucle jusqu’au verdict souhaité. Appels séquentiels, ordre des directions tournant à chaque scénario. Chaque invocation CLI utilise un nouvel espace fournisseur ; Xerify ne réutilise aucune conversation. Caches distants et répétitions internes des fournisseurs ne sont ni contrôlés ni mesurés séparément.

Ctrl-C/SIGTERM annule l’appel courant et arrête la matrice. Un fournisseur bloqué peut demander une annulation manuelle ; supprimer le délai ne garantit pas une réponse. Limites entrée/sortie : 32 768/131 072 octets. Défaut ordinaire : 120 secondes ; `xerify --timeout 0` ou `limits.timeoutMs: 0` choisit explicitement l’attente illimitée sur les autres surfaces. Fin normale et annulation HTTP/sous-processus sans délai sont testées de façon déterministe.

`XERIFY_BENCH_REPEATS` accepte 1..3, défaut 1. Variables modèles : `XERIFY_BENCH_OPENAI_MODEL`, `XERIFY_BENCH_ANTHROPIC_MODEL`, `XERIFY_BENCH_TYPESAFE_MODEL`. `auto` est refusé. Changer modèle ou répétitions change la comparaison et doit être signalé. L’indisponibilité opérationnelle arrête cette cible ; les cases restantes sont skipped, jamais réussies. Les erreurs de schéma restent des tentatives échouées.

Chaque cellule produit un point de reprise privé. Continuer explicitement uniquement les cellules non tentées :

```sh
XERIFY_LIVE_CONFIRM_BILLABLE=YES node --env-file=.env scripts/benchmark-providers.mjs --live \
  --resume=.xerify/benchmarks/RUN_TIMESTAMP/report.json
```

La reprise vérifie suite, cas, modèles, directions, répétitions, limites et empreintes des adaptateurs/prompts. Elle conserve les erreurs et divergences déjà tentées sans les répéter. Un nouveau rapport privé reprend les tentatives et le timestamp d’origine. Une interruption pendant un appel ne prouve pas l’absence de facturation distante ; pas de résultat terminé ne signifie pas aucune requête envoyée.

## Métriques et interprétation

| Métrique                    | Définition                                                                                                                              |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Attempted / skipped / valid | Appels effectués, non effectués, résultats conformes avec `failure: null`                                                               |
| Accord exact                | Verdict valide égal au label / toutes tentatives ; les erreurs réduisent le succès de livraison                                         |
| Accord de contexte          | Accords sur neuf cas contextuels avec dénominateur tenté ; pas un score général de compréhension                                        |
| Matrice de confusion        | Attendu contre obtenu, avec colonnes erreur et skipped séparées                                                                         |
| Fausse confirmation         | confirmed alors que refuted ou unclear est attendu                                                                                      |
| Abstention inutile          | unclear valide alors que confirmed ou refuted est attendu                                                                               |
| Couverture décisive         | Nombre de confirmed/refuted valides ; unclear attendu peut être correct                                                                 |
| Latence                     | Temps monotone autour du handler CLI complet, démarrage/réseau/normalisation inclus ; p50/p95/min/max valides et p50 des échecs séparés |
| Tokens                      | Totaux entrée/sortie rapportés avec couverture ; absence reste null, pas zéro                                                           |
| Coût                        | USD rapportés seulement avec couverture ; aucun prix manquant ou quota d’abonnement estimé                                              |

Les percentiles utilisent nearest-rank sur appels valides. Douze échantillons par direction ne prouvent ni p95 stable ni significativité. Temps total n’est pas délai du premier token. Tokens Jev et tokens d’explication/raisonnement LLM servent des contrats différents. L’entrée Codex inclut déjà le cache ; Claude ajoute les compteurs de création/lecture de cache. Tokenizers, surcoût de prompt et facturation cache diffèrent. Un classement tokens/seconde serait trompeur et n’est pas calculé.

Jev garde probabilité ≥0.90, confidence ≥0.80 et maximum unique ; le choix original reste séparé. Confidence n’est pas un label indépendant de justesse : [définition TypeSafe](https://docs.typesafe.ai/confidence). Pour indirection, distractions et attaques, voir [limites Jev 1.13](https://docs.typesafe.ai/model-jaggedness/jev-1.13). Aucun score humain de justification ou LLM-as-judge n’est inventé. Ces petits cas synthétiques ne représentent pas une production. Examiner les divergences avant publication ; aucun gagnant ou multiplicateur de vitesse n’est présupposé.

La machine a aussi servi à éditer les documents et exécuter des contrôles locaux. La charge hôte n’était pas isolée ; les latences incluent cette variabilité.

## Transport et limites de sécurité

Seul l’adaptateur Jev appelle directement HTTP. Codex et Claude Code sont des exécutables locaux qui contactent leurs services. Les preuves quittent donc la machine dans les quatre cas ; comptes, rétention, limites et facturation existants s’appliquent. Les autres moteurs comprennent OpenAI API directe, Anthropic API, endpoints compatibles OpenAI et adaptateurs de commandes configurés. Un modèle/endpoint local configuré peut calculer localement ; un client local de service distant ne le fait pas. Aucun remplacement de moteur pendant ce test. CLI, bibliothèque, MCP STDIO et HTTP sont des entrées alternatives du même noyau. MCP ne remplace pas HTTPS Jev et ne rend pas le calcul local.

Chaque processus reçoit un environnement sur liste autorisée et un répertoire temporaire, sans copie du dépôt ou de .env. La clé TypeSafe n’est pas transmise aux autres CLI. Ces outils peuvent utiliser leur propre configuration home et magasins d’authentification ; un workspace temporaire ne prouve pas une isolation OS complète. Les modes des adaptateurs limitent outils/sandbox. HTTP MCP utilise loopback par défaut ; l’exposition publique nécessite configuration explicite et bearer auth.

Seules des preuves synthétiques sont envoyées. Le banc désactive historique/audit Xerify dans une configuration temporaire et ignore la configuration utilisateur/projet normale. Il ne copie jamais .env. Les métadonnées sélectionnées restent privées sous `.xerify/benchmarks/`, ignoré. Résumés générés, sorties complètes, HTTP brut, magasins d’auth et clés ne sont pas des publications. Les sorties sont validées et jamais exécutées comme commandes. Instructions et typage ne démontrent pas une résistance complète à l’injection ou la vérité.

Les empreintes enregistrées décrivent les fichiers au démarrage. Pendant l’exécution, le harnais a reçu un import Buffer explicite, un filtrage des options XERIFY_* héritées et un rejet de auto insensible à la casse. Le processus actif a conservé son code chargé ; son environnement ne contenait aucune surcharge XERIFY_*. Adaptateurs, prompts visibles par les modèles, cas et seuils sont restés fixes. Une nouvelle exécution aura une empreinte de harnais différente et devra être enregistrée séparément.

## Exécutions enregistrées

Le pilote v1 utilisait six directions et un délai de 90 secondes. Anthropic a expiré au quatrième appel ; les suivants ont été sautés, ce canal est incomplet. Le propriétaire a ensuite demandé douze directions sans délai. Ce pilote reste privé, exclu de v2. Modifier les conditions commence une nouvelle suite ; les deux exécutions ne sont pas fusionnées.

Le v2 initial comportait 144 appels. À la demande du propriétaire, toutes les routes Cursor sont retirées du comparatif public : **72 appels, aucun saut**. Aucun nouvel appel ni changement de label. [Résultats](benchmarks/2026-09-18-v2-three-providers.md) · [Mesures](../../benchmarks/2026-09-18-v2-three-providers.json). Jev **24/24**, OpenAI et Anthropic **20/24** chacun. Les deux derniers ont rendu unclear pour support et les permissions en turc. Médianes des appels valides individuels : Jev **783 ms**, OpenAI **11 123 ms**, Anthropic **75 444 ms**. Totaux de tokens et couverture dans le rapport ; coût absent signifie inconnu. V3 démarre de nouveaux tests à trois fournisseurs, sans reprendre v2. L’historique privé complet reste intact.
