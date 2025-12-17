import { NextResponse } from 'next/server';
import { isLoggedIn } from '@/lib/auth';

function normalizePath(input: string): string {
    // English comment: normalize and validate path
    const s = (input || '').trim();
    const noLeading = s.startsWith('/') ? s.slice(1) : s;
    const noTrailing = noLeading.replace(/\/+$/, '');
    return noTrailing;
}

export async function POST(req: Request) {
    if (!isLoggedIn()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const API_BASE_URL = process.env.API_BASE_URL;
    const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

    if (!API_BASE_URL || !ADMIN_TOKEN) {
        return NextResponse.json(
            { error: 'Server is not configured (missing API_BASE_URL or ADMIN_TOKEN).' },
            { status: 500 }
        );
    }

    const body = await req.json().catch(() => ({}));
    const path = normalizePath(String(body?.path ?? ''));
    const targetUrl = String(body?.targetUrl ?? '').trim();

    if (!path) {
        return NextResponse.json({ error: 'path is required' }, { status: 400 });
    }
    if (!(targetUrl.startsWith('https://') || targetUrl.startsWith('http://'))) {
        return NextResponse.json({ error: 'targetUrl must start with http(s)://' }, { status: 400 });
    }

    const upstream = await fetch(`${API_BASE_URL}/links`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ADMIN_TOKEN}`,
        },
        body: JSON.stringify({ path, targetUrl }),
        cache: 'no-store',
    });

    const text = await upstream.text();
    let json: any = null;
    try { json = JSON.parse(text); } catch { json = { raw: text }; }

    return NextResponse.json(json, { status: upstream.status });
}