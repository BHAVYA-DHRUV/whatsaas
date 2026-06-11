import { NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Only allow in development mode
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Debug endpoint only available in development' }, { status: 403 });
  }

  // Require authentication
  const user = await getUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Return minimal debug information without exposing sensitive data
    return NextResponse.json({
      success: true,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      userId: user.id,
      userRole: user.role,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
