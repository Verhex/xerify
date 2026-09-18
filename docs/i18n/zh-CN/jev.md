# 在 Xerify 0.3.0 中使用 Jev

Jev 是 TypeSafe 的类型化决策模型。Xerify 是支持这些后端的验证层，负责限定证据、隔离提供方、保持稳定结论并记录运行历史。两者都关注软件可直接使用的决策，但解决的是不同层面的问题。

Xerify 0.3.0 包含 Jev 支持。适配器通过合成 HTTP 响应测试。经所有者批准的宣传检查与另一组十场景实时运行已于 2026-09-18 完成。详见[测试覆盖和实时结果](jev-testing.md)。领域准确率和阈值校准尚未测量。

## 配置密钥

在源码 checkout 中运行 `npm ci` 和 `npm run build`。将 `.env.example` 复制为 `.env`，在本地填写 `TYPESAFE_API_KEY`。Git 忽略 `.env`，npm 包也排除它。保持私有；POSIX 下使用 `chmod 600 .env`。不要把密钥写进证据或命令参数。

真正的 `.env` 只留在所有者的主工作目录，不能进入任何 Git 分支（包括 `main`）、其他 worktree、npm 包、源码归档、网站上传或 Docker 上下文。Git 忽略 dotenv；npm 排除规则也覆盖允许打包目录中的嵌套文件。Docker 排除根目录和嵌套文件；Git 源码归档排除 dotenv 路径。Git 索引只允许根目录中所有赋值为空的 `.env.example`。

`npm run secrets:check` 检查 Git 索引、网站目录和实际 npm dry-run 清单，不读取真实 dotenv 内容。它在 `check` 和 `prepack` 中执行；安装冒烟测试也检查打包清单。Pages 工作流在上传前检查组装后的输出。本地 pre-commit hook 连 `git add -f` 强制暂存的 dotenv 也会阻止。新 checkout 应先检查已有 hook，再通过 `git config --local core.hooksPath .githooks` 启用；所有者的 checkout 已启用。Hook 可以绕过，因此 CI 和打包排除仍是独立防线。不要把凭据复制到其他文件，也不要把 `.env` 当作验证证据。

Xerify 读取进程环境，**不会自动读取** `.env`。使用 Node 的 `--env-file` 显式加载；要求 Node 20.6+，建议 Node 24：

```sh
node --env-file=.env ./dist/cli/entry.js --json providers probe --provider jev
```

此操作只报告密钥是否存在，不验证有效性，也不发送 TypeSafe 请求。进程中已存在的环境变量优先于文件值。

运行以下命令会进行一次可能计费的评估：

```sh
git diff --cached | node --env-file=.env ./dist/cli/entry.js --json verify \
  --from openai:AUTHOR_MODEL \
  --to jev \
  --claim "This migration preserves existing data"
```

如果环境中已有密钥，安装版 CLI 命令为 `xerify --json verify --from openai:AUTHOR_MODEL --to jev --claim "…"`。应提供足够证据；空 diff 不能证明正确性。既有运行历史采集设置仍然生效。

## 身份与支持的操作

默认适配器 ID 和配置类型为 `jev`。调用提供方为 `typesafe`，因为 TypeSafe 控制直接端点、身份认证和计费。CLI `--to jev` 展开为 `typesafe:jev-latest`；`--to jev:jev-1.13.0` 固定模型版本。同样的规范化适用于 `--from`，所以别名不能绕过同提供方检查。显式 `typesafe:MODEL_ID` 也可使用。

库和 MCP 的 `to` 使用 `{ "provider": "typesafe", "model": "jev-latest" }`。请求别名保留在 `to.model`，响应报告的模型记录在 `decision.model`。Jev 仅支持 `verify`；`ask` 和 `request` 在任何 HTTP 请求之前返回 `UNSUPPORTED`。能力声明包含 `operations: ["verify"]`；没有此可选字段的适配器保持原行为。不同提供方并不能证明模型来源独立或判断正确。

## 决策策略

Xerify 向 `POST https://api.typesafe.ai/v1/systemone` 发送 `{model, state: {claim, context}, questions: {verdict: …}}`。Choice 问题要求依据所给证据尝试证伪主张，候选标准是 `confirmed`、`refuted`、`unclear`。

只有被选项概率至少 **0.90**、confidence 至少 **0.80** 且最高概率没有并列时，才保留有效响应的原始选择。否则最终结论为 `unclear`。原生 `unclear` 仍保持不确定。低于阈值的结果为 `failure: null`，退出码 11。这些是可配置的启发式默认值，并非独立校准过的准确性保证。TypeSafe confidence 概括整个分布，与单个选项的概率不同。

合成示例片段：

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

`decision` 是 schema 版本 1 的可选新增字段。即使最终结论弃权，概率仍描述提供方原始选择。三个概率必须齐全且位于 [0,1]；总和与一的偏差不超过 0.000001；被选项必须达到最大值。除导出的 JSON Schema 外，运行时还执行跨字段约束。格式异常和传输故障保留既有类型化错误与退出码。不会自动重试或调用备用提供方。

Jev 不生成解释或证据引用。Xerify 提供明确标注由模板生成的摘要和限制，findings/evidence 数组为空。类型安全不是事实证明。可选元数据按采集策略保存在规范化历史中；audit JSONL 不保存 decision 对象。使用量如实报告，不估算成本。

## 配置、库与 MCP

默认适配器无需提供方配置。若要覆盖 `.xerify/xverify-config.json` 中的策略，将以下条目合并进现有配置：

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

环境凭据优先于可选的字面量 `apiKey`。诊断脱敏和仅所有者可读的配置权限与其他直接 API 适配器一致。可选 `endpoint` 支持可信代理或本地测试服务器；修改它会将密钥与证据发送到新 URL。如果调用服务本身不同，应单独声明 gateway 适配器。请求体和 HTTP 响应都有字节边界；超大输入在计费请求前即拒绝。提供方 token 上限独立于 Xerify 字节上限。

```ts
import { executeVerify, JevAdapter, ProviderRegistry, VerifyRequestSchema } from 'xverify-cli';

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

MCP 中，在服务器进程环境设置 `TYPESAFE_API_KEY`，使用相同结构化请求调用 `xerify_verify`。源码 checkout 的 STDIO 也支持显式 dotenv 加载：`node --env-file=.env ./dist/cli/entry.js mcp stdio`。不需要额外 MCP 工具。

## 智能体技能

仅选择一种方法，为 Codex、Claude Code 和 Cursor 安装官方 skill：

```sh
npx skills add typesafe-ai/skills --skill typesafe-ai --agent codex claude-code cursor --yes
```

这是 TypeSafe 推荐给非 Claude 智能体的命令的多智能体选择形式。它安装文件，不安装模型集成或 API 凭据。不要为同一配置再安装 Claude marketplace 插件。Codex 和 Cursor 使用 `.agents/skills/typesafe-ai`，Claude Code 使用链接到共享副本的 `.claude/skills/typesafe-ai`。安装器将上游来源记入 `skills-lock.json`；`experimental_install` 可以恢复锁定技能。

此工作目录还包含 `.agents/skills/xerify-jev` 本地配套技能，并链接到 Claude Code。它记录 Xerify 的提供方身份、策略、schema 和验证要求，不修改官方 skill。两种技能安装和本地 `AGENTS.md` 指针都是被忽略的开发状态，不在 npm 包中。配套技能仅存在于此 checkout，恢复官方 lockfile 不会重建它。在 Codex 选择 `$typesafe-ai` 获取通用指南，或 `$xerify-jev` 处理项目集成。新技能在下一轮可用；其他运行中的智能体可能需要重新加载项目。

## 文档审阅与判断范围

2026-09-18 审阅了官方 skill 与在线文档：介绍、State、Choice、HTTP API、confidence、模型、限制以及 citation-check cookbook。当时提供的下载文件与官方 GitHub 版本逐字节一致。

| 范围     | 审阅结论                                                                                               |
| -------- | ------------------------------------------------------------------------------------------------------ |
| 通信协议 | 保留直接 HTTP 端点、bearer 认证、命名 state 和 Choice 映射；无需 chat-completions 包装。               |
| 问题     | 明确命名 `claim` 和 `context`，判断二者关系；仅缺少支持不等于矛盾。                                    |
| 策略     | 保留可配置的 0.90 概率 / 0.80 confidence；不是 TypeSafe 强制阈值或已测准确率。                         |
| 可解释性 | 保留适配器摘要与空 evidence/findings；Jev 不生成理由。                                                 |
| 验证     | 合成 HTTP 测试检查集成契约；宣传检查和十个实时场景符合预期。领域准确率、校准和普遍抗攻击能力仍未测量。 |

合适的 Jev 任务是聚焦的来源到主张判断，例如依据迁移文件判断“该迁移删除 `email` 列”。“版本安全、快速且向后兼容”结合多个维度，应拆成有适当证据的具体检查，或明确选择 LLM 做更广泛推理。Xerify 0.3.0 不自动拆分主张或批量执行多个验证。

精确算术、日期比较、计数和确定性查找应保留在代码中。提供相关片段，不要发送整个仓库。TypeSafe 已记录 Jev 1.13 的数值精度、间接推理、干扰上下文和对抗性内容限制；不要假设这些限制或性能声明会原样适用于未来模型。Prompt 边界有助于减少歧义，但并非已经证明的注入防御。

`jev-latest` 适合初次配置；评估阈值时应固定版本，避免别名更新悄悄改变模型。在将 confidence 用作路由信号前，应在目标领域测试支持、矛盾、缺失、混合证据和对抗性案例。本仓库中的实时评估仍需所有者批准。

## 产品方向与来源

合理组合是：Jev 做类型化决策，Xerify 提供验证契约。自动升级、确定性评估器、人工复核与多提供方集成仍属未来方向，而非 0.3.0 功能。应用可在 `unclear` 后明确请求另一 LLM 验证；Xerify 不会默默调用其他提供方并产生费用。

于 2026-09-18 检查的官方来源：

[Introduction](https://docs.typesafe.ai/introduction) · [Skill](https://github.com/typesafe-ai/skills/blob/main/skills/typesafe-ai/SKILL.md) · [State](https://docs.typesafe.ai/concepts/state) · [Choice](https://docs.typesafe.ai/primitives/choice) · [Citation checks](https://docs.typesafe.ai/cookbooks/citation_check) · [Model limitations](https://docs.typesafe.ai/model-jaggedness/jev-1.13) · [HTTP API](https://docs.typesafe.ai/api) · [Confidence](https://docs.typesafe.ai/confidence) · [Models](https://docs.typesafe.ai/models)

架构决定见 [ADR 0003](../../decisions/0003-typed-decision-verifiers.md)，宣传草稿见[发布文案](launch-0.3.0.md)。

## 首次实时宣传检查

2026-09-18 所有者批准通过 Xerify CLI 的 `--to jev` 做一次验证。作者身份声明为 `openai:gpt-6`，目标为 `typesafe:jev-latest`，响应模型为 `jev-1.13.0`。仅提供 490 字节的代码片段和宣传句。检查的问题是：实现是否支持低于任一配置概率或 confidence 阈值时返回 `unclear`。

规范化结果为 `confirmed`，退出码 0；概率 `confirmed=0.91`、`refuted=0.06`、`unclear=0.03`，confidence `0.87`。策略为最小概率 `0.90` 和 confidence `0.80`。Xerify 报告 882 ms、649 输入 token、41 输出 token，无截断、无故障；未报告费用。

这记录一次成功实时请求与一个狭窄语义检查，不验证整个版本，也不测量模型准确率、策略校准、延迟分布或抗注入能力。未调用第二提供方或重试。密钥留在本地 `.env`；原始响应和本地运行记录不是发布素材。以上为编写后的摘要，而非提交进仓库的原始响应。
