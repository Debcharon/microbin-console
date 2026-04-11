'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { ThemeToggle } from './components/ThemeProvider';

type CreateResponse =
    | { path: string; targetUrl: string }
    | { error: string; detail?: string };

function normalizePath(input: string) {
  // Normalize user input path: strip leading/trailing slashes
  const s = (input || '').trim();
  const noLeading = s.startsWith('/') ? s.slice(1) : s;
  const noTrailing = noLeading.replace(/\/+$/, '');
  return noTrailing;
}

export default function Home() {
  const router = useRouter();
  const [path, setPath] = useState('hello3');
  const [targetUrl, setTargetUrl] = useState('https://example.com');

  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState<CreateResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const qrRef = useRef<SVGSVGElement>(null);

  const normalizedPath = useMemo(() => normalizePath(path), [path]);
  const shortUrl = useMemo(() => {
    const base = process.env.NEXT_PUBLIC_REDIRECT_BASE_URL || 'https://link.microbin.dev';
    return normalizedPath ? `${base}/${encodeURI(normalizedPath)}` : '';
  }, [normalizedPath]);

  // Configurable site information
  const siteTitle = process.env.NEXT_PUBLIC_SITE_TITLE || 'Microbin Console';
  const siteSubtitle = process.env.NEXT_PUBLIC_SITE_SUBTITLE || '创建自定义路径短链接（301 跳转）';
  const headerLinkText = process.env.NEXT_PUBLIC_HEADER_LINK_TEXT || 'link.microbin.dev';
  const headerLinkHref = process.env.NEXT_PUBLIC_HEADER_LINK_HREF || 'https://link.microbin.dev';

  const pathError = useMemo(() => {
    if (!normalizedPath) return 'Path 不能为空';
    if (normalizedPath.length > 128) return 'Path 过长（建议 <= 128）';
    if (normalizedPath.includes('..')) return 'Path 不能包含 ..';
    if (normalizedPath.includes('//')) return 'Path 不能包含连续的 //';
    return '';
  }, [normalizedPath]);

  const urlError = useMemo(() => {
    const u = targetUrl.trim();
    if (!u) return 'Target URL 不能为空';
    if (!(u.startsWith('https://') || u.startsWith('http://'))) return 'Target URL 必须以 http:// 或 https:// 开头';
    return '';
  }, [targetUrl]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setCopied(false);
    setResp(null);

    if (pathError || urlError) {
      setResp({ error: '表单校验失败，请检查输入' });
      return;
    }

    setLoading(true);
    try {
      const r = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: normalizedPath, targetUrl: targetUrl.trim() }),
      });

      const data = (await r.json().catch(() => ({}))) as CreateResponse;

      if (!r.ok) {
        setResp(data && 'error' in data ? data : { error: `创建失败：${r.status}` });
        return;
      }

      setResp(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setResp({ error: '网络错误', detail: message });
    } finally {
      setLoading(false);
    }
  }

  async function onCopy() {
    if (!shortUrl) return;
    await navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  function onDownloadQR() {
    const svg = qrRef.current;
    if (!svg) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qrcode.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function onLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <img src="/logo.webp" alt="Microbin Console logo" width="28" height="28" style={styles.logo} />
            <div>
              <h1 className="page-title" style={styles.h1}>{siteTitle}</h1>
              <p className="page-subtitle" style={styles.sub}>{siteSubtitle}</p>
            </div>
          </div>
          <div style={styles.headerRight}>
            <a href={headerLinkHref} target="_blank" rel="noreferrer" style={styles.linkMuted}>
              {headerLinkText}
            </a>
            <ThemeToggle />
            <button onClick={onLogout} className="logout-btn">
              <span className="logout-icon" aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </span>
              <span className="logout-text">退出登录</span>
            </button>
          </div>
        </header>

        <div className="content-grid">
          <section style={styles.card}>
            <p style={styles.sectionTitle}>创建短链</p>
            <form onSubmit={onCreate} style={styles.form}>
              <div style={styles.row}>
                <span style={styles.fieldLabel}>Path</span>
                <input
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  placeholder="hello 或 foo/bar"
                  style={styles.input}
                />
                <div style={styles.hint}>
                  生成链接：<code style={styles.code}>{shortUrl || '（请先输入 path）'}</code>
                </div>
                {pathError ? <div style={styles.errorText}>{pathError}</div> : null}
              </div>

              <div style={styles.row}>
                <span style={styles.fieldLabel}>Target URL</span>
                <input
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://example.com"
                  style={styles.input}
                />
                {urlError ? <div style={styles.errorText}>{urlError}</div> : null}
              </div>

              <div style={styles.actions}>
                <button
                  type="submit"
                  disabled={loading}
                  style={loading ? { ...styles.primaryBtn, opacity: 0.7, cursor: 'not-allowed' } : styles.primaryBtn}
                >
                  {loading ? '创建中...' : '创建短链'}
                </button>

                {shortUrl ? (
                  <button type="button" onClick={onCopy} style={styles.secondaryBtn}>
                    {copied ? '✓ 已复制' : '复制短链'}
                  </button>
                ) : null}
              </div>
            </form>
          </section>

          {resp ? (
            <section style={styles.card}>
              {'error' in resp ? (
                <div>
                  <div style={styles.badgeError}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                    创建失败
                  </div>
                  <div style={styles.resultTitle}>{resp.error}</div>
                  {resp.detail ? <pre style={styles.pre}>{resp.detail}</pre> : null}
                  <div style={styles.hint}>如果提示 409，表示 path 已被占用。</div>
                </div>
              ) : (
                <div>
                  <div style={styles.badgeOk}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    创建成功
                  </div>
                  <div style={styles.resultTitle}>你的短链已生成</div>

                  <div style={styles.kv}>
                    <div style={styles.k}>Short URL</div>
                    <div style={styles.v}>
                      <a href={shortUrl} target="_blank" rel="noreferrer" style={styles.link}>
                        {shortUrl}
                      </a>
                    </div>
                  </div>
                  <div style={styles.kv}>
                    <div style={styles.k}>Target URL</div>
                    <div style={styles.v}>
                      <a href={resp.targetUrl} target="_blank" rel="noreferrer" style={styles.linkMuted}>
                        {resp.targetUrl}
                      </a>
                    </div>
                  </div>

                  <hr style={styles.divider} />

                  <div style={styles.actions}>
                    <button type="button" onClick={onCopy} style={styles.primaryBtn}>
                      {copied ? '✓ 已复制' : '复制短链'}
                    </button>
                  </div>

                  {shortUrl ? (
                    <div style={styles.qrSection}>
                      <span style={styles.k}>二维码</span>
                      <div style={styles.qrWrapper}>
                        <QRCodeSVG ref={qrRef} value={shortUrl} size={150} bgColor="#ffffff" fgColor="#000000" level="M" />
                      </div>
                      <button type="button" onClick={onDownloadQR} style={styles.secondaryBtn}>
                        下载二维码
                      </button>
                    </div>
                  ) : null}
                </div>
              )}
            </section>
          ) : null}
        </div>

        <footer style={styles.footer}>
          <span style={styles.footerText}>提示：301 会被浏览器缓存，path 不建议频繁修改目标地址。</span>
        </footer>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'var(--background)',
    color: 'var(--text-primary)',
    padding: '0 0 48px',
  },
  container: { maxWidth: 1000, margin: '0 auto', padding: '0 20px' },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    padding: '16px 0',
    borderBottom: '1px solid var(--border-subtle)',
    marginBottom: 32,
    flexWrap: 'wrap',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
    flex: '1 1 auto',
    flexWrap: 'wrap',
  },
  logo: {
    width: 28,
    height: 28,
    borderRadius: 6,
    flexShrink: 0,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
    flex: '0 1 auto',
  },
  h1: { margin: 0, fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--text-primary)' },
  sub: { margin: '2px 0 0', color: 'var(--text-secondary)', fontSize: 12 },
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: '20px',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
    marginBottom: 16,
    marginTop: 0,
  },
  form: { display: 'grid', gap: 16 },
  row: { display: 'grid', gap: 6 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--text-primary)',
    letterSpacing: '0.01em',
  },
  input: {
    width: '100%',
    maxWidth: '100%',
    padding: '8px 11px',
    borderRadius: 6,
    border: '1px solid var(--border)',
    background: 'var(--background)',
    color: 'var(--text-primary)',
    outline: 'none',
    fontSize: 13,
    boxSizing: 'border-box' as const,
    fontFamily: 'inherit',
  },
  hint: { color: 'var(--text-secondary)', fontSize: 12, lineHeight: 1.5, marginTop: 4 },
  code: {
    fontFamily: 'var(--font-geist-mono), monospace',
    background: 'var(--surface-raised)',
    border: '1px solid var(--border)',
    padding: '2px 6px',
    borderRadius: 4,
    overflowWrap: 'anywhere',
    wordBreak: 'break-word',
    fontSize: 12,
    color: 'var(--text-secondary)',
  },
  errorText: { color: 'var(--error-text)', fontSize: 12, marginTop: 2 },
  actions: { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 },
  primaryBtn: {
    padding: '8px 16px',
    borderRadius: 6,
    border: '1px solid var(--accent)',
    background: 'var(--accent)',
    color: 'var(--accent-fg)',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    fontFamily: 'inherit',
    letterSpacing: '0.01em',
    whiteSpace: 'nowrap' as const,
  },
  secondaryBtn: {
    padding: '8px 16px',
    borderRadius: 6,
    border: '1px solid var(--border)',
    background: 'transparent',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    fontSize: 13,
    fontFamily: 'inherit',
    whiteSpace: 'nowrap' as const,
  },
  divider: {
    border: 'none',
    borderTop: '1px solid var(--border-subtle)',
    margin: '20px 0',
  },
  badgeOk: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '3px 10px',
    borderRadius: 999,
    background: 'var(--success-bg)',
    border: '1px solid var(--success-border)',
    color: 'var(--success-text)',
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: '0.04em',
    marginBottom: 14,
  },
  badgeError: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '3px 10px',
    borderRadius: 999,
    background: 'var(--error-bg)',
    border: '1px solid var(--error-border)',
    color: 'var(--error-text)',
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: '0.04em',
    marginBottom: 14,
  },
  resultTitle: { fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)', letterSpacing: '-0.01em' },
  kv: {
    display: 'grid',
    gridTemplateColumns: '100px 1fr',
    gap: 8,
    alignItems: 'start',
    marginTop: 10,
  },
  k: { color: 'var(--text-secondary)', fontSize: 12, paddingTop: 1, fontWeight: 500 },
  v: {
    fontSize: 13,
    minWidth: 0,
    overflowWrap: 'anywhere',
    wordBreak: 'break-word',
    color: 'var(--text-primary)',
  },
  link: {
    color: 'var(--text-primary)',
    textDecoration: 'underline',
    textDecorationColor: 'var(--border)',
    overflowWrap: 'anywhere',
    wordBreak: 'break-word',
  },
  linkMuted: {
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    overflowWrap: 'anywhere',
    wordBreak: 'break-word',
    fontSize: 12,
  },
  pre: {
    marginTop: 10,
    padding: '10px 12px',
    borderRadius: 6,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    overflow: 'auto',
    fontSize: 12,
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-geist-mono), monospace',
  },
  footer: { marginTop: 32 },
  footerText: { color: 'var(--text-muted)', fontSize: 12 },
  qrSection: { marginTop: 18, display: 'flex', flexDirection: 'column' as const, alignItems: 'flex-start', gap: 12 },
  qrWrapper: { padding: 10, background: '#ffffff', borderRadius: 8, display: 'inline-block' },
};