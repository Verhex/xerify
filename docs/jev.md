# Jev with Xerify 0.3.0

Jev is TypeSafe's typed decision model. Xerify is the verification layer around supported
backends: bounded evidence, provider separation, stable verdicts, and run history. They share
a focus on machine-consumable decisions, but solve different parts of the problem.

Jev support is included in Xerify 0.3.0. The adapter is tested with
synthetic HTTP fixtures. An owner-approved campaign check and a separate ten-scenario live run
completed on 2026-09-18. See the [test coverage and live results](jev-testing.md) and the
[Turkish usage guide](i18n/tr/jev.md). Domain accuracy and threshold calibration remain unmeasured.

## Set up a key

From a source checkout, run `npm ci` and `npm run build`. Copy `.env.example` to `.env` and set
`TYPESAFE_API_KEY` locally. `.env` is ignored by Git and excluded from the npm package. Keep it
private (on POSIX, `chmod 600 .env`). Never put a key in evidence or a command argument.

The real `.env` belongs only in the owner's main working directory, never in a Git branch
(including `main`), another worktree, npm package, source archive, site upload, or Docker context.
Git ignores dotenv files; package-level exclusions also cover files nested inside allowlisted
npm directories. Docker ignores cover root and nested files. Git source archives exclude dotenv
paths. Only the root `.env.example` with empty assignments is allowed in the Git index.

`npm run secrets:check` checks the Git index, site tree, and actual npm dry-run manifest without
reading real dotenv files. It runs in `check` and `prepack`; the install smoke checks the packed
manifest too. The Pages workflow checks assembled output before upload. A local pre-commit hook
blocks even dotenv files staged with `git add -f`; enable it in a fresh checkout with
`git config --local core.hooksPath .githooks` after checking for existing hooks. The owner checkout
has this hook enabled. Hooks can be bypassed, so CI and package exclusions remain separate checks.
Do not copy credentials into other files or provide `.env` as verification evidence.

Xerify reads the process environment; it does **not** automatically read `.env`. Load it explicitly
using Node's `--env-file` flag (Node 20.6 or newer; Node 24 recommended):

```sh
node --env-file=.env ./dist/cli/entry.js --json providers probe --provider jev
```

This reports key presence only. It does not validate the key or make a TypeSafe request.
An existing process environment variable takes precedence over the file.

The following command makes one potentially billable evaluation when you choose to run it:

```sh
git diff --cached | node --env-file=.env ./dist/cli/entry.js --json verify \
  --from openai:AUTHOR_MODEL \
  --to jev \
  --claim "This migration preserves existing data"
```

With the key already in your environment, the installed CLI command is `xerify --json verify
--from openai:AUTHOR_MODEL --to jev --claim "…"`. Supply enough evidence to judge the claim;
an empty diff is not evidence of correctness. Existing run-history capture settings still apply.

## Identity and supported operations

The default adapter ID and config kind are `jev`. The invocation provider is `typesafe` because
TypeSafe controls the direct endpoint, authentication, and billing. CLI `--to jev` expands to
`typesafe:jev-latest`; `--to jev:jev-1.13.0` selects a pinned model. The same normalization applies
to `--from`, so aliases cannot bypass the same-provider check. Explicit `typesafe:MODEL_ID` works.

Library and MCP requests use `{ "provider": "typesafe", "model": "jev-latest" }` for `to`.
The requested alias stays in `to.model`; `decision.model` records the model reported in the response.
Jev supports `verify` only. `ask` and `request` return `UNSUPPORTED` before any HTTP request.
Capabilities expose `operations: ["verify"]`; capabilities without this optional field retain their
existing behavior. Provider diversity does not prove independent model lineage or correctness.

## Decision policy

Xerify sends `{model, state: {claim, context}, questions: {verdict: …}}` to
`POST https://api.typesafe.ai/v1/systemone`. A Choice question asks for falsification against the
supplied evidence, with three criteria: `confirmed`, `refuted`, and `unclear`.

A valid response retains its choice only if its selected probability is at least **0.90**, its
confidence is at least **0.80**, and the maximum is not tied. Otherwise the verdict is `unclear`.
A native `unclear` choice remains unclear. Below-threshold results have `failure: null` and exit 11.
These defaults are configurable heuristics, not independently calibrated accuracy guarantees.
TypeSafe confidence summarizes the distribution; it is distinct from the probability of a choice.

An illustrative synthetic result fragment:

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

`decision` is an optional addition to schema version 1. Its probabilities describe the provider's
original choice, even if the final verdict abstains. Each probability must be in [0,1], all three
must be present, their sum must be within 0.000001 of one, and the choice must be a maximum.
Cross-field constraints are enforced at runtime in addition to the exported JSON Schema.
Malformed output and transport failures preserve existing typed failures and exit codes.
There are no automatic retries or fallback calls.

Jev does not generate an explanation or evidence citations. Xerify supplies a clearly labeled
template summary and limitations, with empty findings/evidence arrays. Typed output is not proof
of truth. The optional metadata is retained in normalized run history, subject to capture policy;
audit JSONL does not retain the decision object. Usage fields are reported without estimating cost.

## Configuration, library, and MCP

No provider config is needed for the default adapter. To override its policy in
`.xerify/xverify-config.json`, merge this provider entry into your existing configuration:

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

Environment credentials take precedence over an optional literal `apiKey`. Diagnostic redaction
and owner-only config permissions match the other direct API adapters. An optional `endpoint`
allows a trusted proxy or local test server; changing it sends the configured key and evidence to
that URL. Use a separately declared gateway adapter when the invocation service itself differs.
Input body and HTTP response bytes are bounded; oversized input is refused without a paid call.
Provider token limits still apply independently of Xerify's byte limit.

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

For MCP, expose `TYPESAFE_API_KEY` in the server process environment and call `xerify_verify` with
the same structured request. In a source checkout, explicit dotenv loading also works for STDIO:
`node --env-file=.env ./dist/cli/entry.js mcp stdio`. No extra MCP tool is required.

## Agent skills

Install the official skill into a project for Codex, Claude Code, and Cursor with one method:

```sh
npx skills add typesafe-ai/skills --skill typesafe-ai --agent codex claude-code cursor --yes
```

This is the multi-agent selection form of TypeSafe's recommended non-Claude-agent installation
command. It installs files, not a model integration or API credential. Do not also install the
Claude marketplace plugin for the same setup. Codex and Cursor use `.agents/skills/typesafe-ai`;
Claude Code uses `.claude/skills/typesafe-ai`, linked to the shared copy. The installer records the
upstream source in `skills-lock.json`. Its `experimental_install` command can restore locked skills.

This working checkout also has a local `xerify-jev` companion under `.agents/skills/xerify-jev`,
linked into Claude Code. It records Xerify's provider identity, policy, schema, and validation
requirements without editing the official skill. Both skill installations and the local
`AGENTS.md` pointer are ignored development state, not npm package contents. The companion is
local to this checkout; restoring the official lockfile does not recreate that custom skill.
Select `$typesafe-ai` for TypeSafe guidance or `$xerify-jev` for this project's integration in Codex.
New skills become available on the next turn; another running agent may need to reload the project.

## Documentation review and judgment scope

The official skill and live documentation were reviewed on 2026-09-18, including the introduction,
State, Choice, HTTP API, confidence, models, model limitations, and citation-check cookbook.
The supplied downloaded skill matched the official GitHub version byte for byte at review time.

| Area            | Review outcome                                                                                                                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wire contract   | Keep the existing direct HTTP endpoint, bearer authentication, named state, and Choice response mapping. No chat-completions wrapper is needed.                                                         |
| Question        | Name `claim` and `context` explicitly. Judge their relationship; unsupported evidence alone must not be classified as a contradiction.                                                                  |
| Decision policy | Keep 0.90 probability / 0.80 confidence as configurable Xerify defaults. These are not TypeSafe-mandated thresholds or measured accuracy.                                                               |
| Explainability  | Keep the adapter-authored summary and empty evidence/findings arrays. Jev supplies no generated rationale.                                                                                              |
| Validation      | Synthetic HTTP tests verify the integration contract. A campaign check and ten live scenarios matched expectations; domain accuracy, calibration, and general adversarial resistance remain unmeasured. |

A useful Jev task is one focused source-to-claim judgment. For example, check “The provided migration
removes the `email` column” against that migration. A claim such as “This release is safe, fast, and
backward compatible” combines several dimensions; split it into specific checks with appropriate
evidence, or explicitly select an LLM verifier for the broader reasoning task. Xerify does not
automatically split claims or batch multiple verifications in 0.3.0.

Keep exact arithmetic, date comparisons, counts, and lookups in code. Supply relevant source
excerpts rather than an entire repository. TypeSafe documents limitations for Jev 1.13 including
numeric precision, indirection, distracting context, and adversarial content; do not assume these
limitations or performance claims apply unchanged to future models. Prompt boundaries reduce
ambiguity but are not a demonstrated injection defense.

`jev-latest` is convenient for setup; pin a version when evaluating thresholds so an alias update
does not silently change the tested model. Evaluate supported, contradicted, missing-evidence,
mixed-evidence, and adversarial cases in the target domain before treating confidence as a routing
signal. Such live evaluations still require owner approval in this repository.

## Product direction and sources

The useful composition is “Jev makes a typed decision; Xerify supplies the verification contract.”
Automatic escalation, deterministic evaluators, human review, and multi-provider ensembles remain
possible future work, not 0.3.0 features. An application can explicitly request a separate LLM
verification after an unclear decision; Xerify does not silently spend on another provider.

Checked against TypeSafe's official [introduction](https://docs.typesafe.ai/introduction),
[agent skill](https://github.com/typesafe-ai/skills/blob/main/skills/typesafe-ai/SKILL.md),
[State](https://docs.typesafe.ai/concepts/state), [Choice](https://docs.typesafe.ai/primitives/choice),
[citation checks](https://docs.typesafe.ai/cookbooks/citation_check),
[model limitations](https://docs.typesafe.ai/model-jaggedness/jev-1.13), and [HTTP API](https://docs.typesafe.ai/api),
[confidence semantics](https://docs.typesafe.ai/confidence), and
[model and alias reference](https://docs.typesafe.ai/models) on 2026-09-18.
See [ADR 0003](decisions/0003-typed-decision-verifiers.md) for the architecture decision and
[launch copy](launch-0.3.0.md) for a draft announcement.

## First live campaign check

On 2026-09-18, the owner authorized one verification through the Xerify CLI using `--to jev`.
The author identity was declared as `openai:gpt-6`; the target was `typesafe:jev-latest`, and the
response reported `jev-1.13.0`. Only a 490-byte code excerpt and campaign sentence were supplied.
The check asked whether the implementation supports the statement that falling below either
configured probability or confidence threshold produces `unclear`.

The normalized result was `confirmed` (exit 0), with probabilities `confirmed=0.91`,
`refuted=0.06`, `unclear=0.03` and confidence `0.87`. The existing policy was `0.90` minimum
selected probability and `0.80` minimum confidence. Xerify reported 882 ms, 649 input tokens,
and 41 output tokens, no truncation, and no failure. Cost was not reported.

This records one successful live request and a narrowly scoped semantic check. It does not
validate the entire release, measure model accuracy, calibrate the policy, establish latency
distributions, or demonstrate resistance to prompt injection. No second provider or retry was
invoked. Credentials stayed in the local `.env`; raw responses and the local run record are not
publication assets. These figures are an authored summary, not a committed raw response.
