# 准确率记录

## 评测结果

数据集：DataBench 完整表（`databench`），共 **1,789 题**，排除 `080_Books`。准确率为答对题数除以总题数，缺失答案计入分母。

| 评测条件 | 模型 | 评测时间 | 答对 / 答错 / 缺失 | 准确率 | 平均耗时 / 题 | 平均 token / 题 | 原始报告 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **AVA Agent + AVA Skill** | GLM 5.1 | 2026-09-29 13:38:20 | 1511 / 275 / 3 | 84.46% | 40.93 秒 | 23384 | [报告](reports/2026-09-29-ava-agent-skill-glm-5.1.json) |
| **Sive Workflow + direct strategy** | GLM 5.1 | 2026-09-24 07:50:30 | 1511 / 276 / 2 | 84.46% | 18.44 秒 | 903 | [报告](reports/direct-glm-5.1.json) |
| **Sive Workflow + direct strategy + profile** | GLM 5.1 | 2026-09-24 07:50:30 | 1550 / 238 / 1 | 86.64% | 20.48 秒 | 2315 | [报告](reports/direct-profile-glm-5.1.json) |
| **Sive Workflow + subset strategy + profile** | GLM 5.1 | 2026-09-24 07:50:30 | 1551 / 236 / 2 | 86.70% | 25.42 秒 | 1173 | [报告](reports/subset-profile-glm-5.1.json) |
| **Sive Workflow + loop strategy** | GLM 5.1 | 2026-09-22 11:17:04 | 1504 / 283 / 2 | 84.07% | 82.52 秒 | 5089 | [报告](reports/loop-glm-5.1.json) |
