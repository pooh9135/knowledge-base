# LLMを使わないMinecraft Java自動化ソフトの調査ノート(採掘・建築)

調査日: 2026-11-14(以下の事実はすべてこの日に確認。ページ側の「n か月前」表記は 2026-11-14 時点の相対表示)

**読み方の注意**
- 「出典の記載」と「推論」は分けて書いています。推論の箇所には【推論】と付けました。
- すべての取得は WebFetch(ページを取得し、小型モデルが要約して返す方式)で行いました。このため「全文読了」と書いた箇所も、正確には「全文を取得し、その要約を読んだ」という意味です。逐語的な精読ではありません。
- 引用は短い英語句にとどめ、それ以外は言い換えています。

---

## Q1. Baritone:ビルダー、採掘、範囲整地、コスト付き経路探索、対応バージョン、ライセンス、既知の限界

### Takeaway
Baritone(LGPL-3.0)は 26.1 向けの公式リリース v1.18.0 を出しています。読み込める形式は `.schematic`、`.schem`(v1/v2)、`.litematic`(v7 のみ)です。ビルダーは「間違っている位置の集合」を A* のゴールに変換します。設置面はレイトレースで確かめ、向きのある状態は「その視線で実際に置くとどの状態になるか」をシミュレーションして照合します。人間に可能な設置だけを行う、という点で Liz Atlas の制約に最も近い設計です。ただし大規模ビルドでの停止や階段の向き違いといった未解決 issue があり、クライアント mod として動くため Mineflayer へコードを直接移植することはできません。

### Cited Findings

**対応バージョンと開発の状況**
- ライセンスは LGPL-3.0 です。README のバッジには "LGPL-3.0 with anime exception" とあります。Baritone をライブラリとして使う条件は「LGPL 3.0 に従うこと」とだけ書かれています。API リリース jar では `baritone.api` パッケージの外は非サポートです。— [README](https://github.com/cabaletta/baritone) / [README raw](https://raw.githubusercontent.com/cabaletta/baritone/1.21.4/README.md)
- LICENSE ファイル本体は標準の LGPL-3.0 本文に見え、"anime exception" の追加条項は LICENSE 内に見当たりませんでした。— [LICENSE](https://raw.githubusercontent.com/cabaletta/baritone/1.21.4/LICENSE)
- 最新リリースは v1.20.0(Minecraft 26.3 用、2026-09-23)です。26.2 用 v1.19.0 は 8/31、26.1 用 v1.18.0 は 8/31 に出ています。1.19.4〜1.21.3 向けの旧ブランチも 9/1 に一斉に再リリースされています。— [Releases](https://github.com/cabaletta/baritone/releases)
- v1.18.0 の説明は "For Minecraft 26.1" だけで、26.1.1 や 26.1.2 の明記はありません。Forge、Fabric、NeoForge のすべてに対応しています。— [v1.18.0](https://github.com/cabaletta/baritone/releases/tag/v1.18.0)
- リポジトリの数字は約 4,579 コミット、open issue 852、open PR 74 です。デフォルトブランチは 1.21.4 です。— [README](https://github.com/cabaletta/baritone)

**読み込める形式**
- `DefaultSchematicFormats` は 3 形式を定義しています。
  - `MCEDIT`(`.schematic`)
  - `SPONGE`(`.schem`、v1/v2 のみ。それ以外は `UnsupportedOperationException`)
  - `LITEMATICA`(`.litematic`、**v7 のみ** = 1.21 以降。v4〜6 は "too old" として拒否)
  — [DefaultSchematicFormats.java](https://raw.githubusercontent.com/cabaletta/baritone/1.21.4/src/main/java/baritone/utils/schematic/format/DefaultSchematicFormats.java)
- 登録されているコマンドには `BuildCommand`、`LitematicaCommand`、`SelCommand`、`MineCommand`、`TunnelCommand`、`FarmCommand`、`ExploreCommand`、`pause`/`resume`/`cancel` などがあります。`SchematicaCommand` はコメントアウトされています。— [DefaultCommands.java](https://raw.githubusercontent.com/cabaletta/baritone/1.21.4/src/main/java/baritone/command/defaults/DefaultCommands.java)
- `#litematica [n]` は、Litematica で開いている n 番目の配置(placement)を `buildOpenLitematic` で建てます。— [LitematicaCommand.java](https://raw.githubusercontent.com/cabaletta/baritone/1.21.4/src/main/java/baritone/command/defaults/LitematicaCommand.java)
- `#build 名前 x y z` は原点を指定して建築します(既定は足元)。— [USAGE.md](https://raw.githubusercontent.com/cabaletta/baritone/1.21.4/USAGE.md)

**ビルダーのアルゴリズム(`BuilderProcess.java`)**
すべて [BuilderProcess.java](https://raw.githubusercontent.com/cabaletta/baritone/1.21.4/src/main/java/baritone/process/BuilderProcess.java) の記述です。
- 準備:schematic を Substitute、Mirrored、Rotated、Mask(`buildSkipBlocks`)の順で包みます。原点は `schematicOrientationX/Y/Z` で調整し、開始層は `startAtLayer` で決めます。
- 毎 tick の流れ:`approxPlaceable(36)` で手持ちを把握します。`buildInLayers` が有効なら、今の Y 帯だけを対象にした ISchematic で包みます(`layerOrder` で上から/下からを選択)。その後 `recalc` を呼びます。
- 「間違っている位置」の管理:`incorrectPositions` という集合で持ちます。
  - `fullRecalc` は全体を走査します。未ロードのチャンクは「不正」とみなしますが、`observedCompleted`(完成を確認済みの記録)に入っていれば除外します。
  - `recalcNearby` は周囲 `builderTickScanRadius` を毎 tick 再チェックします。
  - `trim` は遠い位置(距離² > 200)を落とします。
- 破壊:プレイヤー周囲 11×6×11 の範囲で、届く(`RotationUtils.reachable`)不正ブロックを探します。地上にいて安全にキャンセルできるときだけ、最適ツールを持って左クリックを押し続けます。
- 設置:
  1. `searchForPlacables`:近く(dy −5〜+1)の置換可能な位置を探します。
  2. `possibleToPlace`:各隣接面(置換不可のブロックに限る)について、AABB 上の点をサンプルし、`calcRotationFromVec3d` で視線を計算し、`RayTraceUtils.rayTraceTowards` で狙ったブロック・面に当たるか確認します。
  3. `hasAnyItemThatWouldPlace`:ホットバーの各スロットについて、一時的に yaw/pitch を設定して `getStateForPlacement` を呼び、**「この視線で置いたら何の状態になるか」をシミュレーション**します。それを `valid()` で目標と照合し、一致したものだけ採用します。
- 状態の照合:`valid` と `sameBlockstate` で行います。`buildIgnoreDirection` が有効なら `ORIENTATION_PROPS`(axis、facing、階段の half/shape、トラップドアの open/half など)を無視します。`buildIgnoreProperties` で任意のプロパティも無視できます。
- ゴールの組み立て(`assemble`):
  - 空気の位置は、手持ちで合わせられれば placeable、合わせられなければ missing に分けます。
  - 水源の位置には上に GoalBlock を置きます(捨てブロックで埋めるため)。流水は「置換不能」です。
  - placeable は「下と 2 つ下も placeable でない」ものだけを採用します。これで**下から順に**建ちます。
  - 置く対象があれば `JankyGoalComposite(設置ゴール群, 破壊ゴール群)` を返します。
  - 設置ゴールは `GoalPlace`(対象の 1 つ上に立って下に置く)か `GoalAdjacent`(`canPlaceAgainst` を満たす隣接ブロック側から置く)です。
- 足場(throwaway)のコスト:`BuilderCalculationContext.costOfPlacingAt` で決まります。
  - schematic 上で空気の位置に捨てブロックを置く:`placeBlockCost * placeIncorrectBlockPenaltyMultiplier`
  - 正しいブロックを置く:0
  - 持っていないブロックの位置:1.5 倍
  - 捨てブロックが無い:`COST_INF`
  - 壊すコストは、正しいブロックなら `breakCorrectBlockPenaltyMultiplier` 倍です。
- 置けない場合:`assemble` が 2 回とも null で、`skipFailedLayers` と `buildInLayers` が有効なら次の層へ進みます。それ以外は "Unable to do it. Pausing. resume to resume, cancel to cancel" と出して `paused=true` になります。
- 材料がホットバーに無い場合:`allowInventory` が有効なら、インベントリ 9〜35 から `attemptToPutOnHotbar` で移します。
- 再開:`pause()`/`resume()` で切り替えます。`onLostControl` は `incorrectPositions`、`observedCompleted` などを全消去します。つまり**進捗はメモリ上だけで、ディスクには保存しません**。
- 繰り返し建築:`buildRepeat`/`buildRepeatCount` で、原点をずらしながら繰り返せます。

**ビルダー関連の設定と既定値**
すべて [Settings.java](https://raw.githubusercontent.com/cabaletta/baritone/master/src/api/java/baritone/api/Settings.java) の記載です。

| 設定 | 既定値 | 意味 |
|---|---|---|
| `buildInLayers` | false | 1 層ずつ完成させてから次へ進む |
| `layerOrder` | false | false = 下から上、true = 上から下 |
| `layerHeight` | 1 | 1 層の高さ |
| `startAtLayer` | 0 | 何層目から始めるか |
| `skipFailedLayers` | false | 建てられない層を飛ばす |
| `buildOnlySelection` | false | 選択範囲の部分だけ建てる |
| `buildIgnoreExisting` | false | 既存ブロックをすべて正解扱いにする |
| `buildIgnoreDirection` | false | 向きを無視する |
| `buildIgnoreBlocks` | (空) | 空気指定の場所にあっても無視するブロック |
| `buildSkipBlocks` | (空) | 常に正解扱いにするブロック |
| `okIfAir` | (空) | 空気のままでもよいブロック |
| `buildValidSubstitutes` | (空) | 代わりにあってもよいブロック |
| `buildSubstitutes` | (空) | 代わりに置いてよいブロック |
| `mapArtMode` | false | 各列の最上段だけを見る |
| `schematicFallbackExtension` | "schematic" | 拡張子省略時に使う拡張子 |
| `buildRepeat` | (0,0,0) | 繰り返し時のずらし量 |

**足場・経路探索・採掘の設定と既定値**
すべて [Settings.java](https://raw.githubusercontent.com/cabaletta/baritone/master/src/api/java/baritone/api/Settings.java) の記載です。

| 設定 | 既定値 | 意味 |
|---|---|---|
| `acceptableThrowawayItems` | dirt, cobblestone, netherrack, stone | 足場に使ってよいブロック |
| `blocksToAvoidBreaking` | 作業台、かまど、チェスト、看板など | なるべく壊さない(禁止ではない) |
| `allowPlace` | true | 設置を許可 |
| `allowBreak` | true | 破壊を許可 |
| `blockPlacementPenalty` | 20.0 | 設置のコスト |
| `blockBreakAdditionalPenalty` | 2.0 | 破壊の追加コスト |
| `allowDownward` | true | 真下を掘る |
| `allowParkour` | false | パルクール(不安定と注記あり) |
| `allowInventory` | false | インベントリからホットバーへ移す |
| `autoTool` | true | ツールを自動で選ぶ |
| `legitMine` | false | 見えている鉱石だけ掘る |
| `minYLevelWhileMining` | 0 | 採掘の下限 Y(0 は無効の意) |
| `maxYLevelWhileMining` | 255 | 採掘の上限 Y |
| `allowOnlyExposedOres` | false | 空気に接した鉱石だけ掘る |
| `exploreForBlocks` | true | 場所が不明なら探索する |
| `mineGoalUpdateInterval` | 5 | ゴールを更新する間隔(tick) |
| `mineScanDroppedItems` | true | ドロップアイテムもゴールにする |
| `maxCachedWorldScanCount` | 10 | キャッシュ検索の上限 |
| `mineDropLoiterDurationMSThanksLouca` | 250 | 掘った後ドロップを待つ時間(ms) |
| `costHeuristic` | 3.563 | A* のヒューリスティック係数 |
| `avoidance` | false | モブ・スポナー回避(有効にするとラグの恐れ) |
| `mobAvoidanceCoefficient` | 1.5 | モブ付近のコスト倍率 |
| `mobAvoidanceRadius` | 8 | モブを避ける距離 |
| `walkOnWaterOnePenalty` | 3.0 | 水上歩行の追加コスト |

**経路探索の仕組み(FEATURES.md)**
すべて [FEATURES.md](https://raw.githubusercontent.com/cabaletta/baritone/1.21.4/FEATURES.md) の記載です。
- 改良版 A* を使います。経路は区間ごとに計算し、今の区間の終わり近くで次の区間を先に計算しておきます。
- チャンクは 2bit(空気/固体/水/回避)で RAM にキャッシュし、ディスクにも保存できます。
- 破壊は手持ちツールの速さを考慮してコストに含めます。設置(橋渡し、ピラー、スニークバック設置)もコストに含めます(既定で約 1 秒相当)。
- 落下は既定 3 ブロックまで、水バケツがあれば 23 ブロックまでです。
- 液体の隣のブロックを壊すこと、落下ブロックの下を掘ることは避けます。
- 時間切れのときは、係数を段階的に上げて最良ノードを選び、途中までの区間を実行します。
- 未対応:トラップドア。対応予定なし:ボート、馬。

**採掘・範囲整地・トンネル**
- `#mine <block...>` と `#mine 64 diamond_ore` が使えます。`legitMine` は y=11 付近をランダムに探索します。— [USAGE.md](https://raw.githubusercontent.com/cabaletta/baritone/1.21.4/USAGE.md)
- 採掘は既知の鉱石位置ごとにゴールを作り、それらをまとめた `GoalComposite` にします。— [FEATURES.md](https://raw.githubusercontent.com/cabaletta/baritone/1.21.4/FEATURES.md)
- `#tunnel` は 1×2 のトンネルを掘ります(溶岩回避などで必要な時だけ直線から外れる)。`#tunnel 高さ 幅 奥行き` は cleararea と同じ動作です。— [USAGE.md](https://raw.githubusercontent.com/cabaletta/baritone/1.21.4/USAGE.md)
- `#sel cleararea`(別名 `ca`)は、選択範囲を空気の `FillSchematic` として**ビルダーで処理**します。つまり整地は「空気を建てる」建築と同じ仕組みです。ほかに `set/fill`、`walls`、`shell`、`sphere`、`cylinder`、`replace`、`copy/paste`、`expand/contract/shift` があります。— [SelCommand.java](https://raw.githubusercontent.com/cabaletta/baritone/1.21.4/src/main/java/baritone/command/defaults/SelCommand.java)

**issue tracker に出ている限界(タイトル検索。本文はほぼ未読)**
すべて [GitHub issue 検索 API](https://api.github.com/search/issues?q=repo:cabaletta/baritone+build+schematic+in:title&sort=updated&per_page=30) の結果です。
- 未解決のもの
  - #3171「大きな schematic で詰まる、階段の角度が違う、buildinlayers/allowinventory でクラッシュ」
  - #2703「少し建てた後、止まってスキャンを続ける」
  - #2657「羊毛など置かれないブロックがある」
- 解決済み(close)のもの
  - #5033(2026-05)「ブロックステートを持つブロック(トラップドア等)が、手持ちにあるのに missing 扱いになる」
  - #4342(Litematica 使用時に建てずに歩き去る)
  - #4496(Litematica の複数サブリージョンでクラッシュ)
  - #2432(インベントリに入りきらない材料量では失敗)
  - #2882(材料不足でも建てられる分だけ建てたいという要望)
  - #4511(壊さずに建てるモードの要望)
- Litematica jar と同時に読み込むと、mojmap と malilib のメソッド名衝突でスタックオーバーフローが起きる件が、#4375 と Unimined#74 で議論されています(close 済みかは未確認)。— [Unimined #74](https://github.com/unimined/Unimined/issues/74)

#### 読んだ範囲
- 全文取得:README、USAGE.md、FEATURES.md、Settings.java(要求した設定のみ抽出)、BuilderProcess.java、DefaultSchematicFormats.java、SelCommand.java、DefaultCommands.java、LitematicaCommand.java、LICENSE、Releases ページ、v1.18.0 リリースページ
- 一部のみ:issue 検索(54 件中約 30 件。タイトルと要約のみ)
- 未読:経路探索の本体(`AStarPathFinder`、`Movement*` クラス)、`MineProcess.java`、`FarmProcess`、litematica パーサ(`LitematicaSchematic`)の実装、issue 本文、Wiki

### Inferences
- 【推論】ビルダーの肝は 3 点です。(1) schematic と現実の差分集合 `incorrectPositions` を持つ。(2) その集合を「立つべき位置の複合ゴール」に変換して汎用経路探索に渡す。(3) 置く直前に「この視線・この面で置いたら何になるか」をシミュレーションして照合する。この 3 点は Mineflayer でも再実装できる考え方です。とくに (3) は、`minecraft-data` / `prismarine-block` に `getStateForPlacement` 相当の機能が無いため、自前で向きの規則表を作る必要があります。
- 【推論】「下と 2 つ下が placeable でない位置だけ置く」という規則は、下から順に建てて空中設置を避けるための簡単なヒューリスティックで、Liz Atlas の「空気に対して置かない」制約と相性が良いです。ただし Baritone 自身はオーバーハングを支える足場を自動で計画しません。設置コストの仕組みで、経路の途中に捨てブロックを置くことはあります。schematic 上で空気の場所に置いた捨てブロックは、後で「不正」として壊す対象になり、結果的に撤去されます。これは足場の後片付けを自動化する一つの方法です。
- 【推論】ライセンスについて。LGPL-3.0 のコードを Liz Atlas(Node.js)に**写して**組み込むと、その部分は LGPL の義務(ソース開示、ライセンス表示など)を負う可能性があります。**読んでアルゴリズムを理解し、自分で書き直す**ことは著作権上の複製にあたらないのが一般的な理解です。ただし法的助言ではありません。自分のサーバーで動かすだけで配布しないなら、実務上の影響は小さいと考えられます。
- 【推論】進捗がメモリ上にしか無いので、再接続後の再開は「`fullRecalc` で現実と比べ直す」ことで成り立っています。Liz Atlas でも「進捗は保存しつつ、最終的な正解は常にワールドとの差分で判定する」設計が安全です。

### Gaps
- 26.1.2 で v1.18.0 が動くかは、リリースページに明記がなく未確認です。
- "anime exception" の具体的な条文は LICENSE ファイル内に見つからず、未確認です。
- `.litematic` パーサが複数サブリージョンやブロックエンティティをどこまで扱うかは、実装を読んでいないため未確認です。
- 階段の向きのずれ(#3171)が現行版で直ったかは未確認です。

---

## Q2. Altoclef とフォーク:タスクシステムの設計、資源収集の連鎖、失敗時の処理、現状

### Takeaway
原本の Altoclef(MIT)は 2024-06-28 にアーカイブされました。現行の主なフォークは MiranCZ/altoclef(1.16.5〜1.21.1)で、26.1 対応は確認できませんでした。設計上の価値は 2 つあります。毎 tick「今やるべきサブタスク」を返し直す再評価型のタスクツリーと、優先度の高いチェーン(食事・防衛など)が割り込むスケジューラです。

### Cited Findings
- 原本は 2024-06-28 にアーカイブされ、読み取り専用です。ライセンスは MIT、Fabric 専用で、公式対応は 1.18 です。Baritone で動いており、400 以上のアイテムを取得できると謳っています。Meloweh のフォークは schematic 対応を追加しています。— [gaucho-matrero/altoclef](https://github.com/gaucho-matrero/altoclef)
- MiranCZ フォークのダウンロード表は 1.16.5〜1.21.1 です。新しい版は Baritone の移植待ちと書かれています。最新は v0.19 です(日付は表示なし)。Replay Mod preprocessor で多バージョンを一つのコードで扱い、Baritone フォーク(MiranCZ/baritone_altoclef)を同梱しています。"nowhere near perfect"、他 mod との併用は想定外、LLM 統合は "no" と書かれています。— [MiranCZ/altoclef](https://github.com/MiranCZ/altoclef)
- `Task` のしくみ — [Task.java](https://raw.githubusercontent.com/gaucho-matrero/altoclef/main/src/main/java/adris/altoclef/tasksystem/Task.java)
  - `tick()` は初回に `onStart` を呼び、その後毎 tick `onTick` を呼びます。`onTick` は**その tick に実行すべきサブタスクを返します**。
  - 返したサブタスクが前回と `isEqual` なら継続し、違えば旧サブタスクを `stop` して差し替えます。null なら停止します。
  - `ITaskCanForce.shouldForce` を実装したタスクは、割り込みを拒否できます。
  - `interrupt` は onStop を呼んだうえで「再開時に onStart を再度呼ぶ」状態にします。
  - `isFinished` はサブクラスが実装します。
  - `thisOrChildAreTimedOut` は、子の中に `TimeoutWanderTask` があるかを調べます。
- `TaskRunner.tick()` は、アクティブなチェーンのうち `getPriority` が最大のものだけを実行します(同点なら先に登録した方)。前回と違うチェーンになったら、旧チェーンに `onInterrupt` を呼びます。— [TaskRunner.java](https://raw.githubusercontent.com/gaucho-matrero/altoclef/main/src/main/java/adris/altoclef/tasksystem/TaskRunner.java)
- チェーンの一覧:`DeathMenuChain`、`FoodChain`、`MLGBucketFallChain`、`MobDefenseChain`、`PlayerInteractionFixChain`、`SingleTaskChain`、`UserTaskChain`、`WorldSurvivalChain`。— [chains ディレクトリ](https://github.com/gaucho-matrero/altoclef/tree/main/src/main/java/adris/altoclef/chains)
- `ResourceTask.onTick` は次の優先順で処理します。 — [ResourceTask.java](https://raw.githubusercontent.com/gaucho-matrero/altoclef/main/src/main/java/adris/altoclef/tasks/ResourceTask.java)
  1. 取り出せないスロットにある目的アイテムを移す
  2. カーソル上のアイテムを片付ける(入れる場所が無ければ "STUCK!")
  3. 落ちているアイテムを拾う
  4. 既知のコンテナから取り出す
  5. `MiningRequirement` を満たすブロックがあれば `MineAndCollectTask` で掘る
  6. クラフトグリッドを空ける
  7. サブクラスの `onResourceTick` に任せる
  - 終了判定は `itemTargetsMetInventoryNoCursor` です。このファイル自体にはタイムアウトやブラックリストはありません。
- `TimeoutWanderTask` — [TimeoutWanderTask.java](https://raw.githubusercontent.com/gaucho-matrero/altoclef/main/src/main/java/adris/altoclef/tasks/movement/TimeoutWanderTask.java)
  - 「今いる場所が悪いので離れたい」ときに使います。
  - まず Baritone の explore を試し、だめなら `GoalRunAway` に切り替えます(plan B)。
  - フェンスや蔦などに挟まれたら `SafeRandomShimmyTask` で小刻みに動きます。
  - `MovementProgressChecker` で停滞を検出したら失敗カウンタを増やし、10 回を超えると終了します。
  - `increaseRange` が有効なら、次回はより遠くまで離れます。
- develop.md は環境構築の説明だけで、設計の説明はありません(Javadoc と配信動画へのリンクのみ)。— [develop.md](https://raw.githubusercontent.com/gaucho-matrero/altoclef/main/develop.md)

#### 読んだ範囲
- 全文取得:原本 README、MiranCZ README、develop.md、Task.java、TaskRunner.java、ResourceTask.java、TimeoutWanderTask.java
- 一部のみ:chains ディレクトリ(ファイル名のみ)
- 未読:各チェーンの `getPriority` の実装値、`TaskCatalogue`、`MineAndCollectTask`、`MovementProgressChecker` 本体、MiranCZ 版で何が変わったかのコード、Wiki「Big Picture」

### Inferences
- 【推論】「毎 tick、状態から今やるべき子タスクを返す」方式(宣言的な再評価)は、切断や手動介入で状態が変わっても自然に復帰しやすいです。Liz Atlas の採掘ループでも、「次の手順」をメモリ上の状態変数ではなく、ワールドとインベントリの現状から毎回決める方式が参考になります。
- 【推論】優先度付きチェーン(食事 > 防衛 > ユーザータスク)の割り込みと、`isEqual` による同一タスクの継続判定を組み合わせると、10〜20 台の bot それぞれに「生存維持の割り込み」を入れやすくなります。
- 【推論】Altoclef は Baritone と Fabric クライアントの上に作られていて、26.1 版も無いので、そのまま使うことはできません。読む教材としての価値が中心です。

### Gaps
- MiranCZ 版の最新リリース日、コミットの最終日、ライセンス表記(LICENSE ファイル)は、ページに表示されず未確認です。
- 26.1.x に対応した Altoclef フォークは見つかりませんでした(調べたのは検索 1 回と MiranCZ ページのみ)。
- チェーンごとの優先度の具体値は未確認です。

---

## Q3. Litematica Easy Place と Litematica Printer 系:何をしているか、プロトコル、サーバー側の要件、向きの決め方、非対応ブロック、26.1.x 対応

### Takeaway
Easy Place は「Litematica の配置上で使用キーを押すと、該当ブロックを持ち替えて置く」機能です。向きを正しくするには、クリック座標にエンコードした向き情報(Accurate Placement Protocol)をサーバーが解釈する必要があります(Carpet Extra の `accurateBlockPlacement`、Servux、または Litemoretica)。素のバニラサーバーで扱えるのはハーフブロック(Slabs Only)だけです。さらに Modrinth の説明では、Easy Place は「常に対象位置の空気ブロックをクリックする」とされており、**Liz Atlas の「人間が置ける置き方だけ」という制約には合いません**。一方、Printer 系(aleksilassila 版とそのフォーク)は「隣の固体の面をクリックし、yaw/pitch を送ってからバニラの `getPlacementState` で結果を予測する」総当たり方式です。こちらは制約に合う考え方で、26.1.x 対応のフォークが複数あります(いずれも AGPL-3.0)。

### Cited Findings

**Easy Place 本体**
- Easy Place の動作:`easyPlaceMode` を有効にし、使用キー(既定 `Button_2`)を押すと、schematic の位置に合うブロックをインベントリから選んで置きます。— [Litematica Wiki: Easy Place](https://github.com/maruohon/litematica/wiki/Easy-Place)
- `easyPlaceProtocolVersion` のモード — [同 Wiki](https://github.com/maruohon/litematica/wiki/Easy-Place)

| モード | 動作 | 必要なもの | 限界 |
|---|---|---|---|
| None | 座標を加工しない | なし | 回転・向きのあるブロックは正しくならない |
| Slabs Only | 上付きハーフだけ扱う | なし(バニラ・Bukkit 系で可) | ハーフ以外の向きは扱えない |
| Auto | シングルは V3、マルチは Slabs Only(`carpet:hello` を受けたら V2) | なし | 検出に失敗したら手動設定が必要 |
| Version 2 | すべての回転・向きに対応 | サーバーに Carpet Extra と `accurateBlockPlacement` ルール | サーバー mod 必須 |
| Version 3 | すべての向きに対応 | マルチでは Litemoretica をサーバーとクライアントの両方に | サーバー mod 必須 |

  - Bukkit/Spigot で V2/V3 を使うと幽霊ブロックが出ます。
  - その他の設定:`easyPlaceFirst`(既定 on、照準に近い位置から置く)、`easyPlaceVanillaReach`(到達距離を 6 から 4.5 へ)、`easyPlaceSwapInterval`(持ち替え後の待ち時間、0〜10000ms)。
- 出典間の食い違い:Wiki は「V3 のマルチには Litemoretica が必要」とします。一方、最近の Litematica と Servux の変更履歴には「Servux による V3 accuratePlacement 対応(Carpet Extra 不要)」が出てきます(検索スニペットでの確認のみ)。Servux 側には、ホッパーなど水平向きの状態についての修正もあるとのことです。— [Litematica changelog(Modrinth)](https://modrinth.com/mod/litematica/changelog?page=2)、[Servux changelog](https://modrinth.com/mod/servux/changelog?page=2)
- Modrinth の Litematica ページの記載:Easy Place は**常に対象位置の空気ブロックをクリックする**ため、アンチチートに検出されうること、配置が拒否されて幽霊ブロックが残りうることが書かれています。対応は 26.3、26.2、26.1.x などで、ライセンスは LGPL-3.0-only、ソースは sakura-ryoko/litematica です。最終更新は約 2 か月前です。— [Modrinth: Litematica](https://modrinth.com/mod/litematica)
- Servux は Fabric の専用サーバー用で、26.3、26.2、26.1.x などに対応しています(26.1.1 と 26.1.2 の個別表記はなし)。最終更新は約 2 か月前です。— [Modrinth: Servux](https://modrinth.com/mod/servux/versions)
- Carpet Extra は 26.2、26.1.x などに対応、ライセンスは LGPL-3.0-only、最終更新は約 5 か月前です。このページに `accurateBlockPlacement` の記載はありません。— [Modrinth: Carpet Extra](https://modrinth.com/mod/carpet-extra)

**Printer の原本(aleksilassila/litematica-printer)**
- 概要:AGPL-3.0。README 上の対応は 1.17〜1.19 です。自動で掘ること(excavation)や誤設置の修正は対象外としています。既知の問題は液体の設置、空中設置(printInAir)、レールの不完全さです。— [aleksilassila/litematica-printer](https://github.com/aleksilassila/litematica-printer)
- 向きの決め方(`GuesserGuide`)— [GuesserGuide.java](https://raw.githubusercontent.com/aleksilassila/litematica-printer/master/src/main/java/me/aleksilassila/litematica/printer/guides/placement/GuesserGuide.java)
  - 見る方向(6 方向)× クリックする面(6 方向)× 面内のヒット位置(±0.25 の 8 通り)を総当たりします。
  - 隣接ブロックが `canBeClicked` で、かつ置換可能でない場合だけ候補にします。
  - 隣がインタラクティブなブロック(チェスト等)ならスニークします。
  - `BlockHitResult` を作って `getPlacementState` で設置結果をシミュレーションし、`statesEqual` で目標と一致する最初の組み合わせを採用します。
  - ダブルチェストは、片側の単体チェストでも可とします。
  - ハーフブロックは別のガイドで扱います。
- 基本ガイド(`GeneralPlacementGuide`)— [GeneralPlacementGuide.java](https://raw.githubusercontent.com/aleksilassila/litematica-printer/master/src/main/java/me/aleksilassila/litematica/printer/guides/placement/GeneralPlacementGuide.java)
  - ヒット位置は「対象の中心 + 面方向 × 0.5 + `getHitModifier`」です。
  - 置換可能なブロックと、クリックできないブロックは支えにしません。
  - `printInAir` は false に固定されていて、**空中設置はしません**。
- ブロックの種類ごとのガイド割り当て:RotatingBlockGuide(頭・看板・旗)、SlabGuide、TorchGuide、RailGuesserGuide、ChestGuide、PropertySpecificGuesserGuide(扉、トラップドア、フェンスゲート、レバー、リピーター、コンパレーター等)、FallingBlockGuide、CycleStateGuide(扉や音符ブロックなどを右クリックで状態合わせ)、LogGuide、LogStrippingGuide(原木の皮むき)、最後に汎用の GuesserGuide。SkipGuide の登録はコメントアウトされています。— [Guides.java](https://raw.githubusercontent.com/aleksilassila/litematica-printer/master/src/main/java/me/aleksilassila/litematica/printer/guides/Guides.java)
- 視線とパケット(`PrepareAction`)— [PrepareAction.java](https://raw.githubusercontent.com/aleksilassila/litematica-printer/master/src/main/java/me/aleksilassila/litematica/printer/actions/PrepareAction.java)
  - 見る方向が水平なら yaw をその方向に、UP なら pitch = −90、DOWN なら pitch = 90、それ以外は 0 にします。
  - `PlayerMoveC2SPacket.Full` で回転を送り、必要なら `ClientCommandC2SPacket` で `PRESS_SHIFT_KEY` を送ります。
  - サバイバルではホットバーを選び、無ければ `pickFromInventory` を使います。

**26.1.x に対応した Printer フォーク**
- sakura-ryoko/litematica-printer(Modrinth の「Litematica Printer」):AGPL-3.0-only。26.3、26.2、26.1.x、1.21.x などに対応し、最終更新は約 2 か月前です。スキップするブロックは、砥石、地面置きの頭、看板、発光苔、蔦、エンティティ(額縁・防具立て)です。— [Modrinth](https://modrinth.com/mod/litematica-printer)、[GitHub](https://github.com/sakura-ryoko/litematica-printer)
- Litematica Printer 4th(water2004):AGPL-3.0-or-later。26.3、26.2、26.1.x に対応し、**26.1.2 と 26.2 を基準に試験済み**と明記しています。最終更新は約 3 週間前です。
  - 非同期スキャンと producer-consumer 型のスケジューラで動き、Print / Fill / 流体除去 / 岩盤破壊の各モードがあります。
  - Quick Shulker などを使ってシュルカーボックスから材料を補給できます。
  - 「packet placement はサーバー側の検証を上書きしない」とあり、空中設置はサーバーが受け付ける場合に限ります。
  — [Modrinth](https://modrinth.com/mod/litematica-printer-4th)
- Litematica Printer – Hana(Yur1Ca):AGPL-3.0-only。26.3、26.2(README 側には記載なし)、26.1.x などに対応し、最終更新は約 2 日前です。
  - 非対応:頭・看板・旗など複雑な状態やデータを持つもの、液体入りの大釜、エンティティ。
  - "simulated rotation"/"silent rotation" という語が出てきます。
  — [Modrinth](https://modrinth.com/mod/litematica-printer-hana)
- 検索結果では、ほかに Litematica Printer (INPRIM) も 26.1.2 に対応しているようです(未精査)。— [CurseForge](https://www.curseforge.com/projects/1312873)

#### 読んだ範囲
- 全文取得:Litematica Wiki Easy-Place、Modrinth の Litematica・Carpet Extra・Servux(版一覧は読み込まれず)・Printer 3 種のページ、aleksilassila の README、GuesserGuide.java、GeneralPlacementGuide.java、Guides.java、PrepareAction.java、sakura-ryoko の README
- 一部のみ:Litematica と Servux の changelog(検索スニペットのみ)
- 未読:SlabGuide、TorchGuide、PropertySpecificGuesserGuide、LogGuide の各実装、Printer.java、ActionHandler.java、4th と Hana のソースコード、Accurate Placement Protocol の仕様書(Carpet Extra のソース)

### Inferences
- 【推論】Accurate Placement Protocol(V2/V3)は、クリック座標に向き情報を埋め込み、サーバー mod がそれを読んで状態を決める方式です。「人間が理論上できる設置」の範囲を超えるので、Liz Atlas の方針では使わない方がよいです。Liz Atlas が見習うべきは Printer の `GuesserGuide` 方式です。つまり「支えになる隣接ブロックの面」×「視線」×「面内のクリック位置」を列挙し、バニラの設置規則で結果を予測し、一致するものだけ実行します。
- 【推論】Mineflayer で再現するには、バニラの `getStateForPlacement` 相当(階段は視線の水平方向とクリック面の上下半分、原木はクリック面の軸、トラップドアはクリック面とヒット位置の上下半分、など)を自前の規則表として持つ必要があります。Printer と Baritone が「自前で規則を書かず、ゲーム本体のメソッドで試す」設計を取れたのは、クライアント mod だからです。Mineflayer ではこれをそのまま真似できません。
- 【推論】Printer 系はすべて AGPL-3.0 です。コードを流用した場合、ネットワーク越しに提供するときのソース開示義務まで負う可能性があります。仕組みを読んで理解し、自分で書き直すのが無難です。
- 【推論】Printer が「掘削はしない」「誤設置の修正もしない」と明言していることから、建築と整地は別の工程に分ける設計が一般的だと分かります。

### Gaps
- Servux の V3 が 26.1.2 で使えるか、また Wiki と changelog の食い違い(Litemoretica が必要か、Servux で足りるか)の最新の正解は、一次資料を読み切れておらず未確認です。
- Printer 各フォークが階段・トラップドア・扉で具体的にどの面とどのヒット位置を選ぶかは、ガイド個別の実装を読んでおらず未確認です。
- 26.1.2 での動作は 4th だけが明言しています。ほかは「26.1.x」表記のみです。

---

## Q4. Mineflayer 系ビルダーと .litematic パーサ(npm):実際に使えるもの、版、日付、対応、問題点

### Takeaway
Mineflayer で「サバイバルで schematic を建てる」実用的な既製品は見つかりませんでした。PrismarineJS/mineflayer-builder は README 上いまも「使える段階ではない」状態で、例もクリエイティブ前提です。mineflayer-schem 1.5.2(2025-11-19)は README で多機能を謳っていますが、`index.js` を見るとサバイバルでは材料を取得できず、マルチ bot 連携も見当たりません。.litematic の読み込み部品は、litematic-parser 1.0.0(2026-02、MIT)、@kleppe/litematic-reader 1.0.11(2023-06、ISC)、nucleation 0.12.2(現行 AGPL-3.0)があります。いずれも Liz Atlas では「読み込み部品」としてだけ使い、建築ロジックは自作する前提になります。

### Cited Findings

**ビルダー**
- PrismarineJS/mineflayer-builder(npm 名 mineflayer-builder)
  - 最新 1.0.1(2022-04-11)、MIT。依存は prismarine-schematic ^1.2.0 などです。— [npm registry](https://registry.npmjs.org/mineflayer-builder)
  - README は「Work in progress. This is not an usable package yet.」としています。例は平坦ワールドで bot に OP とクリエイティブを与え、`/clear` を使う前提です。— [GitHub](https://github.com/PrismarineJS/mineflayer-builder)
  - 2026-03〜04 のコミットは CI の更新と vec3 の更新だけで、機能の追加はありません。— [commits API](https://api.github.com/repos/PrismarineJS/mineflayer-builder/commits?per_page=8)
- mineflayer-schem
  - 最新 1.5.2(2025-11-19)、MIT、作者 AnonymoDGH。依存は mineflayer ^4.20.1、mineflayer-pathfinder ^2.4.0、mineflayer-tool、prismarine-nbt などです。README の例では prismarine-schematic を import していますが、依存関係には入っていません。— [npm registry](https://registry.npmjs.org/mineflayer-schem)
  - README は `.schematic`、`.schem`、`.litematic` に対応し、1.8〜1.20+ と互換、最寄りのチェストから補給(`useNearestChest`)、複数 bot(`bots`)、`onError`(pause/cancel/retry/skip)を謳っています。— [README 1.5.2](https://unpkg.com/mineflayer-schem@1.5.2/README.md)
  - `index.js` の実際の中身 — [index.js 1.5.2](https://unpkg.com/mineflayer-schem@1.5.2/index.js)
    - アイテムが無いとき、クリエイティブなら `bot.creative.setInventorySlot` で出します。スタックが 30 を超えると `/clear` を送ります。**サバイバルでは "Could not get item" で失敗します**。
    - 支えになる隣接ブロック(air でなく bounding box が empty でないもの)がある位置だけを対象にします。
    - 向きは旧 metadata のビットマスクで解釈し、`lookAt` を少しずらすだけです。設置後は half しか確認せず、2 回リトライした後は向きが違っても完了扱いにします。
    - **このファイルにはチェスト補給もマルチ bot 連携もありません**(`lib/build.js` は未読)。

**パーサ**
- prismarine-schematic
  - 1.3.0(2026-03-30)、MIT。— [npm registry](https://registry.npmjs.org/prismarine-schematic)
  - 読み込めるのは Sponge v1〜3 と MCEdit で、書き出しは Sponge v2 です。**.litematic の記載はありません**。API は `read`/`paste`/`makeWithCommands`/`getBlock`/`forEach` です。— [GitHub](https://github.com/PrismarineJS/prismarine-schematic)
  - 1.3.0 の変更内容は CI、発行方法、型定義の追加などで、形式の追加はありません。— [HISTORY.md](https://raw.githubusercontent.com/PrismarineJS/prismarine-schematic/master/HISTORY.md)
- litematic-parser
  - 1.0.0 のみ(2026-02-06)、MIT、ESM、依存は prismarine-nbt ^2.8.0 です。— [npm registry](https://registry.npmjs.org/litematic-parser)
  - API は `loadLitematic(filePath)` で、型 `Litematic`/`Metadata`/`Region`/`BlockStatePalette` を返します。対応する litematic の版、サブリージョンの扱い、ビットパックの展開については README に記載がありません。リポジトリは JaRoMasterDev/litematic-parser です。
- @kleppe/litematic-reader
  - 1.0.11(2023-06-22)、ISC。API は `new Litematic(ArrayBuffer)`、`read()`、`getAllBlocks()`、`getBlock(x,y,z)`、`getBlockPalette()` です。
  - README の Node 用の例は await を忘れています。テストはありません。
  — [npm registry](https://registry.npmjs.org/@kleppe/litematic-reader)
- nucleation
  - npm の最新は 0.12.2 です。ライセンスは 0.1.73 まで MIT OR Apache-2.0、**0.1.74 以降は AGPL-3.0-only** です。ESM で、リポジトリは Schem-at/Nucleation です。— [npm registry](https://registry.npmjs.org/nucleation)(ページが長く、0.12.2 の日付は未取得)
  - GitHub の README は Rust 製で、JS/TS、Python、Kotlin、PHP、C、C++ のバインディングを持つとしています。ライセンス表記は MIT です(npm の AGPL 表記と**食い違い**)。スター 28、open issue 1 です。対応形式の一覧はページから取れませんでした。— [GitHub](https://github.com/Schem-at/Nucleation)

#### 読んだ範囲
- 全文取得:各パッケージの npm registry JSON(nucleation は先頭 10 万字のみ)、mineflayer-builder の README とコミット、mineflayer-schem の README と index.js、prismarine-schematic の README と HISTORY、Nucleation の README
- 未読:mineflayer-schem の `lib/build.js`、litematic-parser と @kleppe のソースコード、nucleation のフォーマット文書、各 issue

### Inferences
- 【推論】.litematic の読み込みは、prismarine-nbt で gzip 済み NBT を開き、各 Region の `BlockStatePalette` と `BlockStates`(long 配列のビットパック)を展開すれば済む規模です。既製品の完成度が低く情報も少ないので、litematic-parser を土台にするか、Baritone の v7 パーサや litematic-parser を**読んで**自作し、テスト用の .litematic で検証するのが確実です。
- 【推論】mineflayer-schem は README と実装が食い違っています(README の機能が index.js に無い)。そのまま採用するのは危険です。参考にできるのは「隣接に支えがある位置だけを対象にする」「連続で失敗したらキューを回して待つ」の 2 点くらいです。
- 【推論】nucleation は npm と GitHub でライセンス表記が違います。採用するなら、使う版の LICENSE ファイルを直接確認する必要があります。

### Gaps
- litematic-parser が litematic の版 6/7 やマルチリージョンで動くかは、実物で試していないため未確認です。
- nucleation 0.12.2 の公開日と、npm 版の正確なライセンスは未確認です。
- Mineflayer 4.39 / 26.1.2 の環境で上記のどれかが動いた報告は見つかりませんでした。

---

## Q5. 参考になるオープンソースの Mineflayer bot(採掘・木・農業)と、Voyager / Mindcraft の基本動作

### Takeaway
基本動作の参照実装として読む価値が高いのは、Mindcraft の `skills.js`(MIT、1.21.11 まで)です。設置・採掘・下掘り・移動の安全チェックが実装されています。Voyager の control_primitives(MIT、1.19)は短くて読みやすいですが、簡素です。いずれも「隣が空気なら置かない」以上の足場計画は持っていません。採掘や農業の専用 bot は古い(minebot は 1.16.5 専用)か、ライセンス不明(minecraftLegion)です。設計の考え方を読む教材として扱うのが適切です。

### Cited Findings

**Voyager**
- MIT、1.19 で試験。保守についての記述はありません。— [MineDojo/Voyager](https://github.com/MineDojo/Voyager)
- control_primitives には、craftItem、mineBlock、placeItem、smeltItem、useChest、killMob、exploreUntil などがあります。— [ディレクトリ](https://github.com/MineDojo/Voyager/tree/main/voyager/control_primitives)
- `mineBlock` は `bot.findBlocks`(32 ブロック以内、最大 1024 件)の結果を `bot.collectBlock.collect(targets,{ignoreNoPath:true,count})` に渡します。見つからなかった回数をモジュール全体のカウンタで数え、10 回を超えると例外を投げます(カウンタはリセットされません)。— [mineBlock.js](https://raw.githubusercontent.com/MineDojo/Voyager/main/voyager/control_primitives/mineBlock.js)
- `placeItem` は 6 方向の中から最初の非空気の隣接ブロックを支えに選びます(未ロードで null の場合も支え扱いになってしまう不具合があります)。`GoalPlaceBlock` で近づいてから `placeBlock` を呼び、例外が出てもアイテム数が減っていれば成功とみなします。— [placeItem.js](https://raw.githubusercontent.com/MineDojo/Voyager/main/voyager/control_primitives/placeItem.js)

**Mindcraft**
- MIT。対応は "up to v1.21.11, recommend v1.21.6" です。「issue への反応は鈍いが PR には反応する」と書かれています。— [mindcraft-bots/mindcraft](https://github.com/mindcraft-bots/mindcraft)
- `skills.js` の主な関数 — [skills.js](https://raw.githubusercontent.com/mindcraft-bots/mindcraft/develop/src/agent/library/skills.js)
  - `placeBlock`:`placeOn` の優先順に隣接ブロックを探し、空いていない最初のものを支えにします。非チートモードでは向きを制御しません。支えが無ければ "nothing to place on" で false を返し、**足場は組みません**。
  - `collectBlock`:`deepslate_*` などの別名に対応し、`safeToBreak` を確認し、`bot.tool.equipForBlock` と `canHarvest` で道具を確認してから collectBlock で掘ります。
  - `digDown`:下が溶岩や水なら停止し、3 ブロック以上の空洞でも停止します(docstring の「4 以上」と実装が食い違っています)。
  - `goToGoal`:まずガラスを壊さない経路(1000ms)、次に破壊ありの経路を試します。
  - `goToPosition`:1.2 秒止まったら扉を開け、掘っているブロックが手持ちで回収できないなら停止します。
  - `bot.interrupt_code` を確認するループがあり、外から中断できます。ただし `goToGoal` 系は中断のチェックを持ちません。

**採掘・農業の専用 bot**
- appenz/minebot
  - Apache-2.0、最終 push 2024-04-20、1.16.5 専用(「1.18/1.19 では動かない」)、Python から Mineflayer を使います。
  - ストリップマイニングは既定で 11 幅 × 9 高の範囲の有価ブロックを掘ります。3×3 や 5×5 の通路も選べます。
  - 谷や溶岩は自動で橋を架け、松明を置き、スタート地点のチェスト(とチェスト付きトロッコ)で道具を補充し収穫物を預けます。
  - 体力が 50% を切るとログアウトし、看板に進捗を記録します。
  - 木こりはマツの大木(2×2)専用、農業は小麦専用です。
  — [GitHub](https://github.com/appenz/minebot)、[API](https://api.github.com/repos/appenz/minebot)
- sefirosweb/minecraftLegion
  - ライセンスの表示なし(GitHub API で license=null)、最終 push 2026-04-24、スター 54。
  - 職業は Guard、Miner(チャンク範囲かトンネル)、Farmer(木の植林を含む)、Breeder、Sorter です。
  - bot 同士がチェストの中身を共有し、目的のアイテムがあるチェストへ直行します。
  - 溶岩や水が多いと採掘にバグがあると明記されています。操作は Web UI が前提です。
  — [GitHub](https://github.com/sefirosweb/minecraftLegion)、[API](https://api.github.com/repos/sefirosweb/minecraftLegion)
- legendary0001/mineflayer-farmbot:MIT。小麦を耕し、植え、収穫し、チェストに預けます。切断されたら 20 秒ごとに再接続し、チェストが満杯なら止まります。農場の状態をディスクに保存する説明はありません。— [GitHub](https://github.com/legendary0001/mineflayer-farmbot)
- PrismarineJS/mineflayer-statemachine:MIT。`StateTransition`(`shouldTransition`)、`NestedStateMachine`、`BotStateMachine`、Web ビューがあり、採掘・設置の behavior も含みます。— [GitHub](https://github.com/PrismarineJS/mineflayer-statemachine)
- 検索結果に出たその他(未精査):Darthfett/Helperbot(strip コマンドと停止・再開)、Catalyst-42/mineflyaer-digger-bot(最終 push 2022)。— [検索結果の出典: Helperbot](https://github.com/Darthfett/Helperbot)

#### 読んだ範囲
- 全文取得:Voyager の README、mineBlock.js、placeItem.js、ディレクトリ一覧、Mindcraft の README と skills.js、minebot と minecraftLegion の README と API、farmbot の README、mineflayer-statemachine の README
- 未読:Voyager の useChest/craftItem/smeltItem、Mindcraft の modes.js(自己防衛・自動照明などの常駐挙動)、minecraftLegion の Miner の実装、Helperbot、digger-bot

### Inferences
- 【推論】Liz Atlas の初期目標(16 チャンクを Y=−59 まで掘る)に最も近いのは、minebot の「通路 + 左右の鉱石探索 + 橋渡し + 松明 + チェスト往復」と、minecraftLegion の「チャンク範囲の採掘ジョブ + チェスト情報の共有」の組み合わせです。ただしどちらも新しいバージョンや大規模運用での実績は確認できません。
- 【推論】Mindcraft の `digDown` の安全チェック(下が液体なら止まる、空洞なら止まる)と、`goToGoal` の段階的な緩和(まず壊さない経路、次に壊す経路)は、そのまま移植する価値のある小さな部品です。ライセンスも MIT です。
- 【推論】Voyager の失敗カウンタがリセットされない点は、長時間動かす bot では避けるべき実装例です(失敗カウンタはタスク単位で持つべき)。

### Gaps
- Mindcraft と Voyager が 26.1.x と Mineflayer 4.39 で動くかは未確認です(Mindcraft は 1.21.11 まで)。
- minecraftLegion のライセンスは不明です(LICENSE ファイルが無い可能性。流用は不可と考えるべき)。
- 「16 チャンク規模の無人採掘」を長時間回した Mineflayer の公開実績は見つかりませんでした。

---

## Q6. 長時間の自動採掘・建築から得られる設計の教訓(状態機械、シュルカー・エンダーチェストからの補給、切断後の再開)

### Takeaway
今回読んだ一次資料に共通する安全策は、「進捗の最終的な判定は常にワールドとの差分で行い、メモリ上の状態は失われても作り直せるようにする」ことです(Baritone の `incorrectPositions`/`fullRecalc`、Altoclef の毎 tick 再評価)。シュルカーボックスからの補給を具体的に実装しているのは Printer 4th と Hana で、どちらも外部 mod(Quick Shulker 等)とサーバー側の対応を前提にしています。Mineflayer で使える既製の仕組みは見つかりませんでした。

### Cited Findings
- Baritone は、差分集合と「完成を確認した位置」(`observedCompleted`)をメモリ上だけで持ちます。`onLostControl` で全消去し、再開時はワールドを走査し直します。置けないときは "Unable to do it. Pausing." で一時停止し、`resume` で再開します。— [BuilderProcess.java](https://raw.githubusercontent.com/cabaletta/baritone/1.21.4/src/main/java/baritone/process/BuilderProcess.java)
- Altoclef は、優先度付きのチェーンで割り込みます(`onInterrupt`)。タスクは `interrupt` 後に `onStart` からやり直します。停滞は `MovementProgressChecker` で検出し、`TimeoutWanderTask` で場所を変えます。— [TaskRunner.java](https://raw.githubusercontent.com/gaucho-matrero/altoclef/main/src/main/java/adris/altoclef/tasksystem/TaskRunner.java)、[Task.java](https://raw.githubusercontent.com/gaucho-matrero/altoclef/main/src/main/java/adris/altoclef/tasksystem/Task.java)、[TimeoutWanderTask.java](https://raw.githubusercontent.com/gaucho-matrero/altoclef/main/src/main/java/adris/altoclef/tasks/movement/TimeoutWanderTask.java)
- Printer 4th は、Quick Shulker / AxShulkers / TakeItOut でシュルカーボックスから材料を補給します。HUD で不足材料と待機理由を表示し、Quick Shulker はクライアントとサーバーで版を合わせる必要があるとしています。— [Modrinth: Printer 4th](https://modrinth.com/mod/litematica-printer-4th)
- Hana は、Quick Shulker を使うには「インベントリからシュルカーを開く」機能をサーバーが持っている必要があるとしています。— [Modrinth: Hana](https://modrinth.com/mod/litematica-printer-hana)
- minebot は、看板に進捗(トンネルの長さ、危険)を記録し、体力 50% 未満でログアウトし、スタート地点のチェストで道具を補充します。— [appenz/minebot](https://github.com/appenz/minebot)
- minecraftLegion は、bot 同士がチェストの中身の情報を共有し、必要なアイテムがあるチェストへ直行します。— [minecraftLegion](https://github.com/sefirosweb/minecraftLegion)
- mineflayer-farmbot は、切断時に 20 秒ごとに再接続し、チェストが満杯なら停止します。— [mineflayer-farmbot](https://github.com/legendary0001/mineflayer-farmbot)
- mineflayer-schem は、連続 10 回失敗するとキューを回して 2 秒待ちます。支えの無い位置は最大 3 回まで再投入し、その後は失敗として数えます。— [index.js](https://unpkg.com/mineflayer-schem@1.5.2/index.js)

#### 読んだ範囲
- 上の Q1〜Q5 で読んだものの再利用です。エンダーチェストを使った補給、2b2t の長期採掘・道路建設プロジェクトの文書などは、今回は検索も閲覧もしていません。

### Inferences
- 【推論】Liz Atlas への教訓:
  1. 作業単位(チャンクの区画・層・列など)ごとに「完了フラグ」を JSON か DB に保存します。ただし再開時は、その区画のワールドを走査して差分から作業を再生成します(保存した状態を盲信しない)。
  2. 失敗カウンタは作業単位ごとに持ち、閾値を超えたら「保留キュー」に移して、人に知らせるか別の bot に回します。
  3. 生存の割り込み(食事、溶岩・落下の回避、体力低下での撤退)は優先度付きチェーンで分離します。
- 【推論】自分のサーバーでバニラ挙動を前提にするなら、シュルカーボックスは「置いて開けて中身を取り、壊して回収する」という人間の手順でしか扱えません(インベントリから直接開くには mod が必要)。補給は基地のチェストかエンダーチェストとの往復を基本とし、シュルカーは運搬用の容器として、置いて・開けて・回収する動作を基本動作の一つにするのが現実的です。
- 【推論】Baritone の `cleararea` が「空気を建てる」ビルダーの一種であるように、採掘(整地)と建築を同じ「差分を解消する」エンジンで扱うと、足場の撤去(schematic 上で空気の位置にある足場 = 不正なので壊す)まで一つの仕組みで統一できます。

### Gaps
- エンダーチェストやシュルカーを使った補給の、Mineflayer での公開実装は今回探していません。
- 2b2t など大規模な長期プロジェクトの事後報告は、調査の範囲外として未読です。
- Altoclef の FoodChain・MobDefenseChain の具体的な閾値は未確認です。
