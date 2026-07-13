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
