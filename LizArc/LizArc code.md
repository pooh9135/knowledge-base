# LizArc 学習のプログラム（全文）

学習の本体 `train\lizarc_train.py` の全文です。2026-11-19 に、プログラムからそのまま写しました（保存の番号 `f88c40b`、560 行）。

- **正本は、プロジェクトのフォルダ（`D:\Claudcode\Liz_ARC`）にあるほうです。** プログラムを直したら、こちらは古くなります。写し直すときは、Claude Code に「全文を写し直して」と言ってください。
- 何をしているかの説明は、「LizArc 学習の工程とプログラム」の 4 章と 5 章にあります。

## 中身の地図

| 部分 | 中身 |
|---|---|
| 冒頭の説明 | 学習のしかた、一時停止と再開、使い方 |
| `use_dataset` | 使うデータを切り替える |
| `Throttle` | GPU を使う割合を抑える（`runs\GPU_LIMIT`） |
| `ResBlock`、`Attention`、`Detailer` | モデル |
| `rotate_cw`、`mirror_x`、`degrade`、`active_region` | 見本の増やし方と、崩し方 |
| `decode`、`sample_iterative`、`score`、`summarize`、`evaluate` | 答えの出し方と、検証 |
| `load_tables`、`select_train`、`build_model`、`save_checkpoint` | 表の読み込み、学習に使う区画の選び方、保存 |
| `main` | 学習の 1 歩と、記録・保存・一時停止 |

## 一部

````python
"""LizArc の学習 v1（崩して戻す学習）。v0 は lizarc_train_v0.py に残してある。

1. 本物の建築の区画（32×32×32）を読む。回転と左右反転で、見本を増やす。
2. 崩す：階段・ハーフ・塀を素材のブロックに直す（一部は消す）。薄い飾りを消す。
   v0 と違い、2×2×2 の多数決はしない。1 ブロック単位の形は残す。
3. モデルに、崩した区画と、一部を隠した元の区画を見せて、隠した所を当てさせる。
   当てるのは「形」（空気・ふつう・階段の向き…）と「素材」の 2 つ。別々に当てて、最後に組み合わせる。
4. 元の区画と 1 個ずつ答え合わせをして、重みを直す。点数は使わない。

検証は 2 種類：学習用のマップから取り置いた区域（in）と、まったく別のマップ（out）。

一時停止：runs/<名前>/PAUSE というファイルができたら、その時点を保存して終了する（GPU が空く）。
再開    ：同じ命令でもう一度起動すると、保存した所から続ける。

使い方:
  .venv/Scripts/python.exe -I -X utf8 train/lizarc_train.py --run v1 [--max-minutes 120]
"""

import argparse
import json
import math
import os
import sys
import time
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "lizarc" / "ds_v0"
V1 = DATA / "v1"
RUNS = ROOT / "runs"
S = 32
KIND_AIR, KIND_FULL, KIND_DETAIL, KIND_DECO = 0, 1, 2, 3


def use_dataset(name: str):
    """使うデータを切り替える（data/lizarc/<名前>）。ds_v0 は Dream-Cubed、ds_c3d は 3D-Craft。"""
    global DATA, V1
    DATA = ROOT / "data" / "lizarc" / name
    V1 = DATA / "v1"
    if not (V1 / "tables.npz").exists():
        raise SystemExit(f"データがありません: {V1 / 'tables.npz'}")


class Throttle:
    """GPU を使う割合を抑える。計算のあいだに休みを入れて、GPU をほかの作業に空ける。

    runs/GPU_LIMIT に 10〜100 の数字（%）を書くと、GPU を使う時間がその割合になる。
    ファイルがなければ 100（休まない）。学習中に書き換えても、10 秒以内に反映する。
    """

    def __init__(self, path):
        self.path = path
        self.share = 1.0
        self.checked = -1e9
        self.t = time.perf_counter()

    def read(self):
        try:
            self.share = min(1.0, max(0.1, float(self.path.read_text(encoding="utf-8").strip()) / 100))
        except FileNotFoundError:
            self.share = 1.0
        except (OSError, ValueError):
            pass  # 読めなかったときは、前の値のまま

    def rest(self):
        """前に呼んでから今までの計算時間に見合うだけ休む。計算のひと区切りごとに呼ぶ。"""
        now = time.perf_counter()
        if now - self.checked > 10:
            self.read()
            self.checked = now
        if self.share < 1.0:
            torch.cuda.synchronize()  # 投げた計算が終わってから休む（休みの間に GPU が動かないように）
            busy = time.perf_counter() - self.t
            time.sleep(min(busy * (1 / self.share - 1), 10.0))
        self.t = time.perf_counter()


THROTTLE = Throttle(RUNS / "GPU_LIMIT")


# ---------------------------------------------------------------- モデル

class ResBlock(nn.Module):
    def __init__(self, cin, cout):
        super().__init__()
        self.n1 = nn.GroupNorm(8, cin)
        self.c1 = nn.Conv3d(cin, cout, 3, padding=1)
        self.n2 = nn.GroupNorm(8, cout)
        self.c2 = nn.Conv3d(cout, cout, 3, padding=1)
        self.skip = nn.Conv3d(cin, cout, 1) if cin != cout else nn.Identity()

    def forward(self, x):
        h = self.c1(F.silu(self.n1(x)))
        h = self.c2(F.silu(self.n2(h)))
        return h + self.skip(x)


class Attention(nn.Module):
    def __init__(self, ch, heads=8):
        super().__init__()
        self.norm = nn.GroupNorm(8, ch)
        self.attn = nn.MultiheadAttention(ch, heads, batch_first=True)

    def forward(self, x):
        h = self.norm(x).flatten(2).transpose(1, 2)
        h, _ = self.attn(h, h, h, need_weights=False)
        return x + h.transpose(1, 2).reshape(x.shape)


class Detailer(nn.Module):
    """崩した区画（cond）と、一部を隠した区画（inp）から、各ブロックの「形」と「素材」を当てる 3D U-Net。

    入り口でも出口でも、ブロックを素材と形に分けて扱う。mat と shp は、状態の番号 → 素材・形の番号の表。
    """

    def __init__(self, mat, shp, n_mat, n_shp, base=96, emb=48, mid_blocks=3):
        super().__init__()
        self.vocab = len(mat)
        self.mask_id = self.vocab
        self.n_mat, self.n_shp = n_mat, n_shp
        # 「隠してある」を表す番号を、素材と形のそれぞれの最後に足す。
        self.register_buffer("mat", torch.cat([mat, torch.tensor([n_mat])]))
        self.register_buffer("shp", torch.cat([shp, torch.tensor([n_shp])]))
        self.emb_cm = nn.Embedding(n_mat + 1, emb)
        self.emb_cs = nn.Embedding(n_shp + 1, emb)
        self.emb_xm = nn.Embedding(n_mat + 1, emb)
        self.emb_xs = nn.Embedding(n_shp + 1, emb)
        c0, c1, c2 = base, base * 2, base * 4
        self.stem = nn.Conv3d(emb * 2, c0, 3, padding=1)
        self.d0 = nn.ModuleList([ResBlock(c0, c0), ResBlock(c0, c0)])
        self.down0 = nn.Conv3d(c0, c1, 3, stride=2, padding=1)
        self.d1 = nn.ModuleList([ResBlock(c1, c1), ResBlock(c1, c1)])
        self.down1 = nn.Conv3d(c1, c2, 3, stride=2, padding=1)
        mid = []
        for _ in range(mid_blocks):
            mid += [ResBlock(c2, c2), Attention(c2)]
        self.mid = nn.ModuleList(mid)
        self.up1 = nn.ConvTranspose3d(c2, c1, 2, stride=2)
        self.u1 = nn.ModuleList([ResBlock(c1 * 2, c1), ResBlock(c1, c1)])
        self.up0 = nn.ConvTranspose3d(c1, c0, 2, stride=2)
        self.u0 = nn.ModuleList([ResBlock(c0 * 2, c0), ResBlock(c0, c0)])
        self.out_norm = nn.GroupNorm(8, c0)
        self.out_s = nn.Conv3d(c0, n_shp, 1)
        self.out_m = nn.Conv3d(c0, n_mat, 1)

    def forward(self, cond, inp, positions=None):
        """形の答えと、素材の答えを返す。

        positions（区画をまたいだ通し番号）を渡すと、その場所の答えだけを計算する（学習用。メモリの節約）。
        """
        c = self.emb_cm(self.mat[cond]) + self.emb_cs(self.shp[cond])
        x = self.emb_xm(self.mat[inp]) + self.emb_xs(self.shp[inp])
        h0 = self.stem(torch.cat([c, x], dim=-1).permute(0, 4, 1, 2, 3))
        for b in self.d0:
            h0 = b(h0)
        h1 = self.down0(h0)
        for b in self.d1:
            h1 = b(h1)
        h = self.down1(h1)
        for b in self.mid:
            h = b(h)
        h = torch.cat([self.up1(h), h1], dim=1)
        for b in self.u1:
            h = b(h)
        h = torch.cat([self.up0(h), h0], dim=1)
        for b in self.u0:
            h = b(h)
        h = F.silu(self.out_norm(h))
        if positions is None:
            return self.out_s(h), self.out_m(h)
        feats = h.permute(0, 2, 3, 4, 1).reshape(-1, h.shape[1])[positions]
        return (F.linear(feats, self.out_s.weight.view(self.n_shp, -1), self.out_s.bias),
                F.linear(feats, self.out_m.weight.view(self.n_mat, -1), self.out_m.bias))


# ---------------------------------------------------------------- 見本の増やし方と、崩し方

def rotate_cw(x, rot_table):
    """(B, x, y, z) を、上から見て右に 90 度回す。向きの状態も対応表で回す。"""
    return rot_table[x].permute(0, 3, 2, 1).flip(1)


def mirror_x(x, mirror_table):
    """(B, x, y, z) を、東西に裏返す。向きや「左・右」の状態も対応表で直す。"""
    return mirror_table[x].flip(1)


def degrade(target, tables, strength=None, gen=None):
    """本物の区画を崩す。細部は素材のブロックに直し、一部は消す。薄い飾りは消す。

    strength（見本ごとの 0〜1）を渡すと、細部を消す確率にかける。0 なら、細部は消さずに素材へ直すだけ。
    """
    simple = tables["simplify"][target]
    p = tables["p_air"][target]
    if strength is not None:
        p = p * strength.view(-1, 1, 1, 1)
    drop = torch.rand(target.shape, device=target.device, generator=gen) < p
    return torch.where(drop, torch.zeros_like(simple), simple)


def active_region(cond, target, radius=2):
    """ブロックのある所と、そのまわり radius ブロック。遠くの空気は、当てても意味がない。"""
    solid = ((cond != 0) | (target != 0)).float().unsqueeze(1)
    k = 2 * radius + 1
    return F.max_pool3d(solid, k, stride=1, padding=radius).squeeze(1) > 0


# ---------------------------------------------------------------- 評価

def gumbel_like(x):
    """くじ引き用の乱数（Gumbel 分布）。答えに足して最大を取ると、確率どおりに 1 つ選べる。"""
    u = torch.rand_like(x).clamp_min(1e-9)
    inner = (-torch.log(u)).clamp_min(1e-9)
    return -torch.log(inner)


def decode(ls, lm, tables):
    """形と素材のいちばん自信のある答えを、ブロックの状態に組み合わせる。"""
    return tables["compose"][lm.argmax(1), ls.argmax(1)]


@torch.no_grad()
def sample_iterative(model, cond, tables, steps=8, temperature=1.0):
    """隠した所を、自信のある所から数回に分けて埋める。"""
    b = cond.shape[0]
    n = S * S * S
    x = torch.full_like(cond, model.mask_id)
    for t in range(steps):
        with torch.autocast("cuda", dtype=torch.bfloat16):
            ls, lm = model(cond, x)
        ls = ls.float().permute(0, 2, 3, 4, 1).reshape(b, n, -1)
        lm = lm.float().permute(0, 2, 3, 4, 1).reshape(b, n, -1)
        ps = (ls / temperature + gumbel_like(ls)).argmax(-1)
        pm = (lm / temperature + gumbel_like(lm)).argmax(-1)
        conf = ls.log_softmax(-1).gather(-1, ps.unsqueeze(-1)).squeeze(-1)
        conf_m = lm.log_softmax(-1).gather(-1, pm.unsqueeze(-1)).squeeze(-1)
        conf = conf + torch.where(tables["has_mat"][ps], conf_m, torch.zeros_like(conf_m))
        pick = tables["compose"][pm, ps]
        del ls, lm
        flat = x.view(b, n)
        masked = flat == model.mask_id
        keep_masked = int(n * math.cos(math.pi / 2 * (t + 1) / steps)) if t < steps - 1 else 0
        conf = torch.where(masked, conf, torch.full_like(conf, float("inf")))
        if keep_masked > 0:
            threshold = conf.kthvalue(keep_masked, dim=1, keepdim=True).values
            reveal = masked & (conf > threshold)
        else:
            reveal = masked
        flat[reveal] = pick[reveal]
        THROTTLE.rest()
    return x


def score(pred, cond, target, tables):
    """答え合わせ。ブロックのある所（崩した側か本物の側のどちらかにある所）だけを数える。"""
    kind, shp = tables["kind"], tables["shp"]
    union = (cond != 0) | (target != 0)
    t_detail = kind[target] == KIND_DETAIL
    p_detail = kind[pred] == KIND_DETAIL
    hit = pred == target
    return {
        "n_union": int(union.sum()),
        "hit_union": int((hit & union).sum()),
        "n_detail": int(t_detail.sum()),
        "hit_detail": int((hit & t_detail).sum()),
        "shape_detail": int(((shp[pred] == shp[target]) & t_detail).sum()),
        "pred_detail": int(p_detail.sum()),
        "hit_pred_detail": int((hit & p_detail).sum()),
    }


def summarize(total):
    return {
        "acc": total["hit_union"] / max(total["n_union"], 1),
        "detail_recall": total["hit_detail"] / max(total["n_detail"], 1),          # 素材も形もぴったり
        "detail_shape": total["shape_detail"] / max(total["n_detail"], 1),         # 形（種類と向き）だけ合った
        "detail_precision": total["hit_pred_detail"] / max(total["pred_detail"], 1),
        "detail_amount": total["pred_detail"] / max(total["n_detail"], 1),
    }


@torch.no_grad()
def evaluate(model, vals, tables, device, batch=8, iterative_chunks=64):
    """vals は {名前: 区画の配列}。名前ごとに、次の 4 つを測る。

    model    : 一度に全部当てる方式（全区画）
    identity : 崩したまま何もしない（基準）
    one64    : 一度に全部当てる方式（最初の iterative_chunks 区画だけ。iter と同じ区画で比べるため）
    iter     : 数回に分けて埋める方式（同じ区画）
    """
    model.eval()
    out = {}
    for name, val in vals.items():
        gen = torch.Generator(device=device)
        gen.manual_seed(1234)  # 毎回同じ崩し方で測る
        totals = {k: {} for k in ("model", "identity", "one64", "iter")}

        def add(mode, s):
            for k, v in s.items():
                totals[mode][k] = totals[mode].get(k, 0) + v

        for i in range(0, len(val), batch):
            target = torch.from_numpy(val[i : i + batch].astype(np.int64)).to(device)
            cond = degrade(target, tables, gen=gen)
            inp = torch.full_like(target, model.mask_id)
            with torch.autocast("cuda", dtype=torch.bfloat16):
                ls, lm = model(cond, inp)
            pred = decode(ls, lm, tables)
            del ls, lm
            s = score(pred, cond, target, tables)
            add("model", s)
            add("identity", score(cond, cond, target, tables))
            THROTTLE.rest()
            if i < iterative_chunks:
                add("one64", s)
                add("iter", score(sample_iterative(model, cond, tables), cond, target, tables))
        for mode, t in totals.items():
            if t:
                for k, v in summarize(t).items():
                    out[f"{name}_{mode}_{k}"] = v
    model.train()
    return out


# ---------------------------------------------------------------- 学習

def load_tables(device):
    tb = np.load(V1 / "tables.npz")
    t = lambda a: torch.from_numpy(np.asarray(a)).to(device)
    tables = {
        "simplify": t(np.load(DATA / "simplify.npy").astype(np.int64)),
        "kind": t(np.load(DATA / "kind.npy").astype(np.int64)),
        "rot": t(np.loadtxt(DATA / "rot_cw.txt", dtype=np.int64)),
        "mir": t(np.loadtxt(DATA / "mirror_x.txt", dtype=np.int64)),
        "mat": t(tb["mat"]), "shp": t(tb["shp"]), "has_mat": t(tb["has_mat"]),
        "compose": t(tb["compose"]), "p_air": t(tb["p_air"]),
    }
    return tables, tb


def select_train(tb, fraction=1.0, maps=""):
    """学習に使う区画の番号。fraction は区域ごとに間引く割合、maps は使うマップの名前（カンマ区切り、空なら全部）。"""
    train_idx = tb["train_idx"]
    keep = np.ones(len(train_idx), dtype=bool)
    if fraction < 1.0:
        keep &= tb["train_u"] < fraction
    if maps:
        index = np.load(DATA / "train_index.npz", allow_pickle=False)
        map_of_file = np.array([f.split("/")[0] for f in index["files"]])
        wanted = [m.strip() for m in maps.split(",") if m.strip()]
        unknown = sorted(set(wanted) - set(map_of_file))
        if unknown:
            raise SystemExit(f"知らないマップです: {unknown}（あるのは {sorted(set(map_of_file))}）")
        keep &= np.isin(map_of_file[index["file_ids"]][train_idx], wanted)
    if not keep.any():
        raise SystemExit("学習に使う区画が 0 個です。")
    return train_idx[keep]


def build_model(tables, base, device):
    n_mat, n_shp = tables["compose"].shape
    model = Detailer(tables["mat"].cpu(), tables["shp"].cpu(), n_mat, n_shp, base=base)
    return model.to(device).to(memory_format=torch.channels_last_3d)


def save_checkpoint(path, model, opt, step, minutes, args):
    tmp = path.with_suffix(".tmp")
    torch.save({"model": model.state_dict(), "opt": opt.state_dict(), "step": step,
                "minutes": minutes, "args": vars(args)}, tmp)
    os.replace(tmp, path)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--run", required=True)
    ap.add_argument("--batch", type=int, default=16)
    ap.add_argument("--base", type=int, default=96)
    ap.add_argument("--lr", type=float, default=3e-4)
    ap.add_argument("--warmup", type=int, default=500)
    ap.add_argument("--max-steps", type=int, default=None,
                    help="学習する歩数の上限（0 で無制限）。再開のときは、省くと前の値を引き継ぐ")
    ap.add_argument("--max-minutes", type=float, default=None,
                    help="学習する時間の上限。一時停止をはさんだ合計（0 で無制限）。再開のときは、省くと前の値を引き継ぐ")
    ap.add_argument("--eval-every", type=int, default=None, help="何歩ごとに検証するか。省くと前の値、なければ 1000")
    ap.add_argument("--eval-chunks", type=int, default=256)
    ap.add_argument("--save-minutes", type=float, default=10)
    ap.add_argument("--train-fraction", type=float, default=1.0, help="学習データのうち使う割合（区域ごとに選ぶ。データ量の比較用）")
    ap.add_argument("--data", default="ds_v0", help="使うデータの名前（data/lizarc の下）。再開のときは、前の値を引き継ぐ")
    ap.add_argument("--maps", default="", help="学習に使うマップの名前（カンマ区切り）。省くと全部。マップの数の比較用")
    ap.add_argument("--seed", type=int, default=0)
    ap.add_argument("--near-positions", type=int, default=100_000, help="1 歩で答え合わせをする場所の上限（ブロックのまわり）")
    ap.add_argument("--far-positions", type=int, default=8_000, help="同じく、遠くの空気")
    args = ap.parse_args()

    run_dir = RUNS / args.run
    run_dir.mkdir(parents=True, exist_ok=True)
    ckpt_path = run_dir / "ckpt.pt"
    pause_flag = run_dir / "PAUSE"
    state_file = run_dir / "STATE"
    log_path = run_dir / "log.jsonl"

    def log(rec):
        rec["time"] = time.strftime("%Y-%m-%d %H:%M:%S")
        with open(log_path, "a", encoding="utf-8") as f:
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")
        print(json.dumps(rec, ensure_ascii=False), flush=True)

    ckpt = torch.load(ckpt_path, map_location="cpu", weights_only=True) if ckpt_path.exists() else None
    if ckpt is not None:
        # モデルの形とデータの使い方は、最初に決めたものを引き継ぐ。
        for key in ("batch", "base", "lr", "warmup", "train_fraction", "seed", "eval_chunks"):
            setattr(args, key, ckpt["args"][key])
        args.maps = ckpt["args"].get("maps", "")
        args.data = ckpt["args"].get("data", "ds_v0")
        # 時間・歩数の上限と検証の間隔は、指定がなければ前の値を引き継ぐ（「学習を再開.bat」は何も指定しない）。
        for key in ("max_minutes", "max_steps", "eval_every"):
            if getattr(args, key) is None:
                setattr(args, key, ckpt["args"].get(key))
    if args.max_minutes is None:
        args.max_minutes = 0
    if args.max_steps is None:
        args.max_steps = 0
    if args.eval_every is None:
        args.eval_every = 1000

    device = torch.device("cuda")
    torch.manual_seed(args.seed)
    torch.backends.cudnn.benchmark = True
    torch.backends.cuda.matmul.allow_tf32 = True
    torch.backends.cudnn.allow_tf32 = True

    use_dataset(args.data)
    tables, tb = load_tables(device)
    train = np.load(DATA / "train_tokens.npy", mmap_mode="r")
    val_all = np.load(DATA / "val_tokens.npy", mmap_mode="r")
    train_idx = select_train(tb, args.train_fraction, args.maps)
    n_train = len(train_idx)
    pick = lambda pool: np.sort(np.random.default_rng(0).choice(pool, size=min(args.eval_chunks, len(pool)), replace=False))
    vals = {
        "in": np.ascontiguousarray(train[pick(tb["val_in_idx"])]),   # 同じマップの、取り置いた区域
        "out": np.ascontiguousarray(val_all[pick(np.arange(len(val_all)))]),  # 別のマップ（v0 と同じ 256 区画）
    }

    model = build_model(tables, args.base, device)
    opt = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=0.01, betas=(0.9, 0.99))
    step, minutes_done = 0, 0.0
    if ckpt is not None:
        model.load_state_dict(ckpt["model"])
        opt.load_state_dict(ckpt["opt"])
        step, minutes_done = ckpt["step"], ckpt["minutes"]
    del ckpt
    params = sum(p.numel() for p in model.parameters())
    log({"event": "start", "version": "v1", "step": step, "params_million": round(params / 1e6, 1),
         "materials": model.n_mat, "shapes": model.n_shp, "train_chunks": n_train,
         "val_chunks": {k: len(v) for k, v in vals.items()}, "batch": args.batch,
         "minutes_done": round(minutes_done, 1), "max_minutes": args.max_minutes,
         "max_steps": args.max_steps, "data": args.data, "maps": args.maps or "all",
         "train_fraction": args.train_fraction})
    if pause_flag.exists():
        pause_flag.unlink()
    state_file.write_text("running", encoding="utf-8")

    rng = np.random.default_rng(args.seed + step)
    t_start = t_save = t_log = time.time()
    loss_sum, loss_n = 0.0, 0
    last_eval = -1
    stop_reason = None
    model.train()
    while stop_reason is None:
        idx = np.sort(train_idx[rng.integers(0, n_train, size=args.batch)])
        target = torch.from_numpy(train[idx].astype(np.int64)).to(device, non_blocking=True)
        for _ in range(int(rng.integers(0, 4))):
            target = rotate_cw(target, tables["rot"])
        if rng.random() < 0.5:
            target = mirror_x(target, tables["mir"])
        target = target.contiguous()
        b = target.shape[0]
        # 5 回に 1 回は、細部を消さずに素材へ直すだけにする。
        strength = (torch.rand(b, device=device) > 0.2).float()
        cond = degrade(target, tables, strength)

        # 隠す割合：半分の見本はぜんぶ隠す。残りは 0〜100% のあいだ。
        ratio = torch.cos(torch.rand(b, device=device) * math.pi / 2)
        ratio = torch.where(torch.rand(b, device=device) < 0.5, torch.ones_like(ratio), ratio)
        mask = torch.rand(target.shape, device=device) < ratio.view(-1, 1, 1, 1)
        inp = torch.where(mask, torch.full_like(target, model.mask_id), target)

        # 答え合わせをする場所を選ぶ。ブロックのまわりを中心に、遠くの空気も少しだけ混ぜる。
        active = active_region(cond, target)
        near = (mask & active).view(-1).nonzero().squeeze(1)
        far = (mask & ~active).view(-1).nonzero().squeeze(1)
        if near.numel() > args.near_positions:
            near = near[torch.randperm(near.numel(), device=device)[: args.near_positions]]
        if far.numel() > args.far_positions:
            far = far[torch.randperm(far.numel(), device=device)[: args.far_positions]]
        positions = torch.cat([near, far])
        flat_target = target.view(-1)[positions]
        t_shp = tables["shp"][flat_target]
        t_mat = tables["mat"][flat_target]
        needs_mat = tables["has_mat"][t_shp].float()  # 空気や飾りには、素材の答え合わせをしない

        for g in opt.param_groups:
            g["lr"] = args.lr * min(1.0, (step + 1) / args.warmup)
        with torch.autocast("cuda", dtype=torch.bfloat16):
            ls, lm = model(cond, inp, positions)
        ce = (F.cross_entropy(ls.float(), t_shp, reduction="none")
              + F.cross_entropy(lm.float(), t_mat, reduction="none") * needs_mat)
        n_near = near.numel()
        loss = ce[:n_near].mean() if n_near else ce.sum() * 0
        if far.numel():
            loss = loss + 0.1 * ce[n_near:].mean()
        opt.zero_grad(set_to_none=True)
        loss.backward()
        nn.utils.clip_grad_norm_(model.parameters(), 1.0)
        opt.step()
        step += 1
        loss_sum += float(loss.detach())
        loss_n += 1
        THROTTLE.rest()

        now = time.time()
        minutes = minutes_done + (now - t_start) / 60
        if step % 100 == 0:
            log({"event": "train", "step": step, "loss": round(loss_sum / loss_n, 4),
                 "steps_per_sec": round(loss_n / (now - t_log), 2), "minutes": round(minutes, 1)})
            loss_sum, loss_n, t_log = 0.0, 0, now
        if step % args.eval_every == 0:
            result = evaluate(model, vals, tables, device)
            log({"event": "eval", "step": step, "minutes": round(minutes, 1),
                 **{k: round(v, 4) for k, v in result.items()}})
            loss_sum, loss_n, t_log = 0.0, 0, time.time()  # 検証の時間を、速さの計算に入れない
            last_eval = step
        if now - t_save > args.save_minutes * 60:
            save_checkpoint(ckpt_path, model, opt, step, minutes, args)
            t_save = now
        if step % 10 == 0 and pause_flag.exists():
            stop_reason = "paused"
        elif args.max_steps and step >= args.max_steps:
            stop_reason = "finished"
        elif args.max_minutes and minutes >= args.max_minutes:
            stop_reason = "finished"

    minutes = minutes_done + (time.time() - t_start) / 60
    save_checkpoint(ckpt_path, model, opt, step, minutes, args)
    if stop_reason == "finished" and last_eval != step:
        result = evaluate(model, vals, tables, device)
        log({"event": "eval", "step": step, "minutes": round(minutes, 1),
             **{k: round(v, 4) for k, v in result.items()}})
    state_file.write_text(stop_reason, encoding="utf-8")
    log({"event": stop_reason, "step": step, "minutes": round(minutes, 1)})
    return 0


if __name__ == "__main__":
    sys.exit(main())
````
