import { redirect } from "@solidjs/router";

export function GET() {
  throw redirect("https://github.com/rexdotsh");
}
