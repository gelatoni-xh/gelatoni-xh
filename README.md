<p align="right"><strong>English</strong> · <a href="./README.zh-CN.md">简体中文</a></p>

<div align="center">
  <img src="https://raw.githubusercontent.com/gelatoni-xh/gelatoni-xh/main/assets/header.png" alt="Xu Huan — enterprise systems, careful delivery, independent products" width="100%" />
  <p><strong>Backend engineering · Complex business workflows · Reliable change</strong></p>
  <p><a href="https://gelatoni.uk/articles">Writing</a> · <a href="https://tasukikeifu.com/ja">Live product</a> · <a href="https://github.com/gelatoni-xh?tab=repositories">Code</a></p>
</div>

I’m **Xu Huan (Gelatoni)**, a software engineer with experience in enterprise HR data systems and cross-border payment products. I work across requirements, domain boundaries, backend implementation, testing, and rollout. My public repositories show independent work; much of my enterprise work is represented here through the problems I handled and the way I approached them, rather than employer-owned source code.

## Where I can help

| Need | Relevant experience |
| --- | --- |
| Evolve a system without breaking existing users | HR master-data migration, compatibility layers, phased cutovers, and consistency checks |
| Turn a broad business request into an implementable scope | Payment and billing designs that separate domain ownership, data flow, edge cases, and what is out of scope |
| Make a change testable and operable | Validation against requirements, regression paths, observability, migration planning, and release checks |
| Build a product and its supporting data workflows | [Tasuki Keifu](https://github.com/gelatoni-xh/tasuki-keifu) and its [live site](https://tasukikeifu.com/ja) |

## Enterprise delivery experience

### HR master data · migration and API evolution

At Ant Group (2023–2025), I worked on backend systems serving employee and organization data. One major workstream involved migrating a legacy surface of more than 1,000 interfaces while maintaining compatibility for upstream consumers. The work called for staged routing, comparing old and new behavior and data, observing real traffic, and planning recovery when a cutover behaved differently than expected. I also worked on the move toward roughly 200 domain-level interfaces; that figure describes the consolidation target, not a claim that every old interface was retired.

**What this demonstrates:** I consider callers, historical behavior, data consistency, and rollback before treating a migration as complete. The source code is employer-owned and is not published here.

### Payments · scope, fees, and cross-system flows

At a cross-border payments company (2026), I worked on Payment Links, fee and billing capabilities, and account-to-account payout flows. Implementation work visible in local history includes fee-record queries, payout fee allocation, and a merchant billing page. My design notes also trace money and account states across services, distinguish current behavior from proposed behavior, and specify scope, security, idempotency, monitoring, and regression cases.

**What this demonstrates:** I can clarify a business flow across services and turn it into explicit decisions and verification points. Some documents describe plans, so I do not present every proposed component as a shipped result. Employer-owned code and internal designs are not reproduced here.

## How I work on a delivery

1. **Clarify the request.** Identify the user journey, existing behavior, data ownership, and unresolved decisions.
2. **Control the scope.** Write down what this release includes, what it leaves for later, and which existing paths must remain compatible.
3. **Design for failure as well as success.** Account for retries, partial completion, data consistency, rollback, and operational visibility.
4. **Verify against the requirement.** Derive cases from the original request, then check implementation, regressions, and the running service.
5. **Leave a handoff trail.** Document decisions, deployment steps, known limits, and follow-up work.

I use AI tools in parts of this workflow, with explicit context and constraints. I keep the judgment on business semantics, data boundaries, and final verification with the engineer responsible for the change.

## Writing and independent work

My [writing archive](https://gelatoni.uk/articles) contains engineering notes on migration, stability, product scope, payments, and AI-assisted development. Two starting points are [AI-assisted development in practice](https://gelatoni.uk/articles/2026-06-26-AI辅助研发模式回顾) and [stability as a systems and business problem](https://gelatoni.uk/articles/2026-03-02-稳定性). Some older articles discuss employer systems; I am reviewing which of them should remain public and which should become anonymized case studies.

| Public project | What you can inspect |
| --- | --- |
| [Tasuki Keifu](https://github.com/gelatoni-xh/tasuki-keifu) · [live](https://tasukikeifu.com/ja) | A Next.js and PostgreSQL running-data product, data imports, migrations, search, and deployment |
| [Tasuki Keifu Agent](https://github.com/gelatoni-xh/tasuki-keifu-agent) | Data-quality diagnosis, auditable actions, dry-run defaults, and safeguards around writes |
| [Personal site](https://github.com/gelatoni-xh/personal-site) · [live](https://gelatoni.uk) | Markdown publishing, build checks, Docker deployment, and a post-deploy health check |

**Tools used in these projects:** TypeScript, Next.js, React, PostgreSQL, Prisma, Docker, GitHub Actions, and LangGraph. My enterprise backend experience also includes service integration and data modeling; the project details above are the more useful evidence than a long technology list.

## Portfolio work in progress

- **Enterprise case studies:** concise, anonymized write-ups showing the starting problem, my exact role, decisions, validation, and what actually shipped.
- **Evidence for independent products:** screenshots, walkthroughs, and measured outcomes where they can be verified.
- **Contact and availability:** a direct route for relevant project inquiries and a clearer description of the assignments I take.

For now, you can [read the writing](https://gelatoni.uk/articles), [try the live product](https://tasukikeifu.com/ja), or [inspect the repositories](https://github.com/gelatoni-xh?tab=repositories).
