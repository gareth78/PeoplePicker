import { jsonResponse } from '@/lib/http';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  return jsonResponse({ ok: true, ts: new Date().toISOString() });
}
