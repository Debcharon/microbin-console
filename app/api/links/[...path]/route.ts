import { NextResponse } from 'next/server';

function normalizePath(segments: string[]): string {
    // English comment: join path segments and normalize
    const joined = segments.join('/');
    const s = (joined || '').trim();
    const noLeading = s.startsWith('/') ? s.slice(1) : s;
    const noTrailing = noLeading.replace(/\/+$/, '');
    return noTrailing;
}

export async function GET(
    req: Request,
    { params }: { params: { path: string[] } }
) {
    const API_BASE_URL = process.env.API_BASE_URL;
    const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

    if (!API_BASE_URL || !ADMIN_TOKEN) {
        return NextResponse.json(
            { error: 'Server is not configured (missing API_BASE_URL or ADMIN_TOKEN).' },
            { status: 500 }
        );
    }

    const path = normalizePath(params.path);
    if (!path) {
        return NextResponse.json({ error: 'path is required' }, { status: 400 });
    }

    // Forward GET request to upstream API to get single link
    const upstream = await fetch(`${API_BASE_URL}/links/${path}`, {
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

export async function DELETE(
    req: Request,
    { params }: { params: { path: string[] } }
) {
    const API_BASE_URL = process.env.API_BASE_URL;
    const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

    if (!API_BASE_URL || !ADMIN_TOKEN) {
        return NextResponse.json(
            { error: 'Server is not configured (missing API_BASE_URL or ADMIN_TOKEN).' },
            { status: 500 }
        );
    }

    const path = normalizePath(params.path);
    if (!path) {
        return NextResponse.json({ error: 'path is required' }, { status: 400 });
    }

    // Forward DELETE request to upstream API
    const upstream = await fetch(`${API_BASE_URL}/links/${path}`, {
        method: 'DELETE',
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
