// Knowledge_Base 用の Quartz レイアウト（ビルド時に Quartz 本体の quartz.layout.ts を置き換える）
// 下の names の値は、ビルド時に .github/quartz/web-names.json の中身に置き換わる
import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"

// エクスプローラーのフォルダ名・ノート名を Web 上だけ別名にする
const explorer = () =>
  Component.Explorer({
    mapFn: (node) => {
      const names: Record<string, string> = __WEB_NAMES__
      let name = node.displayName
      for (const [from, to] of Object.entries(names)) name = name.split(from).join(to)
      node.displayName = name
    },
  })

// グラフ：タグを出さず、文字を小さく・ノードの間隔を広くして重なりを減らす
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
      scale: 0.9,
      repelForce: 1.6,
      centerForce: 0.2,
      linkDistance: 90,
      fontSize: 0.45,
      opacityScale: 1,
      showTags: false,
      focusOnHover: true,
      enableRadial: true,
    },
  })

export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [],
  afterBody: [],
  footer: Component.Footer({ links: {} }),
}

export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.ConditionalRender({
      component: Component.Breadcrumbs(),
      condition: (page) => page.fileData.slug !== "index",
    }),
    Component.ArticleTitle(),
    Component.ContentMeta(),
    Component.TagList(),
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        { Component: Component.Search(), grow: true },
        { Component: Component.Darkmode() },
        { Component: Component.ReaderMode() },
      ],
    }),
    explorer(),
  ],
  right: [
    graph(),
    Component.DesktopOnly(Component.TableOfContents()),
    Component.Backlinks(),
  ],
}

export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.Breadcrumbs(), Component.ArticleTitle(), Component.ContentMeta()],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        { Component: Component.Search(), grow: true },
        { Component: Component.Darkmode() },
      ],
    }),
    explorer(),
  ],
  right: [],
}
