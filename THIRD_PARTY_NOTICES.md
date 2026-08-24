# 第三方与开源声明

## Loom of Doom

- 项目：andHW/lod（Loom of Doom）
- 固定版本：`7c26fcf0284bb40a2d498bff1e64213a5697c905`
- 来源：https://github.com/andHW/lod/tree/7c26fcf0284bb40a2d498bff1e64213a5697c905
- 许可：MIT，Copyright (c) 2022 Andreas
- 使用边界：本项目保留其“格点图案、遮罩/平移、逐行织造”的玩法启发，采用 React、TypeScript 和 Canvas 2D 独立重写；未复制上游 JoJo 资料、r/place 色板、截图、字体和视觉素材。

原 MIT 许可全文见根目录 `LICENSE`。

## Noto Serif CJK SC / 思源宋体

- 项目：https://github.com/notofonts/noto-cjk
- 字体：NotoSerifCJKsc-Regular.otf，构建时转为仅含作品静态文案所需字形的 WOFF2 子集
- 许可：SIL Open Font License 1.1
- 许可全文：`third_party/noto-serif-sc/OFL.txt`
- 构建脚本：`scripts/subset_font.py`

## JavaScript 运行时依赖

React、React DOM、QRCode.js、Vite、vite-plugin-singlefile、TypeScript、Vitest、Playwright 等依赖均通过 `package-lock.json` 锁定。它们各自的许可证随 npm 包分发；项目没有修改这些包，也没有把其名称用于背书。

本声明不覆盖参赛者原创代码、原创网格纹样和经 AI 生成后选用的非文化视觉资产；这些项目另见 `docs/COPYRIGHT_AND_OPEN_SOURCE.md`。
