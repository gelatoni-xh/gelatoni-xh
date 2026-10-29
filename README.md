<p align="right"><strong>English</strong> · <a href="./README.zh-CN.md">简体中文</a></p>

<div align="center">
  <img src="./assets/header.svg" alt="Xu Huan — web applications, data systems, and dependable delivery" width="100%" />

  <p><strong>Web applications · Data workflows · Responsible automation</strong></p>
  <p><a href="https://tasukikeifu.com/ja">Explore a live product</a> · <a href="https://github.com/gelatoni-xh?tab=repositories">Browse code</a> · <a href="https://gelatoni.uk">Read my writing</a></p>
</div>

I’m **Xu Huan (Gelatoni)**. I turn loosely defined ideas into working software, with attention to scope, data quality, verification, and deployment. My independent projects focus on full-stack TypeScript products and the tools needed to operate them.

> **For prospective collaborators:** the projects below show real code and delivery decisions. Each case links to its repository; the live products are linked where available.

## Start here

| If you need… | See this work | What it demonstrates |
| --- | --- | --- |
| A data-rich web product | [Tasuki Keifu](https://github.com/gelatoni-xh/tasuki-keifu) · [live site](https://tasukikeifu.com/ja) | Product scope, data modeling, imports, search, deployment |
| Safer data automation | [Tasuki Keifu Agent](https://github.com/gelatoni-xh/tasuki-keifu-agent) | Diagnosis flows, dry runs, risk holds, audit records |
| A maintainable publishing site | [Personal site](https://github.com/gelatoni-xh/personal-site) · [live site](https://gelatoni.uk) | Markdown publishing, build checks, Docker deployment |

## Featured case · Tasuki Keifu

**The problem.** Japanese distance-running records span athletes, schools, organizations, and competitions. Connecting those records requires more than a set of pages: names, affiliations, results, and sources need a consistent model.

**What I built.** A Next.js site backed by PostgreSQL and Prisma, with athlete, organization, and competition pages; race import and maintenance scripts; multilingual page foundations; and search discovery features. Product requirements and technical plans in the project documents track how the scope evolved.

**How I checked and shipped it.** The repository’s GitHub Actions workflow installs dependencies, generates the Prisma client, runs type checks and linting, builds the app, deploys a Docker image, applies migrations, and checks the running site. Data imports are a separate operational path rather than a production seed step.

**Inspect it:** [live product](https://tasukikeifu.com/ja) · [source repository](https://github.com/gelatoni-xh/tasuki-keifu) · [deployment notes](https://github.com/gelatoni-xh/tasuki-keifu/blob/main/deploy/README.md)

> **Case study additions in progress:** annotated screenshots, a short walkthrough of one import, and a measured before/after example. No performance or traffic numbers are claimed yet.

## Two related builds

| Tasuki Keifu Agent | Personal site |
| --- | --- |
| A companion service for diagnosing ambiguous or inconsistent records. LangGraph workflows produce findings and proposed actions. Batch runs default to a dry run; business-data writes require explicit settings, while high-risk cases can be held for review. The repo includes smoke checks for key graph paths and write actions. | A small publishing site for Markdown articles and a resume. Its workflow type-checks and builds the app, transfers a Docker image to an Ubuntu host, starts it with Compose, and checks the articles endpoint. |
| [Read the code →](https://github.com/gelatoni-xh/tasuki-keifu-agent) | [Visit the site →](https://gelatoni.uk) · [Read the code →](https://github.com/gelatoni-xh/personal-site) |

## How I work

| Stage | Practice visible in these projects |
| --- | --- |
| **Define** | Write down version scope, data boundaries, and technical decisions before adding features. |
| **Build** | Keep application code, data imports, migrations, and maintenance tasks distinct. |
| **Verify** | Use type checks, linting, builds, focused smoke checks, and deployment checks where appropriate. |
| **Operate** | Document deployment, preserve audit trails, and put explicit safeguards around automated writes. |

**Working stack shown here:** TypeScript · Next.js · React · PostgreSQL · Prisma · Docker · GitHub Actions · LangGraph

## What I’m building out next

- **Visual case studies:** screenshots and concise decision logs for the three projects above.
- **Evidence:** measurements and outcomes where they can be verified and disclosed.
- **Collaboration details:** a direct contact route and a short description of the types of assignments I’m taking.

Until then, [my repositories](https://github.com/gelatoni-xh?tab=repositories) and [personal site](https://gelatoni.uk) are the best places to explore the work.
