# 换装室真图素材放这里

`game/dressup.html` 里 33 件单品，其中 27 件仍是 Canvas 程序化画的。把同名 PNG 丢进这个目录，
页面会自动改用图片画那一件，卡片右上角的角标从「自绘」变成「图片」，卡片缩略图也换成这张图。

**但只有代码里标了 `photo: 1` 的单品才会去请求**——没标的会一直用自绘，
这样不会为一堆不存在的路径刷 404。想给某件自绘单品换真图，就在那一件的定义里加 `photo: 1`。

- 文件名 = 单品 id + `.png`，例如 `crown.png`、`sweater.png`。
- 缺文件就退回自绘，不报错、不白块。
- 尺寸：1024×1024 透明底 PNG。物体画满画面 70%～85%，四周留一点空白，别贴边。
- 对位由代码管：`imgPin` 说「照片里哪个点对准锚点」（领口、帽檐），`imgSize` 可以是边长或 `[宽, 高]`，
  还能写成跟着滑块走的方法（如 `g => [g.brx * 3.55, 268]`）。
- 自绘素材的风格要求（平面卡通、`#222` 描边、马卡龙色、不要照片质感）仍然适用；
  下面 6 件是用户自己发的实物照片，照片质感是故意的，不算破坏规范。
- 物体本身别画进猫、爪子、身体——身体由页面画，图片只画那一件东西。

## 已接入的 6 张真图（用户提供，2026-11-11）

| 文件 | 中文 | 分类 | 原来 |
|---|---|---|---|
| `sweater.png` | 针织毛衣 | 衣服 | 改名自 `pink-knit-sweater.png`，顶掉了原来的条纹毛衣自绘 |
| `hoodie.png` | 连帽卫衣 | 衣服 | 新增单品，改名自 `yellow-hoodie.png` |
| `tater.png` | 薯饼连帽衫 | 衣服 | 新增单品，改名自 `potato-hoodie.png` |
| `scarf.png` | 格纹围巾 | 颈部 | 改名自 `plaid-scarf.png`，顶掉原来的自绘围巾 |
| `bowtie.png` | 缎面领结 | 颈部 | 改名自 `pink-bowtie.png`，顶掉原来的自绘领结 |
| `beret.png` | 猫耳贝雷帽 | 头饰 | 新增单品，改名自 `cat-ear-beret.png` |

原件仍在 `incoming/`，那张表还写着当初的判断。

## 可替换清单（其余仍是自绘，加 `photo: 1` 后才生效）

| 文件 | 中文 | 位置 | 画布尺寸 |
|---|---|---|---|
| `straw-hat.png` | 草帽 | 头顶 | 220 |
| `crown.png` | 皇冠 | 头顶 | 170 |
| `nightcap.png` | 睡帽 | 头顶 | 190 |
| `headphones.png` | 耳机 | 头部 | 230 |
| `glasses.png` | 眼镜 | 脸部 | 190 |
| `overalls.png` | 背带裤 | 胸口 | 260 |
| `cape.png` | 斗篷 | 身后 | 320 |
| `bell-collar.png` | 铃铛项圈 | 脖子 | 150 |
| `fish.png` | 小鱼干 | 右爪 | 130 |
| `fan.png` | 纸扇 | 左爪 | 160 |
| `blush.png` | 腮红 | 脸颊 | 120 |
| `star.png` | 星星贴纸 | 背后 | 110 |
| `studio.png` `mintroom.png` `dusk.png` `night.png` `dots.png` | 五种背景 | 整幅 | 600 |

`nameplate.png` 建议别做：名牌上印的是你在页面里输入的实时文字，换成图片就打不开了。

## 生图提示词

通用风格串，每条都拼在后面：

```
flat cartoon game asset, single object only, thick dark #222 outline, pastel palette
(butter yellow #F5E66B, coral #F16D5B, mint #BFE4D0, cream #FAF8F3), clean cell shading,
fully transparent background, no backdrop, no shadow, no cat, no paws, no text,
object centered filling 75% of frame, 1024x1024 PNG sticker sheet
```

逐件（把上面这段接在后面即可）：

- `crown.png` — a small royal crown, three points with rounded pearls, butter yellow with coral gems
- `straw-hat.png` — a wide brim straw sun hat with a coral ribbon band
- `nightcap.png` — a soft sleeping nightcap with a pom-pom tip, cream and mint stripes
- `headphones.png` — over-ear headphones, mint earcups and dark headband, front view
- `glasses.png` — round spectacles, thin dark frames, transparent lenses
- `sweater.png` — a cozy knitted sweater, cream body with coral horizontal stripes, front view, no neck of a cat
- `overalls.png` — denim style overalls with a front pocket and two straps, flat cartoon
- `cape.png` — a short flowing hero cape, coral outside and cream lining, spread flat
- `bowtie.png` — a neat bow tie, coral with dark outline
- `scarf.png` — a long knitted scarf, mint and cream stripes, ends hanging
- `bell-collar.png` — a collar band with a round bell in the middle, butter yellow bell
- `fish.png` — a small dried fish snack on a stick, cartoon, pale cream body
- `fan.png` — a folding paper fan, cream paper with dark ribs, opened
- `blush.png` — two oval cheek blush marks, soft pink, minimal
- `star.png` — a single five point star sticker, butter yellow with dark outline
- `studio.png` — empty photo studio corner backdrop, warm cream wall and light wood floor, horizon line at 63% height
- `mintroom.png` — empty mint green room with one white window, floor at 70% height
- `dusk.png` — empty room at sunset, big warm window light, apricot walls
- `night.png` — empty dark navy room at night, small moon window, desk lamp glow
- `dots.png` — seamless cream wallpaper with small coral and mint polka dots, flat

背景类要点：画面里没有任何家具以外的东西，更没有猫，地平线大约在下 1/3 处，四边能平铺。
