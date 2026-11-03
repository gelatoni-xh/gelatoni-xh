# Website traffic

The English and Chinese profile READMEs show Cloudflare **Web Analytics** page views and visits for `gelatoni.uk` and `tasukikeifu.com`, including their `www` hostnames.

- **Previous day:** the previous complete calendar day in `Asia/Shanghai`, from 00:00 inclusive to the following 00:00 exclusive.
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

## Daily email

After fetching and committing statistics successfully, the Action emails the same report using SMTP or Resend. No personal server is involved. If email delivery fails, the Action fails while the already published statistics remain available. A provider accepting a message does not guarantee inbox delivery; check spam on the first run.

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
