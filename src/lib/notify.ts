import { env } from "cloudflare:workers";

// Fire-and-forget Telegram DM. Silently no-ops when the bot isn't configured.
export async function notify(text: string) {
  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;
  if (!(token && chatId)) {
    console.warn(`[notify] telegram not configured: ${text}`);
    return;
  }
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
  }).catch(() => undefined);
}
