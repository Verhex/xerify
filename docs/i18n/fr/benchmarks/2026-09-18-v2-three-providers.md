# Résultats entre fournisseurs: 2026-09-18

`xerify-cross-provider-v2` · [Méthode et limites](../benchmark.md) · [Mesures dérivées](../../../benchmarks/2026-09-18-v2-three-providers.json)

Aucune réponse brute publiée. Sous-ensemble choisi par le propriétaire : 72 des 144 mesures historiques ; routes Cursor exclues, sans nouvel appel.

| Direction             | Accords / tentatives | Sautés | Valides | Erreurs | Contexte / tentatives | Faux confirmed | unclear en trop | p50 / p95 valides ms | Tokens entrée (couverture) | Tokens sortie (couverture) | USD (couverture)           |
| --------------------- | -------------------- | ------ | ------- | ------- | --------------------- | -------------- | --------------- | -------------------- | -------------------------- | -------------------------- | -------------------------- |
| openai-to-anthropic   | 10/12                | 0      | 12      | 0       | 8/9                   | 0              | 2               | 73055 / 108271       | 178924 (12/12)             | 36477 (12/12)              | 2.6223577500000004 (12/12) |
| openai-to-typesafe    | 12/12                | 0      | 12      | 0       | 9/9                   | 0              | 0               | 794 / 1392           | 7375 (12/12)               | 500 (12/12)                | — (0/12)                   |
| anthropic-to-openai   | 10/12                | 0      | 12      | 0       | 8/9                   | 0              | 2               | 11296 / 19177        | 191012 (12/12)             | 2369 (12/12)               | — (0/12)                   |
| anthropic-to-typesafe | 12/12                | 0      | 12      | 0       | 9/9                   | 0              | 0               | 766 / 1074           | 7375 (12/12)               | 500 (12/12)                | — (0/12)                   |
| typesafe-to-openai    | 10/12                | 0      | 12      | 0       | 8/9                   | 0              | 2               | 10957 / 13510        | 191006 (12/12)             | 2241 (12/12)               | — (0/12)                   |
| typesafe-to-anthropic | 10/12                | 0      | 12      | 0       | 8/9                   | 0              | 2               | 77798 / 129163       | 177060 (12/12)             | 32718 (12/12)              | 2.7045484999999996 (12/12) |

Les erreurs opérationnelles réduisent le succès de livraison, même si leur verdict est unclear. Les percentiles valides excluent les échecs ; leurs temps séparés sont dans le JSON. Usage/coût absent signifie inconnu, pas zéro. Aucun comparatif en dollars sans couverture.

## Matrice des scénarios

| Scénario            | Attendu   | openai-to-anthropic | openai-to-typesafe | anthropic-to-openai | anthropic-to-typesafe | typesafe-to-openai | typesafe-to-anthropic |
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

Comparaison à des labels synthétiques, pas estimation de précision en production. Une erreur de schéma mesure un échec de contrat, pas la justesse d’une réponse illisible. Les mêmes cibles sous différentes sources déclarées reçoivent les mêmes entrées. Examiner les divergences avant de conclure.
