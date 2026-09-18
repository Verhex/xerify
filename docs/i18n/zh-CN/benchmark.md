# 跨提供方基准测试

这是显式启用的 **Xerify 端到端验证 benchmark**，不是底层模型智能排名。它使用完全相同的预编写主张和证据比较已安装渠道。所有者批准实时调用，并选择固定输入、仅调用目标。提交、包发布和社交发布将在另行审阅结果之后进行。

## 矩阵与固定输入

`xerify-cross-provider-v3` 包含 `openai`、`anthropic` 和 `typesafe`（Jev）：**6 个方向 × 12 场景 = 72 次评估**。每个提供方与另两个配对，不允许自我验证。来源仅为声明的测试身份，不执行生成调用；只调用目标。Cursor 已排除，其集成单独调查。

| 目标         | 适配器/渠道                | 请求模型        |
| ------------ | -------------------------- | --------------- |
| OpenAI       | `codex`，本地 Codex CLI    | `gpt-6-astra`   |
| Anthropic    | `claude`，本地 Claude Code | `claude-opus-5` |
| TypeSafe Jev | `jev`，直接 HTTPS API      | `jev-1.13.0`    |

初始本地版本：Codex CLI 0.154.0、Claude Code 2.1.276、Linux/WSL 上的 Node 24.15.0。Codex 使用 `--ignore-user-config` 和 `--ignore-rules`，因此不假设个人 reasoning effort 设置会生效。规范化结果未暴露的实际推理参数仍未测量；使用提供方 CLI 默认设置。认证通过现有 CLI 账户和本地 TypeSafe API 密钥。测量对象是这些配置，并非相同推理参数或纯 API 性能。模型名称可能是别名；当前规范化结果只有 Jev 提供已解析模型，不能声称知道未观察到的版本。

[测试用例](../../../scripts/benchmark-cases.mjs)均衡分布：四个 `confirmed`、四个 `refuted`、四个 `unclear`。涵盖支持、矛盾、缺失证据、土耳其语权限、策略例外、部分支持、间接推理、注入指令、冲突来源、干扰上下文、SQL 删除及未测量效果。标签在运行前编写，描述与给定文本的关系，不是外部已证事实。模型谨慎拒绝信任合成规格是标签不符，不必然是事实幻觉。冲突来源场景期待弃权，因为无法确定优先级和实际部署版本。

预期标签和场景 ID 不发送给提供方。各方向使用同一 UTF-8 主张和上下文，以 SHA-256 校验。当前 LLM prompt 与 Jev state 不含来源身份，所以不同来源行下的同一目标是相同输入的重复测量，不是来源提供方产生因果影响的证据。本地化文档不翻译测试夹具。LLM 请求完整验证 schema，Jev 请求没有生成理由的类型化 Choice；共同评分对象是 Xerify 最终三分类结论。

## 执行与有限完成

无需密钥、构建或提供方调用即可预览：

```sh
node scripts/benchmark-providers.mjs
```

所有者批准潜在费用后：

```sh
npm run build
XERIFY_LIVE_CONFIRM_BILLABLE=YES node --env-file=.env scripts/benchmark-providers.mjs --live
```

benchmark 使用 `timeoutMs: 0` 关闭 Xerify 生命周期时限，不设置任意等待上限；由目标进程结束或 HTTP 响应完成来推进。矩阵有限，不自动重试、fallback，也不循环直到预期答案出现。调用顺序执行，每场景轮换方向次序。每次 CLI 调用使用新的提供方工作区；Xerify 不复用会话。远程缓存及提供方内部重试未被控制或单独测量。

Ctrl-C/SIGTERM 取消当前调用并停止矩阵。提供方卡住时可能需要手动取消；取消时限不保证最终一定返回。输入和输出边界保留为 32,768/131,072 字节。普通请求默认仍为 120 秒；其他入口通过 `xerify --timeout 0` 或 `limits.timeoutMs: 0` 显式选择无限等待。HTTP 和子进程在无限等待下的完成/取消均有确定性回归测试。

`XERIFY_BENCH_REPEATS` 接受 1..3，默认 1。模型覆盖变量为 `XERIFY_BENCH_OPENAI_MODEL`、`XERIFY_BENCH_ANTHROPIC_MODEL`、`XERIFY_BENCH_TYPESAFE_MODEL`；拒绝 `auto`。模型或重复次数变更是不同实验条件，必须记录。操作性不可用会停止该目标后续调用，剩余单元标记 skipped，绝非成功。Schema 错误仍记为已尝试的失败。

每个单元后保存私有检查点。显式继续仅尚未尝试的单元：

```sh
XERIFY_LIVE_CONFIRM_BILLABLE=YES node --env-file=.env scripts/benchmark-providers.mjs --live \
  --resume=.xerify/benchmarks/RUN_TIMESTAMP/report.json
```

继续操作验证 suite、用例、模型、方向、重复数、边界以及核心适配器/prompt 哈希。此前错误和不符结果保留，不重试。新私有报告保留旧尝试并记录来源时间戳。调用中断无法证明远程是否产生费用；缺少完成记录不能证明请求没有到达服务。

## 指标与解释

| 指标                        | 定义                                                                                                  |
| --------------------------- | ----------------------------------------------------------------------------------------------------- |
| Attempted / skipped / valid | 已调用、未调用、schema 有效且 `failure: null` 的数量                                                  |
| 精确匹配                    | 有效最终结论等于预编写标签 / 全部已尝试调用；操作失败降低交付成功率                                   |
| 上下文一致性                | 九个上下文场景的匹配数及尝试分母，不是通用理解分数                                                    |
| 混淆矩阵                    | 预期与实际结论，操作失败和 skipped 单独列出                                                           |
| 错误确认                    | 预期 refuted 或 unclear 却返回 confirmed                                                              |
| 多余弃权                    | 预期 confirmed 或 refuted 却返回有效 unclear                                                          |
| 明确结论覆盖                | 有效 confirmed/refuted 数量；预期 unclear 也可能是正确结果                                            |
| 延迟                        | 包围完整 CLI handler 的单调墙钟时间，包含进程启动、网络和规范化；有效 p50/p95/min/max 与失败 p50 分开 |
| Token                       | 提供方报告的输入/输出总数及覆盖；缺失保持 null，不算零                                                |
| 费用                        | 仅提供方报告的 USD 及覆盖，不估算缺失价格或订阅额度                                                   |

有效调用的分位数使用 nearest-rank。每方向十二样本无法证明稳定 p95 或统计显著性。墙钟时间不是首 token 延迟。Jev 输出 token 与 LLM 解释/推理 token 服务于不同契约。Codex 输入已包含缓存 token；Claude 输入加上报告的缓存创建/读取量。分词器、prompt 开销和缓存计费不同，因此不计算误导性的 token/秒排名。

Jev 保持概率 ≥0.90、confidence ≥0.80、最大值唯一；原始选择单独保存。Confidence 不是独立正确性标签，见 [TypeSafe 定义](https://docs.typesafe.ai/confidence)。间接推理、干扰与对抗限制见 [Jev 1.13](https://docs.typesafe.ai/model-jaggedness/jev-1.13)。不编造人工理由质量或 LLM-as-judge 分数。小型合成集合不代表生产数据。用于宣传前应逐条检查不符，不能预设赢家或速度倍数。

运行期间同一工作站还用于编辑文档和执行本地检查。主机负载未隔离，延迟观察包含这些环境波动。

## 传输与安全边界

只有 Jev 适配器直接发 HTTP 请求。Codex 和 Claude Code 是连接各自服务的本地可执行程序，因此三个渠道都会把证据发出机器。现有账户、保留政策、限流与计费仍适用。其他后端包括直接 OpenAI API、Anthropic API、OpenAI 兼容端点和配置的命令适配器。明确配置本地模型/端点可本地推理；远程服务的本地客户端并不能做到。本轮不切换这些后端。CLI、库、MCP STDIO 和 HTTP MCP 是同一核心的不同入口；MCP 不替代 Jev HTTPS，也不让验证变成纯本地计算。

每个进程获得环境变量允许列表和临时目录，而非 repo 或 .env 副本。TypeSafe 密钥不传给其他 CLI。工具仍可使用自身 home 配置和认证存储；临时工作区不意味着完整 OS 隔离。适配器模式限制工具/sandbox 行为。HTTP MCP 默认 loopback，公开绑定需要显式配置及 bearer 认证。

仅发送编写的合成证据。临时配置关闭 Xerify 历史/audit，忽略正常用户/项目设置，绝不复制 .env。选定的规范化数据保存在仅所有者可读且被忽略的 `.xerify/benchmarks/`。提供方生成摘要、完整输出、原始 HTTP、认证库和密钥不作为公开材料。结果通过 schema 检查，绝不作为命令执行。Prompt 规则与类型校验不是完整抗注入或真实性证明。

记录的实现摘要对应启动时的文件。运行期间，测试程序补充了显式 Buffer 导入、继承的 XERIFY_* 配置过滤以及不区分大小写的 auto 模型拒绝检查。运行中的进程继续使用已加载代码，其调用环境没有 XERIFY_* 覆盖项。提供方适配器、模型可见提示、测试输入及决策阈值保持不变。后续运行的测试程序摘要因此不同，必须单独记录。

## 已记录运行

早先 v1 试运行采用六方向和 90 秒时限。Anthropic 第四次超时，随后单元被跳过，因此该渠道不完整。之后所有者要求十二方向、无生命周期时限。试运行私有保存，不并入 v2。条件变化意味着新 suite，两次测量不混合。

原始 v2 完成了 144 次调用。按所有者要求，公开比较中删除了所有涉及 Cursor 的方向，子集为 **72 次调用，无跳过**。没有重新调用或修改标签。[结果](benchmarks/2026-09-18-v2-three-providers.md) · [测量](../../benchmarks/2026-09-18-v2-three-providers.json)。Jev 匹配 **24/24**，OpenAI 和 Anthropic 各 **20/24**；后两者在 support 和土耳其语权限场景返回 unclear。有效单次调用的中位延迟：Jev **783 ms**、OpenAI **11,123 ms**、Anthropic **75,444 ms**。Token 总量和覆盖率在报告中，缺失费用仍为未知。v3 启动新的三提供方测试，不续跑 v2。完整私有历史记录保持不变。
