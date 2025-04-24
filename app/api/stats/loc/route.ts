import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

interface LocStats {
  user_name: string;
  additions: number;
  deletions: number;
  net: number;
  duration_seconds: string;
  last_updated_unix: number;
}

const LOC_STATS_KEY = 'loc_stats';

export async function GET() {
  try {
    const stats = await kv.get<LocStats>(LOC_STATS_KEY);
    return NextResponse.json(stats || null);
  } catch (error) {
    console.error('Failed to fetch loc stats:', error);
    return NextResponse.json(null);
  }
}
