import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
    const CONSOLE_PASSWORD = process.env.CONSOLE_PASSWORD;

    if (!CONSOLE_PASSWORD) {
        return NextResponse.json(
            { error: 'Server is not configured (missing CONSOLE_PASSWORD).' },
            { status: 500 }
        );
    }

    const body = await req.json().catch(() => ({}));
    const password = String(body?.password ?? '').trim();

    if (!password) {
        return NextResponse.json({ error: '请输入密码' }, { status: 400 });
    }

    if (password !== CONSOLE_PASSWORD) {
        return NextResponse.json({ error: '密码错误' }, { status: 401 });
    }

    // Set a secure session cookie
    const cookieStore = await cookies();
    cookieStore.set('session', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
    });

    return NextResponse.json({ success: true });
}
