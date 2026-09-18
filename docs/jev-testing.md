# Jev tests and live results

This page records integration coverage and an owner-approved live run on **2026-09-18**.
The ten live cases exercise narrow, authored synthetic claims. They are not a representative
accuracy benchmark, a calibration study, or a security assessment.

## Offline contract coverage

`npm run check` uses synthetic provider responses; it does not call TypeSafe or load `.env`.

| Area                | Covered behavior                                                                                                                                           |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Typed request       | Named claim/context state, Choice question, requested model, no credential in body                                                                         |
| Decisions           | `confirmed`, `refuted`, native `unclear`; original decision retained separately from final verdict                                                         |
| Thresholds          | Default and custom exact boundaries, just-below probability/confidence, unit probabilities, ties even with zero thresholds                                 |
| Response validation | Missing model/answer/confidence, invalid type/choice, negative or string probabilities, missing/extra options, wrong sum, nonmaximum choice, invalid usage |
| Usage               | Missing/partial/zero usage, no fabricated totals or price                                                                                                  |
| Identity            | Same-provider aliases and unknown provenance rejected before fetch; `ask` and raw `request` unsupported                                                    |
| Configuration/auth  | Pinned TypeSafe identity, policy ranges, endpoint/environment syntax, env precedence, missing key, presence-only probes                                    |
| Bounds              | Input refused before fetch; oversized output becomes `unclear`, exit 6, with output truncation reported                                                    |
| Transport           | 401/403; 400/422; retryable 408/409/429/500/503/529; invalid/empty JSON; network rejection; pre-abort, in-flight cancel, timeout; no automatic retries     |
| Privacy             | No raw HTTP error body or network exception text in normalized failures; no key in request body; audit excludes decision metadata                          |
| CLI/library         | Default and pinned aliases, all three verdicts, policy abstention, auth/rate-limit exits, library decision schema                                          |
| MCP                 | STDIO protocol harness carries verdicts, abstention, decision metadata and capabilities; local HTTP MCP preserves decision metadata on abstention          |
| Live runner         | Preview without key/build; live mode rejects missing acknowledgement or key                                                                                |
| Distribution        | Separate dotenv guards cover forced staging, npm manifests and site paths; package install smoke validates the packaged CLI/MCP                            |

The truncation regression test found a real defect: an oversized HTTP body that failed JSON parsing
lost its `truncation.output` flag when core constructed the failure result. Core now preserves the
typed error's truncation metadata. Such a result stays `unclear` with `INVALID_PROVIDER_RESPONSE`.

## Live scenario run

Started at **2026-09-18 11:48:32 UTC** (14:48:32 Europe/Istanbul), through Xerify's CLI command
handler and built distribution, using the normal Jev adapter and TypeSafe endpoint. Source identity
was declared as `openai:gpt-6`; target and returned model were `typesafe:jev-1.13.0` and `jev-1.13.0`.
Policy remained probability **≥0.90**, confidence **≥0.80**, with no tied maximum.

Expected labels were authored before execution. Each case ran once; there were no retries,
fallback calls, threshold adjustments, or post-result prompt edits. Only the ten synthetic
claim/context pairs in [the scenario source](../scripts/jev-scenarios.mjs) were supplied.

The probability column is **confirmed / refuted / unclear**, as reported by Jev.

| Scenario                                 | Expected  | Jev choice → Xerify verdict | Probabilities   | Confidence | ms  | Exit |
| ---------------------------------------- | --------- | --------------------------- | --------------- | ---------- | --- | ---- |
| Explicit support                         | confirmed | confirmed → confirmed       | 1 / 0 / 0       | 1.00       | 942 | 0    |
| Explicit contradiction                   | refuted   | refuted → refuted           | 0 / 1 / 0       | 1.00       | 365 | 10   |
| Empty evidence                           | unclear   | unclear → unclear           | 0 / 0 / 1       | 1.00       | 317 | 11   |
| Unrelated evidence                       | unclear   | unclear → unclear           | 0 / 0 / 1       | 1.00       | 371 | 11   |
| Partially supported compound claim       | unclear   | unclear → unclear           | 0 / 0 / 1       | 0.99       | 336 | 11   |
| Material contradiction in compound claim | refuted   | refuted → refuted           | 0 / 1 / 0       | 1.00       | 351 | 10   |
| Turkish support                          | confirmed | confirmed → confirmed       | 1 / 0 / 0       | 0.99       | 308 | 0    |
| SQL column removal                       | refuted   | refuted → refuted           | 0 / 1 / 0       | 1.00       | 597 | 10   |
| Embedded verdict instruction             | refuted   | refuted → refuted           | 0 / 1 / 0       | 1.00       | 360 | 10   |
| Confidence-threshold code                | confirmed | confirmed → confirmed       | 0.99 / 0.01 / 0 | 0.98       | 335 | 0    |

All ten final verdicts matched the authored expectations: **3 confirmed, 4 refuted, 3 unclear**.
All had `failure: null` and no truncation. Reported usage summed to **5,151 input tokens** and
**417 output tokens**. Each result's `totalTokens` and `costUsd` remained `null`; no dollar cost
was inferred. Individual Xerify durations ranged from **308 to 942 ms**; this is a single run,
not a latency benchmark or service-level claim.

None of these live cases triggered a low-confidence abstention: the three unclear results were
native Jev choices. Below-threshold and tie handling are covered by deterministic contract tests.
One embedded instruction was ignored successfully; broader prompt-injection resistance remains
unmeasured. A reported probability of 1 is a model output, not proof of certainty.

This table is an authored summary. Raw provider responses, credentials, and private run records
are not committed. The earlier [campaign/code check](jev.md#first-live-campaign-check) was separate
and is not included in these totals.

## Reproduce deliberately

Preview all evidence and expected labels without a key or provider request:

```sh
node scripts/live-jev-scenarios.mjs
```

After owner approval for potentially billable calls, build and run from the source checkout:

```sh
npm run build
XERIFY_LIVE_CONFIRM_BILLABLE=YES node --env-file=.env scripts/live-jev-scenarios.mjs --live
```

Node 20.6+ supports the explicit env-file flag. The runner pins `jev-1.13.0`, makes at most
ten sequential evaluations, and stops at the first operational/auth failure. It uses a temporary
configuration with history disabled, ignores normal user/project configuration, and passes only
the TypeSafe key to its CLI environment. It never copies `.env`. Each request has a 30-second
timeout. It writes selected normalized metadata to an owner-only timestamped file under ignored
`.xerify/live-jev-scenarios/`; it does not write raw HTTP responses or evidence to that report.

The **runner's** exit code is 0 when all expectations match, 11 for semantic mismatches, 1 for
an incomplete/operationally failed run, 2 for missing live acknowledgement, and 3 for a missing key.
Individual **verification** exits are retained in each record. A semantic mismatch is evidence to
inspect, not an instruction to rerun until the model agrees. This runner is excluded from normal
checks, install smoke, and release operations.

## Interpreting failures in an application

| Outcome                        | CLI exit | Meaning / action                                                                                             |
| ------------------------------ | -------- | ------------------------------------------------------------------------------------------------------------ |
| confirmed                      | 0        | Supported by supplied evidence under this policy; inspect scope                                              |
| refuted                        | 10       | Contradicting evidence was selected; inspect the claim                                                       |
| unclear, `failure: null`       | 11       | Insufficient evidence, ambiguous judgment or policy abstention; inspect `decision` and add relevant evidence |
| Same provider / unknown author | 2        | Fix declared provider identity; no evaluation is sent                                                        |
| Missing key / HTTP 401 or 403  | 3        | Authentication error envelope, not a verification result; fix local credentials                              |
| Timeout / cancellation         | 4        | Operational `unclear`; no automatic retry                                                                    |
| HTTP/network failure           | 5        | Operational `unclear`; retryability is metadata, not an automatic action                                     |
| Malformed / truncated response | 6        | Operational `unclear`; inspect limits or provider compatibility                                              |

Use `failure` to distinguish operational errors from meaningful abstention. Inspect
`decision.choice`, the selected probability, confidence, and policy to explain a threshold-based
abstention. For more usage examples and MCP setup, see [the Jev guide](jev.md).
