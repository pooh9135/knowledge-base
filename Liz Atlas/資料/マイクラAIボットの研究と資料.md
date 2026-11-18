---
title: マイクラAIボットの研究と資料
date: 2026-11-14
tags:
  - liz-atlas
  - 資料
  - 調査報告
status: 調査メモ 6 本をまとめた報告書（2026-11-14 調べ）
---

> [!abstract] 先に結論
> 1. **「設計図から、サバイバルで、10〜20 体のbotが、何時間も無人で掘ったり建てたりする」ことをやってみせた研究やソフトは、見つかりませんでした。** 研究にあるのは、2〜8 体が 10〜60 分の課題をこなす例までです。
> 2. **仕事の割り当ては、AI同士の話し合いより、1つの司令塔がまとめて決めるほうが成績が良い**、という結果が複数の研究でそろっています。Liz Atlas の方針と同じ向きです。
> 3. **そのまま使える既製品は少ないです。** Baritone や Litematica Printer は、設計を学ぶ教科書になりますが、Mineflayer では動きません。Mineflayer 用の建築部品は、使える段階にありません。
> 4. **Mineflayer が公式に試験しているのは 26.1 までです。** 26.1.2 でbotが追い出されないかを、最初に確かめる必要があります。
> 5. **16 チャンクの露天掘りは、約 50 万ブロックの仕事です。** 耐久力IIIのダイヤのツルハシで約 80 本ぶんです。経験値瓶だけで道具を直すと、約 9,000 本が要ります。
> 6. **簡易設置（Easy Place）は、空気をクリックする置き方で、向きはサーバー側のMODで決めます。** 「空中に置かない」決まりと合いません。

> [!info] この報告書について
> - 2026-11-14 に、6 つの分野を手分けして調べ、1本にまとめたものです。分野ごとのくわしいメモは `資料/調査メモ` フォルダにあります（[[00_調査メモについて]]）。
> - 本文の「書き手」は Claude です。「資料に書いてあること」と「書き手の解釈」を分けて書いています。
> - ウェブのページは、要約する道具を通して読んでいます。一字一句を確かめた資料ではありません。プログラムを書く前に、その時点の公式の資料でもう一度確かめます。
> - この報告を受けて計画をどう変えたかは、[[Liz Atlas 計画まとめ]] に書きました。

> [!note] 追記：公式の利用の決まりを読めました（2026-11-14）
> 本文の 4-2 と 7 章では「公式ページを読めなかった」と書いています。そのあと、ブラウザで公式ページを開いて読めたので、ここに書き足します。
>
> **公式ページに書いてあること**
> - [Minecraft Usage Guidelines](https://www.minecraft.net/en-us/usage-guidelines) の「Servers and hosting」の節に、サーバーを立ててよいことが書かれています。あわせて、サーバーに入れてよいのは、正規の有料版を持っている人だけだと書かれています。
> - [Minecraft EULA](https://www.minecraft.net/en-us/eula) には、Java版のサーバー版を自分のサーバーに入れて、オンラインで遊べることが書かれています。MODを入れて改造してよいこと、改造した本体を配ってはいけないことも書かれています。
> - どちらのページにも、bot、自動で動くクライアント、アカウントの確認をオフにする設定についての記述は、見当たりませんでした。ページの中を言葉で探して確かめました。
>
> **Claude の考え**（法律の助言ではありません）
> - 見学の人は、正規版を持っている人だけにする必要があります。アカウントの確認をオフにすると、サーバーはそれを確かめられません。招待する側で確かめることになります。
> - botについては、公式の記述がないので、はっきりしたことは言えません。Liz Atlas では、自分のPCの中で、自分が動かすbotに限ります。

# 既製品は部品止まり、無人露天掘りの本体は自作する

## 結論（ここだけ読めば全体が分かる）

いま公開されている研究とソフトを調べた結果、**「.litematic の設計図から、サバイバルで、10〜20体のbotが、何時間も無人で建てたり掘ったりする」ことを実際にやってみせた資料は一つも見つかりませんでした**。研究で示されているのは、2〜8体ほどが10〜60分程度の短い課題をこなす例までです。それでも研究からは、はっきりした方向が読み取れます。AI（LLM＝文章を作るAI）同士に会話で仕事を分けさせると成績が落ち、**全体を見渡す一つの司令塔が仕事を割り当てる方が、ぶつかり合いも未完成も少ない**という結果が複数の論文で出ています。これは「決まった作業は普通のプログラムで行い、AIは困ったときだけ呼ぶ現場監督にする」というこのプロジェクトの方針と同じ向きです。一方、そのまま使える既製品は思ったより少なく、Baritone や Litematica Printer のような優秀な自動化ソフトは**Java製の「プレイヤー側の改造（クライアントmod）」なので Node.js の Mineflayer には持ってこられず**、設計を読んで真似る教科書にしかなりません。Mineflayer 用の建築部品は「まだ使える段階ではない」か「クリエイティブ専用」でした。土台になる Mineflayer 本体も、公式に試験済みなのは **26.1 まで**で、26.1.2 対応を求める要望は 2026-11-14 時点でまだ解決済みになっていません。さらに、通常のサーバーが求める「1 tick（ゲーム内の最小時間単位、1/20秒）ごとの区切りの合図」を毎回送る修正が、4.39.0 にはまだ入っていないという記録があり、**移動中にサーバーから追い出される危険を最初に確かめる必要があります**。書き手の計算では、16チャンクを Y=-59 まで掘ると**約50万ブロック**になり、耐久力III のダイヤのツルハシで約80本分、チェストで約290個分の量です。つまり、最初の目標の露天掘りの時点で「掘る・運ぶ・しまう・道具を直す・食べる・事故から立ち直る・進み具合を覚えておく」をすべて自分で作る必要があり、ここで作る仕組みが、そのまま後の整地や建築の土台になります。

> [!note] この報告の読み方
> 各章は「**資料に書いてあること**」と「**書き手の解釈**」に分けています。数字には出どころのリンクを付け、書き手が自分で計算した数字には「（書き手の計算）」と書いています。調査はすべて 2026-11-14 に、ウェブページを取得して要約させる方法で行ったもので、長いページは途中までしか読めていません。読めなかった資料と確かめられなかった点は、最後の章にまとめています。

---

## 1. 研究は「司令塔が割り当て、AIは失敗時だけ」を後押しするが、長時間の無人作業は誰も示していない

### 1-1. 単体のAI：うまくいく仕組みの骨組みは共通している

#### 資料に書いてあること

最も有名な **Voyager（2023年）** は、GPT-4 に Mineflayer で動く JavaScript のプログラムを書かせ、うまくいったプログラムを「技（スキル）」として貯めて使い回す仕組みです。160回のやり取りで63種類のアイテムを集め、比較相手の3.3倍だったと報告しています。成否を自分で確かめる仕組みを外すと発見数が73%減り、課題の順番をでたらめにすると93%減りました。著者自身が限界として、途中で止まってしまうこと、存在しない道具を提案するなどの作り話（幻覚）、GPT-4 の費用の高さを挙げています（[Voyager論文](https://arxiv.org/html/2305.16291)）。公開されているプログラムは Minecraft 1.19 で試されたもので、最後の更新は 2023-07-27 です（[GitHub](https://github.com/MineDojo/Voyager/commits/main)）。

ほかの研究も骨組みはほぼ同じです。**GITM** は目標を「何を・いくつ・何の材料で・何の道具で」という形の木に分け、成功した手順を5本ためたら1本の見本にまとめて使い回し、ダイヤ入手の成功率 67.5% を、GPU（画像処理用の高価な計算装置）を使わずに出しました（[GITM論文](https://arxiv.org/html/2305.17144)）。**Odyssey** は Mineflayer の上に基本の技40個と組み合わせ技183個を作り、「材料が足りなければ、その材料を作る技を先に呼ぶ」仕組みを持っています。プログラムは MIT ライセンス（ほぼ自由に使ってよい許可）です（[Odyssey論文](https://arxiv.org/html/2407.15325)、[GitHub](https://github.com/zju-vipa/Odyssey)）。2026年の **MineNPC-Task** では、GPT-4o に Mineflayer を操作させたところ216件中71件（約33%）が失敗し、失敗の中で一番多かったのは「書いたプログラム自体の失敗」でした（[MineNPC-Task](https://arxiv.org/html/2601.05215)）。

一方、画面を見て操作を学ぶ型（ニューラルネット型）の **VPT** は、約7万時間の動画と V100 という計算装置720枚で約9日の学習をしても、ダイヤのツルハシの成功率は約2.5%でした（[VPT](https://ar5iv.labs.arxiv.org/html/2206.11795)）。

評価の長さはどれも短く、GITM は1回10分、JARVIS-1 は最長60分（しかも敵が出ない・常に昼・死んでも持ち物が消えない設定）でした（[GITM](https://arxiv.org/html/2305.17144)、[JARVIS-1](https://arxiv.org/html/2311.05997)）。**数時間を超える無人運転を報告した論文は見つかりませんでした。**

#### 書き手の解釈

研究から借りられるのは「部品の分け方」と「成否の確かめ方」です。Voyager の `mineBlock`（掘る）、`placeItem`（置く）、`useChest`（チェストを使う）くらいの大きさの動作を人間がプログラムとして書いておき、成否は「持ち物の増減」「ブロックの状態」「座標」のように機械で確かめられるもので判定します。AIに毎回新しいプログラムを書かせるやり方は、MineNPC-Task の失敗内訳を見る限り事故のもとです。また Voyager の「1つの課題は最大4回で諦めて次へ」のような**打ち切りの決まり**は、無人運転で同じ失敗を延々と繰り返さないために必須です。学習型（VPT など）は、AIの訓練をしないこのプロジェクトには背景知識としてしか役立ちません。

### 1-2. 複数のAIの協力：会話で分担すると崩れ、司令塔方式が勝つ

#### 資料に書いてあること

**Mindcraft（MineCollab）** の論文は、2〜5体のAIに料理・クラフト・建築をさせました。一番成績のよいモデルでも建築の成功率は 0.36 で、詳しい計画を言葉で伝え合うよう求めると成績が15%以上下がり、料理とクラフトでは2体から5体に増やすと成績が大きく落ちました。著者は「AI同士の会話が一番の弱点」と結論しています。建築では、あるAIが置いた石の層を別のAIが全部壊してしまう失敗例が載っています（[Mindcraft論文](https://arxiv.org/html/2504.17950)）。

**VillagerAgent** は、中央のAIが仕事の順番を表す図（DAG＝「AがBより先」という矢印だけでできた、ぐるぐる回らない図）を作り、前の仕事が終わったものから空いているエージェントに配る方式です。議論で決める方式（AgentVerse）と比べて、失敗率は 18.2% 対 44.4%、使った文字量の費用は 1.79 対 10.30 でした。ただし人数を8体にすると成績が下がり、著者は原因に「AIに渡す文章が長くなる」「順番の図を作るのが難しくなる」「資源の取り合い」を挙げています（[VillagerAgent](https://arxiv.org/html/2406.05720)）。

**TeamCraft** では、全員の様子を見て全員の行動を決める「中央集権型」の方が、各自で判断する「分散型」より建築の成功率が高く（0.42 対 0.00）、エージェント同士のぶつかり合いの割合も低く（0.01 対 0.15）なりました。ただし中央のモデルは4体目を放っておく失敗をしました（[TeamCraft](https://arxiv.org/html/2412.05255)）。**S-Agents** では、リーダー1体の下に作業役が並ぶ木の形が、全員が対等な形より速く、対等な形では仕事を押し付け合ってぐるぐる回り止まりました（[S-Agents](https://arxiv.org/html/2402.04578)）。

人数が一番多い **Project Sid** は50体で4時間以上、500体で9000秒動かしましたが、目的は社会のまねごと（役割分担や文化の広まり）で、著者自身が「共同建築はできていない」と書いています。1000体を超えるとサーバーが追いつかなくなりました（[Project Sid](https://arxiv.org/html/2411.00114)）。

#### 書き手の解釈

研究の結果は「中央で割り当てる方がよい」を後押ししますが、比べられているのはどれも「AIが司令塔をする方式」です。**AIを使わない普通のプログラムの司令塔と直接比べた研究は見つかりませんでした**。それでも、中央方式が人数で崩れた理由（AIに渡す文章が長くなる、順番の図をAIが作り損ねる）は、割り当てを普通のプログラムにすれば原理的に起きません。残るのは「資源の取り合い」で、これは担当範囲（チャンクや層）を重ならないように決め、共用のチェストや通路を予約制にすることで自分で防ぐ必要があります。また Mindcraft の「他人が置いたブロックを壊す」失敗は、座標ごとの担当が一つに決まっていないと起きることを示しています。

> [!info] 計算メモ（書き手の計算）
> VillagerAgent と AgentVerse の費用の差は 10.30 ÷ 1.79 ≒ 5.8倍です。

### 1-3. AIによる建築：比べ方は「同じ座標の格子で1マスずつ照合」

#### 資料に書いてあること

共同建築の研究（IGLU、BAP v2）は、11×9×11 程度の小さな格子に6色のブロックを置く課題で、出来上がりと目標を1マスずつ照合して点数（F1スコア＝「正しく置けた割合」と「置くべき所に置けた割合」を合わせた点数）を出します。新しい研究では、位置のずれや90度の回転を許して照合する方法も提案されています（[BAP v2](https://arxiv.org/html/2501.10836v3)、[IGLU 2022](https://ar5iv.labs.arxiv.org/html/2205.13771)）。IGLU 2022 の基準モデルは、部分課題はほぼ90%解けても、全体の課題は25%しか解けませんでした（[IGLU 2022](https://ar5iv.labs.arxiv.org/html/2205.13771)）。MineLand の論文は、高い建物に必要な足場をAIが計画できないことを失敗として挙げています（[MineLand](https://arxiv.org/html/2403.19267)）。

#### 書き手の解釈

.litematic は「どの座標に、どのブロックが、どの向きで」の一覧なので、この照合の考え方がそのまま使えます。このプロジェクトでは建てる場所が決まっているので、位置合わせは要らず、厳密な照合で十分です。ただし研究は色付きブロックしか扱っておらず、**階段の向きやハーフブロックの上下のような「ブロックの状態」まで照合する方法は自分で決める必要があります**。AIは空間の把握（どこに置くか）が特に苦手だと複数の論文が述べているので、建築の位置決めをAIに任せる理由はありません。

---

## 2. 既製の自動化ソフトは設計の教科書で、Mineflayer ではそのまま動かない

### 2-1. Baritone：考え方は一番近いが、プレイヤー側の改造なので移せない

#### 資料に書いてあること

Baritone は、プレイヤーを自動で歩かせ、掘らせ、建てさせる改造ソフトで、ライセンスは LGPL-3.0 です。26.1 向けの v1.18.0 が出ていますが、説明は「26.1 用」だけで 26.1.2 の明記はありません（[Releases](https://github.com/cabaletta/baritone/releases)、[v1.18.0](https://github.com/cabaletta/baritone/releases/tag/v1.18.0)）。.litematic は新しい形式（v7）だけ読めます（[DefaultSchematicFormats.java](https://raw.githubusercontent.com/cabaletta/baritone/1.21.4/src/main/java/baritone/utils/schematic/format/DefaultSchematicFormats.java)）。

建築の仕組みのプログラム（[BuilderProcess.java](https://raw.githubusercontent.com/cabaletta/baritone/1.21.4/src/main/java/baritone/process/BuilderProcess.java)）を読むと、要点は三つです。一つ目は、設計図と現実の世界を比べて「間違っている座標の集まり」を持つこと。二つ目は、その集まりを「立つべき場所の候補」に変えて道探し（経路探索）に渡すこと。三つ目は、置く直前に「この向きで、この面をクリックしたら、どんな状態のブロックになるか」をゲーム本体の計算で試し、設計図と一致する置き方だけを使うことです。置く場所は「その下と2つ下がまだ置けない場所でないもの」だけを選ぶので、下から順に建ちます。また、整地（`#sel cleararea`）は「空気を建てる」建築として同じ仕組みで処理しています（[SelCommand.java](https://raw.githubusercontent.com/cabaletta/baritone/1.21.4/src/main/java/baritone/command/defaults/SelCommand.java)）。進み具合はメモリ上だけで持ち、再開時は世界を見直して作り直します。

課題の一覧には「大きな設計図で止まる、階段の角度が違う」（#3171）など未解決のものが残っています（[issue検索](https://api.github.com/search/issues?q=repo:cabaletta/baritone+build+schematic+in:title&sort=updated&per_page=30)）。

#### 書き手の解釈

三つの要点のうち、一つ目と二つ目は Mineflayer でもそのまま真似できます。問題は三つ目で、Baritone はゲーム本体の「置いたら何になるか」の計算を呼べますが、**Mineflayer やその部品（minecraft-data、prismarine-block）にはその計算が無いので、「階段は視線の向きとクリックした面の上下で決まる」のような向きの決まりの表を自分で作る必要があります**。これが建築段階で一番大きな自作部分になります。「整地も建築も、設計図との差を埋める同じ仕組みで扱う」という考え方は、露天掘りの段階から取り入れる価値があります。そうすると、足場の後片付け（設計図では空気の場所に残った足場＝間違いなので壊す）も同じ仕組みで済みます。

### 2-2. Altoclef：毎回「今やるべきこと」を決め直す設計

#### 資料に書いてあること

Altoclef は Baritone の上に作られた自動プレイソフトで、元のプログラムは 2024-06-28 に更新停止（アーカイブ）されました。後を継いだ版（MiranCZ版）は 1.21.1 までの対応で、26.1 対応は見つかりませんでした（[原本](https://github.com/gaucho-matrero/altoclef)、[MiranCZ版](https://github.com/MiranCZ/altoclef)）。仕組みとしては、作業が毎 tick「今この瞬間にやるべき下位の作業」を返し直し、食事や防衛のような優先度の高い作業の流れ（チェーン）が割り込める作りになっています（[Task.java](https://raw.githubusercontent.com/gaucho-matrero/altoclef/main/src/main/java/adris/altoclef/tasksystem/Task.java)、[TaskRunner.java](https://raw.githubusercontent.com/gaucho-matrero/altoclef/main/src/main/java/adris/altoclef/tasksystem/TaskRunner.java)）。動けなくなったと判断すると場所を変え、10回を超えると諦めます（[TimeoutWanderTask.java](https://raw.githubusercontent.com/gaucho-matrero/altoclef/main/src/main/java/adris/altoclef/tasks/movement/TimeoutWanderTask.java)）。

#### 書き手の解釈

「次の手順を、覚えている状態ではなく、今の世界と持ち物から毎回決め直す」やり方は、切断や人の手出しで状況が変わっても自然に立ち直れるので、20体を長時間動かすときの基本にすべきです。「食べる＞身を守る＞仕事」の割り込み順も、各botにそのまま持たせられる考え方です。

### 2-3. Litematica の簡易設置（Easy Place）と Printer：真似るべきは Printer の総当たり方式

#### 資料に書いてあること

Litematica の **Easy Place** は、設計図の位置で使うボタンを押すと、合うブロックを持ち替えて置く機能です。向きを正しく置くには、クリックした座標に向きの情報を埋め込む特別な取り決め（Accurate Placement Protocol）をサーバー側の改造（Carpet Extra、Servux、Litemoretica）が読み取る必要があり、改造なしのサーバーで扱えるのはハーフブロックの上下だけです（[Litematica Wiki](https://github.com/maruohon/litematica/wiki/Easy-Place)）。また Modrinth の説明には、Easy Place は**常に置きたい場所の空気ブロックをクリックする**と書かれています（[Modrinth: Litematica](https://modrinth.com/mod/litematica)）。

**Printer**（元祖は aleksilassila 版）は、隣にある固いブロックの面をクリックする前提で、「見る向き6通り × クリックする面6通り × 面の中のクリック位置8通り」を総当たりし、ゲーム本体の計算で結果を予想して、設計図と一致する最初の組み合わせを使います。空中には置きません（[GuesserGuide.java](https://raw.githubusercontent.com/aleksilassila/litematica-printer/master/src/main/java/me/aleksilassila/litematica/printer/guides/placement/GuesserGuide.java)、[GeneralPlacementGuide.java](https://raw.githubusercontent.com/aleksilassila/litematica-printer/master/src/main/java/me/aleksilassila/litematica/printer/guides/placement/GeneralPlacementGuide.java)）。元祖は「掘ることや、間違いの直しはしない」としています（[README](https://github.com/aleksilassila/litematica-printer)）。26.1.x に対応した後継版は複数あり、そのうち **Printer 4th は「26.1.2 と 26.2 を基準に試験済み」と明記**しています。どれもライセンスは AGPL-3.0 です（[Printer 4th](https://modrinth.com/mod/litematica-printer-4th)、[sakura-ryoko版](https://modrinth.com/mod/litematica-printer)、[Hana](https://modrinth.com/mod/litematica-printer-hana)）。

#### 書き手の解釈

Easy Place は「空気をクリックする」「サーバー改造で向きを決める」という点で、**「空中に置かない・人間に理論上できる置き方だけ」という条件に合わないので使えません**。真似るべきは Printer の総当たり方式ですが、これもゲーム本体の計算を呼べるクライアント改造だからこそ成り立つ方法です。Mineflayer では、向きの決まりの表を自分で作り、その表で総当たりする形になります。AGPL-3.0 はネットワーク越しに使わせる場合にもプログラムの公開義務が生じうる強いライセンスなので、**コードを写さず、仕組みを読んで自分で書き直す**のが無難です（法律の助言ではありません）。

### 2-4. Mineflayer 用の建築部品と .litematic を読む部品：読む部品だけ借りられる

#### 資料に書いてあること

公式の **mineflayer-builder** は、最新が 2022 年の 1.0.1 で、説明に「作業中。まだ使えるパッケージではない」とあり、例はクリエイティブ前提です（[GitHub](https://github.com/PrismarineJS/mineflayer-builder)、[npm](https://registry.npmjs.org/mineflayer-builder)）。**mineflayer-schem 1.5.2**（2025-11-19）は説明では .litematic 対応・チェストからの補給・複数bot対応をうたいますが、中身（index.js）を読むと、サバイバルでは材料を手に入れられず「Could not get item」で失敗し、チェスト補給や複数botの連携も見当たりませんでした（[README](https://unpkg.com/mineflayer-schem@1.5.2/README.md)、[index.js](https://unpkg.com/mineflayer-schem@1.5.2/index.js)）。

.litematic を読む部品は三つ見つかりました。**litematic-parser 1.0.0**（2026-02、MIT）、**@kleppe/litematic-reader 1.0.11**（2023-06、ISC）、**nucleation 0.12.2**（npm の表示では 0.1.74 以降 AGPL-3.0、GitHub では MIT と表示が食い違う）です（[litematic-parser](https://registry.npmjs.org/litematic-parser)、[@kleppe](https://registry.npmjs.org/@kleppe/litematic-reader)、[nucleation](https://registry.npmjs.org/nucleation)、[Nucleation GitHub](https://github.com/Schem-at/Nucleation)）。公式の prismarine-schematic は .litematic に対応していません（[GitHub](https://github.com/PrismarineJS/prismarine-schematic)）。

#### 書き手の解釈

建築部品は使えないものとして、**自作する前提**にすべきです。.litematic の読み込みは、圧縮されたデータ（NBT＝Minecraft の保存形式）を開いて、ブロックの種類一覧と詰め込まれた数字の列をほどけば済む規模の作業なので、litematic-parser を土台にするか、仕組みを読んで自作し、試験用の .litematic で正しく読めるかを確かめるのが確実です。nucleation を使うなら、使う版のライセンスを直接確かめる必要があります。

### 2-5. 公開されている Mineflayer の採掘・農業bot：考え方の参考

#### 資料に書いてあること

**Mindcraft** の `skills.js`（MIT、1.21.11 まで対応）には、下が溶岩や水なら掘るのをやめる、3ブロック以上の空洞があればやめる、まずガラスを壊さない道を探してだめなら壊す道を探す、といった安全確認が入っています。ただし足場は組みません（[skills.js](https://raw.githubusercontent.com/mindcraft-bots/mindcraft/develop/src/agent/library/skills.js)）。**minebot** は通路を掘りながら左右の鉱石を探し、谷や溶岩には橋を架け、松明を置き、出発地点のチェストで道具を補充し、体力が50%を切るとログアウトしますが、1.16.5 専用です（[minebot](https://github.com/appenz/minebot)）。**minecraftLegion** はチャンク範囲の採掘役や農家役があり、bot同士でチェストの中身の情報を共有しますが、ライセンスの表示がありません（[minecraftLegion](https://github.com/sefirosweb/minecraftLegion)）。Voyager の `mineBlock` は失敗の回数を全体で数え、一度も0に戻しません（[mineBlock.js](https://raw.githubusercontent.com/MineDojo/Voyager/main/voyager/control_primitives/mineBlock.js)）。

#### 書き手の解釈

16チャンクの露天掘りに一番近いのは、minebot の「通路＋橋＋松明＋チェスト往復」と、minecraftLegion の「チャンク単位の担当＋チェスト情報の共有」の組み合わせです。どちらも新しい版での実績は確認できないので、部品の考え方だけを借ります。Mindcraft の安全確認は MIT なので、小さな部品として取り入れやすいものです。ライセンス表示の無い minecraftLegion のプログラムは写してはいけません。Voyager の「失敗回数を0に戻さない」作りは、長時間動かすbotでは避けるべき例です（失敗回数は作業ごとに数える）。

---

## 3. Mineflayer 4.39 は 26.1 までが公式で、26.1.2 は自分の接続試験が最初の関門

### 3-1. 版と対応状況

#### 資料に書いてあること

npm（Node.js の部品置き場）の最新は **4.39.0（2026-09-06）** で、それ以降の新版はありません。Node.js は 22 以上が必要です（[npm registry](https://registry.npmjs.org/mineflayer)、[package.json](https://raw.githubusercontent.com/PrismarineJS/mineflayer/master/package.json)）。試験済みの版の一覧の最後は 26.1 で、**26.1.2 は入っていません**（[lib/version.js](https://raw.githubusercontent.com/PrismarineJS/mineflayer/master/lib/version.js)）。通信の取り決めの番号（プロトコル番号）は、26.1・26.1.1・26.1.2 がすべて **775** で同じです（[protocolVersions.json](https://raw.githubusercontent.com/PrismarineJS/minecraft-data/master/data/pc/common/protocolVersions.json)）。26.1.2 対応を求める要望 #3893 は、2026-11-14 時点で**まだ開いたまま**です（[issue #3893](https://github.com/PrismarineJS/mineflayer/issues/3893)）。

通常のサーバーは、1.21.2 以降「1 tick の終わりの合図（Client Tick End）」を求め、これが無いと移動の通信を不正として追い出します（[Java Edition protocol/Packets](https://minecraft.wiki/w/Java_Edition_protocol/Packets)）。Mineflayer では、この合図を毎 tick 送る修正（PR #4137、bot 1体につき1 tickあたり2バイト）が 2026-10-03 に開発版へ取り込まれましたが、4.39.0 には入っておらず未リリースだという記録があります（[PR #4137](https://github.com/PrismarineJS/mineflayer/pull/4137)）。実際、26.3 のサーバーで 4.39.0 のbotが入って約1.5秒で追い出されたという報告があります（[issue #4189](https://github.com/PrismarineJS/mineflayer/issues/4189)）。

道探しの部品 **mineflayer-pathfinder** は、npm の最新が **2.4.5（2023-09-04）** のままで、開発版には2026年にも修正（泳ぎ、斜め移動、内部の並べ替えの不具合）が入り続けています。未解決の課題は47件で、水から上がれない、階段で詰まる、足場の設置がときどき失敗する、などがあります（[readme](https://raw.githubusercontent.com/PrismarineJS/mineflayer-pathfinder/master/readme.md)、[commits](https://github.com/PrismarineJS/mineflayer-pathfinder/commits/master)、[issues](https://github.com/PrismarineJS/mineflayer-pathfinder/issues)）。周辺の部品で2025年以降に更新されたのは auto-eat、collectblock、web-inventory、prismarine-viewer だけで、tool・pvp・statemachine・armor-manager は2022〜2023年で止まっています（[npm search](https://registry.npmjs.org/-/v1/search?text=mineflayer&size=60)）。

#### 書き手の解釈

26.1.2 は 26.1 と通信番号が同じなので、4.39 で「26.1」として接続できる見込みはありますが、公式の保証はありません。**最初にやるべきは「bot 1体を自分の 26.1.2 サーバーに入れて、10分間歩き回らせ、掘らせ、置かせ、チェストを開けさせる」試験**です。もし移動中に追い出されたら、開発版（#4137 入り）を GitHub から直接入れる選択肢がありますが、「正式に出ていない版」を使う危うさを伴います。pathfinder も同じで、npm 版は古いので、長い移動（チェストへ戻るなど）だけに使い、掘り進める作業そのものは「向く→掘る→1歩進む」を自分で書く方が安定すると考えます。周辺部品が 26.1 で動くと書いた資料は一つも無かったので、使う部品はすべて自分で試す必要があります。

### 3-2. 基本動作の使い方で気をつける点

#### 資料に書いてあること

ブロックを置く命令 `bot.placeBlock(参照ブロック, 面の向き)` は「隣にあるブロックの、この面に置く」という形で、サーバーが受け付けたら成功、断られたら失敗を返し、4.39.0 からは断られたらすぐに失敗を返すようになりました（[api.md](https://raw.githubusercontent.com/PrismarineJS/mineflayer/master/docs/api.md)、[history.md](https://raw.githubusercontent.com/PrismarineJS/mineflayer/master/docs/history.md)）。掘る命令 `bot.dig` は、説明書では「向きを変えるかどうか」の引数の既定値が書かれているように読めますが、実際のプログラムには既定値がありません。また、掘れるかの判定 `canDigBlock` は「目の高さから5.1以内」で、サーバーが受け付ける「目から6以内」より内側です（[digging.js](https://raw.githubusercontent.com/PrismarineJS/mineflayer/master/lib/plugins/digging.js)、[Packets](https://minecraft.wiki/w/Java_Edition_protocol/Packets)）。道具や状態によって掘る時間を間違える不具合（#3921）が報告されています（[issues](https://github.com/PrismarineJS/mineflayer/issues?q=is%3Aissue+is%3Aopen+26.1)）。チェストなどの出し入れの不具合を直す提案が多数、未解決のまま並んでいます（[open PRs](https://github.com/PrismarineJS/mineflayer/pulls?q=is%3Apr+is%3Aopen+sort%3Aupdated-desc)）。

#### 書き手の解釈

`placeBlock` は「隣のブロックの面に置く」形なので、**そもそも空中には置けず、このプロジェクトの「空中に置かない」条件と相性が良い**です。掘る・置くは、人間の通常の手の届く範囲（4.5ブロック）に収めておけば、サーバーに断られにくくなります。掘ったはずのブロックが残る、チェストの中身が食い違う、といったずれは起きる前提で、「やった後に世界と持ち物を見直し、違っていたらやり直す」処理を必ず入れるべきです。

### 3-3. 10〜20体を動かす負荷：実測値の資料は無い

#### 資料に書いてあること

公式の FAQ には「アカウントごとに `createBot` を呼ぶ」「サーバーが重いときは切断までの待ち時間（既定30秒）を延ばす」としか書かれていません（[FAQ](https://raw.githubusercontent.com/PrismarineJS/mineflayer/master/docs/FAQ.md)）。**bot 1体あたりのCPUやメモリの量を示した Mineflayer の資料は見つかりませんでした。** 参考として、別のライブラリ（Rust製の Azalea）の説明では、1体あたり待機中に約20〜40MBとされていますが、これは Mineflayer の値ではありません（[azalea](https://docs.rs/crate/azalea/latest/source/src/_docs/performance.md)）。

#### 書き手の解釈

Mineflayer は bot ごとに周りのチャンクを別々に覚えるので、見える距離（`viewDistance`）を小さくするとメモリを減らせると考えられます。また、1つのプログラムで20体を動かすと、道探しの計算が長引いたときに他のbotの「生きてるよ」の合図が遅れて切断されるおそれがあります。数体ずつ別のプログラムに分ける、ログインを数秒ずつずらす、などの対策は、どれも推測なので**実際に測ってから決める**必要があります。

---

## 4. サーバー側：偽プレイヤーは向かず、ログイン方式は安全と手軽さの取り合い

### 4-1. Carpet の偽プレイヤー：アカウント不要だが、自律作業の部品が無い

#### 資料に書いてあること

Carpet（サーバー改造）の 26.1 版は 26.1.2 に対応した正式版として 2026-06-16 に出ています（[Modrinth API](https://api.modrinth.com/v2/project/carpet/version?game_versions=["26.1.2"])）。`/player` コマンドで、アカウントなしに「ほぼ本物のプレイヤーのように振る舞う」偽プレイヤーを出せますが、できる操作は前進・視点・左右クリック・ジャンプのような低レベルの入力だけです（[PlayerCommand.java](https://raw.githubusercontent.com/gnembon/fabric-carpet/master/src/main/java/carpet/commands/PlayerCommand.java)）。Carpet 独自の言語 Scarpet で補えますが、Scarpet には任意のアイテムを何もないところから持ち物に入れる関数（`inventory_set`）もあります（[Inventories.md](https://raw.githubusercontent.com/gnembon/fabric-carpet/master/docs/scarpet/api/Inventories.md)）。

#### 書き手の解釈

偽プレイヤーには道探しも建築計画も無く、Mineflayer の pathfinder に当たる部品も見当たらないので、全部を新しい言語で作ることになり、開発量は Mineflayer より多くなる可能性が高いです。しかも「アイテムを作り出せる」機能が手元にあると、「botを有利にしない」方針との線引きを自分で守り続ける必要があります。**このプロジェクトでは不採用が妥当**と考えます。

なお、参考動画（たいち氏の3本）については、以前の調査メモに「Mineflayer ベース」「botのプログラムは非公開」「露天掘り動画ではサーバー側に『壊したブロックが直接持ち物に入る』改造がある」「建築動画は空中設置に頼っている」と記録されています（[整地動画](https://youtu.be/o663bdNBYhA)、[建築動画](https://youtu.be/dike_nUZeoM)、[露天掘り動画](https://youtu.be/VYNxRjaEoR4)）。今回の調査ではこれを再確認していません。もしこの記録が正しければ、その方式はサーバー側に偽プレイヤーを出しているのではなく外部の Mineflayer がログインしており、そのうえでサーバーをbotに有利に変えている点が、このプロジェクトと大きく違います。

### 4-2. ログイン方式：どれも一長一短で、公式の利用規約は読めていない

#### 資料に書いてあること

サーバー設定の `online-mode`（アカウントの本物確認）を false にすると誰でも名前だけで入れるようになり、wiki は「インターネットにつながっていないときだけ false にすべき」と書いています（[Server.properties](https://minecraft.wiki/w/Server.properties)）。Mineflayer はパスワードなどを省くと、この確認なしの方式で接続を試みます（[node-minecraft-protocol API](https://raw.githubusercontent.com/PrismarineJS/node-minecraft-protocol/master/docs/API.md)）。

人間は正規に確認しつつ裏のサーバーを隠す方法として、**Velocity**（入口役の中継サーバー）で確認し、裏の Fabric サーバーは確認なしにして **FabricProxy-Lite**（26.1.2 対応の v2.12.0 が正式版）を入れる構成があります。この場合、裏のサーバーには中継サーバー以外が直接入れないよう、ファイアウォールか `server-ip=127.0.0.1`（同じPCの中からしか入れない設定）で守る必要があると公式文書は書いています（[Velocity 転送](https://docs.papermc.io/velocity/player-information-forwarding)、[Velocity セキュリティ](https://docs.papermc.io/velocity/security)、[FabricProxy-Lite](https://api.modrinth.com/v2/project/fabricproxy-lite/version?game_versions=["26.1.2"])）。ただし Velocity は全員に正規の確認を求めるので、bot だけを確認なしで通す公式機能は見つかりませんでした。**EasyAuth**（確認なしのサーバーにパスワード認証を足す改造）は、26.1.2 版が試作版（beta）だけです（[EasyAuth](https://api.modrinth.com/v2/project/easyauth/version?game_versions=["26.1.2"])）。bot 1体ごとに Microsoft アカウントを用意すれば確実ですが、費用は今回確認できていません。

Minecraft の利用規約（EULA）と使用ガイドラインの公式ページは、**すべて読み込みが時間切れで読めませんでした**。検索結果の抜粋には「サーバーへの参加は正規の有料版を持つ人に限る」という趣旨が出てきますが、本文では確認できていません（[Usage Guidelines（本文未取得）](https://www.minecraft.net/pl-pl/usage-guidelines)）。 **【追記】そのあと、公式ページを読めました。冒頭の「追記」を見てください。**

#### 書き手の解釈

自宅のPCで、見学者が3〜4人だけなら、「ポートを外に開けない＋見学者だけ Tailscale のような個人用の仮想ネットワークで入れる＋確認なし＋入れる人の名簿（ホワイトリスト）」が一番手軽です。ただし確認なしでは名簿は名前で照合されるので、その仮想ネットワークに入れる人なら誰の名前でも名乗れます（見学者を信頼できる前提）。より安全なのは Velocity 構成ですが、bot の通し方を自分で工夫する必要があり、その方法は確認できていません。確認なしの bot を入れることが利用規約上どう扱われるかは公式に明言が見つからないので、**公式本文を自分で読んで判断する必要があります**。

### 4-3. Fabric サーバーの準備と、bot が増えると変わるゲームの仕組み

#### 資料に書いてあること

26.1.2 は 2026-04-09 リリースで、Java 25 以上が必要です（[Java Edition 26.1.2](https://minecraft.wiki/w/Java_Edition_26.1.2)）。Fabric Loader の最新安定版は 0.20.1、インストーラーは 1.1.2、Fabric API の 26.1.2 用最新は 0.155.3+26.1.2（2026-09-07）です（[loader](https://meta.fabricmc.net/v2/versions/loader/26.1.2)、[installer](https://meta.fabricmc.net/v2/versions/installer)、[Fabric API](https://api.modrinth.com/v2/project/fabric-api/version?game_versions=["26.1.2"])）。

ゲームの動きを変えずに軽くする改造のうち、Lithium（「バニラの仕組みを一切変えない」ことが目標）、FerriteCore、Krypton、spark（負荷の計測）、Chunky（地形の先読み生成）は 26.1.2 対応の正式版があり、C2ME は試作版（alpha）だけ、ModernFix は見つかりませんでした（[Lithium](https://modrinth.com/mod/lithium)、[spark](https://api.modrinth.com/v2/project/spark/version?game_versions=["26.1.2"]&loaders=["fabric"])、[Chunky](https://api.modrinth.com/v2/project/chunky/version?game_versions=["26.1.2"]&loaders=["fabric"])、[C2ME](https://api.modrinth.com/v2/project/c2me-fabric/version?game_versions=["26.1.2"])）。

server.properties の既定値は、同時接続の上限 `max-players` が20、サバイバルで約5秒空中にいると追い出す `allow-flight=false`、署名鍵を必須にする `enforce-secure-profile=true` などです（[Server.properties](https://minecraft.wiki/w/Server.properties)）。bot もプレイヤーとして数えられるので、敵の湧く上限は「プレイヤーの周り17×17チャンクの合計」に比例して増え、プレイヤーから半径128ブロックの中で湧きます（[Mob spawning](https://minecraft.wiki/w/Mob_spawning)）。ゲームルールは 1.21.11 から名前が変わり、寝て夜を飛ばすのに必要な割合 `players_sleeping_percentage` は既定100、同じ場所に詰め込まれると窒息ダメージを受ける上限 `max_entity_cramming` は既定24、ファントム（寝ないと現れる空飛ぶ敵）の出現 `spawn_phantoms` は既定 true です（[Game rule](https://minecraft.wiki/w/Game_rule)）。

#### 書き手の解釈

`max-players` は bot 20体＋見学者4人で**24以上**に変える必要があります（書き手の計算）。確認なしで bot を入れるなら、`enforce-secure-profile` を false にしないと入れない可能性が高いと考えますが、公式の明言は確認できていません。寝る割合が既定100のままだと、bot も寝ない限り夜を飛ばせず、寝ない bot にはファントムが寄ってくると考えられます。これを変えるか、bot に寝る動作を持たせるかは「バニラのまま」の方針との兼ね合いで決める必要があります。20体を広く散らばらせると、敵の湧く上限も、サーバーが計算するチャンクの数も増えるので、spark で負荷を測りながら人数を増やすのが確実です。26.1.2 はすでに最新ではなく（26.3 が出ており、多くの改造が新しい版へ移りつつある）、改造の修正が今後届きにくくなる点も覚えておくべきです。

### 4-4. Discord 通知：Webhook が一番簡単

#### 資料に書いてあること

Discord の Webhook（決まったURLに送るだけで、指定のチャンネルに投稿できる仕組み）は、bot ユーザーも認証も要らず、本文は最大2000文字です。送信の回数制限は固定値を決め打ちせず、返事に含まれる情報と「429（送りすぎ）」の待ち時間に従うよう公式文書は求めています（[Webhook](https://docs.discord.com/developers/resources/webhook)、[Rate Limits](https://docs.discord.com/developers/topics/rate-limits)）。

#### 書き手の解釈

20体が別々に通知すると送りすぎになりうるので、通知は司令塔の1か所にまとめ、順番待ちの列（キュー）から送ります。Webhook のURLは合言葉と同じなので、プログラムに直接書かず、別ファイル（.env）に置いて公開しないようにします。

---

## 5. ゲームの仕様から計算すると、16チャンクの露天掘りは約50万ブロックの仕事

### 5-1. 掘る範囲と危険

#### 資料に書いてあること

地上の世界は Y=-64〜319 です。岩盤は Y=-64〜-60 の5層で、上の4層には稀に隙間があります（[Height limit](https://minecraft.wiki/w/Height_limit)、[Bedrock](https://minecraft.wiki/w/Bedrock)）。Y=-54 より下の洞窟の空洞は溶岩で満たされます（[Aquifer](https://minecraft.wiki/w/Aquifer)）。ただし溶岩のページは「Y=-55〜-63」と書いており、境界が1層ずれています（[Lava](https://minecraft.wiki/w/Lava)）。深層岩のダイヤ鉱石は Y=-58〜-59 あたりで最も多く出ます（[Diamond Ore](https://minecraft.wiki/w/Diamond_Ore)）。落下ダメージは3ブロックを超えた分だけかかります（[Damage](https://minecraft.wiki/w/Damage)）。敵は明るさ0の場所で湧き、松明などで防げます（[Light](https://minecraft.wiki/w/Light)）。ウォーデン（深い闇の強敵、体力500）は、シュリーカー（叫ぶブロック）を4回鳴らすと現れます（[Warden](https://minecraft.wiki/w/Warden)）。砂利は下のブロックが無くなると落ちてきて、埋まると窒息します（[Gravel](https://minecraft.wiki/w/Gravel)）。

#### 書き手の解釈と計算

| 項目 | 値 | 出どころ |
|---|---|---|
| 1チャンク（16×16）を地表 Y=64 から Y=-59 まで | 256 × 124 = **31,744 ブロック** | 書き手の計算（調査メモの式） |
| 16チャンク分（地表 Y=64） | 31,744 × 16 = **507,904 ブロック** | 書き手の計算 |
| 16チャンク分（地表 Y=63 / Y=80） | 503,808 / 573,440 ブロック | 書き手の計算 |
| bot 20体で割ると1体あたり | 約 **25,400 ブロック** | 書き手の計算 |
| 地表から Y=-59 までの深さ（地表 Y=63） | **122 ブロック** | 書き手の計算 |

実際には空洞・水・溶岩があるので、掘る数はこれより少し減ります。最下層の Y=-54〜-59 は「ダイヤが一番多い層」と「溶岩の層」が重なる場所なので、洞窟に穴を開けた瞬間に溶岩が流れ込む前提で、**掘る前に周りを確かめ、溶岩の源をブロックでふさぐ動作**が必須です。122ブロックの深さは落ちたらほぼ助からないので、縦穴ではなく階段状に掘り下げるか、落下を止める仕組みが要ります。Y=-60 に岩盤の隙間がありうるので、そこから下へ落ちたり溶岩が来たりしないよう注意が必要です。ディープダーク（深層の暗い地帯）に当たってシュリーカーを見つけたら、掘るのをやめて人に知らせるのが安全です。

### 5-2. 道具の消耗と修繕：経験値の瓶だけで賄うのは非現実的

#### 資料に書いてあること

ツルハシの耐久値は、鉄250、ダイヤ1561、ネザライト2031です（[Pickaxe](https://minecraft.wiki/w/Pickaxe)）。耐久力のエンチャントは最大IIIで、1回の使用で耐久が減る確率が 1/(レベル+1) なので、IIIなら平均で4倍長持ちします（[Unbreaking](https://minecraft.wiki/w/Unbreaking)）。修繕のエンチャントは、経験値1点で耐久を2回復します（[Mending](https://minecraft.wiki/w/Mending)）。経験値の瓶は割ると平均7点で、サバイバルで手に入れる方法は、村人の聖職者（マスター）との取引でエメラルド3個につき1本、一度の在庫は12本です（[Bottle o' Enchanting](https://minecraft.wiki/w/Bottle_o'_Enchanting)）。金床でもダイヤなどで修理できますが、修理のたびに費用が増え、40レベル以上は「高すぎる」として断られます（[Anvil mechanics](https://minecraft.wiki/w/Anvil_mechanics)）。

#### 書き手の解釈と計算

以下は「1ブロック掘ると耐久が1減る」と仮定した書き手の計算です（この仮定は今回の資料では確かめていません）。

| 項目 | 値 |
|---|---|
| 耐久力III のダイヤのツルハシ1本で掘れる量 | 1561 × 4 = 約 **6,244 ブロック** |
| 16チャンク（507,904 ブロック）に必要な本数（修繕なし） | 約 **81 本**（ネザライトなら約63本） |
| 耐久力III＋修繕で、1ブロックあたり必要な経験値 | 0.25 耐久 ÷ 2 = **0.125 点** |
| 16チャンク全体で必要な経験値 | 507,904 × 0.125 = 約 **63,500 点** |
| それを経験値の瓶だけで賄うと | 約 **9,070 本**（エメラルド約 27,200 個） |

数字が示すのは、**経験値の瓶は「足りないときの補い」にしかならず、主な経験値源は掘った鉱石や倒した敵、かまどの製錬など、作業の中で自然に出る経験値になる**ということです。ただし、それで足りるかは鉱石の量しだいで、今回の資料では鉱石ごとの分布の表が崩れていて読めなかったため、判断できません。最初は「耐久が一定以下になったら作業をやめ、拠点で交換・修理する」という決まりを作り、実際に掘った量と得た経験値を記録して足りるかを測るのが現実的です。修繕は、修理が必要な装備の中から無作為に1つを選んで直すので、bot が修繕付きの防具も着ていると、ツルハシに回る経験値が減る点にも注意が要ります。

### 5-3. 掘る速さ、食べ物、しまう場所

#### 資料に書いてあること

掘る時間は「道具の速さ ÷ ブロックの硬さ ÷ 30」で1 tickあたりの進み具合が決まり、宙に浮いていると5分の1、頭が水に沈んでいると5分の1になります。掘り終わった後には6 tick（0.3秒）の待ちがあります（[Breaking](https://minecraft.wiki/w/Breaking)）。効率V のダイヤのツルハシに採掘速度上昇II（ビーコンで得られる効果）を合わせると、石は一瞬で壊れます（[Breaking](https://minecraft.wiki/w/Breaking)、[Beacon](https://minecraft.wiki/w/Beacon)）。ブロックを1つ壊すと「消耗度」が0.005たまり、4.0たまるごとに満腹度か空腹ゲージが1減ります（[Hunger](https://minecraft.wiki/w/Hunger)）。チェスト・樽・シュルカーボックスはどれも27マスで、シュルカーボックスは壊しても中身ごと持ち運べます（[Shulker Box](https://minecraft.wiki/w/Shulker_Box)）。ホッパーは1秒に約2.5個しか運べません（[Hopper](https://minecraft.wiki/w/Hopper)）。落ちたアイテムは5分で消えます（[Item (entity)](https://minecraft.wiki/w/Item_(entity))）。

#### 書き手の解釈と計算

| 項目 | 値（書き手の計算） |
|---|---|
| 掘った後の待ちを含む1ブロックの最短時間 | 約0.3秒（1秒に約3.3ブロック） |
| 20体が休まず最速で掘り続けたときの「壊すだけ」の時間 | 507,904 ÷ (3.3 × 20) ≒ 7,600秒 ≒ **約2時間** |
| 掘るだけでたまる消耗度 | 507,904 × 0.005 ≒ 2,540（空腹ゲージ約635点分） |
| 掘った物を64個ずつ積んだ数 | 507,904 ÷ 64 ≒ **7,936 スタック** |
| 27マスの箱に入れると | 約 **294 個分** |
| ホッパー1基で全部運ぶと | 約 56 時間 |

約2時間は「移動も運搬も食事もせず、深層岩も石と同じ速さで壊れる」という非現実的な下限で、実際にはこの何倍もかかります（深層岩は効率V だけでは一瞬で壊れません）。掘った石や土をどうするかは、作業時間の大部分を左右します。約294箱分のブロックを全部しまうのか、要らない物は溶岩やサボテンで処分するのか（バニラの仕組みの範囲で）、先に決めておく必要があります。ホッパーでは遅すぎるので、bot がシュルカーボックスやチェストとの間を往復して運ぶ設計が前提になります。そのとき、シュルカーボックスはバニラのままだと「置く→開ける→中身を出し入れ→壊して拾う」という人間と同じ手順でしか扱えません。

### 5-4. 置き方のルール：向きの決まりは今回読めなかった

#### 資料に書いてあること

サバイバルでのブロック操作の届く距離は4.5ブロックです（[Attribute](https://minecraft.wiki/w/Attribute)）。ブロックの状態（向き、上下、軸など）の種類は wiki に載っていますが、**「プレイヤーの向きとクリックした面から、どう向きが決まるか」は、今回読めた範囲には書かれていませんでした**。階段のページは長すぎて置き方の節まで読めていません（[Block states](https://minecraft.wiki/w/Block_states)）。

#### 書き手の解釈

建築段階で一番大事な「向きの決まりの表」の材料が、今回の調査ではまだ手に入っていません。次の調査では、階段・ハーフブロック・原木・トラップドア・扉・フェンスゲート・ボタン・松明・看板・チェスト・かまど・観察者・ピストン・彩釉テラコッタについて、wiki の各ページの「置き方（Placement）」の節を個別に読み、さらに実際のサーバーで bot に置かせて結果を確かめる必要があります。露天掘りの段階では向きのあるブロックをほとんど置かないので、この問題は後回しにできます。

---

## 6. そのまま使えるもの、自分で作るもの、落とし穴

この章は、前の章までの資料をもとにした**書き手の解釈**の一覧です。

### 6-1. そのまま使える（ただし自分の環境で動作確認が必要）

| もの | 使い道 | 注意 |
|---|---|---|
| Mineflayer 4.39 本体 | botの体（接続・掘る・置く・持ち物・チェスト） | 26.1.2 は公式に試験されていない。tick の区切りの合図の問題を最初に確認 |
| minecraft-data / prismarine-nbt | ブロックやアイテムの情報、.litematic の中身を開く | — |
| mineflayer-pathfinder | 拠点への往復など長い移動 | npm 版は2023年のまま。掘り進める作業は自作する |
| litematic-parser | .litematic を読む土台 | 1.0.0 だけで実績が少ない。試験用ファイルで確認 |
| Fabric Loader 0.20.1 / Fabric API 0.155.3 | サーバーの土台 | — |
| Lithium、FerriteCore、spark、Chunky、バックアップ改造 | 軽くする・測る・地形の先読み・保存 | ゲームの動きを変えないと説明されているものだけを選ぶ |
| Discord Webhook | 異常や進み具合の通知 | URL を秘密にする。通知は1か所にまとめる |
| Mindcraft の安全確認（MIT） | 下が溶岩なら止まる、などの小さな部品 | 1.21.11 までの対応。部品単位で取り入れる |

### 6-2. 自分で作る必要があるもの

**司令塔（コーディネーター）**：16チャンクを担当区画に分け、座標ごとの担当を一つに決め、チェストや通路を予約制にする仕組みです。研究では人数が増えると崩れた部分なので、普通のプログラムで作ります。

**掘り進める動作**：「向く→掘る→確かめる→進む」を自分で書き、溶岩・水・砂利・落下・空洞を掘る前に確かめます。階段状の降り方もここに入ります。

**生き延びる割り込み**：食べる、逃げる、体力が減ったら戻る、寝る、を優先度順に割り込ませます（Altoclef の考え方）。

**運搬と保管**：掘った物をしまう・処分する、シュルカーボックスを置いて開けて回収する、道具を補充する流れです。

**道具の管理と修理**：耐久を見張り、決まった値を下回ったら交換か修理に回します。経験値の収支を記録します。

**進み具合の保存と再開**：区画ごとに「終わった」を保存しつつ、再開時は必ず世界を見直して残りを作り直します（保存した記録を盲信しない。Baritone の考え方）。

**失敗の記録と打ち切り**：作業ごとに失敗回数を数え、上限を超えたら保留にして別のbotに回すか、AIの現場監督を呼ぶか、人に通知します。AIを呼ぶときは「持ち物・座標・周りのブロック・失敗の種類・試した対処」をまとめて渡します（GITM や MineNPC-Task の記録項目が参考になります）。

**設計図との照合エンジン（建築段階）**：.litematic と世界を座標ごとに比べ、「正しい・違う・足りない・余分」を数え、下から順に、支えのある場所だけに置きます。整地もこのエンジンで「空気を建てる」として扱えます。

**向きの決まりの表（建築段階）**：Mineflayer には「置いたら何になるか」を計算する機能が無いので、ブロックごとの向きの決まりを表にし、その表で「立つ場所×クリックする面×視線」を総当たりします（Printer の考え方）。

### 6-3. 落とし穴

| 落とし穴 | なぜ起きるか | 出どころ |
|---|---|---|
| 移動中にサーバーから追い出される | 4.39.0 が tick の区切りの合図を毎回送らない（修正は未リリース） | [PR #4137](https://github.com/PrismarineJS/mineflayer/pull/4137)、[issue #4189](https://github.com/PrismarineJS/mineflayer/issues/4189) |
| 26.1.2 で何かが動かない | 公式の試験は 26.1 まで、対応の要望は未解決 | [issue #3893](https://github.com/PrismarineJS/mineflayer/issues/3893) |
| 掘ったはずのブロックが残る、チェストの中身がずれる | 掘る時間の計算の不具合や、持ち物の食い違いの修正が未解決 | [issues](https://github.com/PrismarineJS/mineflayer/issues?q=is%3Aissue+is%3Aopen+26.1)、[open PRs](https://github.com/PrismarineJS/mineflayer/pulls?q=is%3Apr+is%3Aopen+sort%3Aupdated-desc) |
| 水・階段・鍾乳石で動けなくなる | pathfinder の未解決の不具合 | [pathfinder issues](https://github.com/PrismarineJS/mineflayer-pathfinder/issues) |
| 空中にいて追い出される | `allow-flight=false` では約5秒浮くと追い出される | [Server.properties](https://minecraft.wiki/w/Server.properties) |
| bot が多いほど敵が増える | 敵の上限がプレイヤーの周りのチャンク数に比例する | [Mob spawning](https://minecraft.wiki/w/Mob_spawning) |
| 同じ場所に集まって窒息する | 24体を超えて詰め込まれるとダメージ | [Game rule](https://minecraft.wiki/w/Game_rule) |
| 夜が明けない、ファントムが来る | 寝る割合の既定が100%、ファントムの出現は既定で有効 | [Game rule](https://minecraft.wiki/w/Game_rule) |
| 最下層で溶岩に飲まれる | Y=-54 付近より下の洞窟は溶岩で満たされる | [Aquifer](https://minecraft.wiki/w/Aquifer) |
| 落ちたアイテムが消える | 5分で消える | [Item (entity)](https://minecraft.wiki/w/Item_(entity)) |
| 1つのプログラムで全員が切断される | 道探しの計算が長引くと合図が遅れる（書き手の推測、未計測） | [FAQ](https://raw.githubusercontent.com/PrismarineJS/mineflayer/master/docs/FAQ.md) |
| ライセンス違反 | Baritone は LGPL、Printer 系は AGPL、minecraftLegion は表示なし | 各リポジトリ |
| 既製の建築部品を信じてしまう | mineflayer-schem は説明と中身が違い、サバイバルでは材料を取れない | [index.js](https://unpkg.com/mineflayer-schem@1.5.2/index.js) |
| 研究の数字を目標に当てはめる | 研究は短時間・易しい設定・別の環境での値 | [JARVIS-1](https://arxiv.org/html/2311.05997) ほか |

---

## 7. 読めなかった資料と、確かめられなかった点

調査はすべてウェブページを取得して要約させる方法で行い、どのページも原文を一字ずつ読んだわけではありません。長いページは先頭の約10万文字までしか読めていません。

| 種類 | 読めなかった・確かめられなかったこと |
|---|---|
| 公式の決まり | Minecraft の利用規約（EULA）と使用ガイドラインの本文は、すべての言語版で読み込みが時間切れになり読めなかった。bot の扱いについての公式の記述は不明。**【追記】そのあと読めました。冒頭の「追記」を参照** |
| 参考動画 | たいち氏の3本の動画とその解説は、今回の検索では見つからず、以前の調査メモに頼っている。bot のログイン方法や使った改造の名前は不明 |
| 論文 | ACL 2019 の共同建築論文の本文（PDFを取り出せず）、CraftUtopia（アクセス拒否）、MineAnyBuild・APT・VistaWise（本文未読）、STEVE-1 と DreamerV3（要旨のみ）、Gated Coordination と TickingCollab（要旨のみ）。多くの論文で付録の後半を読めていない |
| 研究の空白 | 10体以上が1つの建物や採掘を何時間も続けた研究、AIを使わない司令塔とAI方式を同じ課題で比べた研究は、見つからなかった |
| Mineflayer | 26.1.2 で実際に動くか、通常のサーバーが tick の区切りの合図が無いと追い出すか（26.3 の報告のみ）、bot 1体あたりの CPU とメモリ、設置の届く距離の上限、説明書の全文、例のプログラム、周辺部品の説明書と 26.1 での動作 |
| 自動化ソフト | Baritone v1.18.0 が 26.1.2 で動くか、Baritone の .litematic 読み込みの細部、Printer が階段や扉でどの面を選ぶか、Servux と Litemoretica のどちらが必要かの食い違い |
| .litematic を読む部品 | litematic-parser が新旧の形式や複数の区画を読めるか（実物で試していない）、nucleation の本当のライセンス |
| サーバー | Velocity の 26.1.2 対応、bot だけを確認なしで通す方法、`enforce-secure-profile` を false にする必要があるか、`white-list` の既定値（wiki の要約では true と出たが、書き手の記憶では false。実際に作られる設定ファイルで確かめる必要がある）、Tailscale などの公式手順、Java のメモリ設定、アカウントの価格 |
| ゲーム仕様 | ブロックの向きの決まり（階段・トラップドアなど）、鉱石ごとの高さの分布（表が崩れて読めなかった）、深層岩・土・砂の硬さとシャベルの速さ、「1ブロック掘ると耐久1減る」こと、シュルカーボックスを壊す時間（要約と計算が食い違う）、溶岩で満たされる境界の高さ（Y=-54 か -55 かで資料が食い違う）、26.1.1 と 26.1.2 の個別の変更点 |

---

## まとめ：何が分かり、次に何をすべきか

調べて分かった一番大事なことは、**このプロジェクトの難しさは「賢さ」ではなく「長く止まらずに続けること」にある**という点です。研究はAIの賢さを競っていますが、どれも短い課題で、AIが失敗した原因の多くは会話・位置の把握・自分で書いたプログラムの誤りでした。決まった作業を普通のプログラムに任せると、そうした失敗の多くは最初から起きなくなり、代わりに「溶岩」「満杯の持ち物」「切断」「ずれたチェストの中身」といった地味な事故への備えが、全体の出来を決めます。そして露天掘りのために作る「設計図（または空気）と世界の差を埋める仕組み」「担当の予約」「保存と見直しによる再開」は、そのまま整地・運搬・建築にも使える土台です。露天掘りを「建築の前の練習」ではなく、**建築エンジンの最初の版**として作るのが、資料全体から見えた一番の近道です。

次の一歩は小さく確実にすべきです。まず bot 1体を自分の 26.1.2 サーバーに入れ、10分間追い出されずに歩く・掘る・置く・チェストを使えるかを試します。次に1チャンクだけを数体で掘り、掘った量・かかった時間・経験値の収支・事故の回数を測ります。そこで初めて、20体や16チャンクに広げたときの時間や道具の本数を、この報告の計算ではなく実測で見積もれるようになります。利用規約と bot のログイン方法については、公式本文を自分で読んで判断することが、作り始める前の宿題として残っています。
