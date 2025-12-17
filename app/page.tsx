'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type CreateResponse =
    | { path: string; targetUrl: string }
    | { error: string; detail?: string };

type LinkItem = {
  path: string;
  targetUrl: string;
  enabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type ListResponse =
    | { items: LinkItem[]; nextToken?: string }
    | { error: string; detail?: string };

function normalizePath(input: string) {
  // English comment: normalize user input path
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

  // State for link list management
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const normalizedPath = useMemo(() => normalizePath(path), [path]);
  const shortUrl = useMemo(() => {
    const base = process.env.NEXT_PUBLIC_REDIRECT_BASE_URL || 'https://link.microbin.dev';
    return normalizedPath ? `${base}/${encodeURI(normalizedPath)}` : '';
  }, [normalizedPath]);

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

  async function onLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  // Fetch list of links
  async function fetchLinks() {
    setListLoading(true);
    setListError(null);
    try {
      const r = await fetch('/api/links', {
        method: 'GET',
      });

      const data = (await r.json().catch(() => ({}))) as ListResponse;

      if (!r.ok) {
        setListError(data && 'error' in data ? data.error : `获取列表失败：${r.status}`);
        setLinks([]);
        return;
      }

      if ('items' in data) {
        setLinks(data.items || []);
      } else {
        setLinks([]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setListError(`网络错误: ${message}`);
      setLinks([]);
    } finally {
      setListLoading(false);
    }
  }

  // Delete a single link (from success area)
  async function onDeleteCreated() {
    if (!resp || 'error' in resp) return;
    const pathToDelete = resp.path;
    
    if (!confirm(`确定要删除短链 "${pathToDelete}" 吗？`)) return;

    setDeleting(true);
    setDeleteError(null);
    try {
      const r = await fetch(`/api/links/${pathToDelete}`, {
        method: 'DELETE',
      });

      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        setDeleteError(data?.error || `删除失败：${r.status}`);
        return;
      }

      // Success: clear the response and refresh list
      setResp(null);
      alert('删除成功！');
      await fetchLinks();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setDeleteError(`网络错误: ${message}`);
    } finally {
      setDeleting(false);
    }
  }

  // Batch delete selected links
  async function onBatchDelete() {
    if (selectedPaths.size === 0) {
      alert('请先勾选要删除的短链');
      return;
    }

    if (!confirm(`确定要删除选中的 ${selectedPaths.size} 个短链吗？`)) return;

    setDeleting(true);
    setDeleteError(null);
    const pathsToDelete = Array.from(selectedPaths);
    const failures: string[] = [];

    // Delete one by one with concurrency control
    for (const path of pathsToDelete) {
      try {
        const r = await fetch(`/api/links/${path}`, {
          method: 'DELETE',
        });

        if (!r.ok) {
          failures.push(path);
        }
      } catch {
        failures.push(path);
      }
    }

    setDeleting(false);
    setSelectedPaths(new Set());

    if (failures.length > 0) {
      setDeleteError(`删除失败的项：${failures.join(', ')}`);
    } else {
      alert('批量删除成功！');
    }

    // Refresh list
    await fetchLinks();
  }

  // Toggle selection
  function toggleSelect(path: string) {
    const newSet = new Set(selectedPaths);
    if (newSet.has(path)) {
      newSet.delete(path);
    } else {
      newSet.add(path);
    }
    setSelectedPaths(newSet);
  }

  // Toggle select all
  function toggleSelectAll() {
    if (selectedPaths.size === links.length) {
      setSelectedPaths(new Set());
    } else {
      setSelectedPaths(new Set(links.map(l => l.path)));
    }
  }

  // Load links on mount
  useEffect(() => {
    fetchLinks();
  }, []);

  return (
      <div style={styles.page}>
        <div style={styles.container}>
          <header style={styles.header}>
            <div>
              <h1 style={styles.h1}>Microbin Console</h1>
              <p style={styles.sub}>创建自定义路径短链接（301 跳转）</p>
            </div>
            <div style={styles.headerRight}>
              <a href="https://link.microbin.dev" target="_blank" rel="noreferrer" style={styles.linkMuted}>
                link.microbin.dev
              </a>
              <button onClick={onLogout} style={styles.logoutBtn}>
                退出登录
              </button>
            </div>
          </header>

          <section style={styles.card}>
            <form onSubmit={onCreate} style={styles.form}>
              <div style={styles.row}>
                <label style={styles.label}>
                  Path
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
                </label>
              </div>

              <div style={styles.row}>
                <label style={styles.label}>
                  Target URL
                  <input
                      value={targetUrl}
                      onChange={(e) => setTargetUrl(e.target.value)}
                      placeholder="https://example.com"
                      style={styles.input}
                  />
                  {urlError ? <div style={styles.errorText}>{urlError}</div> : null}
                </label>
              </div>

              <div style={styles.actions}>
                <button type="submit" disabled={loading} style={styles.primaryBtn}>
                  {loading ? '创建中...' : '创建短链'}
                </button>

                {shortUrl ? (
                    <button type="button" onClick={onCopy} style={styles.secondaryBtn}>
                      {copied ? '已复制' : '复制短链'}
                    </button>
                ) : null}
              </div>
            </form>
          </section>

          {resp ? (
              <section style={{ ...styles.card, marginTop: 16 }}>
                {'error' in resp ? (
                    <div>
                      <div style={styles.badgeError}>创建失败</div>
                      <div style={styles.resultTitle}>{resp.error}</div>
                      {resp.detail ? <pre style={styles.pre}>{resp.detail}</pre> : null}
                      <div style={styles.hint}>如果提示 409，表示 path 已被占用。</div>
                    </div>
                ) : (
                    <div>
                      <div style={styles.badgeOk}>创建成功</div>
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
                      <div style={styles.actions}>
                        <button type="button" onClick={onCopy} style={styles.primaryBtn}>
                          {copied ? '已复制' : '复制短链'}
                        </button>
                        <button type="button" onClick={onDeleteCreated} disabled={deleting} style={styles.dangerBtn}>
                          {deleting ? '删除中...' : '删除该短链'}
                        </button>
                      </div>
                      {deleteError ? <div style={styles.errorText}>{deleteError}</div> : null}
                    </div>
                )}
              </section>
          ) : null}

          <section style={{ ...styles.card, marginTop: 24 }}>
            <div style={styles.listHeader}>
              <h2 style={styles.h2}>已创建短链</h2>
              <button onClick={fetchLinks} disabled={listLoading} style={styles.secondaryBtn}>
                {listLoading ? '加载中...' : '刷新'}
              </button>
            </div>

            {listError ? (
                <div style={styles.errorText}>{listError}</div>
            ) : listLoading ? (
                <div style={styles.hint}>加载中...</div>
            ) : links.length === 0 ? (
                <div style={styles.hint}>暂无短链</div>
            ) : (
                <div>
                  <div style={styles.tableActions}>
                    <label style={styles.checkboxLabel}>
                      <input
                          type="checkbox"
                          checked={selectedPaths.size === links.length && links.length > 0}
                          onChange={toggleSelectAll}
                          style={styles.checkbox}
                      />
                      全选
                    </label>
                    <button
                        onClick={onBatchDelete}
                        disabled={deleting || selectedPaths.size === 0}
                        style={styles.dangerBtn}
                    >
                      {deleting ? '删除中...' : `批量删除 (${selectedPaths.size})`}
                    </button>
                  </div>

                  {deleteError ? <div style={styles.errorText}>{deleteError}</div> : null}

                  <div style={styles.tableContainer}>
                    <table style={styles.table}>
                      <thead>
                      <tr style={styles.tableHeaderRow}>
                        <th style={styles.thCheckbox}></th>
                        <th style={styles.th}>Path</th>
                        <th style={styles.th}>Short URL</th>
                        <th style={styles.th}>Target URL</th>
                        <th style={styles.th}>创建时间</th>
                        <th style={styles.th}>更新时间</th>
                      </tr>
                      </thead>
                      <tbody>
                      {links.map((link) => {
                        const base = process.env.NEXT_PUBLIC_REDIRECT_BASE_URL || 'https://link.microbin.dev';
                        const linkShortUrl = `${base}/${encodeURI(link.path)}`;
                        return (
                            <tr key={link.path} style={styles.tableRow}>
                              <td style={styles.tdCheckbox}>
                                <input
                                    type="checkbox"
                                    checked={selectedPaths.has(link.path)}
                                    onChange={() => toggleSelect(link.path)}
                                    style={styles.checkbox}
                                />
                              </td>
                              <td style={styles.td}>
                                <code style={styles.code}>{link.path}</code>
                              </td>
                              <td style={styles.td}>
                                <a href={linkShortUrl} target="_blank" rel="noreferrer" style={styles.link}>
                                  {linkShortUrl}
                                </a>
                              </td>
                              <td style={styles.td}>
                                <a href={link.targetUrl} target="_blank" rel="noreferrer" style={styles.linkMuted}>
                                  {link.targetUrl}
                                </a>
                              </td>
                              <td style={styles.td}>
                                {link.createdAt ? new Date(link.createdAt).toLocaleString('zh-CN') : '-'}
                              </td>
                              <td style={styles.td}>
                                {link.updatedAt ? new Date(link.updatedAt).toLocaleString('zh-CN') : '-'}
                              </td>
                            </tr>
                        );
                      })}
                      </tbody>
                    </table>
                  </div>
                </div>
            )}
          </section>

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
    background: 'linear-gradient(180deg, #0b1020 0%, #070a12 60%, #05060a 100%)',
    color: '#e8eaf0',
    padding: 24,
  },
  container: { maxWidth: 820, margin: '0 auto' },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 12,
    marginBottom: 16,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  logoutBtn: {
    padding: '6px 12px',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.06)',
    color: '#e8eaf0',
    cursor: 'pointer',
    fontSize: 12,
  },
  h1: { margin: 0, fontSize: 28, letterSpacing: 0.2 },
  sub: { margin: '6px 0 0', color: '#aab2c5', fontSize: 14 },
  card: {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 14,
    padding: 18,
    boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
    backdropFilter: 'blur(8px)',
  },
  form: { display: 'grid', gap: 14 },
  row: { display: 'grid', gap: 6 },
  label: { display: 'grid', gap: 6, fontSize: 13, color: '#cfd6e6' },
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(0,0,0,0.25)',
    color: '#e8eaf0',
    outline: 'none',
  },
  hint: { color: '#aab2c5', fontSize: 12, lineHeight: 1.5 },
  code: {
    background: 'rgba(0,0,0,0.25)',
    border: '1px solid rgba(255,255,255,0.10)',
    padding: '2px 6px',
    borderRadius: 8,
  },
  errorText: { color: '#ff9aa2', fontSize: 12 },
  actions: { display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6 },
  primaryBtn: {
    padding: '10px 14px',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)',
    color: 'white',
    cursor: 'pointer',
  },
  secondaryBtn: {
    padding: '10px 14px',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.06)',
    color: '#e8eaf0',
    cursor: 'pointer',
  },
  badgeOk: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 999,
    background: 'rgba(34,197,94,0.15)',
    border: '1px solid rgba(34,197,94,0.35)',
    color: '#7ee0a3',
    fontSize: 12,
    marginBottom: 10,
  },
  badgeError: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 999,
    background: 'rgba(239,68,68,0.15)',
    border: '1px solid rgba(239,68,68,0.35)',
    color: '#ff9aa2',
    fontSize: 12,
    marginBottom: 10,
  },
  resultTitle: { fontSize: 16, marginBottom: 10 },
  kv: {
    display: 'grid',
    gridTemplateColumns: '120px 1fr',
    gap: 10,
    alignItems: 'start',
    marginTop: 10,
  },
  k: { color: '#aab2c5', fontSize: 12, paddingTop: 2 },
  v: { fontSize: 14 },
  link: { color: '#93c5fd', textDecoration: 'none' },
  linkMuted: { color: '#aab2c5', textDecoration: 'none' },
  pre: {
    marginTop: 10,
    padding: 12,
    borderRadius: 10,
    background: 'rgba(0,0,0,0.25)',
    border: '1px solid rgba(255,255,255,0.10)',
    overflow: 'auto',
  },
  footer: { marginTop: 18, padding: 6 },
  footerText: { color: '#7f8aa6', fontSize: 12 },
  dangerBtn: {
    padding: '10px 14px',
    borderRadius: 10,
    border: '1px solid rgba(239,68,68,0.35)',
    background: 'rgba(239,68,68,0.15)',
    color: '#ff9aa2',
    cursor: 'pointer',
  },
  listHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  h2: { margin: 0, fontSize: 20, letterSpacing: 0.2 },
  tableActions: {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 13,
    color: '#cfd6e6',
    cursor: 'pointer',
  },
  checkbox: {
    cursor: 'pointer',
    width: 16,
    height: 16,
  },
  tableContainer: {
    overflowX: 'auto',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.10)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 13,
  },
  tableHeaderRow: {
    background: 'rgba(0,0,0,0.25)',
    borderBottom: '1px solid rgba(255,255,255,0.10)',
  },
  th: {
    padding: '10px 12px',
    textAlign: 'left',
    color: '#aab2c5',
    fontWeight: 500,
  },
  thCheckbox: {
    padding: '10px 12px',
    width: 40,
  },
  tableRow: {
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  td: {
    padding: '10px 12px',
    color: '#e8eaf0',
  },
  tdCheckbox: {
    padding: '10px 12px',
    width: 40,
  },
};