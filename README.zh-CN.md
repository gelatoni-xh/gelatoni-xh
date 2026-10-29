<p align="right"><a href="./README.md">English</a> · <strong>简体中文</strong></p>

<div align="center">
  <img src="./assets/header.svg" alt="徐涣：Web 应用、数据系统与可靠交付" width="100%" />

  <p><strong>Web 应用 · 数据工作流 · 审慎的自动化</strong></p>
  <p><a href="https://tasukikeifu.com/ja">查看线上产品</a> · <a href="https://github.com/gelatoni-xh?tab=repositories">浏览代码</a> · <a href="https://gelatoni.uk">阅读文章</a></p>
</div>

我是**徐涣（Gelatoni）**。我会把尚未完全明确的想法逐步落实为可运行的软件，重视范围界定、数据质量、验证和部署。近期独立项目主要围绕 TypeScript 全栈产品及其运行所需的工具。

> **给潜在合作者：**下方项目展示真实代码与交付决策。每个案例都链接到仓库；有线上产品的也提供访问入口。

## 从这里开始

| 如果你需要…… | 可以看 | 展示的能力 |
| --- | --- | --- |
| 数据量较丰富的 Web 产品 | [Tasuki Keifu](https://github.com/gelatoni-xh/tasuki-keifu) · [线上站点](https://tasukikeifu.com/ja) | 版本范围、数据建模、导入、搜索与部署 |
| 更稳妥的数据自动化 | [Tasuki Keifu Agent](https://github.com/gelatoni-xh/tasuki-keifu-agent) | 诊断流程、试运行、风险拦截与审计记录 |
| 易维护的内容站点 | [个人站点](https://github.com/gelatoni-xh/personal-site) · [线上站点](https://gelatoni.uk) | Markdown 发布、构建检查与 Docker 部署 |

## 重点案例 · Tasuki Keifu

**问题。** 日本长跑和驿传资料涉及选手、学校、所属组织与赛事。要把分散记录连接起来，除了页面，还需要一致地处理名称、所属、成绩与来源。

**我做了什么。** 使用 Next.js、PostgreSQL 和 Prisma 构建站点，包括选手、组织和赛事页面，赛事数据导入及维护脚本，多语言页面基础，以及搜索发现相关功能。项目文档中的需求与技术方案记录了版本范围如何逐步演进。

**如何验证和交付。** 仓库的 GitHub Actions 工作流安装依赖、生成 Prisma Client、执行类型检查和 lint、构建应用、部署 Docker 镜像、应用数据库迁移，并检查运行中的站点。业务数据导入走单独的运维流程，不在生产部署时执行 seed。

**查看依据：**[线上产品](https://tasukikeifu.com/ja) · [源码仓库](https://github.com/gelatoni-xh/tasuki-keifu) · [部署说明](https://github.com/gelatoni-xh/tasuki-keifu/blob/main/deploy/README.md)

> **案例仍在完善：**计划补充带标注的截图、一次数据导入的简要过程，以及有依据的前后对比。目前不声称具体性能或流量成果。

## 两个相关项目

| Tasuki Keifu Agent | 个人站点 |
| --- | --- |
| 为 Tasuki Keifu 诊断模糊或不一致数据的配套服务。LangGraph 流程产出问题发现与建议操作。批处理默认试运行；写入业务数据需要显式开启，高风险案例可留待人工复核。仓库包含关键流程与写动作的 smoke checks。 | 使用 Markdown 文章和简历内容的小型站点。部署工作流执行类型检查与构建，将 Docker 镜像传到 Ubuntu 主机，使用 Compose 启动，并检查文章入口。 |
| [查看代码 →](https://github.com/gelatoni-xh/tasuki-keifu-agent) | [访问站点 →](https://gelatoni.uk) · [查看代码 →](https://github.com/gelatoni-xh/personal-site) |

## 我的工作方式

| 阶段 | 在项目中可以看到的做法 |
| --- | --- |
| **界定** | 扩展功能前记录版本范围、数据边界与技术决策。 |
| **实现** | 将应用代码、数据导入、迁移和维护任务分开。 |
| **验证** | 根据项目使用类型检查、lint、构建、针对性的 smoke checks 和部署检查。 |
| **运维** | 记录部署过程、保留审计线索，并为自动写入设置显式保护。 |

**这些项目使用的技术：**TypeScript · Next.js · React · PostgreSQL · Prisma · Docker · GitHub Actions · LangGraph

## 后续要补充的内容

- **可视化案例：**三个项目的截图和简洁的决策记录。
- **可核实的结果：**在能够验证且适合公开时，补充指标与实际成果。
- **合作入口：**直接联系方式，以及希望承接的具体任务类型。

现阶段可以先查看[我的仓库](https://github.com/gelatoni-xh?tab=repositories)和[个人站点](https://gelatoni.uk)。
