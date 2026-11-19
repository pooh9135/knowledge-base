// ビルド後の HTML と検索用データの「表示文字」だけを Web 用の名前に置き換える。
// URL・リンク先・見出しID などの属性は変えないので、リンクは壊れない。
// 使い方: node postbuild.mjs <public フォルダ> <web-names.json>
import fs from "node:fs"
import path from "node:path"

const [publicDir, namesFile] = process.argv.slice(2)
const names = Object.entries(JSON.parse(fs.readFileSync(namesFile, "utf8"))).flatMap(([from, to]) =>
  // フォルダページのタイトルでは空白がハイフンになる（例: "Liz-Atlas/資料"）ので、その形も置き換える
  from.includes(" ") ? [[from, to], [from.replaceAll(" ", "-"), to]] : [[from, to]],
)
const rename = (s) => names.reduce((acc, [from, to]) => acc.split(from).join(to), s)

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) yield* walk(p)
    else yield p
  }
}

// タグ・script・style の外側（＝画面に出る文字）だけ置換する。
// meta の title / description だけは属性の中も置換する（共有したときの表示名）。
// （属性の値に ">" が含まれることがあるので、引用符の中は 1 つのかたまりとして読む）
const TOKEN =
  /(<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>|<!--[\s\S]*?-->|<(?:[^>"']|"[^"]*"|'[^']*')*>)/gi
function renameHtml(html) {
  return html
    .split(TOKEN)
    .map((part, i) => {
      if (i % 2 === 0) return rename(part) // テキスト
      if (/^<meta\b/i.test(part) && /(title|description)/i.test(part)) {
        return part.replace(/content="([^"]*)"/i, (_, v) => `content="${rename(v)}"`)
      }
      return part
    })
    .join("")
}

let htmlCount = 0
for (const file of walk(publicDir)) {
  if (file.endsWith(".html")) {
    const src = fs.readFileSync(file, "utf8")
    const out = renameHtml(src)
    if (out !== src) {
      fs.writeFileSync(file, out)
      htmlCount++
    }
  }
}

// 検索・グラフ・エクスプローラーが使うデータ（タイトルと本文だけ置換）
const indexFile = path.join(publicDir, "static", "contentIndex.json")
if (fs.existsSync(indexFile)) {
  const index = JSON.parse(fs.readFileSync(indexFile, "utf8"))
  for (const entry of Object.values(index)) {
    if (typeof entry.title === "string") entry.title = rename(entry.title)
    if (typeof entry.content === "string") entry.content = rename(entry.content)
    if (typeof entry.description === "string") entry.description = rename(entry.description)
  }
  fs.writeFileSync(indexFile, JSON.stringify(index))
}

console.log(`表示名を置換しました（HTML ${htmlCount} 件 + contentIndex.json）`)
