import { headers } from 'next/headers';

export async function getHost(): Promise<string> {
  return (await headers()).get('host') || 'rex.wf';
}

export async function getBaseUrl(): Promise<string> {
  const host = await getHost();
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  return `${protocol}://${host}`;
}
