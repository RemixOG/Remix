#!/usr/bin/env python3
"""
REMIX LOGO ALIGNMENT

Fits each transparent letter PNG into the original logo (src/assets/image.png)
by alpha-silhouette matching. Each letter is solved INDEPENDENTLY (scale,
rotation, translation): the letter PNGs each fill their own em square, so
they do not share a render scale with the flattened logo.

Per letter:
  1. Coarse search: for every candidate scale, a silhouette IoU map is
     computed over the logo (TM_CCORR intersection + integral-image ref-ink
     count under the template window; IoU = inter / (templ + local - inter)).
     The peak over scale x position is the seed.
  2. Fine refinement: warp-based symmetric IoU (+ small color term), with
     sub-pixel translation, scale and rotation descent.
  3. Emits final web assets: each letter as a layer on ONE shared canvas
     (the cropped original image). The layer pixels ARE the original pixels,
     so the final assembled state is pixel-exact to image.png by construction.

Outputs (src/assets/logo/):
  layer-r.png ... layer-x.png   per-letter layers (shared canvas; the layer
                                holds original pixels, alpha = fitted letter)
  mask.png                      original x union-mask, used as the shine mask
  scripts/out/poses.json        fitted poses + per-letter metrics
  scripts/out/overlay.png       original with fitted silhouettes outlined
  scripts/out/diff.png          original | assembled reconstruction
"""

import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "src" / "assets"
OUT_ASSETS = ASSETS / "logo"
OUT_DEBUG = ROOT / "scripts" / "out"

LETTERS = "remix"  # animation / paint order

# Candidate x-windows (fractions of logo width) for the template's left edge.
# The letters overlap heavily, so windows only stop a small template from
# latching onto a distant letter's ink.
WINDOWS = {
    "r": (0.00, 0.35),
    "e": (0.06, 0.55),
    "m": (0.26, 0.82),
    "i": (0.42, 0.95),
    "x": (0.58, 1.00),
}

SCALE_GRID = np.geomspace(0.10, 0.60, 55)      # per-letter scale candidates
COLOR_WEIGHT = 0.20                             # color vs shape in fine cost


def alpha_crop(img: Image.Image) -> Image.Image:
    return img.crop(img.getchannel("A").getbbox())


class Glyph:
    def __init__(self, letter: str):
        path = ASSETS / "letters" / f"{letter}.png"
        if not path.exists():
            path = ASSETS / f"{letter}.png"
        img = alpha_crop(Image.open(path).convert("RGBA"))
        self.rgba = np.asarray(img).astype(np.float32)
        a = self.rgba[..., 3]
        self.binary = (a > 127.5).astype(np.float32)

    def silhouette_at(self, scale: float):
        h = max(1, int(round(self.binary.shape[0] * scale)))
        w = max(1, int(round(self.binary.shape[1] * scale)))
        t = cv2.resize(self.binary, (w, h), interpolation=cv2.INTER_AREA)
        return (t > 0.5).astype(np.float32)


def pose_matrix(scale, angle, tx, ty):
    m = cv2.getRotationMatrix2D((0.0, 0.0), angle, scale)
    m[0, 2] += tx
    m[1, 2] += ty
    return m


def warp(rgba, m, size):
    return cv2.warpAffine(
        rgba, m, (size[1], size[0]),
        flags=cv2.INTER_LINEAR, borderValue=(0, 0, 0, 0),
    )


def iou_map_peak(ref_bin, ii, templ, x0f, x1f):
    """Best (iou, x, y, inter, area) for one binary template over the logo.

    IoU = inter / (templ_area + ref_ink_under_window - inter), where the
    ref-ink count under every template window comes from the integral image.
    Symmetric: neither a tiny template deep in one blob nor a giant template
    swallowing the logo can fake a perfect score.
    """
    H, W = ref_bin.shape
    th, tw = templ.shape
    if th >= H or tw >= W:
        return None
    resp = cv2.matchTemplate(ref_bin, templ, cv2.TM_CCORR)  # float32 counts
    # ref ink in the [y:y+th, x:x+tw] window, for every template position
    local = (ii[th:th + resp.shape[0], tw:tw + resp.shape[1]]
             - ii[:resp.shape[0], tw:tw + resp.shape[1]]
             - ii[th:th + resp.shape[0], :resp.shape[1]]
             + ii[:resp.shape[0], :resp.shape[1]])
    area = float(templ.sum())
    iou = resp / (area + local - resp + 1e-6)
    x0 = max(0, min(int(x0f * W - tw), W - tw))
    x1 = max(0, min(int(x1f * W), W - tw))
    colmask = np.zeros(iou.shape[1], bool)
    colmask[x0:x1 + 1] = True
    iou = np.where(colmask[None, :], iou, -1)
    idx = int(np.argmax(iou))
    y, x = divmod(idx, iou.shape[1])
    return (float(iou[y, x]), float(x), float(y),
            float(resp[y, x]), area)


def main():
    OUT_ASSETS.mkdir(parents=True, exist_ok=True)
    OUT_DEBUG.mkdir(parents=True, exist_ok=True)

    original = Image.open(ASSETS / "image.png").convert("RGBA")
    original = alpha_crop(original)
    ref = np.asarray(original).astype(np.float32)
    H, W = ref.shape[:2]
    ref_a = ref[..., 3] / 255.0
    ref_bin = (ref_a > 0.5).astype(np.float32)
    ref_area = float(ref_bin.sum())
    ii = np.zeros((H + 1, W + 1), np.float64)
    ii[1:, 1:] = np.cumsum(np.cumsum(ref_bin.astype(np.float64), 0), 1)

    glyphs = {c: Glyph(c) for c in LETTERS}

    print(f"original logo (alpha bbox): {W}x{H}  ref_ink={ref_area:.0f}px\n")

    # ------------------------------------------------------------
    # Per-letter: coarse IoU-map search, then warp refinement
    # ------------------------------------------------------------
    ref_rgb = ref[..., :3]

    def fine_cost(letter, s, a, x, y):
        w = warp(glyphs[letter].rgba, pose_matrix(s, a, x, y), (H, W))
        mask = w[..., 3] > 127.5
        t_area = float(mask.sum())
        if t_area < 200:
            return 1e9
        ys, xs = np.where(mask)
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        local = float(ref_bin[y0:y1, x0:x1].sum())
        inter = float(np.logical_and(mask, ref_a > 0.5).sum())
        iou = inter / (t_area + local - inter)
        rgb = float(np.abs(w[..., :3][mask] - ref_rgb[mask]).mean()) / 255.0
        return (1.0 - iou) + COLOR_WEIGHT * rgb

    def refine(letter, s, a, x, y):
        best = (fine_cost(letter, s, a, x, y), s, a, x, y)
        for aa in np.arange(-8.0, 8.01, 2.0):
            v = fine_cost(letter, s, aa, x, y)
            if v < best[0]:
                best = (v, s, aa, x, y)
        _, s, a, x, y = best
        for d_s, d_t, d_a in [
            (0.012, 3.0, 2.0), (0.004, 1.0, 0.5),
            (0.0015, 0.35, 0.25), (0.0005, 0.12, 0.1),
        ]:
            improved = True
            while improved:
                improved = False
                for ds, da, dtx, dty in [
                    (d_s, 0, 0, 0), (-d_s, 0, 0, 0),
                    (0, d_a, 0, 0), (0, -d_a, 0, 0),
                    (0, 0, d_t, 0), (0, 0, -d_t, 0),
                    (0, 0, 0, d_t), (0, 0, 0, -d_t),
                ]:
                    v = fine_cost(letter, s + ds, a + da, x + dtx, y + dty)
                    if v < best[0] - 1e-7:
                        best = (v, s + ds, a + da, x + dtx, y + dty)
                        improved = True
                _, s, a, x, y = best
        return best

    poses = {}
    for letter in LETTERS:
        g = glyphs[letter]
        # coarse: peak IoU over scale grid
        seed = None
        for s in SCALE_GRID:
            r = iou_map_peak(ref_bin, ii, g.silhouette_at(s),
                             *WINDOWS[letter])
            if r is None:
                continue
            if seed is None or r[0] > seed[1]:
                seed = (s, r[0], r[1], r[2])
        s0, q0, x0, y0 = seed
        # refine over the top seed scales (peak + neighbors) and fine positions
        starts = []
        for sf in (0.94, 0.97, 1.0, 1.03, 1.06):
            s = s0 * sf
            r = iou_map_peak(ref_bin, ii, g.silhouette_at(s),
                             *WINDOWS[letter])
            if r is None:
                continue
            for dx, dy in ((0, 0), (-4, -4), (4, 4), (0, -4), (0, 4)):
                starts.append((r[0], s, r[1] + dx, r[2] + dy))
        starts.sort(key=lambda c: -c[0])
        scored = sorted(
            (fine_cost(letter, s, 0.0, x, y), s, 0.0, x, y)
            for _, s, x, y in starts[:8]
        )
        _, s, a, x, y = scored[0]
        c, s, a, x, y = refine(letter, s, a, x, y)

        w = warp(g.rgba, pose_matrix(s, a, x, y), (H, W))
        mask = (w[..., 3] / 255.0) > 0.5
        cover = float(np.logical_and(mask, ref_a > 0.5).sum() / mask.sum())
        xs, ys = np.where(mask)
        poses[letter] = dict(
            cost=float(c), scale=float(s), angle=float(a),
            tx=float(x), ty=float(y), inside_logo_ratio=float(cover),
            bbox=[int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())],
        )
        print(f"{letter.upper()}  coarseIoU={q0:.3f}@s={s0:.4f}  "
              f"scale={s:.4f}  angle={a:+.2f}deg  t=({x:.1f}, {y:.1f})  "
              f"template_in_logo={cover:.3f}  cost={c:.4f}")

    # ------------------------------------------------------------
    # Assembly + verification
    # ------------------------------------------------------------
    union = np.zeros((H, W), np.float32)
    overlay = (ref[..., :3] / 255).copy()
    colors = [(1, .25, .25), (.25, .85, .35), (.35, .55, 1), (.95, .8, .2), (.8, .35, 1)]
    layers = []
    for letter, col in zip(LETTERS, colors):
        p = poses[letter]
        m = warp(glyphs[letter].rgba,
                 pose_matrix(p["scale"], p["angle"], p["tx"], p["ty"]),
                 (H, W))[..., 3] / 255.0
        layer = ref.copy()
        layer[..., 3] = ref[..., 3] * np.clip(m * 1.2, 0, 1)
        layers.append(layer)
        union = np.maximum(union, m)
        b = (m > 0.5).astype(np.uint8)
        k = np.ones((3, 3), np.uint8)
        overlay[(cv2.dilate(b, k) - cv2.erode(b, k)) > 0] = col

    fitted = union > 0.5
    on = ref_a > 0.5
    missed = float((on & ~fitted).sum() / on.sum())
    extra = float((fitted & ~on).sum() / on.sum())

    recon = ref.copy()
    recon[..., 3] = ref[..., 3] * np.clip(union * 1.2, 0, 1)
    print(f"\nassembly: missed {missed:.4f}, extra {extra:.4f}")

    Image.fromarray(recon.astype(np.uint8)).save(OUT_ASSETS / "mask.png")
    for letter, layer in zip(LETTERS, layers):
        Image.fromarray(layer.astype(np.uint8)).save(OUT_ASSETS / f"layer-{letter}.png")

    def on_bg(arr, alpha):
        return arr[..., :3] * alpha[..., None] + 0.15 * (1 - alpha[..., None])

    src_view = on_bg(ref, ref_a)
    rec_view = on_bg(recon, recon[..., 3] / 255.0)
    gap = np.full((H, 8, 3), 0.6, np.float32)
    compare = np.concatenate([src_view, gap, rec_view], axis=1) * 255
    Image.fromarray(compare.astype(np.uint8)).save(OUT_DEBUG / "diff.png")
    Image.fromarray(
        ((overlay * (0.35 + 0.65 * ref_a[..., None])) * 255).astype(np.uint8)
    ).save(OUT_DEBUG / "overlay.png")

    (OUT_DEBUG / "poses.json").write_text(json.dumps(poses, indent=2))
    print(f"logo canvas: {W}x{H}  (aspect {W / H:.3f})")
    print(f"wrote {OUT_ASSETS} and {OUT_DEBUG}")


if __name__ == "__main__":
    main()
