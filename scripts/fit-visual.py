#!/usr/bin/env python3
# REMIX visual-seeded per-letter fit.
# Seeds are my eyeballed ink boxes on src/assets/image.png (canvas 1080x1080,
# ink bbox (45,281)-(1034,800)). Search stays LOCAL around each seed so the
# optimizer cannot collapse into the degenerate tiny-stamp optimum.
# Outputs: out/overlay.png (per-letter fitted masks), out/compare.png
# (reference | reconstruction | diff) for visual verification.
from pathlib import Path
import cv2
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "src/assets"
LET = ASSETS / "letters"
OUT = ROOT / "out"

REF = cv2.imread(str(ASSETS / "image.png"), cv2.IMREAD_UNCHANGED)
REF = cv2.cvtColor(REF, cv2.COLOR_BGRA2RGBA)
RH, RW = REF.shape[:2]
ref_al = REF[:, :, 3].astype(np.float32)
ref_bin = (ref_al > 10).astype(np.float32)
ref_dil = cv2.dilate(ref_bin, np.ones((5, 5), np.uint8))  # glow tolerance
H, W = ref_bin.shape

# letter: tight-bbox center in INK coords, size box; glyph bbox size
SEEDS = {
    # name: (x0,y0,x1,y1 in ink-bbox coords)
    "r": (0, 55, 459, 520),
    "e": (261, 141, 510, 399),
    "m": (485, 29, 713, 417),
    "i": (661, 63, 756, 425),
    "x": (700, 51, 989, 421),
}
INK0 = (45, 281)  # ink bbox origin on the 1080 canvas

SCALE_BAND = 0.30   # +/- fraction around seed scale
ANGLE_MAX = 5.0     # degrees
POS_DX, POS_DY = 0.10, 0.12  # window around seed center, fraction of W,H


def load_glyph(name):
    g = cv2.imread(str(LET / f"{name}.png"), cv2.IMREAD_UNCHANGED)
    g = cv2.cvtColor(g, cv2.COLOR_BGRA2RGBA)
    al = g[:, :, 3]
    ys, xs = np.where(al > 64)
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    sil = (al[y0:y1 + 1, x0:x1 + 1] > 64).astype(np.float32)
    return sil, (x1 - x0 + 1, y1 - y0 + 1)


def warp_mask(sil, cx, cy, s, ang):
    """Place silhouette (centered) at logo (cx,cy) with scale s, tilt ang deg."""
    h, w = sil.shape
    M = cv2.getRotationMatrix2D((w / 2, h / 2), ang, s)
    M[0, 2] += cx - (w / 2) * s - (M[0, 0] * 0 + M[0, 1] * 0)
    M[1, 2] += cy - (h / 2) * s
    out = cv2.warpAffine(sil, M, (W, H), flags=cv2.INTER_NEAREST,
                         borderValue=0)
    return out


def score_mask(mask):
    """coverage (on dilated ref) minus outside-ref fraction."""
    area = mask.sum()
    if area < 100:
        return -1.0, 0.0, 0.0
    cov = float((mask * ref_dil).sum() / area)
    out = float((mask * (1.0 - ref_bin)).sum() / area)
    return cov - 0.6 * out, cov, out


def coarse_fit(sil, s0, cx0, cy0):
    best = (-1.0, None)
    for ang in np.linspace(-ANGLE_MAX, ANGLE_MAX, 5):
        for sf in np.linspace(1 - SCALE_BAND, 1 + SCALE_BAND, 9):
            s = s0 * sf
            mask = warp_mask(sil, cx0, cy0, s, ang)
            ys, xs = np.where(mask > 0)
            if ys.size == 0:
                continue
            y0, y1 = ys.min(), ys.max() + 1
            x0, x1 = xs.min(), xs.max() + 1
            t = mask[y0:y1, x0:x1]
            th, tw = t.shape
            if th < 2 or tw < 2 or th >= H or tw >= W:
                continue
            ta = t.sum()
            cov_map = cv2.matchTemplate(ref_dil, t, cv2.TM_CCORR) / ta
            out_map = cv2.matchTemplate(1.0 - ref_bin, t, cv2.TM_CCORR) / ta
            score = cov_map - 0.6 * out_map
            dy, dx = score.shape
            lo_x = max(0, int(cx0 - POS_DX * W - tw / 2))
            hi_x = min(dx, int(cx0 + POS_DX * W - tw / 2) + 2)
            lo_y = max(0, int(cy0 - POS_DY * H - th / 2))
            hi_y = min(dy, int(cy0 + POS_DY * H - th / 2) + 2)
            if lo_x >= hi_x or lo_y >= hi_y:
                continue
            win = score[lo_y:hi_y, lo_x:hi_x]
            iy, ix = np.unravel_index(np.argmax(win), win.shape)
            sc = float(win[iy, ix])
            if sc > best[0]:
                best = (sc, (float(lo_x + ix + tw / 2),
                             float(lo_y + iy + th / 2), s, float(ang)))
    return best[1]


def fine_fit(sil, seed):
    cx, cy, s, ang = seed
    sc, cov, out = score_mask(warp_mask(sil, cx, cy, s, ang))
    step_x, step_y, step_s, step_a = 8.0, 8.0, 0.03, 1.5
    for _ in range(6):
        cand = None
        for dcy in (-step_y, 0, step_y):
            for dcx in (-step_x, 0, step_x):
                for dsf in (1 - step_s, 1.0, 1 + step_s):
                    for da in (-step_a, 0.0, step_a):
                        sc2, c2, o2 = score_mask(
                            warp_mask(sil, cx + dcx, cy + dcy, s * dsf,
                                      ang + da))
                        if cand is None or sc2 > cand[0]:
                            cand = (sc2, cx + dcx, cy + dcy, s * dsf,
                                    ang + da, c2, o2)
        if cand is None or cand[0] <= sc:
            step_x *= 0.5; step_y *= 0.5; step_s *= 0.5; step_a *= 0.5
        else:
            sc, cx, cy, s, ang, cov, out = cand
        if step_x < 0.5 and step_s < 0.002 and step_a < 0.1:
            break
    return (cx, cy, s, ang), cov, out


def main():
    OUT.mkdir(exist_ok=True)
    fits = {}
    union = np.zeros((H, W), np.float32)
    tints = {"r": (255, 60, 60), "e": (255, 170, 40), "m": (60, 220, 90),
             "i": (70, 200, 255), "x": (90, 120, 255)}
    # star region (image canvas coords) belongs to the I layer
    star = np.zeros((H, W), np.float32)
    star[262:445, 712:868] = 1
    overlay = cv2.cvtColor(REF[:, :, :3], cv2.COLOR_RGB2GRAY)
    overlay = cv2.cvtColor(overlay, cv2.COLOR_GRAY2RGB)
    overlay = (0.55 * REF[:, :, :3][:, :, ::-1] +
               0.45 * 40).astype(np.uint8)
    masks = {}
    for name in "remix":
        sil, (gw, gh) = load_glyph(name)
        x0, y0, x1, y1 = SEEDS[name]
        cx0 = (x0 + x1) / 2 + INK0[0]
        cy0 = (y0 + y1) / 2 + INK0[1]
        s_w = (x1 - x0) / gw
        s_h = (y1 - y0) / gh
        s0 = (s_w + s_h) / 2
        seed = coarse_fit(sil, s0, cx0, cy0)
        fit, cov, out = fine_fit(sil, seed)
        fits[name] = dict(zip("cs_a", fit)) | {"cx": fit[0], "cy": fit[1],
                                               "s": fit[2], "a": fit[3]}
        mask = warp_mask(sil, *fit)
        if name == "i":
            mask = np.maximum(mask, star)
        masks[name] = mask
        union = np.maximum(union, mask)
        r, g, b = tints[name]
        col = np.zeros((H, W, 3), np.uint8)
        col[:, :] = (b, g, r)
        m = mask > 0
        overlay[m] = (0.5 * overlay[m] + 0.5 * col[m]).astype(np.uint8)
        print(f"{name}: cx={fit[0]:7.1f} cy={fit[1]:7.1f} s={fit[2]:.4f} "
              f"a={fit[3]:+5.2f}  cov={cov:.4f} outside={out:.4f}")
    # reconstruction: ref RGB where union mask says a letter lives
    rec = np.zeros((H, W, 4), np.uint8)
    rec[:, :, :3] = REF[:, :, :3]
    rec[:, :, 3] = (union > 0) * REF[:, :, 3]
    # coverage diagnostic: how much ref ink the union captures
    covered = float((union * ref_bin).sum() / ref_bin.sum())
    print(f"union ink coverage: {covered:.4f}  missed {1-covered:.4f}")
    missed = (ref_bin > 0) & (union < 0.5)
    diff = np.zeros((H, W, 3), np.uint8)
    diff[:, :] = REF[:, :, :3][:, :, ::-1] * 0.25
    diff[union > 0.5] = (0, 90, 0)
    diff[missed] = (40, 40, 220)
    pad = np.full((H, 12, 3), 30, np.uint8)
    side = np.hstack([
        cv2.cvtColor(REF[:, :, :3], cv2.COLOR_RGB2BGR), pad,
        rec[:, :, :3], pad, diff, pad, overlay])
    cv2.imwrite(str(OUT / "compare.png"), side)
    cv2.imwrite(str(OUT / "overlay.png"), overlay)


if __name__ == "__main__":
    main()
