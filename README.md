# NEXUS MD — WhatsApp Session Generator

Fully fixed WhatsApp session ID generator using Baileys pair code + Mega.nz upload.

## ⚠️ Required Environment Variables

Set these on your host platform (Render / Koyeb) — NEVER hardcode them:

| Variable | Value |
|---|---|
| `MEGA_EMAIL` | Your Mega.nz email |
| `MEGA_PASSWORD` | Your Mega.nz password |

## Session ID Format

Sessions now use the `NEXUS___` prefix and are longer for added uniqueness:
```
NEXUS___<mega_file_key>__<fingerprint>
```

## Deploy on Render / Koyeb

1. Push this folder to a GitHub repo
2. Set env vars: `MEGA_EMAIL`, `MEGA_PASSWORD`
3. Build command: `npm install`
4. Start command: `npm start`
5. Port: `8000`
6. Health check path: `/health`

## Routes

| Route | Description |
|---|---|
| `/` | Landing page |
| `/pair` | Pair code UI |
| `/code?number=2547XXXXXXXX` | API — get pair code |
| `/health` | Health check |

## What was fixed

- ✅ Browser fingerprint now rotates (Chrome/Firefox/Edge) to avoid WA blocks
- ✅ Session prefix changed from `POPKID;;;` to `NEXUS___` with longer unique ID
- ✅ Mega credentials moved to environment variables (security fix)
- ✅ Proper error handling if upload fails — user is notified on WhatsApp
- ✅ Connection timeout added (60s)
- ✅ Button disabled while waiting (no duplicate requests)
- ✅ Enter key works on pair page
- ✅ Reconnect logic improved with DisconnectReason check
- ✅ Full UI redesign with NEXUS branding
