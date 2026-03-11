# Source Sheets

A simplified Sefaria source sheet reader built with Next.js.

## Features

- **User sheet listing**: Browse all source sheets by a Sefaria user at `/:username`
- **Sheet reader**: Read individual sheets at `/sheets/:sheetId`
- **Bilingual support**: Toggle between English, Hebrew, and both via `?lang=bi|en|he`
- **Table of Contents**: Wikipedia-style TOC in the upper right corner with internal anchor links
- **Responsive design**: Works on all screen sizes
- **Print-friendly**: Clean print view with TOC and hidden navigation elements

## URL Structure

| URL | Description |
|-----|-------------|
| `/` | Homepage |
| `/:username` | List all sheets for a Sefaria user (e.g. `/binyomin-szanto-varnagy`) |
| `/sheets/:sheetId` | View a specific sheet (e.g. `/sheets/713930`) |
| `/sheets/:sheetId?lang=bi` | View with bilingual (English + Hebrew) text |
| `/sheets/:sheetId?lang=en` | View with English text only |
| `/sheets/:sheetId?lang=he` | View with Hebrew text only |

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
