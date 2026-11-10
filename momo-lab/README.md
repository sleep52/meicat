# MOMO 事务所 — 创意互动工作室

为它做一个小世界。
完整可运行的中文品牌官网 + 五款真实可玩的宠物互动游戏。纯静态：HTML5 / CSS3 / ES6+ / Canvas / localStorage，无后端、无付费依赖，可直接部署到 GitHub Pages 子目录。

## 目录结构

```
momo-lab/
├── index.html          App 首页（移动端主视觉 + 今日任务 + 快捷入口）
├── games.html          App「游戏」tab：全部游戏清单
├── collection.html     App「收藏」tab：本机作品与成绩
├── settings.html       App「设置」tab：开关 / 宠物 / 数据
├── studio.html         品牌官网首页（原 index 内容，营销用）
├── play.html           游戏大厅（网页版）
├── custom.html         定制案例
├── service.html        服务内容 + 联系
├── gift.html           电子礼物 + 纪念卡生成器
├── game/
│   ├── escape.html      游戏 01 紧急撤离（45s）
│   ├── chaos.html       游戏 02 混乱现场（30s）
│   ├── meme-maker.html  游戏 03 表情包制造机（PNG 导出）
│   ├── boss.html        游戏 04 谁是老板（4 场景 × 3 选择）
│   ├── snack-panic.html 游戏 05 零食危机（45s）
│   ├── pet-world.html   游戏 06 宠物世界（3D 角色实时渲染）
│   ├── jump.html        游戏 07 蓄力跳家具（按住蓄力 + 落点分级）
│   ├── sneak.html       游戏 08 偷吃木头人（主人回头就定住）
│   └── dressup.html     游戏 09 MOMO 换装室（30 件单品 + PNG 导出）
├── pet/
│   ├── pet001/index.html  客户专属页（MOMO）
│   └── pet002/index.html  客户专属页（眉姐姐）
├── tools/glb-check.html   生产工具：外包 GLB 契约体检（本地解析，不上传）
├── docs/pet-character-spec.md  3D 角色规格 + AI 生产管线 + 验收清单
├── css/  base.css（全站视觉规范） game.css（游戏外壳） app.css（App 外壳专用）
├── js/   core.js（导航/页脚/设置/音效/状态机/分享卡/宠物加载/收藏与任务） icons.js（SVG 图标）
│         registry.js（游戏清单，首页 / 游戏 tab / 收藏 tab 共用）
│         pet3d.js（3D 角色控制器） vendor/（three r169 + GLTF 加载/导出，已内置）
├── data/pets/pet001.json / pet002.json  宠物配置
└── assets/{hero,games,pets,backgrounds,icons,effects,custom,dressup}
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

## 移动端 App 外壳

四个页面（`index / games / collection / settings`）带 `data-app="1"`，`ML.chrome()` 因此只注入底部 `.ml-tabbar`，不注入网页版导航与页脚——游戏页和品牌页仍是原来的顶栏 + 页脚，两套外壳互不干扰。四个 tab 是真链接真路由，不是假切换。

数据全部来自本机 localStorage，首页显示的不是写死的数字：

| 键 | 内容 |
|---|---|
| `ml-stats` | 互动次数 / 积分 / 开过的局 / 表情包数 / 换装数 |
| `ml-records` | 每款游戏的 best 与 plays |
| `ml-works` | 收藏作品（≤60 条，含 PNG dataURL、来源游戏、标题、日期） |
| `ml-daily` | 今日任务：以当天第一次打开时的累计值为基线，跨天自动归零 |
| `ml-dressup` | 换装室搭配记忆 |

撸猫（首页主视觉点击）加互动次数并弹表情贴纸；任意游戏开局加「开过的局」；导出表情包 / 换装图加对应计数并可写进 `ml-works`；任务领奖励才加积分。设置页可分别重置今日任务、清空作品、清空全部数据。

## 新游戏（第一批）

- 蓄力跳家具 `game/jump.html`：按住蓄力、松手起跳，抛物线由蓄力量决定；落点按中心偏差分 perfect / good / edge 三档，只有完美落点涨连击并加时间，蓄力过头或跳不够会掉命；60 秒限时，家具程序化生成。
- 偷吃木头人 `game/sneak.html`：BACK → WARN → LOOK → SNAP 四相循环，主人回头时必须定住；警告相有真回头 / 假动作 / 打电话三种随机事件；吃到碗进下一回合，完美静止有额外分，被抓扣命；结束时把现场画成 600×760 结案写真，可导出并存进收藏。
- MOMO 换装室 `game/dressup.html`：7 个分类 30 件单品（表情 / 头饰 / 衣服 / 颈部 / 手持 / 贴纸 / 背景），全部由 Canvas 程序化绘制，锚点跟随体型、头身、耳距三个滑块；随机一套、1080×1350 PNG 导出、一键存进收藏、搭配记忆与重置。素材换成真图的口子见 `assets/dressup/README.md`。

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