# Meadow Robynn Template Migration Notes

This clone prepares `madhukarkumar/a-meadowapt` for the Robynn website template contract without modifying the Robynn workspace repos.

## What changed

- Replaced the single static `app/page.tsx` entry with `app/[[...slug]]/page.tsx`.
- Moved editable site/page content into:
  - `content/site.json`
  - `content/pages/home--42099b4a.json`
  - `content/pages/blog--77640d38.json`
- Added JSON-backed rendering for the existing Meadow sections while preserving the current visual structure and public assets.
- Added `RobynnWebhookForm` with webhook support via `NEXT_PUBLIC_ROBYNN_WEBHOOK_URL` and mailto fallback.
- Added a `legacy-html` section renderer for imported pages/blogs that are not yet structured.
- Added Robynn scripts:
  - `npm run validate`
  - `npm run create-page -- /route/ "Page title"`
  - `npm run robynn:bundle`

## Generated bundle

`npm run robynn:bundle` writes:

- `.robynn/site-bundle/manifest.json`
- `.robynn/site-bundle/snapshots/*.html`

The generated bundle currently includes `/` and `/blog/`, JSON-path editable targets, and the tour request form manifest.

## Remaining manual steps

1. Review `content/site.json` and set the final canonical production URL if it differs from `https://a-meadowapt.vercel.app`.
2. Decide whether `/blog/` should be published now or kept as a contract/convention placeholder.
3. Push these changes to `madhukarkumar/a-meadowapt` from this clone or copy them into an authorized checkout.
4. After pushing, run `npm run robynn:bundle` in the published branch so Robynn can ingest the current manifest and snapshots.

## Commands verified locally

- `npm ci`
- `npm run validate`
- `npm run robynn:bundle`
- `npm run lint`
- `npm run build`
