import { NextResponse } from 'next/server';
/** @deprecated - Use Server Action instead. */
export async function POST() { return NextResponse.json({ success: false }, { status: 410 }); }
