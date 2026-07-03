// @ts-nocheck
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  return NextResponse.json({
    hasFirebaseSA: !!process.env.FIREBASE_SERVICE_ACCOUNT,
    saPreview: process.env.FIREBASE_SERVICE_ACCOUNT ? process.env.FIREBASE_SERVICE_ACCOUNT.substring(0, 20) : 'none'
  });
}
