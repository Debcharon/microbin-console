import { NextResponse } from 'next/server';

function normalizePath(input: string): string {
    // English comments: normalize and validate path
    const s = (input || '').trim();
    const noLeading = s.startsWith('/') ? s.slice(1) : s;
    const noTrailing = noLeading.replace(/\/+$/, '');
    return noTrailing;
}

export async function GET(req: Request) {
    const API_BASE_URL = process.env.API_BASE_URL; // e.g. https://api.link.microbin.dev
    const ADMIN_TOKEN = process.env.ADMIN_TOKEN;   // secret token

    if (!API_BASE_URL || !ADMIN_TOKEN) {
        return NextResponse.json(
            { error: 'Server is not configured (missing API_BASE_URL or ADMIN_TOKEN).' },
            { status: 500 }
        );
    }

    // Parse query parameters from the request URL
    const { searchParams } = new URL(req.url);
    const queryString = searchParams.toString();
    const upstreamUrl = `${API_BASE_URL}/links${queryString ? `?${queryString}` : ''}`;

    // Forward GET request to upstream API to list all links
    const upstream = await fetch(upstreamUrl, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${ADMIN_TOKEN}`,
        },
        cache: 'no-store',
    });

    const text = await upstream.text();
    let json: unknown = null;
    try { json = JSON.parse(text); } catch { json = { raw: text }; }

    return NextResponse.json(json, { status: upstream.status });
}

export async function POST(req: Request) {
    const API_BASE_URL = process.env.API_BASE_URL; // e.g. https://api.link.microbin.dev
    const ADMIN_TOKEN = process.env.ADMIN_TOKEN;   // secret token

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

    // Forward request to AWS Admin API
    const upstream = await fetch(`${API_BASE_URL}/links`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // English comments: keep token on server side only
            'Authorization': `Bearer ${ADMIN_TOKEN}`,
        },
        body: JSON.stringify({ path, targetUrl }),
        // Avoid caching for admin operations
        cache: 'no-store',
    });

    const text = await upstream.text();
    let json: unknown = null;
    try { json = JSON.parse(text); } catch { json = { raw: text }; }

    return NextResponse.json(json, { status: upstream.status });
}