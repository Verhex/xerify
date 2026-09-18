# Cross-provider results: 2026-09-18

Suite: `xerify-cross-provider-v2`. Method and limitations: [benchmark guide](../benchmark.md).
Machine-readable derived measurements: [JSON](2026-09-18-v2-three-providers.json). No raw provider responses are published. Selection: 72/144 historical measurements; Cursor routes excluded by owner request, not rerun.

| Route                 | Match / attempted | Skipped | Valid | Failure | Context match / attempted | False confirmed | Extra unclear | Valid p50 / p95 ms | Input tokens (coverage) | Output tokens (coverage) | USD (coverage)             |
| --------------------- | ----------------- | ------- | ----- | ------- | ------------------------- | --------------- | ------------- | ------------------ | ----------------------- | ------------------------ | -------------------------- |
| openai-to-anthropic   | 10/12             | 0       | 12    | 0       | 8/9                       | 0               | 2             | 73055 / 108271     | 178924 (12/12)          | 36477 (12/12)            | 2.6223577500000004 (12/12) |
| openai-to-typesafe    | 12/12             | 0       | 12    | 0       | 9/9                       | 0               | 0             | 794 / 1392         | 7375 (12/12)            | 500 (12/12)              | — (0/12)                   |
| anthropic-to-openai   | 10/12             | 0       | 12    | 0       | 8/9                       | 0               | 2             | 11296 / 19177      | 191012 (12/12)          | 2369 (12/12)             | — (0/12)                   |
| anthropic-to-typesafe | 12/12             | 0       | 12    | 0       | 9/9                       | 0               | 0             | 766 / 1074         | 7375 (12/12)            | 500 (12/12)              | — (0/12)                   |
| typesafe-to-openai    | 10/12             | 0       | 12    | 0       | 8/9                       | 0               | 2             | 10957 / 13510      | 191006 (12/12)          | 2241 (12/12)             | — (0/12)                   |
| typesafe-to-anthropic | 10/12             | 0       | 12    | 0       | 8/9                       | 0               | 2             | 77798 / 129163     | 177060 (12/12)          | 32718 (12/12)            | 2.7045484999999996 (12/12) |

Operational failures count against delivery success, including when their fallback verdict is unclear. Valid-latency percentiles exclude failed calls; see JSON for their separate durations. Missing token/cost observations are unknown, not zero. No dollar comparison is valid where coverage is absent.

## Scenario matrix

| Scenario            | Expected  | openai-to-anthropic | openai-to-typesafe | anthropic-to-openai | anthropic-to-typesafe | typesafe-to-openai | typesafe-to-anthropic |
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

These are authored synthetic-label comparisons, not a production accuracy estimate. A schema error measures contract delivery failure; it does not reveal the correctness of an unparseable answer. Repeated target calls under different declared source identities share identical model-visible inputs. Review individual mismatches before drawing conclusions.
