# MOMO 事务所 — 创意互动工作室

为它做一个小世界。
完整可运行的中文品牌官网 + 五款真实可玩的宠物互动游戏。纯静态：HTML5 / CSS3 / ES6+ / Canvas / localStorage，无后端、无付费依赖，可直接部署到 GitHub Pages 子目录。

## 目录结构

```
momo-lab/
├── index.html          首页
├── play.html           游戏大厅
├── custom.html         定制案例
├── service.html        服务内容 + 联系
├── gift.html           电子礼物 + 纪念卡生成器
├── game/
│   ├── escape.html      游戏 01 紧急撤离（45s）
│   ├── chaos.html       游戏 02 混乱现场（30s）
│   ├── meme-maker.html  游戏 03 表情包制造机（PNG 导出）
│   ├── boss.html        游戏 04 谁是老板（4 场景 × 3 选择）
│   ├── snack-panic.html 游戏 05 零食危机（45s）
│   └── pet-world.html   游戏 06 宠物世界（3D 角色实时渲染）
├── pet/
│   ├── pet001/index.html  客户专属页（MOMO）
│   └── pet002/index.html  客户专属页（眉姐姐）
├── tools/glb-check.html   生产工具：外包 GLB 契约体检（本地解析，不上传）
├── docs/pet-character-spec.md  3D 角色规格 + AI 生产管线 + 验收清单
├── css/  base.css（全站视觉规范） game.css（游戏外壳）
├── js/   core.js（导航/页脚/设置/音效/状态机/分享卡/宠物加载） icons.js（SVG 图标）
│         pet3d.js（3D 角色控制器） vendor/（three r169 + GLTF 加载/导出，已内置）
├── data/pets/pet001.json / pet002.json  宠物配置
└── assets/{hero,games,pets,backgrounds,icons,effects,custom}
```

## 本地运行

任意静态服务器均可，例如：

```
npx serve .
# 或
python -m http.server 8010
```

然后打开 `http://localhost:8010/momo-lab/`（路径取决于服务器根目录）。

注意：直接双击以 `file://` 打开时，页面与游戏逻辑可运行，但浏览器安全策略禁止 Canvas 导出含本地图片的 PNG（表情包/分享卡会给出提示）。请改用本地服务器或上传照片，或在 GitHub Pages 上使用——导出完全正常。

## GitHub Pages 部署

仓库根目录为 `game/`（即 meicat 仓库）。本站位于其子目录 `momo-lab/`，所有资源均使用相对路径，子目录部署无需改动：

1. 提交并推送 `momo-lab/` 目录。
2. 仓库 Settings → Pages → 选择分支根目录。
3. 访问 `https://<用户名>.github.io/<仓库名>/momo-lab/`。

## 宠物定制配置

每位客户一个 JSON：`data/pets/petXXX.json`，字段：
`petId / petName / petType / petAvatar / petExpressions / petBackground / petDescription / gameSettings / customText`。

- 新建 `pet/petXXX/index.html`（复制 pet001 模板，改 `data-pet`）。
- 素材放入 `assets/pets/petXXX/`。
- 游戏页通过 `?pet=petXXX` 读取配置；专属页只展示该客户信息。
- `gameSettings` 控制专属页显示哪些游戏；`customText` 会追加进表情包预设文案。
- 3D 角色再加 3 个字段：`modelUrl`（客户 GLB）、`furColor`、`shapeParams`（脸宽/胖瘦/耳距）。缺 `modelUrl` 时角色层自动用程序化占位猫，页面照常可玩。
- `file://` 环境无法 fetch JSON 时，自动回退到 `js/core.js` 内置的同名配置。

## 游戏系统

统一状态机 READY / PLAYING / PAUSED / FINISHED；导航齿轮提供全站音效 / 动画开关（localStorage 持久化）；P / Esc 暂停；切后台自动暂停；成绩与最佳记录存 localStorage；中途离开不写脏数据。

- 紧急撤离：拖拽 / 连点 / 按住拖 / 修复贴纸四种操作；随机事件 A–E；装睡四选一；S/A/B/C + 隐藏结局；每局随机布局；分享卡。
- 混乱现场：10 物品独立动作与次数；4 组连招；6 种随机事件；连击倍率；五档评级；4 隐藏成就。
- 表情包制造机：上传照片或角色素材（自动抠白底）；8+ 预设文案、自定义文字；8 贴纸可拖动/双击删除；文字位置/字体/颜色；Canvas 真实导出 PNG。
- 谁是老板：4 场景 ×3 选择；权限/耐心/自由三数值；5 种结局均可达成；键盘 A/B/C。
- 零食危机：Canvas 接物；5 奖励 5 危险；生命/连击/加分；连续失误生气表情；末 10 秒加速；触摸 + 方向键。

## 3D 角色层（游戏 06 宠物世界）

同一套接口两条渲染路径：有客户 GLB 就播它的骨骼动画与形态键，没有就用 `js/pet3d.js` 里的程序化占位猫（28 根契约骨骼 + 参数化动作 + 变换驱动的五官）。二者共用同一份表情参数与事件表，所以 GLB 到货只是多一个文件名。

- 身体 / 表情 / 尾巴 / 耳朵四层独立：奔跑中可以翻脸，炸毛不影响腿。
- 游戏不碰骨骼：`ML.sound` 的 8 个音效点同时是 8 个角色事件（`ML.onSound` 转发，五款游戏零改动），点击身体按头/身/尾/掌四个分区给不同反应。
- 手机优先：像素比上限 1.5、连续掉帧自动降采样、切后台暂停、`dispose()` 释放几何体/材质/贴图、一次性离屏渲染导出透明 PNG 表情包素材（`preserveDrawingBuffer` 只在导出那一帧开）。
- `tools/glb-check.html`：把外包 / AI 生成的 `.glb` 拖进去，浏览器本地解析，按契约给"通过 / 不通过"，并能在没有真模型时先用占位角色跑一次"导出 → 重新加载 → 渲染"验证通路。
- 完整规格、AI 生产管线与验收清单见 `docs/pet-character-spec.md`。
- three r169 已 vendored 在 `js/vendor/`，无 CDN、无构建步骤；但该页用 ES 模块 + importmap，多数浏览器双击以 `file://` 打开会拦下模块加载——页面会显示中文提示而不是白屏，请用本地服务器或线上地址访问。

## 移动端

断点 960 / 720，按 390×844 校准：导航收进抽屉（含「开始一个项目」入口）、单列栅格、`html{overflow-x:clip}` 杜绝横滚、按钮与选项最小 44px 触摸目标、输入框 16px 防止 iOS 聚焦自动缩放、场景与画布高度按屏收窄、`@media(hover:none)` 关掉悬停位移、底部留 `env(safe-area-inset-bottom)` 安全区。游戏在触屏下用 Pointer 事件操作：拖拽、连点、长按拖动均可用，切后台自动暂停。

## 素材

assets 内图片来自客户提供的附件与既有渲染素材，未使用在线生成服务。角色 PNG 的白底由 `js/core.js` 的运行时抠图处理；附件右下角水印在主视觉中以裁切方式避开。