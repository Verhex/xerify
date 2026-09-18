# Cross-provider benchmark

This is an opt-in **Xerify end-to-end verification benchmark**, not a ranking of underlying model
intelligence. It compares the installed provider channels on exactly the same authored claims and
evidence. The owner approved live calls and selected fixed inputs with only the target invoked.
Publication, package release, and social posting follow a separate review of the results.

## Matrix and immutable inputs

Suite `xerify-cross-provider-v3` contains `openai`, `anthropic`, and `typesafe` (Jev): **6 directed routes × 12 scenarios = 72 evaluations**. Each provider is paired with each other provider; self-verification is excluded. The source is only a declared fixture identity, never an actual generation call. Only the target is invoked. Cursor is excluded from this comparison and investigated separately.

| Target       | Adapter/channel             | Requested model |
| ------------ | --------------------------- | --------------- |
| OpenAI       | `codex`, local Codex CLI    | `gpt-6-astra`   |
| Anthropic    | `claude`, local Claude Code | `claude-opus-5` |
| TypeSafe Jev | `jev`, direct HTTPS API     | `jev-1.13.0`    |

Initial local versions: Codex CLI 0.154.0, Claude Code 2.1.276,
Node 24.15.0 on Linux/WSL. Codex is invoked with `--ignore-user-config` and `--ignore-rules`, so the reasoning
effort in the owner’s personal configuration is not assumed to apply. Effective inference settings
not exposed by the normalized result remain unmeasured; provider CLI defaults apply. Authentication uses existing CLI-managed accounts and a local
TypeSafe API key. This measures these configurations, not equal inference settings or API-only
performance. Model identifiers may be provider aliases; only Jev supplies a resolved model in
Xerify's current normalized result. No unobserved model revision is asserted.

[Authored fixtures](../scripts/benchmark-cases.mjs) are balanced: four `confirmed`, four `refuted`,
four `unclear`. They cover support, contradiction, missing evidence, Turkish permissions, policy
exceptions, partial support, indirection, injected instructions, conflicting sources, distracting
context, SQL deletion, and unmeasured outcomes. Labels were written before live execution. They
express the expected relationship to the supplied text, not externally established real-world
truth. Conservative refusal to trust a synthetic specification is a label mismatch, not necessarily
a factual hallucination. The conflicting-source case expects abstention because priority and the
actual deployed version cannot be resolved.

Expected labels and scenario IDs are never included in provider requests. The same UTF-8 claim
and context are used for every route, checked with SHA-256 digests. The source identity is not in
the current verifier prompt or Jev state; repeated targets across source rows are repeated
measurements of the same input, not evidence of a causal source-provider effect. No translation of
the test fixtures is performed for localized documentation. Wrapper prompts and outputs differ:
LLM adapters request the full verification schema; Jev requests a typed Choice and has no generated
rationale. The common scored output is Xerify's final three-way verdict.

## Execution and finite completion

Run the preview without credentials, a build, or provider calls:

```sh
node scripts/benchmark-providers.mjs
```

After owner approval for potentially billable calls:

```sh
npm run build
XERIFY_LIVE_CONFIRM_BILLABLE=YES node --env-file=.env scripts/benchmark-providers.mjs --live
```

The benchmark sets `timeoutMs: 0`, which explicitly disables Xerify's lifecycle deadline.
There is no arbitrary upper wait per request; completion comes from the target process or HTTP
response. It uses a finite matrix, no automatic retry, no fallback, and no loop until an expected
answer appears. Calls run sequentially, with route order rotated for each scenario. Every CLI
invocation has a fresh provider workspace; no conversation/session is reused by Xerify. Remote
caches and provider-internal retries are not controlled or independently measured.

Ctrl-C/SIGTERM aborts the current invocation and stops the matrix. A hung provider can therefore
require manual cancellation; disabling a deadline does not guarantee eventual completion.
Input and output limits remain 32,768 and 131,072 bytes. Normal request defaults remain 120 seconds;
`xerify --timeout 0` or config `limits.timeoutMs: 0` opts into unbounded waiting on other surfaces.
No-deadline subprocess and HTTP completion/cancellation have deterministic regression tests.

`XERIFY_BENCH_REPEATS` accepts 1..3, with one as default. Model overrides use
`XERIFY_BENCH_OPENAI_MODEL`, `XERIFY_BENCH_ANTHROPIC_MODEL`, and
`XERIFY_BENCH_TYPESAFE_MODEL`. `auto` is refused. A different model/repeat setting is a different
comparison and must be reported. Operational unavailability stops further calls to that target;
remaining cells are marked skipped, never successful. Schema failures remain attempted failures.

Private results are checkpointed after every cell. Continue only unattempted cells explicitly:

```sh
XERIFY_LIVE_CONFIRM_BILLABLE=YES node --env-file=.env scripts/benchmark-providers.mjs --live \
  --resume=.xerify/benchmarks/RUN_TIMESTAMP/report.json
```

Resume validates the suite, cases, models, routes, repeats, limits and core adapter/prompt digests.
It retains attempted errors and mismatches; it never retries them. A new private report preserves
the previous attempts and names the originating timestamp. Interruptions during a provider call
cannot prove whether a remote charge occurred; do not treat an absent completed record as proof
that no request reached the service.

## Metrics and interpretation

| Metric                      | Definition                                                                                                                                                                           |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Attempted / skipped / valid | Calls made, calls not made, and schema-valid results with `failure: null`                                                                                                            |
| Exact match                 | Valid final verdict equals the prewritten label, divided by all attempted calls; operational failures count against delivery success                                                 |
| Context agreement           | Same exact-match count on the nine context cases, reported with its attempted denominator; not a general comprehension score                                                         |
| Confusion matrix            | Expected vs final verdict, with operational failure and skipped columns kept separate                                                                                                |
| False confirmation          | `confirmed` when expected is `refuted` or `unclear`                                                                                                                                  |
| Unnecessary abstention      | Valid `unclear` when expected is `confirmed` or `refuted`                                                                                                                            |
| Decisive coverage           | Number of valid `confirmed` or `refuted` results; expected `unclear` can be a correct outcome                                                                                        |
| Latency                     | Monotonic wall time around the complete CLI handler, including process startup, API round-trip and normalization; successful p50/p95/min/max and failed-call p50 reported separately |
| Tokens                      | Provider-reported input/output totals with reporting coverage; missing remains null, never zero                                                                                      |
| Cost                        | Only provider-reported USD with coverage; missing prices and subscription quota are not estimated                                                                                    |

Percentiles use nearest-rank on successful calls; twelve samples per route do not establish a
stable p95 or statistical significance. Wall time is not time-to-first-token. Jev's output tokens
and the CLI models' explanation/reasoning tokens serve different contracts. Codex input already
includes cached tokens; Claude input adds its reported cache creation/read counts. Tokenizers,
prompt overhead and cache billing differ. Tokens/second would be misleading here and is not scored.

Jev policy stays at probability ≥0.90, confidence ≥0.80, unique maximum. Its original decision is
retained separately from the final verdict. Confidence is not an independent correctness label;
see [TypeSafe's definition](https://docs.typesafe.ai/confidence). Its documented limitations include
indirection, distracting context and adversarial content; see [Jev 1.13 limitations](https://docs.typesafe.ai/model-jaggedness/jev-1.13).
No human rationale-quality score or LLM-as-judge score is invented. These small synthetic fixtures
are not a representative production dataset. Review individual mismatches before using aggregate
numbers in marketing; no winner or speed multiplier is assumed in advance.

The workstation also performed documentation edits and local checks during the run. Host load was not isolated; latency observations include that environmental noise.

## Transport and security boundaries

Only Jev is called directly with HTTP by its adapter. Codex and Claude Code Agent are local
executables that contact their services. Evidence therefore leaves the machine for all three
channels. Existing provider accounts, retention policies, rate limits and billing still apply.
Other available backends include direct OpenAI API, Anthropic API, OpenAI-compatible endpoints and configured command adapters. A local model/endpoint can provide local inference when configured explicitly; a local client of a remote service does not. These alternative backends are not substituted into this run.

CLI, library, MCP STDIO and MCP HTTP are alternative entry surfaces to the same core and adapters;
MCP does not replace Jev's HTTPS endpoint or make verification local.

Each provider process gets an allowlisted environment and temporary directory, not a copy of the
repository or `.env`. The TypeSafe key is not passed to other provider subprocesses. CLI tooling
can still use its own home-directory configuration and auth stores; a temporary workspace is not
a claim of total OS isolation. Existing adapter modes restrict tools/sandbox behavior. HTTP MCP is
loopback by default; public binding requires explicit configuration and bearer authentication.

Only authored synthetic evidence is sent. The harness disables Xerify history/audit in its temporary
configuration and ignores normal Xerify project/user config. It never copies `.env`. Selected
normalized data stays in owner-only, ignored `.xerify/benchmarks/` files; provider-generated
summaries, full outputs, raw HTTP bodies, auth stores and credentials are not publication artifacts.
Results are schema-checked and never executed as commands. Prompt instructions and type validation
do not establish complete injection resistance or truth.

The recorded implementation digests describe the files at run start. During the run, harness maintenance added an explicit Buffer import, filtering of inherited XERIFY_* overrides, and case-insensitive rejection of auto model identifiers. The running process retained its loaded code; the invocation environment had no XERIFY_* overrides. Provider adapters, model-visible prompts, fixtures, and decision thresholds stayed fixed. A later rerun therefore has a different harness digest and must be recorded separately.

## Recorded runs

The earlier `v1` pilot used six routes and a 90-second deadline. It is incomplete for Anthropic
because its fourth call timed out, so remaining cells were skipped. The owner then requested all
12 directions and no lifecycle deadline. That pilot is retained privately and excluded from the
v2 comparison. Changing these conditions starts a new suite; the two runs are not pooled.

The original v2 run completed 144 calls. At the owner’s request, all routes involving Cursor were removed from the public comparison: the selected subset has **72 calls, zero skipped**. No calls were rerun or relabeled. [Results](benchmarks/2026-09-18-v2-three-providers.md) · [Measurements](benchmarks/2026-09-18-v2-three-providers.json). Jev matched **24/24** labels; OpenAI and Anthropic each **20/24**. Both returned unclear in support and Turkish-policy cases. Valid-call medians: Jev **783 ms**, OpenAI **11,123 ms**, Anthropic **75,444 ms**, pooled from individual observations. Token totals and reporting coverage are in the report; missing cost is unknown. The v3 runner creates new three-provider runs; it does not resume v2. The full private historical record remains unchanged.
