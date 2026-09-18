# Xerify 0.3.0 宣传文案

Xerify 0.3.0 发布文案。以下社交内容尚未发送。实时检查不代表普遍准确率或已校准 confidence。

[Jev](jev.md) · [Tests](jev-testing.md) · [Benchmark](benchmark.md)

## 核心信息

**信任之前，先验证。**

**LLM 复核或 Jev 决策，同一验证契约。**

Xerify 接收已有 AI 主张、有限证据以及另一个调用提供方，通过 CLI、库和 MCP 返回 confirmed、refuted 或 unclear。它源于 Deckent 原生验证层，也能独立运行。

## 公告

软件依据 AI 输出行动前，需要先检查。Xerify 0.3.0 将 TypeSafe 的 Jev 加入 LLM 验证器。证据边界相同，提供方隔离规则相同，三个结论相同。JSON 保留 Jev 概率分布和 confidence。低于配置阈值时返回 unclear，后续由应用决定，没有隐藏备用调用。

```sh
git diff --cached | xerify --json verify \
  --from openai:AUTHOR_MODEL --to jev \
  --claim "This migration preserves nullable email values"
```

在进程环境设置 TYPESAFE_API_KEY，并安装 xverify-cli@0.3.0。如果 diff 无法判断主张，补充 schema 和相关证据。Xerify 可作为独立 CLI、TypeScript 库和 MCP 服务器使用。开源，MIT 许可，由 Verhex 开发。

<https://github.com/Verhex/xerify>

## 短帖

> 信任之前，先验证。 Xerify 0.3.0 包含 Jev 和 LLM 验证器。有限证据 → 不同提供方 → confirmed / refuted / unclear。CLI · 库 · MCP。源自 Deckent。开源。
> https://github.com/Verhex/xerify

## 媒体与说明

- [GIF](../../../assets/readme/xerify-verification-flow.gif): 960 × 540; 16 s.
- [Jev](../../../assets/readme/xerify-verification-flow-poster.png): 1200 × 675.
- [Social](../../../assets/readme/xerify-verification-flow-social.png): 1920 × 1080.
- [LLM](../../../assets/readme/xerify-verification-flow-llm.png): 1200 × 675.

LLM 复核或 Jev 决策；每次运行一个目标；数值为示例。

动画展示两个独立运行，而非级联。Jev 场景概率 0.78、confidence 0.62 未达到默认 0.90 / 0.80，因此 unclear。这不是实时数据。保留已批准的 X 几何与纸张/墨色/祖母绿视觉体系。

## 仓库描述

GitHub About 描述 Xerify 0.3.0；包和 MCP 描述同一契约。

GitHub About:

> Verify before you trust. Cross-provider verification with bounded evidence and typed verdicts. CLI, library & MCP. LLM and Jev verification in 0.3.0.

npm:

> Verify before you trust. Cross-provider verification with LLMs and Jev. CLI, library, MCP.

MCP:

> Verify before you trust. Bounded cross-provider checks with LLMs and Jev over MCP.

## 发布边界

只有对应版本实际发布后才能声明可用。Jev 不生成理由或引用，confidence 不保证正确。首次实时检查只验证宣传与代码的一条一致性主张，不验证整个版本。新提供方 benchmark 独立评估。.env、原始响应和本地运行记录不得进入 Git/npm/网站、媒体或社交内容。
