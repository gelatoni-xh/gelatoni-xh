# Service usage

The English and Chinese profile READMEs show Cloudflare **Web Analytics** page views and visits for `tasukikeifu.com`, including its `www` hostname, and daily subscriber snapshots and publication receipts for AI Product Radar and Steam Deals Radar.

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

## Telegram publishing channels

The channel publisher records the Bot API `getChatMemberCount` result and the daily publication receipt for each channel. The profile workflow also collects a current subscriber snapshot when it builds the report. The public report contains the date, subscriber count, item count, status, sent timestamp and message link only. Daily snapshots begin when this integration is deployed; earlier subscriber counts are unavailable and remain `null`. The publisher's existing receipts can populate earlier publication status and item counts where present.

The profile workflow reads a fixed aggregate query through a dedicated SSH key restricted to `deploy/export-channel-stats.sh`; it does not receive a database password or Telegram bot token. The query exposes only channel/date-level aggregates, not post text, source candidates, or user data. Missing or invalid data fails the refresh instead of becoming zero. Snapshots are retained in `history/` for trend inspection.

Telegram Bot API does not expose channel post view counts, so this report does not show them. Channel subscriber count is a point-in-time daily snapshot and is not a unique-user or engagement metric.

Daily profile and email reports include website analytics and the two Telegram publishing channels. They do not collect or display Telegram bot usage statistics. Channel subscriber counts and publication receipts continue to come from the channel statistics export described above.

## Daily email

After fetching and committing statistics successfully, the Action emails the same website and channel report using SMTP or Resend. If an earlier workflow step fails, it sends a separate failure notice with the failed step and Actions run link; the notice does not include raw logs or statistics. Both email paths use `MAIL_CONFIG`. Collection and email run in GitHub Actions. If email delivery fails, the Action fails while the already published statistics remain available. A provider accepting a message does not guarantee inbox delivery; check spam on the first run.

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

[`products.json`](./products.json) defines public product keys, names, links and collection types. Both profile READMEs and the email iterate this registry in order, producing one independent section per product. Counts are never added across products or different definitions. `traffic.json` includes `reportDate` and the public product descriptors to keep all renderers aligned. Older history files may contain bot statistics from before bot reporting was removed.

For another website using the same Cloudflare account, add a `website` entry with `domain`. Other product types require a collector and validator that expose only approved aggregate data.
