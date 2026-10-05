import { env } from "cloudflare:workers";

export async function notify(text: string) {
  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;
  if (!(token && chatId)) {
    console.warn(`[notify] telegram not configured: ${text}`);
    return false;
  }
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          disable_web_page_preview: true,
        }),
      }
    );
    if (response.ok) {
      return true;
    }
    console.error("[notify]", response.status, await response.text());
  } catch (error) {
    console.error("[notify]", error);
  }
  return false;
}
