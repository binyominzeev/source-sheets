# Source Sheets

A simplified Sefaria source sheet reader built with Next.js.

## Features

- **User sheet listing**: Browse all source sheets by a Sefaria user at `/:username`
- **Claimable user tags**: A rabbi can claim a public user tag and map it to their Sefaria profile
- **Single active tag per rabbi**: Each Sefaria profile can have one active claimed user tag at a time
- **Tag change support**: Claimed accounts can move to a different user tag with password confirmation
- **Legacy tag redirect**: Old claimed tags automatically redirect to the latest claimed tag
- **Sefaria bio verification**: Claiming requires placing a proof code in the Sefaria bio
- **Password auth + persistent login**: Claimed user tags support password sign-in with a long-lived session cookie
- **Sheet reader**: Read individual sheets at `/sheets/:sheetId`
- **Sheet permalinks**: Imported sheets can get user-owned slug URLs at `/:username/:sheetSlug`
- **Bilingual support**: Toggle between English, Hebrew, and both via `?lang=bi|en|he`
- **Table of Contents**: Wikipedia-style TOC in the upper right corner with internal anchor links
- **Responsive design**: Works on all screen sizes
- **Print-friendly**: Clean print view with TOC and hidden navigation elements

## URL Structure

| URL | Description |
|-----|-------------|
| `/` | Homepage |
| `/:username` | List all sheets for a Sefaria user (e.g. `/binyomin-szanto-varnagy`) |
| `/:username/:sheetSlug` | Claimed permalink for an imported sheet (e.g. `/binjomin/szuka-maamid`) |
| `/sheets/:sheetId` | View a specific sheet (e.g. `/sheets/713930`) |
| `/sheets/:sheetId?lang=bi` | View with bilingual (English + Hebrew) text |
| `/sheets/:sheetId?lang=en` | View with English text only |
| `/sheets/:sheetId?lang=he` | View with Hebrew text only |

## Authentication Setup

Set a strong session signing secret in your environment:

```bash
AUTH_SECRET="replace-with-a-long-random-secret"
```

Without `AUTH_SECRET`, claim/login endpoints cannot create sessions.

## Slug Permalink Workflow

- Existing imported sheets keep working via ID route (`/sheets/:sheetId?from=:username`).
- Owner can open a sheet and save an automatic slug or custom slug.
- Once saved, list links switch to `/:username/:sheetSlug`.
- Slugs are unique per user tag and editable by the owner.

## User Guide (Practical, 5-Minute Setup)

No coding required. If you can open your Sefaria sheets, you can set this up.

### Why this is useful

- Share your Torah content with clean, memorable URLs instead of long technical links.
- Keep your sheet list in one place under your own user tag.
- Import unlisted/private sheets (with direct link) so your page can still organize and surface them.
- Offer a cleaner reading experience with print mode, bilingual text options, and table of contents.
- Keep continuity when you rename your public tag: old claimed tags redirect automatically.

### 1) Open your user page

- Go to `/:username` (your intended public tag), for example: `/myshiurim`.
- If this tag is unclaimed, you can claim it from that page.

### 2) Claim your user tag (one-time)

- Click **Login** on your `/:username` page.
- In **Claim this user tag**, enter your Sefaria profile slug.
- Add a unique proof code to your Sefaria bio.
- Paste the same proof code and set a password.
- Submit the claim form.

After this, you are signed in as the owner of that tag.

### 3) Import sheets from Sefaria

- While signed in, click **+ Import Sheets**.
- Paste one or more Sefaria sheet URLs or numeric sheet IDs.
- Use one per line or comma-separated values.
- Submit import.

Notes:
- Duplicate IDs are safely ignored.
- Import errors are shown per input line.
- Newly imported sheets appear immediately on your list.

### 4) Manage your sheet URLs (permalinks)

- Open a sheet from your list.
- Click **Permalink** (owner-only panel).
- Choose **Save automatic slug** for a quick default, or **Save custom slug** for manual URL text.
- Copy the permalink and share it.

Result: your public link becomes `/:username/:sheetSlug`, while the original ID route still works as a fallback.

### 5) Change your public tag later (without losing work)

- Go to the new `/:username` you want.
- In **Already claimed another tag?**, enter your current claimed tag and current password.
- Click **Move claim here**.

Your imported sheet list moves with you, and old claimed tag URLs redirect to the new one.

### Day-to-day workflow

- Keep using your Sefaria workflow as usual.
- Use **Refresh** to sync current public sheets.
- Use **+ Import Sheets** for specific IDs/URLs you want to manage here.
- Use permalink slugs for the links you share most often.

## Development

```bash
npm install
npm run dev
```

## Tech Stack

- [Next.js 16](https://nextjs.org/) with App Router
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Sefaria API](https://www.sefaria.org/developers)

## API Endpoints Used

- `GET /api/profile/:username` — Fetch user profile (to get user ID)
- `GET /api/sheets/user/:userId` — Fetch all sheets for a user
- `GET /api/sheets/:sheetId` — Fetch a single sheet with all sources
