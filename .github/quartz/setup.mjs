// Quartz 本体をこのサイト用に書き換える（GitHub Actions のビルド前に実行）
// 使い方: node setup.mjs <quartz フォルダ>
// 環境変数: SITE_TITLE（サイト名）, BASE_URL（例: user.github.io/knowledge-base）
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const here = path.dirname(fileURLToPath(import.meta.url))
const quartzDir = process.argv[2]
const siteTitle = process.env.SITE_TITLE
const baseUrl = (process.env.BASE_URL ?? "").toLowerCase()

if (!quartzDir || !siteTitle || !baseUrl) {
  console.error("::error::使い方: SITE_TITLE=... BASE_URL=... node setup.mjs <quartz フォルダ>")
  process.exit(1)
}

// 1) quartz.config.ts
const configFile = path.join(quartzDir, "quartz.config.ts")
let config = fs.readFileSync(configFile, "utf8")
const edits = [
  [/pageTitle: ".*?",/, `pageTitle: ${JSON.stringify(siteTitle)},`],
  [/locale: ".*?",/, `locale: "ja-JP",`],
  [/baseUrl: ".*?",/, `baseUrl: ${JSON.stringify(baseUrl)},`],
  [/ignorePatterns: \[.*?\],/, `ignorePatterns: ["private", "templates", ".obsidian", ".trash", ".github"],`],
  [/^\s*Plugin\.CustomOgImages\(\),\s*$/m, "      // Plugin.CustomOgImages(), // 反映を速くするため無効化"],
  // 見た目（Obsidian 既定テーマ）：Obsidian と同じく OS のフォントを使う（Google Fonts は読み込まない）
  [/fontOrigin: ".*?",/, `fontOrigin: "local",`],
  // 目次に h4 まで載せる
  [/Plugin\.TableOfContents\(\)/, "Plugin.TableOfContents({ maxDepth: 4 })"],
]
for (const [re, rep] of edits) {
  if (!re.test(config)) {
    console.error(`::error::quartz.config.ts に ${re} が見つかりません`)
    process.exit(1)
  }
  config = config.replace(re, rep)
}
fs.writeFileSync(configFile, config)

// 2) quartz.layout.ts（Web 上の表示名を埋め込む）
const names = fs.readFileSync(path.join(here, "web-names.json"), "utf8").trim()
const layout = fs.readFileSync(path.join(here, "quartz.layout.ts"), "utf8")
if (!layout.includes("__WEB_NAMES__")) {
  console.error("::error::quartz.layout.ts に __WEB_NAMES__ がありません")
  process.exit(1)
}
fs.writeFileSync(path.join(quartzDir, "quartz.layout.ts"), layout.replace("__WEB_NAMES__", names))

// 3) 見た目の CSS
fs.copyFileSync(path.join(here, "custom.scss"), path.join(quartzDir, "quartz", "styles", "custom.scss"))

// 3.5) エクスプローラーが現在のノートを表示するとき、ページ全体までスクロールしないようにする
const explorerScript = path.join(quartzDir, "quartz", "components", "scripts", "explorer.inline.ts")
const exSrc = fs.readFileSync(explorerScript, "utf8")
const exNeedle = 'activeElement.scrollIntoView({ behavior: "smooth" })'
if (!exSrc.includes(exNeedle)) {
  console.error("::error::explorer.inline.ts のスクロール処理が見つかりません")
  process.exit(1)
}
fs.writeFileSync(explorerScript, exSrc.replace(exNeedle, 'activeElement.scrollIntoView({ block: "nearest" })'))

// 4) Obsidian 風の部品
const compDir = path.join(quartzDir, "quartz", "components", "obsidian")
fs.mkdirSync(compDir, { recursive: true })
for (const f of fs.readdirSync(path.join(here, "components"))) {
  fs.copyFileSync(path.join(here, "components", f), path.join(compDir, f))
}

console.log("Quartz の設定を書き換えました")
console.log(config.match(/^.*(pageTitle|locale|baseUrl|ignorePatterns|CustomOgImages|TableOfContents|fontOrigin):.*$/gm)?.join("\n") ?? "")
