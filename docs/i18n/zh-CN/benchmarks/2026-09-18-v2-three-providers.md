# 跨提供方结果: 2026-09-18

`xerify-cross-provider-v2` · [方法与限制](../benchmark.md) · [派生测量](../../../benchmarks/2026-09-18-v2-three-providers.json)

不发布原始响应。按所有者要求选择三提供方子集：历史 144 次测量中的 72 次；排除 Cursor 方向，未重新调用。

| 方向                  | 匹配 / 尝试 | 跳过 | 有效 | 失败 | 上下文匹配 / 尝试 | 错误 confirmed | 多余 unclear | 有效 p50 / p95 ms | 输入 token（覆盖） | 输出 token（覆盖） | USD（覆盖）                |
| --------------------- | ----------- | ---- | ---- | ---- | ----------------- | -------------- | ------------ | ----------------- | ------------------ | ------------------ | -------------------------- |
| openai-to-anthropic   | 10/12       | 0    | 12   | 0    | 8/9               | 0              | 2            | 73055 / 108271    | 178924 (12/12)     | 36477 (12/12)      | 2.6223577500000004 (12/12) |
| openai-to-typesafe    | 12/12       | 0    | 12   | 0    | 9/9               | 0              | 0            | 794 / 1392        | 7375 (12/12)       | 500 (12/12)        | — (0/12)                   |
| anthropic-to-openai   | 10/12       | 0    | 12   | 0    | 8/9               | 0              | 2            | 11296 / 19177     | 191012 (12/12)     | 2369 (12/12)       | — (0/12)                   |
| anthropic-to-typesafe | 12/12       | 0    | 12   | 0    | 9/9               | 0              | 0            | 766 / 1074        | 7375 (12/12)       | 500 (12/12)        | — (0/12)                   |
| typesafe-to-openai    | 10/12       | 0    | 12   | 0    | 8/9               | 0              | 2            | 10957 / 13510     | 191006 (12/12)     | 2241 (12/12)       | — (0/12)                   |
| typesafe-to-anthropic | 10/12       | 0    | 12   | 0    | 8/9               | 0              | 2            | 77798 / 129163    | 177060 (12/12)     | 32718 (12/12)      | 2.7045484999999996 (12/12) |

操作故障即使返回 unclear 也降低交付成功率。有效延迟分位数排除失败调用；失败耗时在 JSON 单独列出。缺失用量或费用表示未知，不是零。无报告覆盖时不能比较美元成本。

## 场景矩阵

| 场景                | 预期      | openai-to-anthropic | openai-to-typesafe | anthropic-to-openai | anthropic-to-typesafe | typesafe-to-openai | typesafe-to-anthropic |
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

这是与合成标签的比较，不是生产准确率估计。Schema 错误衡量契约交付失败，不能说明无法解析答案是否正确。不同声明来源下对同一目标的重复调用使用相同模型输入。下结论前应检查不符项。
