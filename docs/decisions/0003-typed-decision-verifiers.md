# ADR 0003: Typed decision verification

- Status: accepted
- Date: 2026-09-18

## Context

Jev returns typed decisions instead of generated text. Xerify's existing provider separation,
verdicts, and failure semantics remain useful for this backend. A chat-compatible wrapper would
lose decision metadata or imply explanations the model does not produce.

## Decision

The `jev` adapter invokes TypeSafe directly and pins its provider identity to `typesafe`.
CLI references `jev` and `jev:MODEL_ID` normalize to `typesafe:jev-latest` and `typesafe:MODEL_ID`
for both author and target before admission. Structured library/MCP callers use `typesafe`.
Provider separation continues to mean invocation/billing/control service, as in ADR 0002.

Core supplies structured claim/context to the adapter without parsing a generated prompt.
One Choice question evaluates `confirmed`, `refuted`, and `unclear`. Jev supports `verify` only;
open-ended `ask` and the raw prompt escape hatch are unsupported before network activity.

Optional `VerifyResult.decision` preserves the provider's choice, probabilities, confidence,
returned model, and the configured policy. `to.model` retains the requested model/alias and
`to.provenance` stays declared. No model response upgrades provenance to observed.
The existing generative verifier payload and generation schema remain unchanged.

Default minimum selected probability is 0.90 and minimum confidence is 0.80. Either unmet
threshold, or a tie, results in `unclear` with no operational failure. These are application
policy defaults, not measured accuracy guarantees. Malformed distributions, missing options,
and choices inconsistent with the maximum probability fail closed. Core still handles transport,
cancellation, truncation, and parsing failures under ADR 0001.

The summary and limitations are explicit adapter templates; findings and evidence arrays are
empty. Xerify does not manufacture reasoning or sources. Usage comes from returned fields;
missing cost and total token fields remain null. Audit projection remains metadata-only.

## Consequences

Jev complements LLM verifiers under one system contract. It is not a replacement for evidence
collection or a proof of truth. There is no automatic fallback, ensemble, or hidden second call.
Applications can inspect the result and explicitly choose another verifier. Probe reports key
presence only, including when network probing is requested; it does not validate the credential.
The additive optional result field keeps schema version 1.
