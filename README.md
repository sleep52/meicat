# 喵星人打工人 · 表情包小游戏合集

一只金渐层英短的 21 种活法，做成了三个可以直接在浏览器里玩的小游戏，手机和电脑都适配。

| 游戏 | 玩法 | 入口 |
|---|---|---|
| 别摸鱼了，打工猫！ | 30 秒反应敲地鼠，连击倍率 + 饿了么金色狂热 | `whack.html` |
| 脆薯饼猫大冒险 | Flappy 手感，装在麦当劳脆薯饼袋里的猫漂洋过海 | `flappy.html` |
| 合成大猫 | 同名表情不断合并，看能叠出多大一只猫 | `merge.html` |

## 本地运行

纯静态站点，无需构建：

```
cd game
python -m http.server 8010
# 打开 http://127.0.0.1:8010
```

直接双击 `index.html` 也能玩（最高分存在浏览器 localStorage 里）。

## 部署到 GitHub Pages

仓库根目录就是站点根目录，Settings → Pages → Source 选 `Deploy from a branch` / `main` / `root` 即可，无需 Actions。

## 结构

```
index.html          游戏选择主页
whack.html          敲地鼠
flappy.html         Flappy
merge.html          合成大猫
css/style.css       共享样式（移动端优先）
js/audio.js         共享 WebAudio 音效（无音频文件）
js/whack.js         敲地鼠逻辑
js/flappy.js        Flappy 逻辑（?test=1 时暴露手动步进钩子）
js/merge.js         合成大猫逻辑
assets/             压缩后的表情素材（约 680KB）
mbti.html           猫咪精神状态测试
momo-lab/           MOMO 事务所：品牌站 + 移动端 App 外壳 + 十款互动游戏（见 momo-lab/README.md）
```

## 说明

- 图片素材来自本地表情包，仅作个人娱乐整活，与麦当劳、饿了么等品牌无关。
- 音效用 WebAudio 实时合成，可右上角静音。
- `assets/*_s.jpg` 是 240px 缩略图，游戏内统一使用它以保证移动端加载速度。
