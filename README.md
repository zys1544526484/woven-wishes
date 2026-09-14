# 一日六厘米：AI共织锦愿

一套聚焦南京云锦木机妆花的离线 AI 数字共创体验。观众写下心愿，轻量本地模型将语义映射到经考据的候选纹样方向；观众交替送梭 24 次，完成一幅 48×24 当代数字锦样和可扫码保存的锦愿卡。全程配有可关闭的原创程序化柔和声景。

> 木机妆花是经纬织造，不是在成布上刺绣。本作不代表宋锦、蜀锦等其他织锦，也并非传统织机、云锦工艺或文物的数字复原。

## 运行成品

打开 `dist/index.html` 即可。该文件内联脚本、样式、字体子集、模型和图像，无需服务器与网络。推荐 Windows Chrome、1920×1080 横屏、100% 缩放。

## 打开最新开发体验

Windows 下双击项目根目录的 `打开最新体验.cmd`。它会自动检查并恢复固定地址 `http://127.0.0.1:4173/`，并为当前 Windows 用户注册 `WovenWishesLocalPreview` 登录计划任务；以后切换 Codex 窗口、关闭终端或重新登录 Windows，预览服务都会继续存在或自动恢复。每次打开都会附加刷新标记，避免浏览器继续显示旧页面；仍打开的同源标签也会在服务重启后自动重新载入。后台日志保存在 `.local-preview/`。日常评审以该地址为准，`dist/index.html` 仅用于离线成品验证。

## 开发与构建

需要 Node.js 20+、npm 10+；重训模型和重建字体子集另需 Python 3.11+、NumPy、fontTools 与 Brotli。

```bash
npm ci
npm run dev
npm test
npm run build:all
```

模型和字体的可复现命令：

```bash
npm run model:build
npm run font:subset
```

正式分享地址已冻结为 `https://zys1544526484.github.io/woven-wishes/share.html`，并通过 `.env.production` 注入离线主构建。未设置该变量时，二维码仍会使用与主页面同目录的 `share.html`，便于本地测试。

推送到 `main` 后，`.github/workflows/deploy-pages.yml` 会构建并部署完整互动作品与结果分享页。公开体验地址为 `https://zys1544526484.github.io/woven-wishes/`。

## 项目结构

- `src/core/`：离线分类、手势、纹样、分享编码及状态无关逻辑
- `src/app/`：三屏 React 界面和状态机
- `src/audio/`：不使用录音素材的 Web Audio 声景与送梭反馈
- `src/render/`：Canvas 织纹、梭子动效、二维码与 1080×1440 结果卡
- `src/content/`：经标注的文化文案、8 个原创网格纹样、4 套配色和 4 种构图
- `src/share/`：不加载分类模型的静态分享页
- `data/generated/`：1,440 条训练草案和 360 条留出测试草案
- `docs/`：设计、文化、AI、版权、视频和过程证据
- `tests/`：分类、确定性、载荷、手势、进度与文化边界单元测试

## 重要发布边界

- 训练数据当前为 AI/模板辅助草案，虽已通过自动验收，但正式提交前仍需完成人工语言复核并更新 `review_status`。
- 专家/机构审校与组委会“开源二改资格”书面确认属于外部流程，模板已准备在 `docs/EXTERNAL_REVIEW_PACK.md`，未收到回复前不得把审校状态写成“已完成”。
- 分享页必须发布到 HTTPS 静态站；项目不收集、不上传、不存储心愿。
