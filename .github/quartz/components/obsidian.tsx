// Obsidian の初期画面（既定テーマ・既定レイアウト）を Web 上で再現するための部品。
// ビルド時に Quartz の quartz/components/obsidian/ にコピーされる。
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"
import { FullSlug, pathToRoot, resolveRelative, simplifySlug } from "../../util/path"
import { svg } from "./icons"

const Icon = ({ name, size }: { name: string; size?: number }) => (
  <span class="ob-svg" dangerouslySetInnerHTML={{ __html: svg(name, size) }} />
)

const IconButton = (p: { icon: string; label: string; action?: string; cls?: string; href?: string }) =>
  p.href ? (
    <a class={`clickable-icon ${p.cls ?? ""}`} aria-label={p.label} title={p.label} href={p.href}>
      <Icon name={p.icon} />
    </a>
  ) : (
    <button
      type="button"
      class={`clickable-icon ${p.cls ?? ""}`}
      aria-label={p.label}
      title={p.label}
      data-ob-action={p.action}
    >
      <Icon name={p.icon} />
    </button>
  )

// ───────────────────────── 共通スクリプト ─────────────────────────
// 「閲覧専用」「サイドバー開閉」「検索」「グラフ」などのボタンの動き。
const sharedScript = `
(function(){
  if (window.__obInit) return; window.__obInit = true;
  const root = document.documentElement;
  const store = { get(k){ try { return localStorage.getItem(k) } catch(e){ return null } },
                  set(k,v){ try { localStorage.setItem(k,v) } catch(e){} } };
  window.obNotice = function(msg){
    let box = document.querySelector('.ob-notice-container');
    if (!box) { box = document.createElement('div'); box.className = 'ob-notice-container'; document.body.appendChild(box); }
    const n = document.createElement('div'); n.className = 'ob-notice'; n.textContent = msg;
    n.addEventListener('click', () => n.remove());
    box.appendChild(n); setTimeout(() => n.remove(), 3500);
  };
  const click = (sel) => { const el = document.querySelector(sel); if (el) el.dispatchEvent(new MouseEvent('click', { bubbles: true })); };
  const actions = {
    'search': () => click('.search .search-button'),
    'graph': () => click('.global-graph-icon'),
    'theme': () => click('button.darkmode'),
    'toggle-left': () => { const c = root.classList.toggle('ob-left-collapsed'); store.set('ob-left-collapsed', c ? '1' : '0'); },
    'toggle-right': () => { const c = root.classList.toggle('ob-right-collapsed'); store.set('ob-right-collapsed', c ? '1' : '0'); },
    'back': () => history.back(),
    'forward': () => history.forward(),
    'collapse-all': () => {
      document.querySelectorAll('.explorer .folder-outer.open').forEach((outer) => {
        const icon = outer.parentElement && outer.parentElement.querySelector(':scope > .folder-container .folder-icon');
        if (icon) icon.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
    },
  };
  document.addEventListener('click', (e) => {
    const btn = e.target.closest && e.target.closest('[data-ob-action]');
    if (!btn) return;
    const fn = actions[btn.dataset.obAction];
    if (fn) { e.preventDefault(); fn(); }
  });
})();
`

// サイドバーの開閉状態を、描画前に反映（ちらつき防止）
const restoreLayoutScript = `
try {
  if (localStorage.getItem('ob-left-collapsed') === '1') document.documentElement.classList.add('ob-left-collapsed');
  if (localStorage.getItem('ob-right-collapsed') === '1') document.documentElement.classList.add('ob-right-collapsed');
} catch (e) {}
`

// ───────────────────────── 左端のリボン ─────────────────────────
export const Ribbon = (() => {
  const C: QuartzComponent = () => (
    <div class="ob-ribbon">
      <div class="ob-ribbon-header">
        <IconButton icon="panel-left" label="左サイドバーを開閉" action="toggle-left" />
      </div>
      <div class="ob-ribbon-actions">
        <IconButton icon="search" label="クイックスイッチャーを開く" action="search" />
        <IconButton icon="git-fork" label="グラフビューを開く" action="graph" />
      </div>
    </div>
  )
  C.beforeDOMLoaded = restoreLayoutScript
  C.afterDOMLoaded = sharedScript
  return C
}) satisfies QuartzComponentConstructor

// ───────────────────────── 左サイドバーの上部 ─────────────────────────
export const LeftHeader = (() => {
  const C: QuartzComponent = () => (
    <div class="ob-left-header">
      <div class="ob-tab-header">
        <div class="ob-tab-header-icons">
          <IconButton icon="folder-closed" label="ファイル" cls="is-active" />
          <IconButton icon="search" label="検索" action="search" />
        </div>
        <IconButton icon="chevrons-down-up" label="すべて折りたたむ" action="collapse-all" />
      </div>
    </div>
  )
  return C
}) satisfies QuartzComponentConstructor

// ───────────────────────── 左サイドバーの下（保管庫名） ─────────────────────────
export const VaultProfile = (() => {
  const C: QuartzComponent = ({ cfg, fileData }: QuartzComponentProps) => {
    const home = pathToRoot(fileData.slug!)
    return (
      <div class="ob-vault-profile">
        <a class="ob-vault-switcher" href={home} title="トップページへ">
          <Icon name="chevrons-up-down" size={14} />
          <span class="ob-vault-name">{cfg.pageTitle}</span>
        </a>
        <div class="ob-vault-actions">
          <IconButton icon="circle-help" label="ヘルプ（公開の仕組み）" href={`${home}/公開の仕組み`} />
          <IconButton icon="sun" label="ライトモードにする" action="theme" cls="ob-theme-to-light" />
          <IconButton icon="moon" label="ダークモードにする" action="theme" cls="ob-theme-to-dark" />
        </div>
      </div>
    )
  }
  return C
}) satisfies QuartzComponentConstructor

// ───────────────────────── タブバーとビューヘッダー ─────────────────────────
export const TabHeader = (() => {
  const C: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
    const slug = fileData.slug!
    const home = pathToRoot(slug)
    const title = fileData.frontmatter?.title ?? ""
    // パンくず（フォルダ / ノート名）
    const slugParts = slug.split("/")
    const fileParts = (fileData.relativePath ?? "").split("/")
    const isFolderPage = slugParts[slugParts.length - 1] === "index"
    const folderCount = slugParts.length - 1
    const crumbs = [] as { name: string; href: string }[]
    for (let i = 0; i < folderCount; i++) {
      const name =
        fileParts.length === slugParts.length ? fileParts[i] : slugParts[i].replaceAll("-", " ")
      const target = (slugParts.slice(0, i + 1).join("/") + "/index") as FullSlug
      crumbs.push({ name, href: resolveRelative(slug, target) })
    }
    if (isFolderPage && crumbs.length > 0 && slug !== "index") crumbs.pop()
    return (
      <div class="ob-header">
        <IconButton icon="panel-right" label="右サイドバーを開閉" action="toggle-right" cls="ob-right-toggle" />
        <div class="ob-tabbar">
          <div class="ob-tabs">
            <div class="ob-tab is-active" title={title}>
              <span class="ob-tab-title">{title}</span>
              <a class="ob-tab-close clickable-icon" href={home} aria-label="閉じる" title="閉じる">
                <Icon name="x" size={14} />
              </a>
            </div>
          </div>
        </div>
        <div class="ob-view-header">
          <div class="ob-view-nav">
            <IconButton icon="arrow-left" label="戻る" action="back" />
            <IconButton icon="arrow-right" label="進む" action="forward" />
          </div>
          <div class="ob-view-title">
            {crumbs.map((c) => (
              <>
                <a class="ob-crumb" href={c.href}>
                  {c.name}
                </a>
                <span class="ob-crumb-sep">/</span>
              </>
            ))}
            <span class="ob-crumb-current">{title}</span>
          </div>
          <div class="ob-view-actions"></div>
        </div>
      </div>
    )
  }
  return C
}) satisfies QuartzComponentConstructor

// ───────────────────────── プロパティ（frontmatter） ─────────────────────────
export const Properties = (() => {
  const C: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
    const fm = (fileData.frontmatter ?? {}) as Record<string, unknown>
    const hidden = new Set(["title", "draft", "publish"])
    const entries = Object.entries(fm).filter(
      ([k, v]) => !hidden.has(k) && v !== undefined && v !== null && !(Array.isArray(v) && v.length === 0),
    )
    if (entries.length === 0) return null
    const slug = fileData.slug!
    const iconFor = (k: string, v: unknown) =>
      k === "tags" ? "tags" : Array.isArray(v) ? "list" : /date|created|modified|updated|published|日/i.test(k) ? "calendar" : "text"
    return (
      <div class="ob-properties">
        <div class="ob-properties-heading">プロパティ</div>
        {entries.map(([k, v]) => (
          <div class="ob-property">
            <div class="ob-property-key">
              <Icon name={iconFor(k, v)} size={16} />
              <span>{k}</span>
            </div>
            <div class="ob-property-value">
              {k === "tags" && Array.isArray(v) ? (
                v.map((t) => (
                  <a class="tag" href={resolveRelative(slug, `tags/${t}` as FullSlug)}>
                    {String(t)}
                  </a>
                ))
              ) : Array.isArray(v) ? (
                v.map((x) => <span class="ob-pill">{String(x)}</span>)
              ) : (
                <span>{v instanceof Date ? v.toISOString().slice(0, 10) : String(v)}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }
  return C
}) satisfies QuartzComponentConstructor

// ───────────────────────── 右サイドバー（タブ切り替え） ─────────────────────────
type PanelTab = { id: string; icon: string; label: string; Component: QuartzComponent }

const rightPanelScript = `
(function(){
  if (window.__obRightPanel) return; window.__obRightPanel = true;
  function setup(){
    const panel = document.querySelector('.ob-right-panel');
    if (!panel) return;
    let saved = null; try { saved = localStorage.getItem('ob-right-tab') } catch(e){}
    const tabs = [...panel.querySelectorAll('.ob-right-tab')];
    const select = (id) => {
      if (!tabs.some(t => t.dataset.tab === id)) id = panel.dataset.default;
      tabs.forEach(t => t.classList.toggle('is-active', t.dataset.tab === id));
      panel.querySelectorAll('.ob-panel').forEach(p => p.classList.toggle('is-active', p.dataset.tab === id));
    };
    select(saved || panel.dataset.default);
    tabs.forEach(t => t.addEventListener('click', () => {
      select(t.dataset.tab);
      try { localStorage.setItem('ob-right-tab', t.dataset.tab) } catch(e){}
    }));
  }
  document.addEventListener('nav', setup);
})();
`

export const RightPanel = ((opts: { tabs: PanelTab[]; defaultTab: string }) => {
  const C: QuartzComponent = (props: QuartzComponentProps) => (
    <div class="ob-right-panel" data-default={opts.defaultTab}>
      <div class="ob-tab-header">
        <div class="ob-tab-header-icons">
          {opts.tabs.map((t) => (
            <button
              type="button"
              class={`clickable-icon ob-right-tab ${t.id === opts.defaultTab ? "is-active" : ""}`}
              data-tab={t.id}
              aria-label={t.label}
              title={t.label}
            >
              <Icon name={t.icon} />
            </button>
          ))}
        </div>
      </div>
      <div class="ob-panels">
        {opts.tabs.map((t) => (
          <div class={`ob-panel ${t.id === opts.defaultTab ? "is-active" : ""}`} data-tab={t.id}>
            <t.Component {...props} />
          </div>
        ))}
      </div>
    </div>
  )
  const res = (k: "css" | "afterDOMLoaded" | "beforeDOMLoaded") =>
    opts.tabs.map((t) => t.Component[k]).filter((x) => x !== undefined) as string[]
  C.css = res("css").join("\n")
  C.beforeDOMLoaded = res("beforeDOMLoaded").join("\n")
  C.afterDOMLoaded = [...res("afterDOMLoaded"), rightPanelScript].join("\n")
  return C
}) satisfies QuartzComponentConstructor<{ tabs: PanelTab[]; defaultTab: string }>

// 右サイドバーの中身：バックリンク
export const BacklinksPane = (() => {
  const C: QuartzComponent = ({ fileData, allFiles }: QuartzComponentProps) => {
    const slug = simplifySlug(fileData.slug!)
    const files = allFiles.filter((f) => f.links?.includes(slug))
    return (
      <div class="ob-pane">
        <div class="ob-pane-heading">
          <Icon name="chevron-down" size={14} />
          <span>リンクされた言及</span>
          <span class="ob-count">{files.length}</span>
        </div>
        {files.length === 0 ? (
          <div class="ob-pane-empty">バックリンクが見つかりません。</div>
        ) : (
          files.map((f) => (
            <a class="ob-tree-item internal" href={resolveRelative(fileData.slug!, f.slug!)}>
              {f.frontmatter?.title}
            </a>
          ))
        )}
      </div>
    )
  }
  return C
}) satisfies QuartzComponentConstructor

// 右サイドバーの中身：発リンク
export const OutgoingPane = (() => {
  const C: QuartzComponent = ({ fileData, allFiles }: QuartzComponentProps) => {
    const links = [...new Set(fileData.links ?? [])]
    const files = links
      .map((l) => allFiles.find((f) => simplifySlug(f.slug!) === l))
      .filter((f) => f !== undefined)
    return (
      <div class="ob-pane">
        <div class="ob-pane-heading">
          <Icon name="chevron-down" size={14} />
          <span>リンク</span>
          <span class="ob-count">{files.length}</span>
        </div>
        {files.length === 0 ? (
          <div class="ob-pane-empty">発リンクはありません。</div>
        ) : (
          files.map((f) => (
            <a class="ob-tree-item internal" href={resolveRelative(fileData.slug!, f!.slug!)}>
              {f!.frontmatter?.title}
            </a>
          ))
        )}
      </div>
    )
  }
  return C
}) satisfies QuartzComponentConstructor

// 右サイドバーの中身：タグ（保管庫全体）
export const TagsPane = (() => {
  const C: QuartzComponent = ({ fileData, allFiles }: QuartzComponentProps) => {
    const counts = new Map<string, number>()
    for (const f of allFiles) {
      for (const t of (f.frontmatter?.tags as string[] | undefined) ?? []) {
        counts.set(t, (counts.get(t) ?? 0) + 1)
      }
    }
    const tags = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    return (
      <div class="ob-pane">
        {tags.length === 0 ? (
          <div class="ob-pane-empty">タグはありません。</div>
        ) : (
          tags.map(([t, n]) => (
            <a class="ob-tree-item ob-tag-item" href={resolveRelative(fileData.slug!, `tags/${t}` as FullSlug)}>
              <span>#{t}</span>
              <span class="ob-count">{n}</span>
            </a>
          ))
        )}
      </div>
    )
  }
  return C
}) satisfies QuartzComponentConstructor

// 右サイドバーの中身：アウトライン（目次）
const outlineScript = `
(function(){
  if (window.__obOutline) return; window.__obOutline = true;
  function setup(){
    const items = [...document.querySelectorAll('.ob-outline a[data-for]')];
    if (!items.length) return;
    const map = new Map(items.map(a => [a.dataset.for, a]));
    const obs = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const a = map.get(e.target.id); if (!a) continue;
        a.classList.toggle('in-view', e.isIntersecting);
      }
    }, { rootMargin: '0px 0px -70% 0px' });
    document.querySelectorAll('article :is(h1,h2,h3,h4,h5,h6)[id]').forEach(h => obs.observe(h));
    window.addCleanup && window.addCleanup(() => obs.disconnect());
  }
  document.addEventListener('nav', setup);
})();
`

export const OutlinePane = (() => {
  const C: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
    const toc = (fileData.toc ?? []) as { depth: number; text: string; slug: string }[]
    return (
      <div class="ob-pane ob-outline">
        {toc.length === 0 ? (
          <div class="ob-pane-empty">見出しが見つかりません。</div>
        ) : (
          toc.map((t) => (
            <a
              class="ob-tree-item"
              href={`#${t.slug}`}
              data-for={t.slug}
              style={`padding-left: calc(8px + ${t.depth} * 17px)`}
              data-router-ignore
            >
              {t.text}
            </a>
          ))
        )}
      </div>
    )
  }
  C.afterDOMLoaded = outlineScript
  return C
}) satisfies QuartzComponentConstructor

// ───────────────────────── ステータスバー ─────────────────────────
const statusScript = `
(function(){
  if (window.__obStatus) return; window.__obStatus = true;
  function count(){
    const bar = document.querySelector('.ob-status-bar'); const art = document.querySelector('.center article');
    if (!bar || !art) return;
    const text = art.innerText || '';
    const cjk = (text.match(/[\\u3040-\\u30ff\\u3400-\\u9fff\\uf900-\\ufaff\\uff66-\\uff9f]/g) || []).length;
    const latin = (text.replace(/[\\u3040-\\u30ff\\u3400-\\u9fff\\uf900-\\ufaff\\uff66-\\uff9f]/g, ' ').match(/[A-Za-z0-9_'’-]+/g) || []).length;
    const chars = text.replace(/\\s/g, '').length;
    const fmt = (n) => n.toLocaleString('ja-JP');
    bar.querySelector('.ob-words').textContent = fmt(cjk + latin) + ' 単語';
    bar.querySelector('.ob-chars').textContent = fmt(chars) + ' 文字';
  }
  document.addEventListener('nav', count);
})();
`

export const StatusBar = (() => {
  const C: QuartzComponent = ({ fileData, allFiles }: QuartzComponentProps) => {
    const slug = simplifySlug(fileData.slug!)
    const backlinks = allFiles.filter((f) => f.links?.includes(slug)).length
    return (
      <div class="ob-status-bar">
        <span class="ob-status-item">{backlinks} 件のバックリンク</span>
        <span class="ob-status-item ob-words"></span>
        <span class="ob-status-item ob-chars"></span>
      </div>
    )
  }
  C.afterDOMLoaded = statusScript
  return C
}) satisfies QuartzComponentConstructor
