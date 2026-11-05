# Service usage

The English and Chinese profile READMEs show Cloudflare **Web Analytics** page views and visits for `tasukikeifu.com`, including its `www` hostname, alongside Telegram activity for Remote Job Radar and JAVIndexBot.

- **Previous day:** the previous complete calendar day in `Asia/Shanghai`, from 00:00 inclusive to the following 00:00 exclusive.
- **Day before previous:** the complete Shanghai calendar day before yesterday. Both days are fetched in the same run. Each metric shows yesterday minus the prior day and its percentage of the prior day; a nonzero value after zero is labelled as a zero baseline with no percentage, and zero to zero is 0%. Current account totals have no historical comparison.
- **Last 30 days:** the 30 complete Shanghai calendar days ending with the previous day, rather than a calendar month. Each day is queried separately and summed, because Cloudflare can apply coarser sampling to broader queries.
- **Page views:** browser page load events from `rumPageloadEventsAdaptiveGroups.count`. Browser tracking can miss visits because of blocked scripts or failed page loads.
- **Visits:** `sum.visits`, defined by Cloudflare as page views initiated from a different website (the referrer hostname differs). This is not a unique-user count or a GA4 session count.
- Cloudflare uses adaptive sampling. The API already returns estimated counts; the script does not multiply them by the sample interval. `sampled` flags returned groups with a sample interval above one. An empty result means no recorded events, which cannot by itself prove that tracking is healthy.

[`traffic.json`](./traffic.json) contains the latest totals. [`history/`](./history/) preserves each update's 30 daily breakdowns and totals. Historical estimates can change when queried again, so these snapshots record what was available on each update date. Web Analytics has no data from before tracking was installed.

The workflow runs at **00:00 UTC / 08:00 Asia/Shanghai** daily and supports manual runs. GitHub may delay scheduled jobs. In public repositories GitHub can disable scheduled workflows after 60 days without repository activity; check the Actions tab if updates stop. Failures leave committed statistics intact and appear in GitHub Actions.

## Configuration

- Repository secret: `CLOUDFLARE_API_TOKEN`, with **Account → Account Analytics → Read** on the relevant Cloudflare account.
- Repository variable: `CLOUDFLARE_ACCOUNT_ID`.
- Workflow permission: `contents: write`, used to commit statistics and update the two READMEs.

All statistics and snapshots are public. The token remains in GitHub Actions Secrets and is never written into these files.

## Telegram business activity

The same daily update adds **Remote Job Radar** to both profile READMEs and the email. Website browser views and Telegram user activity are separate metrics. Bot figures include previous-day and day-before-previous new users, unique active users and processed interactions with absolute and percentage changes; seven complete days of new users, unique active users and interactions; and current registered users and users with enabled alerts. The fourteen complete daily rows are preserved in the public snapshot. Seven-day active users are deduplicated across the entire interval, not summed from daily active users. Do not compare this seven-day period to website thirty-day totals directly.

The bot excludes its administrator from all figures. Interactions count completed private-chat messages and buttons, including navigation; retries are deduplicated by Telegram update ID. Automatic digests are not user activity. Globally paused, unreachable, or individually paused subscriptions do not qualify for enabled-alert users. Deleted accounts are excluded, so past counts can decrease. Zero indicates no observed activity, not proof of uptime.

With `STATS_EXPORT_ENABLED=true` in the bot's protected runtime configuration, the bot maintains **one private, silent, pinned snapshot message** in the administrator chat. It updates after Shanghai midnight and persists its message pointer so normal retries edit the existing message. Keep that message pinned. `/stats` still returns the administrator's on-demand report. The export contains only aggregates, no user IDs or message content.

This repository uses Secrets `TELEGRAM_STATS_BOT_TOKEN` and `TELEGRAM_STATS_CHAT_ID` to call Telegram Bot API `getChat` and read that pinned message. No SSH, production database connection, personal server HTTP endpoint, user-session client, or `getUpdates` polling is used. The bot's webhook continues receiving normal updates. The bot token grants bot-level control: keep it only in repository Secrets and never publish it. The chat ID is also kept private.

The reader verifies the chat and publishing bot, versioned schema, exact previous Shanghai date, generation time, daily continuity and counts. Only an explicit aggregate field allowlist enters public JSON/Markdown. Missing, replaced, stale or invalid snapshots fail before any statistics files are written; they never become fake zeros. The daily email is sent only after a successful refresh. The export is a generation-time snapshot; delayed interactions or subsequent account deletions can revise later snapshots. The collection job fetches both Cloudflare and Telegram before publishing either. To stop integration, disable the bot export, remove its Telegram message and remove the two repository Secrets.

## Daily email

After fetching and committing statistics successfully, the Action emails the same website and Telegram report using SMTP or Resend. The collection and email job runs in GitHub Actions and accesses the Telegram snapshot via Telegram API. If email delivery fails, the Action fails while the already published statistics remain available. A provider accepting a message does not guarantee inbox delivery; check spam on the first run.

Set the repository secret `MAIL_CONFIG` to one of these JSON objects (replace the example credentials and addresses):

SMTP with implicit TLS on port 465, or STARTTLS on port 587:

```json
{"provider":"smtp","host":"smtp.example.com","port":465,"username":"sender@example.com","password":"SMTP_APP_PASSWORD","from":"sender@example.com","to":"recipient@example.com"}
```

Resend with an authorized sender:

```json
{"provider":"resend","api_key":"RESEND_API_KEY","from":"Reports <reports@verified.example.com>","to":"recipient@example.com"}
```

Until `MAIL_CONFIG` is configured, the Action skips sending and records a notice. Both scheduled and manual runs send email once configured. To preview the report without sending:

```sh
python3 scripts/send-traffic-email.py --preview
```

## Product registry and adding services

[`products.json`](./products.json) defines public product keys, names, links, collection types and Telegram secret prefixes. Both profile READMEs and the email iterate this registry in order, producing one independent section per product. Counts are never added across products or different definitions. `traffic.json` includes `reportDate` and the public product descriptors to keep all renderers aligned. Existing `sites`, `businesses` and historical snapshots remain readable.

For another website using the same Cloudflare account, add a `website` entry with `domain`. For another bot exporting the metadata aggregate contract, add a `telegram` entry with `service`, snapshot text `prefix`, `secretPrefix`, public name and link. Configure its `<PREFIX>_BOT_TOKEN` / `<PREFIX>_CHAT_ID` Secrets and pass them to the collection step in the workflow. A different snapshot contract needs a validating adapter; only aggregate allowlisted fields can be published.

### JAVIndexBot

The private `telegram-metadata` repository now exposes administrator-only `/stats` and updates a silent pinned aggregate snapshot every five minutes. The profile collector reads it via Telegram `getChat`, using `METADATA_STATS_BOT_TOKEN` and `METADATA_STATS_CHAT_ID`. It never connects to the production database or server. The pin must belong to this bot and match the expected Shanghai date; missing/stale/invalid data fails the update rather than publishing zeros.

Daily metrics are new users, unique active users, handled interactions, and upstream search attempts (initial query, filters and pagination; provider failures count as attempts). Telegram retries share an update ID and count once. Administrator activity and automatic messages are excluded. Seven-day active users are deduplicated across the entire interval. Registered totals and new users derive from existing user records; interaction tracking begins at `trackingSince`.

Days before installation and the partial installation day have `null` interactions/active/searches. Incomplete weekly metrics also remain `null`, displayed as **— / unavailable**, not zero. New-user history can be available earlier because account creation timestamps already existed. The portfolio includes only aggregates, no IDs, user messages, search terms or provider results. A zero value alone does not prove service health.
