<p align="right"><a href="./README.md">English</a> · <strong>简体中文</strong></p>

![徐涣：让复杂系统中的需求与交付更清晰](https://gelatoni-xh.github.io/gelatoni-xh/assets/header.zh-CN.png)

<div align="center">
  <p><strong>后端工程 · 复杂业务流程 · 稳妥的系统变更</strong></p>
  <p><a href="https://gelatoni.uk/articles">✦ 技术文章</a> · <a href="https://tasukikeifu.com/ja">↗ 线上产品</a> · <a href="https://github.com/gelatoni-xh?tab=repositories">⌘ 代码仓库</a></p>
</div>

我是**徐涣（Gelatoni）**，有企业人事主数据系统和跨境支付产品的开发经历。我会从需求、领域边界、后端实现、测试验证一直考虑到上线。公开仓库展示的是我的独立项目；企业工作更多通过我处理过的问题和工作方式来说明，而不是公开原公司的代码。

## 我能帮助解决什么问题

| 需求 | 相关经历 |
| --- | --- |
| 演进系统，同时保持既有用户的使用方式 | HR 主数据搬迁、兼容层、分阶段切流、一致性校验 |
| 把宽泛的业务需求收敛为可实施范围 | 支付和计费方案中的职责边界、数据流、边缘情况与范围排除 |
| 让变更可验证、可运维 | 从需求导出用例、回归路径、可观测性、迁移与发布检查 |
| 独立构建产品与数据工作流 | [Tasuki Keifu](https://github.com/gelatoni-xh/tasuki-keifu) 及其[线上站点](https://tasukikeifu.com/ja) |

## 企业交付经历

### HR 主数据：系统搬迁与接口演进

在蚂蚁集团（2023–2025），我参与员工与组织数据相关后端系统建设。其中一条重要工作主线，是在保持上游调用兼容的前提下迁移 1000 多个历史接口。工作涉及分阶段路由、新旧行为和数据比对、真实流量观察，以及切流异常时的恢复方案。我也参与朝约 200 个领域接口收敛的工作；这里的数字是收敛目标，不表示所有旧接口都已下线。

**体现的能力：** 在认定迁移完成前，先考虑调用方、历史行为、数据一致性与回滚。相关代码属于原公司，这里不公开。

### 支付业务：范围、计费与跨系统流程

在一家跨境支付公司（2026），我参与 Payment Links、计费与账单能力，以及账户间出款流程。本地提交历史能看到费用记录查询、出款费用分摊和商户账单页面等实现工作。我的方案笔记还梳理跨服务的资金与账户状态，区分现状与目标，并写清范围、安全、幂等、监控和回归检查点。

**体现的能力：** 把跨服务业务流程澄清为明确的设计决策和验证点。部分文档记录的是方案，因此我不会把每个规划中的组件都写成已经上线的成果。这里不复制原公司代码和内部方案。

## 我怎样推进交付

![交付流程：澄清、设计、验证、上线](https://gelatoni-xh.github.io/gelatoni-xh/assets/delivery-flow.zh-CN.png)

1. **澄清需求。** 找到用户流程、既有行为、数据归属和待确认决策。
2. **控制范围。** 写明本期包含什么、后续再做什么、哪些旧链路必须保持兼容。
3. **考虑失败路径。** 处理重试、部分完成、数据一致性、回滚和运维可见性。
4. **对照需求验证。** 从原始需求生成用例，再检查实现、回归影响和运行状态。
5. **留下交接依据。** 记录决策、部署步骤、已知限制与后续工作。

我会在这些环节使用 AI 工具，同时明确上下文和约束。业务语义、数据边界与最终验收仍由负责变更的工程师判断。

## 文章与独立项目

[文章归档](https://gelatoni.uk/articles)记录了我对迁移、稳定性、产品范围、支付业务和 AI 辅助研发的思考。可以从[AI 辅助研发模式回顾](https://gelatoni.uk/articles/2026-06-26-AI辅助研发模式回顾)与[稳定性专题](https://gelatoni.uk/articles/2026-03-02-稳定性)开始。部分旧文涉及原公司的系统；我正在检查哪些适合继续公开，哪些需要改写为匿名案例。

| 公开项目 | 可以核对的内容 |
| --- | --- |
| [Tasuki Keifu](https://github.com/gelatoni-xh/tasuki-keifu) · [线上站点](https://tasukikeifu.com/ja) | 基于 Next.js 和 PostgreSQL 的跑步数据产品、数据导入、迁移、搜索与部署 |
| [Tasuki Keifu Agent](https://github.com/gelatoni-xh/tasuki-keifu-agent) | 数据质量诊断、可审计操作、默认试运行与写入保护 |
| [个人站点](https://github.com/gelatoni-xh/personal-site) · [线上站点](https://gelatoni.uk) | Markdown 发布、构建检查、Docker 部署与部署后健康检查 |

**这些项目使用的技术：** TypeScript、Next.js、React、PostgreSQL、Prisma、Docker、GitHub Actions、LangGraph。企业后端工作还涉及服务集成与数据建模；上面的项目细节比一长串技术名更能说明我的工作。

## 正在补齐的作品集内容

- **企业案例：** 匿名写明起点问题、我的准确职责、关键决策、验证方式和实际落地范围。
- **独立产品证据：** 截图、演示过程，以及能够核实的结果数据。
- **合作入口：** 直接联系方式和更明确的承接任务范围。

现阶段可以[阅读文章](https://gelatoni.uk/articles)、[体验线上产品](https://tasukikeifu.com/ja)，或[查看代码仓库](https://github.com/gelatoni-xh?tab=repositories)。
