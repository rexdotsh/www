// Runs after each production deploy: cached HTML points at the previous
// build's hashed assets, which the deploy just removed.
const ZONES = ["rex.wf", "mridul.sh"];
const token = process.env.CLOUDFLARE_PURGE_TOKEN;

if (!token) {
  console.error("CLOUDFLARE_PURGE_TOKEN is not set");
  process.exit(1);
}

const api = async (path: string, init?: RequestInit) => {
  const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
  });
  const body = (await res.json()) as {
    errors: { message: string }[];
    result: { id: string }[];
    success: boolean;
  };
  if (!body.success) {
    throw new Error(`${path}: ${body.errors.map((e) => e.message).join(", ")}`);
  }
  return body.result;
};

await Promise.all(
  ZONES.map(async (zone) => {
    const [found] = await api(`/zones?name=${zone}`);
    if (!found) {
      throw new Error(`${zone}: not visible to this token`);
    }
    await api(`/zones/${found.id}/purge_cache`, {
      method: "POST",
      body: JSON.stringify({ purge_everything: true }),
    });
    process.stdout.write(`purged ${zone}\n`);
  })
);

export {};
