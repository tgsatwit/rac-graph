import { auth } from '../../../../lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('session')?.value;
    
    if (!sessionCookie) {
      return NextResponse.json({ isValid: false }, { status: 401 });
    }

    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    return NextResponse.json({ isValid: true, uid: decodedClaims.uid });
  } catch (error) {
    return NextResponse.json({ isValid: false }, { status: 401 });
  }
} 