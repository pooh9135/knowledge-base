# サーバー側のbot（Carpet等）とログイン方式・Fabricサーバー設定・Discord通知

調査日：すべて 2026-11-14（以下「確認日」は特記なき限り 2026-11-14）。
調査方法：WebSearch と WebFetch のみ。WebFetch はページを要約モデル経由で読むため、**どのページも「全文を原文で精読した」わけではない**（要約経由の読み取り）。下の「読んだもの／読めなかったもの」を参照。

### 読んだもの・一部だけ読んだもの・読めなかったもの
- 要約経由で全体を読んだ：Carpet の PlayerCommand.java（ソース）、Scarpet docs の Entities.md / Inventories.md / Auxiliary.md、Carpet wiki Commands、Carpet GitHub Releases 1ページ目（10件のみ）、Modrinth API（carpet / fabric-api / lithium / ferrite-core / c2me-fabric / modernfix / krypton / spark / chunky / easyauth / fabricproxy-lite の 26.1.2 版一覧）、Modrinth の carpet 26.1 版ページ、Lithium・C2ME の Modrinth 説明文、fabricmc.net の 26.1 告知、meta.fabricmc.net（loader / installer）、Velocity docs の player-information-forwarding と security、EasyAuth の README と wiki Config、Discord docs の Webhook と Rate Limits、node-minecraft-protocol API.md、mineflayer api.md。
- 一部だけ読んだ（長すぎて先頭10万字のみ）：minecraft.wiki の Server.properties、Mob spawning、Java Edition 26.1.2。
- 読めなかった：minecraft.net の EULA（en-us / ja-jp）と Usage Guidelines（en-us / en-gb / pl-pl）は **すべてタイムアウト**。EULA/ガイドラインの記述は検索結果スニペット経由の二次情報のみ。EasyAuth wiki の AutoLogin ページは中身が空（未作成ページ）。たいち氏の動画ページ・概要欄は今回取得していない。
- 調べていない：Tailscale / ZeroTier の公式ドキュメント、Krypton・FerriteCore・ModernFix の説明文、Carpet 以外のサーバー側bot MOD、Discord のメッセージ作成API（bot token 側）の詳細ページ、メモリ推奨フラグ。

---

## 1. Carpet の fake player（/player と Scarpet）でbotを動かせるか

### Takeaway
Carpet 26.1（26.1 / 26.1.1 / 26.1.2 対応、release）は存在し、`/player` で「ほぼ本物のプレイヤーのように振る舞う」fake player をアカウント不要で出せる。ただし操作は「前進・視点・左右クリック・ジャンプ」などの低レベル入力だけで、経路探索・建築計画などの自律作業機能は無い。Scarpet で補えるが、Mineflayer の pathfinder 等のようなエコシステムは無く、さらに Scarpet にはアイテムを無から作れる関数もあるため「バニラ維持」の方針とは自分で線を引く必要がある。

### Cited Findings
- **26.1.2 対応**：Modrinth API で Carpet の 26.1.2 対応版は `26.1`（名称 "Carpet 26.1"、game_versions 26.1 / 26.1.1 / 26.1.2、release、date_published 2026-06-16）の1件 — [Modrinth API](https://api.modrinth.com/v2/project/carpet/version?game_versions=["26.1.2"])
- 同版の changelog：26.1 対応、メモリリークと fake player 関連の修正、fake player のエリトラ飛行対応（いずれも @altrisi） — [Modrinth version page](https://modrinth.com/project/TQTTVgYE/version/ygtmLbO3)
- GitHub Releases の最新は 26.4-beta-6（26.4-snapshot-8 向け、11月12日）。安定版の最新は 26.3（9月15日）。つまり 26.1 系は最新ではない — [GitHub Releases](https://github.com/gnembon/fabric-carpet/releases)
- wiki は `/player` を「ほぼ本物のプレイヤーのように振る舞う fake player を作る」コマンドと説明。ただし wiki の該当節は "Finish /player" と TODO 扱いで未完成 — [Carpet wiki Commands](https://github.com/gnembon/fabric-carpet/wiki/Commands)
- ソースコード上の `/player <name>` サブコマンド（PlayerCommand.java）：
  - `spawn`（任意で `at <座標>` → `facing <向き>` → `in <ディメンション>` → `in <ゲームモード>`。ゲームモード指定は OP の gamemaster 権限が必要）
  - `use` / `attack` / `jump` / `swapHands`：`once`（既定）・`continuous`・`interval <tick>`
  - `drop` / `dropStack`（`all`・`mainhand`・`offhand`・`slot <0-40>`）、`hotbar <1-9>`、`mount` / `dismount`
  - `sneak` / `unsneak` / `sprint` / `unsprint`、`look`（方角・`up`/`down`・`at <座標>`・角度）、`turn`、`move forward/backward/left/right`（引数なしで停止）
  - `stop` / `kill` / `shadow`
  — [PlayerCommand.java](https://raw.githubusercontent.com/gnembon/fabric-carpet/master/src/main/java/carpet/commands/PlayerCommand.java)
- 権限・名前のルール（同ソース）：コマンド全体が Carpet ルール `commandPlayer` で制御される。OP でない人は fake player 以外を操作できない。移動・kill できるのは fake player だけ。spawn 時、UUID が見つからず `allowSpawningOfflinePlayers` が false なら拒否、true ならオフライン UUID を生成。BAN 済みの名前は拒否。ホワイトリスト有効サーバーでは、ホワイトリスト登録済みの名前を spawn できるのは gamemaster 権限の OP のみ — [PlayerCommand.java](https://raw.githubusercontent.com/gnembon/fabric-carpet/master/src/main/java/carpet/commands/PlayerCommand.java)
- `shadow` はサーバーでのみ動作（シングル不可） — [Carpet wiki Commands](https://github.com/gnembon/fabric-carpet/wiki/Commands)
- Scarpet：`query(e,'player_type')` は carpet が出した fake player なら `'fake'`、shadow なら `'shadow'` を返す。プレイヤーに対して `modify` で `jump`・`jumping`・`swing`・`selected_slot`・`gamemode`・`hunger` 等を変更でき、`query` で `input`・`holds`・`breaking_progress` 等を読める。Entities.md には Scarpet から fake player を spawn する専用関数の記述は無い — [Scarpet Entities.md](https://raw.githubusercontent.com/gnembon/fabric-carpet/master/docs/scarpet/api/Entities.md)
- Scarpet の `run(expr)` は文字列でバニラ/MOD コマンドを実行する関数（`/script run` から直接呼ぶとキューに入り null を返すので、tick イベント等から呼ぶ） — [Scarpet Auxiliary.md](https://raw.githubusercontent.com/gnembon/fabric-carpet/master/docs/scarpet/api/Auxiliary.md)
- Scarpet のインベントリ関数：`inventory_get` / `inventory_set` / `inventory_find` / `inventory_remove` / `drop_item` などがプレイヤーのインベントリにも使え、`recipe_data` でレシピ取得可能。`inventory_set` は任意のスロットに任意のアイテムを個数指定で置ける — [Scarpet Inventories.md](https://raw.githubusercontent.com/gnembon/fabric-carpet/master/docs/scarpet/api/Inventories.md)

### Inferences（推論・筆者の解釈）
- 【解釈】`/player` は「入力の再現」までで、目的地への経路探索・ブロック設置計画・資材管理は一切無い。Scarpet（独自言語、サーバー内で動作）で全部自作する必要があり、Mineflayer の pathfinder / collectblock 等に相当するライブラリは公式 docs に見当たらない。10〜20体の自律作業を作るなら開発量は Mineflayer より多くなる可能性が高い。
- 【解釈】利点：アカウント・認証が不要（`allowSpawningOfflinePlayers` 使用時）、ネットワーク遅延なし、サーバー内で完結。欠点：Scarpet という新しい言語の学習、デバッグ手段が乏しい、Minecraft 更新ごとに Carpet の対応待ち（26.1 対応版の公開は 2026-06-16 で、26.1 リリースから数か月遅れ）。
- 【解釈】Scarpet の `inventory_set` などは「無からアイテムを作る」ことが可能で、これを使うと「botに有利な設定はしない」というユーザー方針に反する。fake player 方式を選ぶなら、使ってよい関数を自分で決めて守る必要がある。
- 【解釈】fake player は Node.js から直接操作できない。外部から操る場合は RCON 等でコマンドを送る形になり、ゲーム状態の読み取りが難しくなる（RCON の詳細は未調査）。

### Gaps
- Carpet 以外に、サーバー側でbotを出して経路探索まで行う Fabric MOD（例：他のアドオン）は今回調べていない。
- fake player の負荷（1体あたり）に関する公式記述は見つけていない。

---

## 2. たいち氏の動画3本はどうやってbotを動かしているか（公開情報）

### Takeaway
今回の検索（WebSearch）では、3本の動画やその解説記事は**見つからなかった**。動画の中身については、同じプロジェクトの以前のセッション（2026-11-13）で動画の文字起こしから記録されたメモがあり、そこでは「Mineflayer ベース」「概要欄には Mineflayer 本体へのリンクのみ、bot のソースは非公開」「露天掘り動画ではサーバー側に『壊したブロックが直接インベントリに入る』等のカスタムあり」とされている。ただし本調査で私自身は再確認していない。

### Cited Findings
- 検索「たいち 60体のボットに整地をさせてみた mineflayer」「ボットに全自動で露天掘りさせてみた たいち」「"AIボットに建築させてみた" マイクラ」はいずれも該当動画・記事にヒットせず（一般的な Mineflayer 情報や無関係な記事のみ） — 検索結果例：[mineflayer-swarm (npm)](https://www.npmjs.com/package/mineflayer-swarm)
- 以前のセッションのメモ（プロジェクト内の記録。2026-11-13 にアプリ内ブラウザで文字起こしパネルから取得と記載）：
  - [60体のボットに整地をさせてみた](https://youtu.be/o663bdNBYhA)（2025-05-24）
  - [AIボットに建築させてみた](https://youtu.be/dike_nUZeoM)（2025-08-01）：空中設置（通常クライアントでは不可）に依存と記録
  - [ボットに全自動で露天掘りさせてみた](https://youtu.be/VYNxRjaEoR4)（2026-10-30）：サーバー側に破壊ブロックが直接インベントリに入る等のカスタムありと記録
  - いずれも「Mineflayer ベース」「概要欄に bot ソースなし、Mineflayer 本体へのリンクのみ」と記録

### Inferences
- 【解釈】上のメモが正しければ、たいち氏の方式は「サーバーMODでbotを生成」ではなく「外部の Mineflayer bot がログイン」であり、ユーザーの「サーバーMODでbotを出しているのでは」という認識とは異なる。ただしサーバー側を bot に有利に改造している点（空中設置、ドロップ直接回収）はあり、これはユーザーの「バニラ維持」方針と相容れない部分。
- 【解釈】bot のログイン方法（オフラインモードか、アカウントか）は公開情報では確認できていない。

### Gaps
- bot のログイン方式、サーバーの online-mode 設定、使用 MOD 名は公開情報で確認できなかった。動画内で語られている可能性はあるが、本調査では動画を視聴・取得していない。

---

## 3. ログイン方式の比較（bot 10〜20体＋人間の見学者3〜4人）

### Takeaway
公式ドキュメントで裏付けが取れた範囲では、(b) Velocity（online-mode）＋ FabricProxy-Lite（バックエンドは offline）の構成が「人間は正規認証、バックエンドは 127.0.0.1 のみで待受」という形を作れる。ただし Velocity 自体は全員にMicrosoft認証を求めるので、bot をどう通すかは別途の工夫が必要で、公式に「ローカルbotだけ認証免除」する機能は確認できなかった。(a) 単純な online-mode=false は公式 wiki が「インターネットに繋がっていないときだけ」と警告している。(c) EasyAuth は 26.1.2 版が beta のみ。(d) 1bot1アカウントは確実だが費用がかかる（金額は未確認）。Minecraft の Usage Guidelines は「サーバーへのアクセスは正規購入版の利用者に限る」趣旨とされるが、公式ページは今回取得できず二次情報のみ。

### Cited Findings
**(a) online-mode=false**
- `online-mode` 既定値 true。false にすると未検証アカウントでも参加可能。wiki は「サーバーがインターネットに接続されていないときにのみ false にすべき」と記述 — [minecraft.wiki Server.properties](https://minecraft.wiki/w/Server.properties)
- Velocity docs：オフラインのバックエンドに直接到達できる人は、任意のプレイヤーになりすませる — [Velocity Security](https://docs.papermc.io/velocity/security)
- `white-list`（wiki記載の既定 true）は whitelist.json を参照、OP は自動で許可。`enforce-whitelist`（既定 false）を true にするとホワイトリスト再読込時に非登録者をキック — [minecraft.wiki Server.properties](https://minecraft.wiki/w/Server.properties)
- `enable-status`（既定 true）を false にするとサーバー一覧上でオフラインに見えるが接続は受け付ける。`hide-online-players`（既定 false）でステータス応答からプレイヤー一覧を除外 — [minecraft.wiki Server.properties](https://minecraft.wiki/w/Server.properties)
- Mineflayer は password やトークンを省くとオフラインモードで接続を試みる。node-minecraft-protocol の `auth` は `microsoft` / `mojang` / `offline`（既定 `offline`） — [mineflayer api.md](https://raw.githubusercontent.com/PrismarineJS/mineflayer/master/docs/api.md)、[node-minecraft-protocol API.md](https://raw.githubusercontent.com/PrismarineJS/node-minecraft-protocol/master/docs/API.md)

**(b) Velocity（online）＋ offline バックエンド＋ FabricProxy-Lite**
- 認証はプロキシで行うため、バックエンドは `online-mode` を無効にする。Fabric で modern forwarding を使うには FabricProxy-Lite を入れる。modern は MAC でプロキシのなりすましを難しくする。legacy は「根本的に安全でない」 — [Velocity Player info forwarding](https://docs.papermc.io/velocity/player-information-forwarding)
- バックエンドはプロキシからの接続だけ受けるべき。方法：OS ファイアウォール（Windows Firewall 等、強く推奨）、または `server-ip=127.0.0.1` にして velocity.toml でも `127.0.0.1:<port>` を指定（同一マシン時のみ）。modern forwarding はファイアウォールの代わりにはならない — [Velocity Security](https://docs.papermc.io/velocity/security)
- FabricProxy-Lite の 26.1.2 対応版：`v2.12.0`（26.1〜26.3、release、2026-03-28） — [Modrinth API](https://api.modrinth.com/v2/project/fabricproxy-lite/version?game_versions=["26.1.2"])

**(c) EasyAuth**
- 「Offline/Online サーバー向けの認証MOD」。未認証プレイヤーは移動・設置・コマンド・インベントリ操作が不可。登録/ログイン必須、SQLite（既定）等に保存、TOTP 二段階認証、IP 制限、セッション自動ログインあり。購入済みプレイヤーの自動ログインとオンライン UUID 対応をうたうが、正規購入の判定方法は README に書かれていない — [EasyAuth README](https://github.com/NikitaCartes/EasyAuth)
- 設定：`premiumAutologin`（既定 false、有効なセッションを持つプレイヤーは認証を省略）、`forcedOfflinePlayers`（常にオフライン扱いする名前一覧）、`sessionTimeoutTime`（既定 3600 秒）、ハッシュは既定 Argon2、`minPasswordChars` 既定 4、`maxLoginTries=-1` は「推奨しない」 — [EasyAuth wiki Config](https://github.com/NikitaCartes/EasyAuth/wiki/Config)
- 26.1.2 対応版：`3.4.3-SNAPSHOT.48`（fabric、**beta**、2026-03-31） — [Modrinth API](https://api.modrinth.com/v2/project/easyauth/version?game_versions=["26.1.2"])
- AutoLogin の wiki ページは未作成（空） — [EasyAuth wiki AutoLogin](https://github.com/NikitaCartes/EasyAuth/wiki/AutoLogin)

**(d) 1bot＝1 Microsoft アカウント**
- node-minecraft-protocol：Microsoft 認証は password を空にすると device code 方式。`onMsaCode` コールバックでコードを受け取れる。`profilesFolder` に認証キャッシュを保存（既定 `.minecraft`）。password 指定方式は「常に動くとは限らない」 — [node-minecraft-protocol API.md](https://raw.githubusercontent.com/PrismarineJS/node-minecraft-protocol/master/docs/API.md)
- 各アカウントがゲームを所有している必要があるかは同ページに記載なし — 同上

**EULA / Usage Guidelines（公式ページは取得失敗、二次情報）**
- 検索スニペットによると Usage Guidelines のサーバー節に「サーバーへのアクセスは正規の有料版を持つユーザーにのみ与えること」という趣旨の記述がある — [Usage Guidelines（検索結果、本文未取得）](https://www.minecraft.net/pl-pl/usage-guidelines)
- EULA は Usage Guidelines が頻繁に変わり、許可はいつでも撤回されうると述べている（スニペット） — [EULA（本文未取得）](https://www.minecraft.net/en-us/eula)
- 自動化クライアント（bot）について公式文書が何と言っているかは確認できなかった。

### Inferences
- 【解釈】ユーザーの条件（自宅PC、見学者は3〜4人だけ）なら、最も安全で簡単なのは「ポート開放しない＋見学者だけ Tailscale 等のプライベートVPNで入れる＋ online-mode=false ＋ホワイトリスト」か、「Velocity で人間を正規認証、バックエンドは 127.0.0.1」。前者は VPN 内の人なら誰の名前でも名乗れる（見学者を信頼できる前提）。Tailscale/ZeroTier の公式ドキュメントは今回読んでいない。
- 【解釈】オフラインモードではホワイトリストは「名前（オフラインUUID）」で照合されるため、名前を偽れば通過できると考えられる。ホワイトリストは online-mode=false の防御にはならない（公式記述での確認はしていない）。
- 【解釈】Velocity 構成で bot を通すには、bot を Velocity を経由せずバックエンド（127.0.0.1）に直接つながせる案が考えられる。バックエンドが FabricProxy-Lite で modern forwarding を要求する設定だと直接接続は拒否される可能性があり、可否は FabricProxy-Lite の設定次第（未確認）。
- 【解釈】Usage Guidelines の「正規購入者のみ」の趣旨を厳密に読むと、オフライン名の bot を入れることとの関係は公式に明言されていない。判断はユーザー自身が公式本文を読んで行うべき。

### Gaps
- EULA と Usage Guidelines の本文（全ロケールでタイムアウト）。
- Minecraft Java Edition のアカウント価格（1bot1アカウントの費用）。
- Velocity の 26.1.2 対応状況（Velocity は Modrinth API で確認していない）。
- 「インターネット全体のサーバースキャナー」に関する一次情報。
- Tailscale / ZeroTier の公式手順。

---

## 4. Fabric 専用サーバー（26.1.2）の準備と server.properties

### Takeaway
26.1.2 は Java 25 以上が必要。Fabric Loader の最新安定版は 0.20.1（26.1.2 で利用可）、インストーラー最新安定は 1.1.2、Fabric API の 26.1.2 最新は 0.155.3+26.1.2。bot に関係する server.properties の既定値は下表の通り（minecraft.wiki 準拠）。

### Cited Findings
- 26.1.2：2026-04-09 リリース、必要 Java は Java SE 25 以上、プロトコル 775、データバージョン 4790 — [minecraft.wiki Java Edition 26.1.2](https://minecraft.wiki/w/Java_Edition_26.1.2)
- 26.1 は難読化されていない最初のバージョンで、1.21.11 以前用の MOD はそのままでは動かない。ワールド保存形式の大きな変更のためバックアップを推奨。告知時点の推奨 Loader は 0.18.4（2026-03-14 の告知） — [fabricmc.net 26.1 告知](https://fabricmc.net/2026/03/14/261.html)
- Fabric Loader の最新は 0.20.1（stable）。26.1.2 用の loader 一覧の先頭も 0.20.1 — [meta loader](https://meta.fabricmc.net/v2/versions/loader)、[meta loader 26.1.2](https://meta.fabricmc.net/v2/versions/loader/26.1.2)
- Fabric インストーラー最新 stable は 1.1.2 — [meta installer](https://meta.fabricmc.net/v2/versions/installer)
- Fabric API 26.1.2 版：0.155.3+26.1.2（release、2026-09-07） — [Modrinth API](https://api.modrinth.com/v2/project/fabric-api/version?game_versions=["26.1.2"])
- fabricmc.net/use/server ページ自体はバージョンやコマンドを表示しなかった（JS 生成と思われる） — [fabricmc.net/use/server](https://fabricmc.net/use/server/)
- server.properties（既定値と効果） — すべて [minecraft.wiki Server.properties](https://minecraft.wiki/w/Server.properties)：
  | キー | 既定 | 効果（要約） |
  |---|---|---|
  | spawn-protection | 16 | スポーン周囲の保護半径。0 で無効。OP が一人もいないと自動で無効 |
  | max-players | 20 | 同時接続上限（bot も数に入る） |
  | view-distance | 10 | クライアントに送るチャンク半径 |
  | simulation-distance | 10 | プレイヤー周囲でエンティティ等が更新されるチャンク半径 |
  | player-idle-timeout | 0 | 無操作キックまでの分数。0 で無効 |
  | allow-flight | false | false だとサバイバルで約5秒空中にいるとキック |
  | network-compression-threshold | 256 | この大きさ以上のパケットを圧縮。-1 無効 |
  | pause-when-empty-seconds | 60 | 最後のプレイヤー退出後、何秒でサーバーを一時停止するか |
  | rate-limit | 0 | プレイヤーが送れるパケット数の上限。0 で無効 |
  | enforce-secure-profile | true | Mojang 署名の公開鍵を必須にする |
  | white-list | true（wiki記載） | whitelist.json を使用 |
  | enforce-whitelist | false | 再読込時に非登録者をキック |
  | online-mode | true | アカウント検証の有無 |
  | server-ip | 空 | 待受 IP。空なら全インターフェース |

### Inferences
- 【解釈】`max-players` は bot 20体＋人間4人で 24 以上が必要。
- 【解釈】`enforce-secure-profile=true` のままだと、オフライン名の bot は署名鍵を持たないため入れない可能性が高い。オフライン運用時は false が必要になると考えられるが、公式の明言は未確認。
- 【解釈】`allow-flight=false` は bot が足場から落ちる・段差で浮く動きでキックされる原因になりうるが、true にすると飛行系の不正を許すことになるので「バニラ維持」とのトレードオフ。
- 【解釈】`pause-when-empty-seconds` は bot が常時接続していれば発動しない。
- 【解釈】white-list の既定値は従来 false と記憶しているが、wiki 要約では true と出た。実際に生成される server.properties で確認すべき。

### Gaps
- Java の推奨メモリフラグ（Aikar フラグ等）は今回一次情報を確認していない。
- `rate-limit` が多数 bot の正常動作に影響する具体的な値は未確認。

---

## 5. 性能MOD・spark・Chunky・バックアップ（26.1.2 対応状況）

### Takeaway
26.1.2 対応（Modrinth で確認）：Lithium、FerriteCore、C2ME（alpha のみ）、Krypton、spark、Chunky、FabricProxy-Lite、Fast Backups ほか。ModernFix は 26.1.2 の Fabric 版が見つからなかった。

### Cited Findings
- Lithium：`mc26.1.2-0.24.7-fabric`（release、2026-07-29） — [Modrinth API](https://api.modrinth.com/v2/project/lithium/version?game_versions=["26.1.2"]&loaders=["fabric"])。説明文で「バニラの仕組みを一切変えないこと」を目標とし、サーバーのみ導入で可、設定ファイルで個別パッチを無効化可能 — [Modrinth Lithium](https://modrinth.com/mod/lithium)
- FerriteCore：`9.0.0-fabric`（26.1〜26.3、release、2026-03-24） — [Modrinth API](https://api.modrinth.com/v2/project/ferrite-core/version?game_versions=["26.1.2"]&loaders=["fabric"])
- C2ME：26.1.2 版は `0.4.0-alpha.0.71+26.1.2`（**alpha**、2026-11-12） — [Modrinth API](https://api.modrinth.com/v2/project/c2me-fabric/version?game_versions=["26.1.2"])。説明文：既定ではバニラの挙動やワールド生成を変えない、同じシードでもバニラ自体の非決定性で差が出うる、カスタムワールド生成MODは壊れうる、ワールドのバックアップを取ること、最新リリースのみ完全サポートで古いリリースは重大修正のみ — [Modrinth C2ME](https://modrinth.com/mod/c2me-fabric)
- ModernFix：Fabric・26.1.2 指定の検索結果は空配列（2026-11-14 時点で見つからず） — [Modrinth API](https://api.modrinth.com/v2/project/modernfix/version?game_versions=["26.1.2"]&loaders=["fabric"])
- Krypton：`0.3.0`（26.1〜26.1.2、release、2026-04-21） — [Modrinth API](https://api.modrinth.com/v2/project/krypton/version?game_versions=["26.1.2"])
- spark：`1.10.187-fabric`（26.1〜26.3、release、2026-09-19） — [Modrinth API](https://api.modrinth.com/v2/project/spark/version?game_versions=["26.1.2"]&loaders=["fabric"])
- Chunky：`1.5.66`（26.1〜26.3、release、2026-11-04） — [Modrinth API](https://api.modrinth.com/v2/project/chunky/version?game_versions=["26.1.2"]&loaders=["fabric"])
- バックアップMOD（26.1.2・Fabric で検索）：Fast Backups（Git による差分バックアップ、サーバー必須）、Just Enough Backups、Simple Backups for Fabric など — [Modrinth search](https://api.modrinth.com/v2/search?query=backup&facets=[["versions:26.1.2"],["categories:fabric"]]&limit=6)

### Inferences
- 【解釈】26.1.2 は MOD 側の「最新」から外れつつある（多くの MOD・Carpet が 26.3 / 26.4 へ移行中）。C2ME は 26.1.2 では alpha かつ「古いリリース」扱いになるので、初心者には Lithium＋FerriteCore＋spark＋Chunky あたりから始め、C2ME は問題が出たら外す前提が無難。
- 【解釈】Krypton は通信最適化MODで、Velocity 等との相性は未確認。

### Gaps
- FerriteCore / Krypton / spark / Chunky の説明文（挙動変化の記載）は読んでいない。
- ScalableLux（C2ME が推奨）の 26.1.2 対応は未確認。

---

## 6. bot を多数ログインさせたときのゲームルール・仕組みへの影響

### Takeaway
bot も「プレイヤー」なので、敵モブの上限・スポーン範囲・睡眠によるスキップ・チャンク読込がプレイヤー数に応じて変わる。ゲームルール名は 1.21.11 から snake_case に変更済み。

### Cited Findings
- 敵対モブの上限は基本 70。全体上限＝mobCap × chunks ÷ 289（chunks は各プレイヤー周囲 17×17 チャンクの合計、重なりは1回だけ数える）なので、プレイヤーが散らばるほど上限が上がる。プレイヤーごとの上限もあり、半径128ブロック以内のチャンクの非永続モブがそのプレイヤーの枠に数えられる — [minecraft.wiki Mob spawning](https://minecraft.wiki/w/Mob_spawning)
- モブはプレイヤー中心の半径128ブロックの球内でのみスポーン、プレイヤーやワールドスポーンから24ブロック以内ではスポーンしない。最寄りプレイヤーから128ブロック超の敵対モブは即デスポーン。view distance 9 以下でスポーンが大きく減るため 10 以上推奨と記載 — [minecraft.wiki Mob spawning](https://minecraft.wiki/w/Mob_spawning)
- ゲームルール（1.21.11 / 25w44a で snake_case に改名）：`players_sleeping_percentage`（既定 100）、`max_entity_cramming`（既定 24、押せるエンティティ数を超えると窒息ダメージ）、`spawn_phantoms`（旧 doInsomnia、既定 true）、`keep_inventory`（既定 false）、`random_tick_speed`（既定 3）、`spectators_generate_chunks`（既定 true）。`spawnChunkRadius` は 25w31a（1.21.9）で削除 — [minecraft.wiki Game rule](https://minecraft.wiki/w/Game_rule)

### Inferences
- 【解釈】`players_sleeping_percentage` が既定 100 だと、bot が寝ない限り夜はスキップされない（bot が多いほど人間だけでは夜を飛ばせない）。これを下げるのは「botに有利」というより人間の利便性の話だが、バニラ維持方針との兼ね合いでユーザーが判断すべき。
- 【解釈】bot を広く散らばらせると、敵モブの全体上限が上がり、各 bot 周辺で敵が湧く。サバイバルでは bot の死亡原因になる。
- 【解釈】各 bot の周囲 `simulation-distance` 分のチャンクが処理されるため、散らばった 20体はサーバー負荷を大きく上げる。spark で計測するのが確実。
- 【解釈】同じマスに bot が密集すると `max_entity_cramming`（24）でダメージを受けうる（以前のメモにある「同一マスに密集して圧死」と整合）。

### Gaps
- Java 版のモブスポーンと simulation distance の関係（wiki の Java 節には記載なしと要約された、後半未読）。
- 1.18 以降のプレイヤーごと上限の詳細。

---

## 7. Node.js から Discord に通知する方法（Webhook と Bot token）

### Takeaway
通知だけなら Webhook が最も簡単：URL（ID とトークン入り）に POST するだけで bot ユーザーも認証も不要。本文は最大2000文字、embed は最大10個。レート制限は固定値をハードコードせず、応答ヘッダと 429 の `retry_after` に従う。Webhook URL 自体が秘密なのでソースに書かない。

### Cited Findings
- Webhook 実行：`POST /webhooks/{webhook.id}/{webhook.token}`。「bot ユーザーや認証は不要」。`content`・`embeds` 等のどれか1つ以上が必須。`content` 最大2000文字、embed 最大10個。`wait=true` で送信確認を待つ（既定 false では保存失敗でもエラーにならない）。`allowed_mentions` で意図しないメンションを防ぐことを推奨 — [Discord Webhook](https://docs.discord.com/developers/resources/webhook)
- Webhook 作成には `MANAGE_WEBHOOKS` 権限が必要。名前に "clyde" "discord" は使えない — [Discord Webhook](https://docs.discord.com/developers/resources/webhook)
- レート制限：ルートごとのバケット、`X-RateLimit-*` ヘッダを実行時に読む（「ハードコードすべきでない」）、429 時は `Retry-After` / `retry_after` 秒待つ。bot は全体で毎秒50リクエスト。Webhook は webhook_id ごとに独立計算。401/403/429 が10分間に10,000回を超えると IP が一時制限。404 を返す Webhook は使用をやめる — [Discord Rate Limits](https://docs.discord.com/developers/topics/rate-limits)

### Inferences
- 【解釈】サーバーID・チャンネルIDが分かっていても、Webhook 方式ではそれらは不要（Webhook URL だけで送れる）。Bot token 方式は双方向（コマンド受付など）が必要になったときに検討すればよい。
- 【解釈】秘密の扱い：Webhook URL や bot token は `.env` ファイルに置いて `.gitignore` に追加し、`process.env` で読む方法が一般的。Discord 公式がこの方法を推奨しているかは今回確認していない。万一公開したら Discord 側で Webhook を削除・再作成する。
- 【解釈】bot 20体が個別に通知すると 429 になりうるので、通知は1か所（管理プロセス）にまとめ、キューで送る設計が安全。

### Gaps
- Bot token でメッセージを送る API（Create Message）の権限要件・Gateway 接続の要否は今回読んでいない。
- Discord 公式の「秘密情報の保管」ガイドは未確認。
