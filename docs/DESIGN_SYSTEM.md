# 设计与交互规格

获批概念图：

- `docs/design/01-input-concept.png`
- `docs/design/02-weaving-concept.png`
- `docs/design/03-result-concept.png`

目标画布为 1920×1080、16:9；低于该比例时等比缩放并保留黑色余边，不产生滚动条。背景 `#020C18`，表面 `#071729`，丝金 `#D6A458`，孔雀青 `#08747C`，朱砂 `#A33A2B`，主文字 `#F0DFC0`，次文字 `#9A8F7A`。

静态标题使用内嵌 OFL Noto Serif CJK SC 子集；观众动态心愿使用系统中文无衬线字体。所有文字均为代码原生，背景图中没有烧录文案。

核心状态：

```text
INPUT → ANALYZING → WEAVING → RESULT_RENDERING → RESULT → RESET
```

织造参数：48 列×24 行；第一梭向右、随后交替；每次只提交一行；最小有效行程为轨道 70%，最大纵向偏移为轨道高度 35%；短滑、反向、多指、`pointercancel` 和窗口失焦均不增加进度。键盘左右箭头是无障碍/测试后备，忽略长按重复。
