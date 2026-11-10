# 换装室真图素材放这里

`game/dressup.html` 里 30 件单品现在全是 Canvas 程序化画的。把同名 PNG 丢进这个目录，页面会自动改用图片画那一件，卡片右上角的角标从「自绘」变成「图片」——不用改任何代码。

- 文件名 = 单品 id + `.png`，例如 `crown.png`、`sweater.png`。
- 只认这个目录，缺文件就继续用自绘，不会报错、不会白块。
- 尺寸：1024×1024 透明底 PNG。物体画满画面 70%～85%，四周留一点空白，别贴边。
- 风格要统一：平面卡通、纯色块、`#222` 深色描边、马卡龙配色（奶黄 `#F5E66B`、珊瑚 `#F16D5B`、薄荷 `#BFE4D0`、米白 `#FAF8F3`）。不要照片质感、不要投影、不要背景板。
- 物体本身别画进猫、爪子、身体——身体由页面画，图片只画那一件东西。
- 建议顺序：先做头饰和颈部（面积小、最容易看出效果），衣服其次，背景最后。
- 放置位置与显示大小已在代码里定好（锚点 + `imgSize`），图片不用自己管对位。

## 可替换清单

| 文件 | 中文 | 位置 | 画布尺寸 |
|---|---|---|---|
| `straw-hat.png` | 草帽 | 头顶 | 220 |
| `crown.png` | 皇冠 | 头顶 | 170 |
| `nightcap.png` | 睡帽 | 头顶 | 190 |
| `headphones.png` | 耳机 | 头部 | 230 |
| `glasses.png` | 眼镜 | 脸部 | 190 |
| `sweater.png` | 条纹毛衣 | 胸口 | 260 |
| `overalls.png` | 背带裤 | 胸口 | 260 |
| `cape.png` | 斗篷 | 身后 | 320 |
| `bowtie.png` | 领结 | 脖子 | 130 |
| `scarf.png` | 围巾 | 脖子 | 200 |
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
