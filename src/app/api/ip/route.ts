
import { NextRequest, NextResponse } from 'next/server';

export function GET(req: NextRequest) {
  const ip = req.ip || req.headers.get('x-forwarded-for') || '127.0.0.1';
  return NextResponse.json({ ip });
}
