# Mineflayerと周辺ライブラリ（2026-11-14時点の調査ノート）

> 確認日: すべて 2026-11-14（WebFetch / WebSearch で取得）。各項目に出典URLを付けています。
> 「出典の内容」と「推論（筆者の解釈）」は分けて書いています。推論には【推論】と付けています。
>
> **読んだ範囲の記録**
> - 全体を読んだもの: mineflayer `package.json`、`lib/version.js`、`docs/history.md`（4.28.0〜4.39.0 の範囲。日付は書かれていない）、`docs/FAQ.md`、`lib/plugins/digging.js`、mineflayer-pathfinder `readme.md`、issue #3893 / #4189、PR #4137
> - 一部だけ読んだもの: `docs/api.md`（質問に関係する節だけを抽出。全項目ではない）、`docs/README.md`（対応バージョン・プラグイン一覧・リンクだけ）、npm レジストリ JSON（mineflayer の `time` 部分、検索APIの結果）、minecraft-data `protocolVersions.json`（先頭部分）、minecraft.wiki「Java Edition protocol/Packets」（250000〜350000 文字の範囲だけ）、minecraft.wiki「Attribute」（前半だけ）、mineflayer の open issue / open PR 一覧（1ページ目だけ）、pathfinder の open issue 一覧（1ページ目 25件 / 47件）、pathfinder の commit 一覧（最新10件）
> - 読んでいないもの: `examples/` フォルダの中身（multiple.js など）、`lib/plugins/inventory.js`・`place_block.js`・`physics.js` などのソース、各プラグイン（collectblock, tool, auto-eat, armor-manager, pvp, statemachine, prismarine-viewer, web-inventory）の README・issue、pathfinder のソースコード、閉じた issue / PR、`docs/api.md` の全文

## 1. Mineflayer の最新バージョン・4.39.0以降の変更・26.1 / 26.1.2 対応

### Takeaway
npm の最新は **4.39.0（2026-09-06 公開）** で、2026-11-14 時点でこれより新しいリリースはありません。4.38.0（2026-08-27）で「26.1 対応」が入り、`testedVersions` の最後は `26.1` です。ただし **26.1.2 対応を求める issue #3893 はまだ open** のままです。また、vanilla 1.21.2 以降が要求する `tick_end` パケットを毎 tick 送る修正（PR #4137）は master にマージ済みですが、**未リリース**です。

### Cited Findings
- npm の `dist-tags.latest` は `4.39.0` — [npm registry](https://registry.npmjs.org/mineflayer)
- 公開日時: 4.33.0=2025-09-07、4.34.0=2026-01-26、4.35.0=2026-02-13、4.36.0=2026-03-30、4.37.0=2026-03-31、4.37.1=2026-05-03、4.38.0=2026-08-27、4.39.0=2026-09-06T16:14Z。`modified`=2026-09-06 なので、それ以降は公開されていない — [npm registry](https://registry.npmjs.org/mineflayer)
- `package.json`（master）: `"version": 4.39.0`、`engines.node: >=22`。主な依存: `minecraft-protocol ^1.67.0`、`minecraft-data ^3.114.0`、`prismarine-physics ^1.11.1`、`prismarine-windows ^2.9.0`、`prismarine-chunk ^1.41.0` — [package.json](https://raw.githubusercontent.com/PrismarineJS/mineflayer/master/package.json)
- README には「Supports Minecraft 1.8 to 26.1」と書かれている（1.21.11 と 26.1 も列挙）— [docs/README.md](https://raw.githubusercontent.com/PrismarineJS/mineflayer/master/docs/README.md)
- `lib/version.js` の `testedVersions` は 28件。最後の4件は `1.21.8, 1.21.9, 1.21.11, 26.1`。`latestSupportedVersion` = 26.1、`oldestSupportedVersion` = 1.8.8。**26.1.2 は含まれていない** — [lib/version.js](https://raw.githubusercontent.com/PrismarineJS/mineflayer/master/lib/version.js)
- history.md の 4.38.0 の項目: 26.1 対応（#3854）、26.1 外部テストの status ping リトライ、spawn 時に `player_loaded` を送信（1.21.4+ のサーバーがすぐ操作を受け付けるようにするため）— [docs/history.md](https://raw.githubusercontent.com/PrismarineJS/mineflayer/master/docs/history.md)
- history.md の 4.39.0 の項目（約30件。要約）:
  - `placeBlock` がサーバーに拒否された時点ですぐ reject するようになった
  - クライアント側インベントリの desync を修正（26.1 creative テストの失敗原因も含む）
  - `transfer` が1クリックずつではなく半スタック単位で動くようになった
  - `blockEntityData` と `signOpen` イベントを追加
  - `spawn_entity` の velocity を反映するようになった
  - proxy transfer の configuration フェーズで物理パケットを送らないようにした

  — [docs/history.md](https://raw.githubusercontent.com/PrismarineJS/mineflayer/master/docs/history.md)
- 4.37.1: 1.21.9+ の velocity 変更を旧バージョンへ反映。position sync の yaw/pitch 変換、`activateItem` の向き、death ハンドラのクラッシュ、`heldItemChanged` を修正。minecraft-protocol を ^1.66.0 へ — [docs/history.md](https://raw.githubusercontent.com/PrismarineJS/mineflayer/master/docs/history.md)
- minecraft-data の `protocolVersions.json` では、26.1・26.1.1・26.1.2 はどれも protocol **775**（majorVersion 26.1）。最新リリースは 26.3（777）で、26.4 snapshot まで載っている — [protocolVersions.json](https://raw.githubusercontent.com/PrismarineJS/minecraft-data/master/data/pc/common/protocolVersions.json)
- issue #3893「Add support for Minecraft Java Edition 26.1.2」（2026-04-22 作成、**open**、ピン留め）— [issue #3893](https://github.com/PrismarineJS/mineflayer/issues/3893)
  - 最初の報告は `unsupported protocol version: 26.1.2` というエラー
  - メンテナ extremeheat の返答（4/22 時点）は「最新対応は 1.21.11」
  - サーバー側で ViaVersion / ViaBackwards を使う回避策が提案されたが、`clickWindow` 系の操作で失敗するという報告がある
  - 2026-08-01 の第三者コメントの内容: minecraft-data #1210 で 26.1 が master に入ったが、mineflayer の `testedVersions` と node-minecraft-protocol の `supportedVersions` にはまだ 26.x が無い（このコメントは 4.38.0 リリースより前のもの）
  - 26.2 の要望（#3932、#4001）は、この issue の重複として閉じられた
- open issue #4189（2026-10-18）の内容 — [issue #4189](https://github.com/PrismarineJS/mineflayer/issues/4189)
  - 症状: 26.3 サーバーで、入って約1.5秒後に `multiplayer.disconnect.invalid_player_movement` で kick される
  - 報告者の環境: mineflayer 4.39.0 + Paper 26.3 + ViaVersion。bot 側は 26.1 で接続
  - 原因: mineflayer が `client_tick_end` を送らないため、同じ tick 内の2回目の位置パケットが拒否される
  - コメントで #4137（master にマージ済み）が言及されている
- PR #4137「Send tick_end at the end of every client tick on 1.21.2+」— [PR #4137](https://github.com/PrismarineJS/mineflayer/pull/4137)
  - 2026-10-03 に master へマージ
  - コストは bot 1体につき 1 tick あたり 2バイト
  - 4.39.0 にはこの修正が入っておらず未リリース、という外部コミットの記述がある
  - vanilla 26.1 が kick するかどうかは、PR ページには書かれていない
- digging 関連の open issue: #3921「wrong dig time when block material doesn't have tool IDs mapped in registry」（2026-06-10）— [issues 検索](https://github.com/PrismarineJS/mineflayer/issues?q=is%3Aissue+is%3Aopen+26.1)
- open PR（1ページ目、136件中）で関係がありそうなもの — [open PRs](https://github.com/PrismarineJS/mineflayer/pulls?q=is%3Apr+is%3Aopen+sort%3Aupdated-desc)
  - 掘る: #3912（狙いを付けた後に dig time を計算・検証する）、#4197（raycast で面を選ぶとき、掘った後のブロックを障害物と判定しない）
  - インベントリ / ウィンドウ: #4188（1.21.2+ で `set_player_inventory` を開いているコンテナに反映）、#4211（ウィンドウを閉じたときや ID 再利用時に、古い「準備完了」待ちを取り消す）、#4195、#4196、#4210
  - チャンク: #4187、#4198、#4203（どれも空の chunk batch で `chunksPerTick` が NaN になる件）、#4205（`findBlocks` の高速化）
  - 物理 / tick: #4201（1.21.2+ で位置パケットの間に tick を閉じる）、#4194（26.3 の重複位置パケット）
  - その他: #4193（初回 spawn 前に health と food を設定）、#4209（respawn と teleport）、#4165（未対応バージョンを throw ではなく `error` イベントで通知）

### Inferences
- 【推論】26.1.2 は 26.1 と同じ protocol 775 なので、4.38.0 以降なら `version: '26.1'` 指定、または自動検出で接続できる可能性があります。ただし公式の tested には 26.1.2 が無く、#3893 も open のままです。動くかどうかは自分のサーバーで確かめる必要があります。
- 【推論】#4189 は 26.3 + Paper + Via の環境での報告です。vanilla 26.1.2 で 4.39.0 が kick されるかどうかは確認できていません。kick が出たら、master（#4137 入り）を GitHub から直接 install することも選択肢になります。
- 【推論】インベントリやウィンドウ関連の修正 PR が多数 open のままです。チェストやシュルカーとの出し入れでは、ズレ（desync）が起きる前提でリトライと再確認を入れるのが安全です。

### Gaps
- #3854（26.1 対応 PR）の中身と、26.1.2 で実際に動くかどうかは、PR本文を読んでいないため確認できていません。
- #3893 に、4.38.0 リリース後にメンテナが書いた「26.1.2 も動く / 動かない」というコメントは見つかりませんでした。
- vanilla 26.1.x で `tick_end` が無いと kick されるのかどうか、一次資料では確認できていません（26.3 についての報告だけあります）。

## 2. 基本動作の API（docs/api.md とソース）

### Takeaway
掘る・置く・見る・インベントリ・コンテナ・アイテム使用・経験値・寝る・ワールド検索・各種イベントについて、docs/api.md に名前と引数が載っています。ただし `bot.dig` の `forceLook` については、**ドキュメントの説明とソースの実装で既定値の扱いが違う**ので注意が必要です。

### Cited Findings
**createBot のオプション** — [docs/api.md](https://raw.githubusercontent.com/PrismarineJS/mineflayer/master/docs/api.md)
- `auth`: 既定は `'mojang'`。`'microsoft'` も指定できる（offline の書き方は今回の抽出では確認できず）
- `viewDistance`: 既定は `far`。ほかに `normal` / `short` / `tiny` / 正の数を指定できる
- `checkTimeoutInterval`: 既定は `30*1000`。この時間内に keepalive が届かないと切断する
- `physicsEnabled`: 既定は `true`。`false` にしても位置の通知は毎秒送られ、`onGround` は最後の値のまま
- `respawn`: 既定は `true`。`false` にした場合は `bot.respawn()` を自分で呼ぶ
- `version`: 既定はサーバーから自動検出
- `keepAlive`: 既定は `true`
- `hideErrors`: 既定は `true`
- `logErrors`: 既定は `true`

**掘る**
- `bot.dig(block, [forceLook], [digFace])` は Promise を返す — [docs/api.md](https://raw.githubusercontent.com/PrismarineJS/mineflayer/master/docs/api.md)
  - `forceLook` が `true` なら即座に向きを変えて掘り、`'ignore'` なら頭を動かさない
  - `digFace` の既定は `'auto'`。Vec3 か `'raycast'` も指定できる
  - 掘っている途中に別の `dig` を呼ぶと `diggingAborted` エラーになる
- ソース側の `dig` の実装 — [lib/plugins/digging.js](https://raw.githubusercontent.com/PrismarineJS/mineflayer/master/lib/plugins/digging.js)
  - シグネチャは `async function dig (block, forceLook, digFace)`。**`forceLook` に既定値は無い**（undefined のまま `bot.lookAt` に渡る）
  - `'ignore'` のときは向きを変えず、面は 1（上面）固定になる
  - `digTime` が `Infinity` なら throw する
  - 流れ: status 0（掘り始め）を送る → `setTimeout(finishDigging, waitTime)` で待つ → 腕振りを 350ms ごとに送る → status 2（掘り終わり）を送る
  - 完了の判定は、ブロックが air になった `blockUpdate` を受けたとき
- `bot.stopDigging()` は status 1（cancel）を送り、`diggingAborted` を emit する — [digging.js](https://raw.githubusercontent.com/PrismarineJS/mineflayer/master/lib/plugins/digging.js)
- `bot.digTime(block)` は ms を返す。手に持った道具、エンチャント、水中かどうか、`!onGround`、ポーション効果を計算に入れる — [digging.js](https://raw.githubusercontent.com/PrismarineJS/mineflayer/master/lib/plugins/digging.js)
- `bot.canDigBlock(block)` の判定: `block.diggable` が真で、かつ「ブロック中心」と「bot の足元 +1.65（目の高さ）」の距離が **5.1 以下** — [digging.js](https://raw.githubusercontent.com/PrismarineJS/mineflayer/master/lib/plugins/digging.js)

**置く・使う** — [docs/api.md](https://raw.githubusercontent.com/PrismarineJS/mineflayer/master/docs/api.md)
- `bot.placeBlock(referenceBlock, faceVector)`
  - 新しいブロックは `referenceBlock.position.plus(faceVector)` の位置に置かれる
  - サーバーが置いたことを確認したら resolve する。拒否されたら reject（エンティティが邪魔な場合など）
  - 4.39.0 から、拒否されたらすぐ reject するようになった（[history](https://raw.githubusercontent.com/PrismarineJS/mineflayer/master/docs/history.md)）
- `bot.placeEntity(referenceBlock, faceVector)` は `Entity` で resolve する
- `bot.activateBlock(block, direction?, cursorPos?)`: `direction` の既定は `(0,1,0)`、`cursorPos` の既定は `(0.5,0.5,0.5)`
- `bot.activateItem(offHand=false)` / `bot.deactivateItem()` / `bot.consume()`（食べ終わると resolve）

**見る**
- `bot.lookAt(point, [force])`
- `bot.look(yaw, pitch, [force])`: 角度はラジアン。アイテムを落とすときや射撃のときは `force: true` が必要とドキュメントにある
- `bot.blockAtCursor(maxDistance=256)`: 見ているブロックを返す。無ければ `null`

— [docs/api.md](https://raw.githubusercontent.com/PrismarineJS/mineflayer/master/docs/api.md)

**装備・インベントリ** — [docs/api.md](https://raw.githubusercontent.com/PrismarineJS/mineflayer/master/docs/api.md)
- `bot.equip(item, destination)`
  - `destination` は `hand` / `head` / `torso` / `legs` / `feet` / `off-hand`
  - `item` に数値 ID を渡すと、スロット番号の小さい順に探し、ホットバーは最後に探す
- `bot.unequip(destination)`
- `bot.toss(itemType, metadata, count)`: `metadata` が null なら何でも一致、`count` が null なら 1個
- `bot.tossStack(item)`: 戻り値についての説明文が崩れているので、使う前にソースで確認する
- `bot.clickWindow(slot, mouseButton, mode)`
  - 安定しているのは mode 0 だけ
  - 1〜4 は実験的、5（ドラッグ）と 6（ダブルクリック）は未実装
  - ドキュメントは `bot.simpleClick.*` の使用を推奨
- `bot.transfer(options)`: `count` の既定は 1

**コンテナ** — [docs/api.md](https://raw.githubusercontent.com/PrismarineJS/mineflayer/master/docs/api.md)
- `bot.openContainer(block | entity, direction?, cursorPos?)` は `Container` で resolve する
- `bot.openChest` は非推奨（中身は `openContainer` と同じ）
- `container.deposit(itemType, metadata, count, nbt)` / `container.withdraw(itemType, metadata, count, nbt)`
  - `count` が null なら 1個
  - bot のインベントリに空きが無いと `withdraw` は throw する
- シュルカーボックスやエンダーチェスト専用の API の記述は、抽出した範囲には無かった

**経験値・寝る** — [docs/api.md](https://raw.githubusercontent.com/PrismarineJS/mineflayer/master/docs/api.md)
- `bot.experience.level` / `.points` / `.progress`（0〜1）
- `bot.sleep(bedBlock)` / `bot.wake()` / `bot.isSleeping` / `bot.isABed(block)`

**ワールドの検索** — [docs/api.md](https://raw.githubusercontent.com/PrismarineJS/mineflayer/master/docs/api.md)
- `bot.blockAt(point, extraInfos=true)`: チャンクが読み込まれていなければ `null`。`extraInfos` を付けると遅くなる
- `bot.findBlocks({point, matching, useExtraInfo, maxDistance=16, count=1})`: 近い順に並んだ座標を返す。`count` より少ないこともある
- `bot.findBlock(options)`
- `bot.waitForChunksToLoad()`
- `bot.waitForTicks(ticks)`

**イベント** — [docs/api.md](https://raw.githubusercontent.com/PrismarineJS/mineflayer/master/docs/api.md)
- `blockUpdate(oldBlock, newBlock)`: `oldBlock` は null のこともある。`bot.world` 側で listen することが推奨されている
- `blockUpdate:(x, y, z)`: 1点だけを監視する
- `playerCollect(collector, collected)` / `itemDrop(entity)`
- `health` / `death` / `respawn`: `respawn` より `spawn` を待つよう推奨されている
- `kicked(reason, loggedIn)` / `end(reason)`（既定は `'socketClosed'`）/ `error(err)`
- `chat(username, message, translate, jsonMsg, matches)`: 公開チャットだけ / `messagestr`
- `diggingCompleted` / `diggingAborted` / `windowOpen` / `physicsTick` / `chunkColumnLoad`
- `bot.chat` は login 前や切断後に呼ぶと throw する

**FAQ** — [docs/FAQ.md](https://raw.githubusercontent.com/PrismarineJS/mineflayer/master/docs/FAQ.md)
- サーバーが重くても切れないようにするには、`checkTimeoutInterval` を延ばす（例: 5分）。再接続の例は `reconnector.js`
- ブロックが壊せない / 置けない / チェストが開けないときは、まずスポーン保護を疑う
- `bot` のプロパティが undefined になるときは、`spawn` を待ってから使う

### Inferences
- 【推論】`bot.dig(block)` のように `forceLook` を省略すると、通常の速さで向きを変えてから掘ります。ドキュメントの文面だけを読んで「既定は true」と思い込まないようにしましょう。
- 【推論】`canDigBlock` の 5.1 は mineflayer 独自の値です。vanilla サーバーが掘るパケットを受け付ける距離（目から 6 以内）より内側なので、`canDigBlock` で確認してから掘れば、距離の点ではサーバーに拒否されにくいと考えられます。
- 【推論】「空気に向かって置かない」という目標とは相性が良いです。`placeBlock` は隣にある「参照ブロック」の面を指定する設計なので、そもそも空中には置けません。
- 【推論】シュルカーボックスは、設置して `openContainer` で開ける「ブロック」として扱うのが自然です。ただしドキュメントでは確認していません。

### Gaps
- `auth: 'offline'` の正確な記述、`tossStack` の戻り値、エンダーチェストやシュルカーの扱い、`bot.inventory` のスロット番号については、api.md を全文読んでいないため未確認です。
- `examples/` は読んでいません。

## 3. mineflayer-pathfinder

### Takeaway
npm の最新は **2.4.5（2023-09-04）** のままです。一方で GitHub の master には 2026-11-14 までコミットが続いています（水泳、斜め移動、ヒープのバグ修正など）。つまり npm 版は3年以上前のものです。open issue は47件で、水・階段・GoalFollow・1.21.x の不具合が報告されています。

### Cited Findings
- npm での版: `mineflayer-pathfinder 2.4.5`（2023-09-04）— [npm search API](https://registry.npmjs.org/-/v1/search?text=mineflayer&size=60)
- master の最近のコミット — [commits](https://github.com/PrismarineJS/mineflayer-pathfinder/commits/master)
  - 2026-11-14「Plan upward swimming and shore exits (#394)」
  - 2026-10-03「fix: recognize water-containing blocks…(#384)」
  - 2026-10-03「Fix BinaryHeapOpenSet sift-down off-by-one and GoalCompositeAll heuristic sentinel (#369)」
  - 2026-10-03「Prevent diagonal corner cuts and raised diagonal jumps (#393)」
  - 2026-09〜10 に `createHuman` という機能のコミットが複数ある
- README に書かれているメソッド — [readme.md](https://raw.githubusercontent.com/PrismarineJS/mineflayer-pathfinder/master/readme.md)
  - `goto(goal)`
  - `setGoal(goal, dynamic=false)`
  - `setMovements(movements)`
  - `stop()`: 次のノードに着いてから止まり、`path_stop` を出す。すぐ止めたいときは `setGoal(null)`
  - `getPathTo(movements, goal, timeout)`
  - `getPathFromTo(movements, startPos, goal, options)`
  - `bestHarvestTool(block)`
  - `isMoving()` / `isMining()` / `isBuilding()`
- README に書かれているプロパティ: `thinkTimeout` 既定 5000ms、`tickTimeout` 既定 40ms、`searchRadius` 既定 -1（距離の制限なし）。ただし `getPathFromTo` の説明では tickTimeout の既定が 50ms と書かれており、**README の中で値が食い違っている** — [readme.md](https://raw.githubusercontent.com/PrismarineJS/mineflayer-pathfinder/master/readme.md)
- `Movements` の既定値 — [readme.md](https://raw.githubusercontent.com/PrismarineJS/mineflayer-pathfinder/master/readme.md)
  - 掘る・置く: `canDig=true`、`digCost=1`、`placeCost=1`、`allow1by1towers=true`、`scafoldingBlocks`（足場に使うブロックの配列。綴りは原文のまま）
  - 落下: `maxDropDown=4`、`infiniteLiquidDropdownDistance=true`
  - 液体: `liquidCost=1`、`dontCreateFlow=true`
  - 落下ブロック: `dontMineUnderFallingBlock=true`
  - 移動の種類: `allowFreeMotion=false`、`allowParkour=true`、`allowSprinting=true`
  - エンティティ: `allowEntityDetection=true`、`entityCost=1`
  - `canOpenDoors=false`（README に「信頼性が低い」と書かれている）
  - ブロック集合: `blocksCantBreak`、`blocksToAvoid`、`liquids`、`climbables`（現在は未使用）、`replaceables`、`gravityBlocks`、`fences`、`carpets`
  - その他: `entitiesToAvoid`、`passableEntities`、`interactableBlocks`
  - `exclusionAreasStep` / `exclusionAreasBreak` / `exclusionAreasPlace`: `(block)=>number` の関数を並べた配列。100 を返すとその動きは不可能になる
- Goal の種類 — [readme.md](https://raw.githubusercontent.com/PrismarineJS/mineflayer-pathfinder/master/readme.md)
  - 位置系: `GoalBlock(x,y,z)`、`GoalNear(x,y,z,range)`、`GoalXZ(x,z)`、`GoalNearXZ(x,z,range)`、`GoalY(y)`、`GoalGetToBlock(x,y,z)`（隣に立つ。チェスト用）
  - 組み合わせ: `GoalCompositeAny`、`GoalCompositeAll`、`GoalInvert`
  - 追跡: `GoalFollow(entity,range)`
  - 置く・見る: `GoalPlaceBlock(pos, world, {range, faces, facing, facing3D, half})`、`GoalLookAtBlock(pos, world, {reach=4.5, entityHeight=1.6})`
  - 非推奨: `GoalBreakBlock`（`GoalLookAtBlock` を使う）
- イベント — [readme.md](https://raw.githubusercontent.com/PrismarineJS/mineflayer-pathfinder/master/readme.md)
  - `goal_reached`: dynamic goal では出ない
  - `path_update`: status は `success` / `partial` / `timeout` / `noPath`
  - `goal_updated`
  - `path_reset`: 理由に `stuck`、`dig_error`、`place_error`、`no_scaffolding_blocks`、`block_updated`、`chunk_loaded` などがある
  - `path_stop`
- open issue（1ページ目）— [issues](https://github.com/PrismarineJS/mineflayer-pathfinder/issues)
  - #398: `goto()` が PathStopped の未処理 rejection を漏らす（2026-10）
  - #391: 水から上に泳げない、岸に上がれない
  - #390: `GoalLookAtBlock` が上方向にある届くブロックを拒否する
  - #367: 1.21.11 で BungeeCord 経由の transfer 後に動かない
  - #366: 1.21.8 より新しいサーバーで `GoalFollow` が動かない
  - #354: 下が砂利のブロックを掘らないようにしたい
  - #343: 階段で stuck する
  - #328: 鍾乳石（dripstone）で stuck する
  - #296: 足場を置くのがランダムに失敗する
  - 合計 open 47件
- 代わりになりそうなもの（npm）— [npm search API](https://registry.npmjs.org/-/v1/search?text=mineflayer&size=60)
  - `@miner-org/mineflayer-baritone` 4.6.2（2026-08-29）
  - `@nxg-org/mineflayer-pathfinder` 0.0.26（2025-12-22）
  - `mineflayer-movement` 0.4.4（2023-04-18）

### Inferences
- 【推論】npm の 2.4.5 には、2026年の水泳・斜め移動・ヒープのバグ修正が入っていません。直った版が必要なら GitHub の master から install するという選択肢がありますが、「リリースされていない」というリスクを伴います。
- 【推論】ストリップマイニングは単純な直線移動が中心です。そこで次のように使い分けると、pathfinder の不安定さの影響を小さくできます。
  - 長い距離の移動（チェストに戻る等）は pathfinder を使い、`allowParkour=false`、`canDig` は状況に応じて設定する
  - 掘り進める作業そのものは、自分で書く「向く → 掘る → 1歩進む」のループにする
  - `goto` は必ず try/catch で囲む（#398 の対策）
- 【推論】代わりのライブラリが 26.1 で動くかどうかは、確認できていません。

### Gaps
- pathfinder のソース（`lib/movements.js`）は読んでいないため、README に無いオプション（`enablePathShortcut`、`LOSWhenPlacingBlocks`、`lookAhead` など）が存在するかどうかは未確認です。
- `createHuman` が何をするものかは確認していません。
- 26.1 で pathfinder が動くと明記した一次資料は見つかりませんでした。

## 4. 各プラグインのバージョンと状態

### Takeaway
最近（2025年以降）に更新されたのは auto-eat、collectblock、web-inventory、prismarine-viewer だけです。tool、pvp、statemachine、armor-manager は2022〜2023年から止まっています。**26.1 で動くと明記された資料は、どのプラグインについても見つけられませんでした。**

### Cited Findings
npm の最新版と公開日 — [npm search API](https://registry.npmjs.org/-/v1/search?text=mineflayer&size=60)

| パッケージ | 最新版 | 公開日 |
|---|---|---|
| mineflayer-collectblock | 1.6.0 | 2025-01-24 |
| mineflayer-tool | 1.2.0 | 2022-05-11 |
| mineflayer-auto-eat | 5.0.3 | 2025-08-01 |
| mineflayer-armor-manager | 2.0.1 | 2023-07-01 |
| mineflayer-pvp | 1.3.2 | 2022-07-03 |
| mineflayer-statemachine | 1.7.0 | 2023-01-23 |
| mineflayer-web-inventory | 2.2.0 | 2026-10-17 |

- prismarine-viewer: 1.33.0 — [npm](https://registry.npmjs.org/prismarine-viewer/latest)
  - 依存: `three 0.128.0`、`express`、`socket.io`、`minecraft-data ^3.0.0` など
  - 公開日の明記は無い。内部のタイムスタンプからは 2025-02-09 頃と読める【推論】
- mineflayer の README には、サードパーティのプラグインとして pathfinder、prismarine-viewer、web-inventory、statemachine、Armor Manager、PVP、Auto Eat、Tool、Collect Block などが並んでいる — [docs/README.md](https://raw.githubusercontent.com/PrismarineJS/mineflayer/master/docs/README.md)

### Inferences
- 【推論】それぞれの用途（READMEは読んでいないので、一般的な位置づけとして）:
  - collectblock: 指定したブロックを掘ってドロップを回収する（内部で pathfinder と tool を使う）
  - tool: 最適な道具に持ち替える
  - auto-eat: 自動で食べる
  - armor-manager: 自動で防具を着る
  - pvp: 戦闘
  - statemachine: 状態遷移で bot を組み立てる
  - prismarine-viewer: ブラウザで 3D 表示する
  - web-inventory: ブラウザでインベントリを見る
- 【推論】tool や collectblock の内部は `bot.dig` / `bot.equip` / pathfinder に頼っています。26.1 で動くかどうかは、mineflayer 本体と pathfinder の状態次第になります。10〜20体を動かす場合、prismarine-viewer は three.js と HTTP サーバーを抱えるので、全員に付けるのは避けるのが無難です。

### Gaps
- 各プラグインの README、issue、peerDependencies、26.1 での動作報告は確認していません。
- prismarine-viewer の正確な公開日は確認できていません。

## 5. 多数の bot（10〜20体）を Node.js で動かす

### Takeaway
公式 FAQ には「アカウントごとに `createBot` を呼ぶ（`multiple.js` を参照）」と「`checkTimeoutInterval` を延ばす」しか書かれていません。bot 1体あたりの CPU やメモリの実測値、worker_threads と child_process の比較、ログインのずらし方について、**Mineflayer の一次資料は見つかりませんでした。**

### Cited Findings
- 複数アカウントを使うには、それぞれ `createBot` を呼ぶ（例: `multiple.js`）— [docs/FAQ.md](https://raw.githubusercontent.com/PrismarineJS/mineflayer/master/docs/FAQ.md)
- 重いときの切断対策は `checkTimeoutInterval` を延ばすこと（例: 5分）。既定は 30秒 — [FAQ](https://raw.githubusercontent.com/PrismarineJS/mineflayer/master/docs/FAQ.md)、[api.md](https://raw.githubusercontent.com/PrismarineJS/mineflayer/master/docs/api.md)
- `viewDistance` の既定は `far`。`tiny` や数値も指定できる — [api.md](https://raw.githubusercontent.com/PrismarineJS/mineflayer/master/docs/api.md)
- PR #4137 の tick_end 送信は「bot 1体につき 1 tick あたり 2バイト」で、多数の bot がいる前提で書かれている — [PR #4137](https://github.com/PrismarineJS/mineflayer/pull/4137)
- （参考・別のライブラリ）Rust 製の Azalea のドキュメントでは、bot 1体はアイドル時に約20〜40MB。swarm では world を共有するので、2体目以降は1体あたり最大約1MB とされている。**Mineflayer の値ではない** — [azalea performance.md](https://docs.rs/crate/azalea/latest/source/src/_docs/performance.md)

### Inferences
- 【推論】Mineflayer では、bot ごとに world（チャンク）と entity を別々に持ちます（共有する仕組みは確認していません）。そのため、メモリを主に左右するのは viewDistance です。採掘 bot なら `viewDistance: 'tiny'` か小さい数値にするのが有効と考えられます。ただし実測はしていません。
- 【推論】1プロセスで全 bot を動かすと、pathfinder の経路計算（同期処理で最大 `thinkTimeout`、tick あたり `tickTimeout`）がイベントループを止めて、ほかの bot の keepalive が遅れるおそれがあります。対策の候補:
  - `checkTimeoutInterval` を延ばす
  - pathfinder の `tickTimeout` を小さくする
  - bot を数体ずつ child_process に分ける

  どれも推測なので、実測で決める必要があります。
- 【推論】ログインを数秒ずつずらすのは、サーバー側でチャンクを一斉に送る負荷を避ける一般的な方法です。ただし一次資料は確認していません。

### Gaps
- Mineflayer での1体あたりの CPU / メモリの実測値、worker_threads と child_process の比較、ログインのずらし方の推奨値は、見つかりませんでした。実際に測る必要があります。

## 6. vanilla サーバーが拒否・修正する動作

### Takeaway
minecraft.wiki のプロトコル解説によると、vanilla サーバーには次のような検査があります。
- 掘るパケットは、目から **6以内** の座標だけ受け付ける
- 移動が速すぎると「moved too quickly」になり、元の位置に戻される
- 当たり判定とのズレが 0.25 を超えると「moved wrongly」になり、元の位置に戻される
- 80 tick を超えて浮いていると kick される
- コンテナ操作で state ID がずれていると、サーバーが中身を全部送り直して修正する
- 1.21.2 以降は Client Tick End パケットが必要

### Cited Findings
- Player Action（掘る）: vanilla サーバーは、プレイヤーの目から 6 の範囲内の座標の掘りパケットだけを受け付ける。一瞬で壊れるブロックやクリエイティブでは、掘り終わりパケットが来ないので、サーバー側で破壊速度を計算する — [Java Edition protocol/Packets](https://minecraft.wiki/w/Java_Edition_protocol/Packets)
- Set Player Position（移動）— [同上](https://minecraft.wiki/w/Java_Edition_protocol/Packets)
  - NaN や無限大の座標を送ると `multiplayer.disconnect.invalid_player_movement` で kick される
  - 速すぎると「moved too quickly!」とログに出て、元の位置に戻される
  - 当たり判定とのズレが 0.25 を超えると「moved wrongly!」とログに出て、元の位置に戻される
  - 80 tick を超えて浮いていると `multiplayer.disconnect.flying` で kick される
- Click Container（コンテナ操作）: 変更されたスロットがサーバーの状態と食い違うと、サーバーは Set Container Slot で正しい内容を送る。State ID が一致しなければ、Set Container Content で全体を送り直す — [同上](https://minecraft.wiki/w/Java_Edition_protocol/Packets)
- Client Tick End: vanilla サーバーは位置更新の前にこのパケットを必要とし、無いと「Invalid move player packet received」で kick する — [同上](https://minecraft.wiki/w/Java_Edition_protocol/Packets)
- Player Loaded: このパケットが 60 tick 以内に来なければ、サーバーはロード済みとみなす（mineflayer 4.38.0 から spawn 時に送信している）— [同上](https://minecraft.wiki/w/Java_Edition_protocol/Packets)、[history.md](https://raw.githubusercontent.com/PrismarineJS/mineflayer/master/docs/history.md)
- 属性の既定値 — [Attribute](https://minecraft.wiki/w/Attribute)
  - `block_interaction_range` 既定 4.5（最大 64）
  - `entity_interaction_range` 既定 3
  - `block_break_speed` 既定 1
  - `submerged_mining_speed` 既定 0.2
  - このページには、サーバー側で interaction range を検査するという記述は無い
- Use Item On（設置）がどこまでの距離を拒否するかは、取得した範囲には書かれていなかった — [同上](https://minecraft.wiki/w/Java_Edition_protocol/Packets)

### Inferences
- 【推論】安全側に寄せた目安:
  - 掘る・置くのは目から 4.5 以内にする（通常のプレイヤーの到達距離）
  - mineflayer の `canDigBlock` の 5.1 も、サーバーの 6 より内側に収まる
  - 移動は mineflayer の物理（`physicsEnabled: true`）と pathfinder に任せる。位置を直接書き換えたり、テレポートのような動きを自作したりしない
- 【推論】破壊時間については、`bot.dig` が `digTime` の分だけ待ってから掘り終わりパケットを送ります。そのため、vanilla の破壊時間検査に沿った動きになるはずです。ただし `digTime` が正しくない例（issue #3921）があるので、`diggingAborted` が出たり、掘ったはずのブロックが残る「ゴーストブロック」が出たりしたら、もう一度掘る処理を入れておきます。
- 【推論】コンテナを操作した後は、サーバーが送り直してくる中身に合わせて状態が修正されます。操作のたびに短く待ってから `bot.inventory` を読み直すと、実装が堅くなります。
- 【推論】vanilla の Client Tick End の要求と、mineflayer 4.39.0 が tick_end を毎 tick 送っていないこと（#4137 は未リリース）を合わせると、26.1.2 vanilla でも移動中に kick される可能性があります。最初の接続テストで確認すべき最優先の項目です。

### Gaps
- Use Item On（設置）と Interact で vanilla がどの距離まで許すか（`block_interaction_range` + 余裕など）は、一次資料で確認できませんでした。
- 「moved too quickly」の具体的なしきい値（100 / 300 など）は、取得した範囲には載っていませんでした。
- 破壊速度の検査（早すぎる掘り終わりをどう扱うか）の詳細は確認できていません。
