# ElevenLabs Webhook Handler

A Netlify function that processes ElevenLabs webhooks, generates AI summaries, and sends emails.

## Quick Deploy

1. Download/create all files in the structure above
2. ZIP the entire `elevenlabs-webhook-netlify` folder
3. Drag and drop the ZIP to Netlify dashboard
4. Set environment variables in Netlify dashboard
5. Configure ElevenLabs webhook URL

## Environment Variables Required

**Secrets:**
- `OPENAI_API_KEY`
- `MANDRILL_API_KEY`

**Config:**
- `OPENAI_MODEL` (optional, defaults to gpt-4o-mini)
- `MANDRILL_USER` (neal@beethovenathome.com)
- `MANDRILL_HOST` (optional, defaults to smtp.mandrillapp.com)
- `TARGET_EMAIL` (optional, defaults to info@beethovenathome.com)

## Webhook Endpoint

After deployment: `https://your-site.netlify.app/.netlify/functions/webhook-handler`