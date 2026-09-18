# Jev 测试与实时结果

本页记录 **2026-09-18** 的集成测试覆盖与经所有者批准的实时运行。十个预先编写的合成主张范围狭窄，不是代表性准确率基准、校准研究或安全评估。

## 离线契约覆盖

`npm run check` 使用合成 HTTP 响应，不调用 TypeSafe，也不加载 `.env`。

|            |                                                                                                            |
| ---------- | ---------------------------------------------------------------------------------------------------------- |
| 类型化请求 | 命名 claim/context、Choice、请求模型；请求体无密钥                                                         |
| 决策       | `confirmed`、`refuted`、原生 unclear；原始选择与最终结论分开保留                                           |
| 阈值       | 默认/自定义精确边界、略低于阈值、单位概率、零阈值时仍处理并列                                              |
| 响应验证   | 缺失模型/答案/confidence，错误类型/选择，负数或字符串概率，缺失/额外选项，错误总和，非最大选择，无效使用量 |
| 使用量     | 缺失/部分/零值，不编造总量或价格                                                                           |
| 身份       | 同提供方别名与未知来源在 fetch 前拒绝；不支持 `ask`/request                                                |
| 配置/认证  | 固定 typesafe 身份、阈值范围、endpoint/env 语法、环境优先、缺少密钥、仅检测存在                            |
| 边界       | 超限输入在调用前拒绝；超大输出 unclear、退出码 6 并报告截断                                                |
| 传输       | 401/403、400/422；可重试 408/409/429/500/503/529；空/坏 JSON、网络拒绝、预先/进行中取消、超时；不自动重试  |
| 隐私       | 规范化错误无原始 HTTP 错误体或网络异常文本；体内无密钥；audit 不含 decision                                |
| CLI/库     | 默认/固定别名、三个结论、策略弃权、认证/限流退出码、决策 schema                                            |
| MCP        | STDIO 协议测试保留结论、弃权、元数据与能力；本地 HTTP 在弃权时保留 decision                                |
| 实时运行器 | 无密钥/build 可预览；缺确认或密钥则拒绝实时模式                                                            |
| 分发       | dotenv 保护覆盖强制暂存、npm 清单与网站路径；安装冒烟测试验证包内 CLI/MCP                                  |

截断回归测试发现真实缺陷：超大的 HTTP 响应无法解析为 JSON 时，核心构造失败结果会丢失 `truncation.output`。现在保留类型化错误中的截断信息。结果仍为 `unclear` 和 `INVALID_PROVIDER_RESPONSE`。

## 实时场景运行

开始于 **2026-09-18 11:48:32 UTC**（14:48:32 Europe/Istanbul），通过编译后的 Xerify CLI 命令处理器、正常 Jev 适配器与 TypeSafe 端点执行。来源声明 `openai:gpt-6`，目标 `typesafe:jev-1.13.0`，返回模型 `jev-1.13.0`。策略保持概率 **≥0.90**、confidence **≥0.80** 且最大值不并列。预期标签在运行前编写；每例只执行一次，没有重试、fallback、阈值调整或结果后的 prompt 修改。仅发送[场景源码](../../../scripts/jev-scenarios.mjs)中的十组 claim/context。概率顺序为 **confirmed / refuted / unclear**。

| 场景                | 预期      | Jev 选择 → Xerify 结论 | 概率            | Confidence | ms  | 退出码 |
| ------------------- | --------- | ---------------------- | --------------- | ---------- | --- | ------ |
| 明确支持            | confirmed | confirmed → confirmed  | 1 / 0 / 0       | 1.00       | 942 | 0      |
| 明确矛盾            | refuted   | refuted → refuted      | 0 / 1 / 0       | 1.00       | 365 | 10     |
| 空证据              | unclear   | unclear → unclear      | 0 / 0 / 1       | 1.00       | 317 | 11     |
| 无关证据            | unclear   | unclear → unclear      | 0 / 0 / 1       | 1.00       | 371 | 11     |
| 部分支持的复合主张  | unclear   | unclear → unclear      | 0 / 0 / 1       | 0.99       | 336 | 11     |
| 复合主张的实质矛盾  | refuted   | refuted → refuted      | 0 / 1 / 0       | 1.00       | 351 | 10     |
| 土耳其语支持        | confirmed | confirmed → confirmed  | 1 / 0 / 0       | 0.99       | 308 | 0      |
| SQL 删除列          | refuted   | refuted → refuted      | 0 / 1 / 0       | 1.00       | 597 | 10     |
| 嵌入结论指令        | refuted   | refuted → refuted      | 0 / 1 / 0       | 1.00       | 360 | 10     |
| Confidence 阈值代码 | confirmed | confirmed → confirmed  | 0.99 / 0.01 / 0 | 0.98       | 335 | 0      |

十例全部符合预期：**3 confirmed、4 refuted、3 unclear**。全部 `failure: null`，无截断。报告的使用量合计 **5,151 输入 token、417 输出 token**。每条结果的 `totalTokens` 和 `costUsd` 保持 null，未推算美元成本。单次耗时 **308–942 ms**，这是一次运行，不是延迟基准或服务等级承诺。没有案例触发低 confidence 弃权；三个 unclear 均为 Jev 原生选择。阈值与并列由确定性契约测试覆盖。一条嵌入指令被成功忽略，不表示普遍抗注入能力已测量。概率 1 是模型输出，不是确定性证明。表格是编辑后的摘要；原始响应、凭据和私有运行记录不会提交。此前[文档/代码检查](jev.md)独立执行，不计入本页总量。

## 有意重现

无需密钥或请求即可预览证据和预期标签：

```sh
node scripts/live-jev-scenarios.mjs
```

所有者批准可能计费的调用后，在源码目录构建并运行：

```sh
npm run build
XERIFY_LIVE_CONFIRM_BILLABLE=YES node --env-file=.env scripts/live-jev-scenarios.mjs --live
```

Node 20.6+ 支持显式 env-file。运行器固定 jev-1.13.0，最多顺序执行十次评估，首次操作/认证失败即停止。临时配置关闭历史，忽略普通用户/项目配置，只将 TypeSafe 密钥传入 CLI 环境，绝不复制 .env。每请求超时 30 秒。选定的规范化元数据写入被忽略的 `.xerify/live-jev-scenarios/` 下仅所有者可读的时间戳文件，不写原始 HTTP 响应或证据。运行器退出码：全部匹配为 0，语义不符 11，未完成/操作失败 1，缺实时确认 2，缺密钥 3；各条验证退出码保留。语义不符应检查，而不是反复调用直到符合预期。正常检查、安装冒烟测试和发布操作不会运行此脚本。

## 在应用中解释故障

|                                       | CLI exit |                                                 |
| ------------------------------------- | -------- | ----------------------------------------------- |
| confirmed                             | 0        | 所给证据支持；检查范围                          |
| refuted                               | 10       | 选中了矛盾；检查主张                            |
| unclear, `failure: null`              | 11       | 证据不足/模糊或策略弃权；检查 decision 并补证据 |
| SAME_PROVIDER / PROVENANCE_UNPROVABLE | 2        | 修正声明身份；不发送评估                        |
| AUTH_UNAVAILABLE / 401 / 403          | 3        | 认证错误信封，不是验证结论；修正本地凭据        |
| TIMEOUT / CANCELLED                   | 4        | 操作性 unclear；不自动重试                      |
| PROVIDER_FAILURE                      | 5        | 操作性 unclear；可重试只是元数据                |
| INVALID_PROVIDER_RESPONSE             | 6        | 操作性 unclear；检查边界或提供方兼容性          |

通过 `failure` 区分操作故障与有意义的弃权。检查 `decision.choice`、所选概率、confidence 和策略，解释阈值弃权。更多使用与 MCP 示例见 [Jev 指南](jev.md)。
