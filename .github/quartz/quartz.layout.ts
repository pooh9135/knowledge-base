// Knowledge_Base 用の Quartz レイアウト（ビルド時に Quartz 本体の quartz.layout.ts を置き換える）
// Obsidian の初期画面（リボン / ファイル一覧 / タブ / 右サイドバー / ステータスバー）を再現する。
// 下の names の値は、ビルド時に .github/quartz/web-names.json の中身に置き換わる
import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"
import * as Ob from "./quartz/components/obsidian/obsidian"

// エクスプローラー：Obsidian と同じく、フォルダはクリックで開閉・最初は閉じた状態
const explorer = () =>
  Component.Explorer({
    folderClickBehavior: "collapse",
    folderDefaultState: "collapsed",
    mapFn: (node) => {
      const names: Record<string, string> = __WEB_NAMES__
      let name = node.displayName
      for (const [from, to] of Object.entries(names)) name = name.split(from).join(to)
      node.displayName = name
    },
  })

// グラフ：Obsidian のグラフビューに近い見た目（タグは出さない）
const graph = () =>
  Component.Graph({
    localGraph: {
      depth: 1,
      scale: 1,
      repelForce: 1.4,
      centerForce: 0.3,
      linkDistance: 70,
      fontSize: 0.5,
      opacityScale: 1,
      showTags: false,
      focusOnHover: true,
    },
    globalGraph: {
      depth: -1,
      scale: 1,
      repelForce: 1.6,
      centerForce: 0.2,
      linkDistance: 90,
      fontSize: 0.45,
      opacityScale: 1,
      showTags: false,
      focusOnHover: true,
      enableRadial: false,
    },
  })

const rightPanel = () =>
  Ob.RightPanel({
    defaultTab: "outline",
    tabs: [
      { id: "backlinks", icon: "link", label: "バックリンク", Component: Ob.BacklinksPane() },
      { id: "outgoing", icon: "arrow-right", label: "発リンク", Component: Ob.OutgoingPane() },
      { id: "tags", icon: "tags", label: "タグ", Component: Ob.TagsPane() },
      { id: "outline", icon: "list", label: "アウトライン", Component: Ob.OutlinePane() },
      { id: "graph", icon: "git-fork", label: "ローカルグラフ", Component: graph() },
    ],
  })

const leftSidebar = () => [
  Ob.Ribbon(),
  Component.MobileOnly(Component.PageTitle()),
  Ob.LeftHeader(),
  // 検索（Ctrl+K）とダーク/ライト切り替えの仕組みだけ使う（ボタンは非表示）
  Component.Search({ enablePreview: false }),
  Component.Darkmode(),
  explorer(),
  Ob.VaultProfile(),
]

export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [Ob.TabHeader()],
  afterBody: [Ob.StatusBar()],
  footer: Component.Footer({ links: {} }),
}

export const defaultContentPageLayout: PageLayout = {
  beforeBody: [Component.ArticleTitle(), Ob.Properties()],
  left: leftSidebar(),
  right: [rightPanel()],
}

export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.ArticleTitle()],
  left: leftSidebar(),
  right: [rightPanel()],
}
