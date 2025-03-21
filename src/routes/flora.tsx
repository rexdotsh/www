import { redirect } from "@solidjs/router";

export function GET() {
  throw redirect("https://flora.tf");
}
