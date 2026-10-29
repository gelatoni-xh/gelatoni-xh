<p align="right"><strong>English</strong> · <a href="./README.zh-CN.md">简体中文</a></p>

![Xu Huan — building clarity into complex systems](https://gelatoni-xh.github.io/gelatoni-xh/assets/header.png)

<div align="center">
  <p><strong>Backend engineering · Complex business workflows · Reliable change</strong></p>
  <p><a href="https://gelatoni.uk/articles">✦ Engineering writing</a> · <a href="https://tasukikeifu.com/ja">↗ Live product</a> · <a href="https://github.com/gelatoni-xh?tab=repositories">⌘ Code</a></p>
</div>

I’m **Xu Huan (Gelatoni)**, a software engineer with experience in enterprise HR data systems and cross-border payment products. I work across requirements, domain boundaries, backend implementation, testing, and rollout. My public repositories show independent work; much of my enterprise work is represented here through the problems I handled and the way I approached them, rather than employer-owned source code.

## Where I can help

| Need | Relevant experience |
| --- | --- |
| Evolve a system without breaking existing users | HR master-data migration, API consolidation, employment-model changes, and phased cutovers |
| Turn a broad business request into an implementable scope | Payment and billing designs that separate domain ownership, data flow, edge cases, and what is out of scope |
| Make a change testable and operable | Validation against requirements, regression paths, observability, migration planning, and release checks |
| Build a product and its supporting data workflows | [Tasuki Keifu](https://github.com/gelatoni-xh/tasuki-keifu) and its [live site](https://tasukikeifu.com/ja) |

## Enterprise delivery experience

### Ant Group · recruitment and HR systems (2023–2025)

I worked as a backend engineer across recruitment workflows and HR master data. The work covered business rules, data models, service boundaries, and changes to systems with many existing consumers:

- **Campus recruitment:** worked on configurable resume-assignment rules, including department hierarchy, rule priority, overlapping conditions, and conflict handling. Other work included interview scheduling model changes, batch scheduling, and adapting flows shared by campus and experienced hiring.
- **HR master-data migration and APIs:** worked on a staged migration involving more than 1,000 legacy interfaces. Compatibility routing, old/new behavior and data comparisons, traffic observation, and recovery planning helped protect upstream callers. I also worked on consolidating overlapping APIs toward roughly 200 domain-level interfaces; that number was a target, not a claim that every old API was retired.
- **Employment-plan decoupling:** worked on separating business-system input from master-data semantics. This involved tracing how multiple upstream systems generated employment plans and designing the boundaries for timeline calculation, conflict resolution, historical changes, and organization-structure derivation. The source notes include proposals as well as implementation work, so these design areas are not all claims of completed rollout.
- **Architecture and reliability:** worked on clearer domain, application, and infrastructure boundaries, alongside governance of service dependencies, messaging, scheduled jobs, caching, monitoring, and change safety. These were parts of a broader team program, not a claim that I personally delivered every item in the program.

This experience is most relevant when a client needs to change an established system: understand existing behavior, define ownership and scope, verify the new path, and plan a controlled release. The source code is employer-owned and is not published here.

### Payments · scope, fees, and cross-system flows

At a cross-border payments company (2026), I worked on Payment Links, fee and billing capabilities, and account-to-account payout flows. Implementation work visible in local history includes fee-record queries, payout fee allocation, and a merchant billing page. My design notes also trace money and account states across services, distinguish current behavior from proposed behavior, and specify scope, security, idempotency, monitoring, and regression cases.

**What this demonstrates:** I can clarify a business flow across services and turn it into explicit decisions and verification points. Some documents describe plans, so I do not present every proposed component as a shipped result. Employer-owned code and internal designs are not reproduced here.

## How I work on a delivery

![Delivery flow: clarify, design, verify, ship](https://gelatoni-xh.github.io/gelatoni-xh/assets/delivery-flow.png)

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

## Technology stack

| Area | Technologies and experience |
| --- | --- |
| Enterprise backend | **Java, Spring Boot**; service APIs, domain modeling, and integration across existing systems |
| Data and asynchronous workflows | Relational databases, SQL, RPC, message queues, caching, and scheduled jobs in enterprise systems |
| Independent products | **TypeScript, Next.js, React, PostgreSQL, Prisma**; data imports and application workflows |
| Delivery and operations | **Docker, GitHub Actions**; build checks, deployment, health checks, and observability |
| Agent workflows | **LangGraph** in [Tasuki Keifu Agent](https://github.com/gelatoni-xh/tasuki-keifu-agent) |

The enterprise systems used company-specific infrastructure. I describe those tools by their general function; the table does not imply that a named open-source equivalent was used there.

## Portfolio work in progress

- **Enterprise case studies:** concise, anonymized write-ups showing the starting problem, my exact role, decisions, validation, and what actually shipped.
- **Evidence for independent products:** screenshots, walkthroughs, and measured outcomes where they can be verified.
- **Contact and availability:** a direct route for relevant project inquiries and a clearer description of the assignments I take.

For now, you can [read the writing](https://gelatoni.uk/articles), [try the live product](https://tasukikeifu.com/ja), or [inspect the repositories](https://github.com/gelatoni-xh?tab=repositories).
