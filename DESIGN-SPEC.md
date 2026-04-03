# Cai Kong 个人网站 — 设计规范文档

> 基于 [v2.ericsin.com](https://v2.ericsin.com/) 的像素级复刻项目，整理出的完整设计系统规范。
> 适用于后续迭代开发、功能扩展、保持设计一致性。

---

## 目录

1. [项目结构](#1-项目结构)
2. [设计风格概述](#2-设计风格概述)
3. [色彩系统](#3-色彩系统)
4. [字体系统](#4-字体系统)
   - [4.1 字体族总览](#41-字体族总览)
   - [4.2 字体配对设计理念](#42-字体配对设计理念)
   - [4.3 字体文件与加载](#43-字体文件与加载)
   - [4.4 排版层级](#44-排版层级)
   - [4.5 辅助字体使用场景](#45-辅助字体martha--lxgw-wenkai使用场景)
   - [4.6 字体使用规范](#46-字体使用规范)
5. [间距系统](#5-间距系统)
6. [边框与圆角](#6-边框与圆角)
7. [布局系统](#7-布局系统)
8. [响应式断点](#8-响应式断点)
9. [动效系统](#9-动效系统)
10. [组件规范](#10-组件规范)
11. [交互模式](#11-交互模式)

---

## 1. 项目结构

```
ericsin-clone/
├── site.config.yml             # 全局配置（个人信息、字体 CDN、i18n 等）
├── templates/
│   └── index.html              # HTML 模板（构建基底）
├── content/                    # 内容目录（Markdown + YAML）
├── static/
│   ├── fonts/                  # 英文字体文件（.woff）
│   │   ├── PPNeueMontreal-Bold.woff
│   │   ├── PPNeueMontreal-Medium.woff
│   │   ├── PPNeueMontreal-Regular.woff
│   │   ├── PPNeueMontreal-Light.woff
│   │   ├── PPNeueMontreal-Thin.woff
│   │   └── Martha-Regular.woff
│   └── images/
├── locales/                    # i18n 翻译文件
├── build.js                    # 构建脚本
├── dev.js                      # 开发服务器
├── dist/                       # 构建输出
└── index.html                  # 原始克隆页面（参考用）
```

---

## 2. 设计风格概述

### 整体风格
- **极简主义**：大量留白，信息层次清晰
- **深色/浅色双主题**：支持明暗模式无缝切换，瞬时变色无过渡
- **无衬线为主**：PP Neue Montreal 贯穿全局，Martha 衬线体仅用于标签/按钮等点缀；中文分别使用 MiSans 和霞鹜文楷对应
- **毛玻璃效果**：侧边栏、移动端导航栏、弹出式抽屉均使用 `backdrop-filter: blur(24px)` 搭配半透明背景
- **微动效**：渐显（fadeIn）+ 交错延迟（stagger），无滑动/弹跳等夸张动画
- **SPA 路由**：JavaScript 实现页面切换，无刷新

### 设计原则
1. **内容优先**：字体层级清晰（标题→正文→辅助文字），无多余装饰
2. **一致性**：所有卡片、边框、间距遵循统一的 token
3. **渐进呈现**：首次访问页面有交错动画，再次访问仅做整体透明度渐显
4. **响应式优雅降级**：桌面端固定侧边栏 → 移动端底部抽屉式导航

---

## 3. 色彩系统

### 设计 Token（CSS 变量）

| Token | 亮色模式 | 暗色模式 | 用途 |
|-------|---------|---------|------|
| `--BackgroundPrimary` | `#fff` | `#08090a` | 页面主背景 |
| `--BackgroundSecondary` | `#f9f8f9` | `#1c1c1f` | 卡片/面板背景 |
| `--BackgroundTertiary` | `#eeedef` | `#28282c` | 悬停/选中背景、骨架屏底色 |
| `--BackgroundHover` | `#eeedef` | `#28282c` | 统一悬停背景色 |
| `--ForegroundPrimary` | `#282a2f` | `#fff` | 主要文字、标题 |
| `--ForegroundSecondary` | `#3e424b` | `#d0d6e0` | 次要文字、正文 |
| `--ForegroundTertiary` | `#8c8b8c` | `#8a8f98` | 辅助文字、标签、时间 |
| `--BordersPrimary` | `#e8e8ea` | `#23252b` | 所有分隔线、卡片边框 |

### 功能色

| 用途 | 色值 |
|------|------|
| 可用状态（绿点） | `#22c55e` |
| 遮罩层 | `rgba(0, 0, 0, 0.5)` |
| 桌面 Trinket 弹窗遮罩 | `rgba(0, 0, 0, 0.6)` |
| 移动端导航栏背景 | `rgba(var(--BackgroundPrimary) / 0.9)` |
| 亮色模式抽屉背景 | `rgba(249, 248, 249, 0.8)` |
| 暗色模式抽屉背景 | `rgba(28, 28, 31, 0.8)` |

### 主题切换规则
- 所有颜色变化**瞬时完成**（`transition-duration: 0s`）
- 切换时添加 `.theme-switching` 类强制 `0s !important`
- 主题切换按钮的动效除外（保留 `0.2s` 的 transform/color 过渡）
- 使用 `requestAnimationFrame` 双帧后移除 `.theme-switching`

---

## 4. 字体系统

### 4.1 字体族总览

项目采用中英文双字体栈。英文字符优先使用本地 woff 字体，中文字符自动回退到 CDN 加载的对应中文字体。

| 角色 | 英文字体 | 中文字体 | 风格 | CSS `font-family` |
|------|---------|---------|------|-------------------|
| **主字体** | PP Neue Montreal | MiSans (小米) | 新格洛特斯克无衬线 / 几何无衬线 | `PPNeueMontreal, "MiSans", sans-serif` |
| **辅助字体** | Martha | 霞鹜文楷 (LXGW WenKai) | 古典衬线 / 人文楷体 | `Martha, "LXGW WenKai", sans-serif` |

### 4.2 字体配对设计理念

**PP Neue Montreal ↔ MiSans**
- 两者均为中性、干净的无衬线体，笔画处理克制理性
- MiSans 的几何倾向与 PP Neue Montreal 的 neo-grotesque 气质高度吻合
- MiSans 提供 10 个字重（Thin 100 ~ Heavy 900），可覆盖 PP Neue Montreal 的全部 5 个字重

**Martha ↔ 霞鹜文楷 (LXGW WenKai)**
- Martha 是古典衬线体，用于标签/按钮等点缀场景
- 霞鹜文楷以书写感和温润笔触呼应 Martha 的人文气息
- 作为标签、导航标题等小尺寸点缀使用时，楷体的辨识度优于常规宋体

### 4.3 字体文件与加载

#### 英文字体（本地 woff 文件）

| 文件 | font-family | font-weight | 说明 |
|------|-------------|-------------|------|
| `PPNeueMontreal-Thin.woff` | PPNeueMontreal | 200 | 极细 |
| `PPNeueMontreal-Light.woff` | PPNeueMontreal | 300 | 细体 |
| `PPNeueMontreal-Regular.woff` | PPNeueMontreal | 500 | 常规 |
| `PPNeueMontreal-Medium.woff` | PPNeueMontreal | 600 | 中粗 |
| `PPNeueMontreal-Bold.woff` | PPNeueMontreal | 800 | 粗体 |
| `Martha-Regular.woff` | Martha | 200~800 (all) | 单一字重，所有粗度映射到同一文件 |

存放位置：`static/fonts/`，构建后拷贝到 `dist/static/fonts/`。

#### 中文字体（CDN 按需加载）

通过 jsDelivr CDN 加载，字体文件已使用 **unicode-range 子集化**技术拆分，浏览器仅下载页面实际使用的字符分片。

| 字体 | CDN 包 | 加载的字重 |
|------|--------|-----------|
| **MiSans** | `misans-webfont@4.3.1` | Thin(100)、ExtraLight(200)、Light(300)、Normal(350)、Regular(400)、Medium(500)、DemiBold(600)、SemiBold(650)、Bold(700)、Heavy(900) |
| **LXGW WenKai** | `lxgw-wenkai-webfont@1.7.0` | Light(300)、Regular(400)、Bold(700) |

CDN 地址集中配置在 `site.config.yml` → `site.fonts.chinese`：

```yaml
site:
  fonts:
    chinese:
      - "https://cdn.jsdelivr.net/npm/misans-webfont@4.3.1/misans-style.min.css"
      - "https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.7.0/lxgwwenkai-regular.css"
      - "https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.7.0/lxgwwenkai-light.css"
      - "https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.7.0/lxgwwenkai-bold.css"
```

构建时自动注入为 `<link rel="stylesheet">` 标签。

#### 字重对照映射

| CSS font-weight | PP Neue Montreal | MiSans (回退) | 典型用途 |
|----------------|-----------------|--------------|---------|
| 200 | Thin | ExtraLight | — |
| 300 | Light | Light | — |
| 400 | — | Regular | body 默认 |
| 500 | Regular | Medium | 正文 |
| 600 | Medium | DemiBold | 标题、按钮 |
| 700 | — | Bold | 统计数字 |
| 800 | Bold | Heavy (900) | 大标题 |

### 4.4 排版层级

| 层级 | 字号 | 字重 | 行高 | 字间距 | 字体栈 | 用途 |
|------|------|------|------|--------|--------|------|
| **H1 大标题** | `2.25rem` (36px) | 600 | `2.5rem` (40px) | `-0.01em` | 主字体 | 页面标题、Hero |
| **H1 统计数字** | `2.5rem` (40px) | 700 | `1.2` | — | 主字体 | 项目详情统计数字 |
| **H1 文章标题** | `1.75rem` (28px) | 400 | `1.25` | — | 主字体 | 写作详情页标题 |
| **H2 详情标题** | `1.5rem` (24px) | 600 | `1.3` | `-0.02em` | 主字体 | 项目详情页标题 |
| **H2 引用** | `1.25rem` (20px) | 400 | `1.6` | — | 辅助字体 | 项目详情页引用（斜体） |
| **H2 内容标题** | `1.25rem` (20px) | 600 | `1.25` | `-0.005em` | 主字体 | Notion 内容 H2 |
| **H3 内容标题** | `1.125rem` (18px) | 600 | `1.25` | — | 主字体 | Notion 内容 H3 |
| **精选标题** | `1.25rem` (20px) | 600 | `1.4` | — | 主字体 | 精选文章标题 |
| **抽屉导航** | `1.125rem` (18px) | 600 | — | — | 主字体 | 移动端抽屉导航链接 |
| **正文大** | `1rem` (16px) | 400 | `1.5`~`1.625` | `normal` | 主字体 | 描述文字、Notion 正文 |
| **正文** | `0.9375rem` (15px) | 400~600 | `133%`~`1.6` | — | 主字体 | 页面描述、详情描述 |
| **正文小** | `0.875rem` (14px) | 400 | `133%` | `0` | 主字体 | 侧边栏导航、公司名 |
| **标签** | `0.75rem` (12px) | 600 | `133%` | `0.05em` | 主字体 | 标签、时间、分类名、页脚 |
| **标签(辅助)** | `0.75rem` (12px) | — | `133%` | `0.025em`~`0.05em` | 辅助字体 | 按钮文字、tab、写作标签 |
| **小标签** | `0.6875rem` (11px) | — | — | `0.05em` | 辅助字体 | 写作详情标签 |

### 4.5 辅助字体（Martha / LXGW WenKai）使用场景

以下场景使用辅助字体栈 `Martha, "LXGW WenKai", sans-serif`，通常伴随 `text-transform: uppercase`（英文）和 `letter-spacing: 0.025em~0.05em`：

| 组件 | CSS 选择器 | 补充说明 |
|------|-----------|---------|
| 侧边栏分组标题 | `.nav-group-title` | 大写，letter-spacing: 0.025em |
| 侧边栏姓名区域 | `.sidebar-name-block` | 大写，letter-spacing: 0.025em |
| 填充按钮 | `.btn-filled` | 大写，letter-spacing: 0.025em |
| 描边按钮 | `.btn-outline` | 大写，letter-spacing: 0.025em |
| Tab 栏 | `.tab-item` | 大写，letter-spacing: 0.05em |
| 时钟标签 | `.clock-label` | 大写 |
| 时钟数字 | `.clock-time .digit` | — |
| 卡片标签 | `.card-label` | 大写，letter-spacing: 0.025em |
| 文章标签 | `.article-tag` | 大写，letter-spacing: 0.05em |
| 写作标签 | `.writing-tag` | — |
| 详情描述 | `.detail-desc` | 斜体 |
| 详情引用 | `.detail-quote h2` | 斜体 |
| Trinket 弹窗品牌名/链接 | `.trinket-modal-*` | — |
| 游戏页面标题 | Games 页 h1 | inline style |

### 4.6 字体使用规范

#### 新增组件时的字体选择原则

1. **默认使用主字体栈**：所有标题、正文、描述性文字使用 `PPNeueMontreal, "MiSans", sans-serif`
2. **仅在以下场景使用辅助字体栈**：
   - 小尺寸标签/分类（≤ 12px）
   - 按钮文字
   - Tab/筛选栏
   - 需要与主字体形成视觉层次对比的点缀文字
3. **代码/等宽场景**使用系统等宽字体：`'SF Mono', SFMono-Regular, ui-monospace, Menlo, Consolas, monospace`
4. **禁止混用**：同一组件内不得同时使用主字体和辅助字体（标题和标签分属不同层级除外）

#### 中英文混排注意事项

- 英文字符始终优先匹配本地 woff 字体（PP Neue Montreal / Martha），中文字符自动回退到 CDN 字体（MiSans / LXGW WenKai）
- `font-weight` 映射时注意 MiSans 字重粒度更细（10 级），浏览器会自动匹配最接近的字重
- 中英文基线对齐已通过 `ascent-override: 100%`（英文字体侧）优化
- 中文内容行高建议不低于 `1.5`，确保阅读舒适度；英文纯文本可使用 `133%`（约 1.33）

#### CDN 字体更新

如需更换中文字体或升级版本，仅需修改 `site.config.yml` 中的 `site.fonts.chinese` 数组，重新构建即可生效。无需修改模板或 CSS。

---

## 5. 间距系统

### 核心间距 Token

| 值 | rem | 典型用途 |
|---|-----|---------|
| **4px** | `0.25rem` | 最小间距，图标与文字间距 |
| **6px** | `0.375rem` | 导航链接内边距（垂直）、标签内边距 |
| **8px** | `0.5rem` | 按钮内边距（垂直）、小间距、图标间距 |
| **10px** | `0.625rem` | 主题切换按钮位置偏移 |
| **12px** | `0.75rem` | 导航链接间距、文章体间距、弹窗关闭按钮位置 |
| **16px** | `1rem` | **基础间距**：侧边栏内边距、区块间距、网格间距、卡片内边距 |
| **20px** | `1.25rem` | 页面头部间距、侧边栏底部内边距、弹窗头体内边距 |
| **24px** | `1.5rem` | 侧边栏导航分组间距、状态卡片内间距、详情 Meta 间距 |
| **32px** | `2rem` | 经验列表间距、详情内容顶部间距、引用区块内边距 |
| **48px** | `3rem` | 主内容区顶部内边距、统计区间距 |
| **72px** | `4.5rem` | 移动端主内容顶部内边距（为固定头留空） |

---

## 6. 边框与圆角

### 边框规则
- **统一边框色**：`1px solid var(--BordersPrimary)`
- 所有卡片、分隔线、输入框使用统一变量
- 移动端抽屉边框单独定义（亮: `#e4e4e7`, 暗: `rgb(39, 39, 42)`）

### 圆角系统

| 值 | 像素 | 用途 |
|---|------|------|
| `0.25rem` | 4px | 卡片（状态、文章、Trinket、项目、游戏） |
| `0.375rem` | 6px | 头像、导航链接、按钮、标签、图片、弹窗链接 |
| `0.5rem` | 8px | 侧边栏、经验 Logo、媒体容器、桌面弹窗、骨架屏 |
| `0.75rem` | 12px | 移动端抽屉（仅顶部两角） |
| `8px` | 8px | 背景缩放效果（Vaul wrapper） |
| `9999px` | 圆形 | 社交按钮、头像、主题切换按钮、弹窗关闭按钮 |

---

## 7. 布局系统

### 页面结构

```
┌─────────────────────────────────────────┐
│ body                                     │
│  ┌─────────┐ ┌────────────────────────┐  │
│  │ Sidebar  │ │ #vaulWrapper           │  │
│  │ (fixed)  │ │  ┌──────────────────┐  │  │
│  │ 256px    │ │  │ main-wrap        │  │  │
│  │          │ │  │  ┌─────────────┐ │  │  │
│  │          │ │  │  │ #app        │ │  │  │
│  │          │ │  │  │  main       │ │  │  │
│  │          │ │  │  │  [data-page]│ │  │  │
│  │          │ │  │  │  footer     │ │  │  │
│  │          │ │  │  └─────────────┘ │  │  │
│  │          │ │  └──────────────────┘  │  │
│  └─────────┘ └────────────────────────┘  │
└─────────────────────────────────────────┘
```

### 关键尺寸

| 元素 | 属性 | 值 |
|------|------|---|
| 侧边栏 | 宽度 | `16rem` (256px) |
| 侧边栏 | 定位 | `fixed`, `inset: 0 auto 0 0` |
| 主内容区 | 左边距 | `16rem`（桌面） / `0`（移动） |
| 主内容区 | 最大宽度 | `46.25rem` (740px) |
| 主内容区 | 水平居中 | `margin: 0 auto` |
| 移动端头部 | 高度 | `57px`（padding: 16px + button: 24px + border: 1px） |
| 移动端头部 | z-index | `50` |
| 遮罩层/抽屉 | z-index | `60` |
| 主题切换 | z-index | `50` |

### 网格配置

| 组件 | 移动端 | 桌面端 (≥640px) | 间距 |
|------|--------|----------------|------|
| 状态卡片 | 1列 | 3列 | `1rem` |
| 文章列表 | 1列 | 2列 | `1rem` |
| 项目列表 | 1列 | 2列 | `1rem` |
| Trinkets | 2列 | 3列 | `1rem` |
| 游戏列表 | 2列 | 3列 | `1rem` |
| 精选文章 | 1列(堆叠) | 2列(并排) | `1.5rem` |
| 经验条目 | 1列 | `2fr 3fr 1fr` | `1rem` |

### 固定宽高比

| 元素 | 比例 |
|------|------|
| 文章缩略图 | `16:9` |
| 项目卡片缩略图 | `16:9` |
| 精选文章缩略图 | `16:9` |
| 写作 Hero 图 | `16:9` |
| Trinket 图片 | `1:1` |
| Trinket 弹窗图片 | `484:420` |

---

## 8. 响应式断点

| 断点 | 条件 | 变化 |
|------|------|------|
| **Mobile** | `max-width: 767px` | 隐藏侧边栏，显示移动头部+抽屉导航，主内容 margin-left:0，padding-top: 4.5rem，状态网格变单列 |
| **SM** | `min-width: 640px` | 主内容水平内边距增至 1.25rem，网格从1列变2-3列，经验条目变三列布局 |
| **MD** | `min-width: 768px` | 隐藏移动端抽屉/遮罩，Trinket 弹窗从全屏变为居中卡片式 |

---

## 9. 动效系统

### 页面切换

| 阶段 | 动画 | 时长 | 缓动函数 |
|------|------|------|---------|
| 旧页面离开 | opacity 1→0, translateY 0→-12px | `0.2s` | `cubic-bezier(0.4, 0, 1, 1)` |
| 新页面进入 | opacity 0→1, translateY 16px→0 | `0.35s` | `cubic-bezier(0, 0, 0.2, 1)` |

### 滚动触发动画

| 属性 | 值 |
|------|---|
| 关键帧 | `fadeIn`：opacity 0→1 |
| 时长 | `0.8s` |
| 缓动 | `cubic-bezier(0.25, 0.46, 0.45, 0.94)` |
| 触发条件 | `IntersectionObserver`, threshold: `0.08`, rootMargin: `0px 0px -40px 0px` |

### 交错延迟（Stagger）
- 首次访问页面时，可视区域内的 `[data-animate]` 元素依次出现
- 每个元素延迟 `80ms`，最大延迟 `400ms`
- 再次访问时跳过交错，所有元素立即可见，仅播放页面级渐显

### 抽屉/弹窗动效

| 元素 | 动效 | 时长 | 缓动 |
|------|------|------|------|
| 遮罩层 | opacity 0→1 | `0.5s` | `cubic-bezier(0.32, 0.72, 0, 1)` |
| 抽屉滑入 | translateY(100%)→0 | `0.5s` | `cubic-bezier(0.32, 0.72, 0, 1)` |
| 背景缩放 | scale(1)→scale(0.9333), translateY(14px), border-radius 0→8px | `0.3s` | `cubic-bezier(0.4, 0, 0.2, 1)` |
| Trinket 弹窗(桌面) | translateY(16px) scale(0.97)→translateY(0) scale(1) | `0.3s` | `cubic-bezier(0,0,0.2,1)` |

### 悬停动效
- 卡片上的箭头图标：opacity 0→1 + translateX(-8px)→0，`0.3s ease-in-out`
- 导航链接：opacity 变化 + 背景色变化，`0.2s cubic-bezier(0.4, 0, 0.2, 1)`
- 按钮/卡片：背景色变化，`0.3s`

### 图片加载动效
- 所有图片初始 `opacity: 0`
- 加载完成后添加 `.img-loaded` → `opacity: 1`，过渡 `0.5s cubic-bezier(0.4, 0, 0.2, 1)`
- 图片容器有 shimmer 骨架屏动画背景

### 常用缓动函数

| 名称 | 值 | 用途 |
|------|---|------|
| 标准 | `cubic-bezier(0.4, 0, 0.2, 1)` | 大部分 UI 过渡 |
| 加速离场 | `cubic-bezier(0.4, 0, 1, 1)` | 页面离开 |
| 减速入场 | `cubic-bezier(0, 0, 0.2, 1)` | 页面进入、弹窗出现 |
| Vaul 弹簧 | `cubic-bezier(0.32, 0.72, 0, 1)` | 抽屉/遮罩 |
| 渐显 | `cubic-bezier(0.25, 0.46, 0.45, 0.94)` | 滚动触发 fadeIn |

---

## 10. 组件规范

### 按钮

**填充按钮 `.btn-filled`**
- 背景: `var(--ForegroundSecondary)`, 文字: `var(--BackgroundPrimary)`
- 悬停: 背景变为 `var(--ForegroundPrimary)`
- 尺寸: `padding: 0.5rem 1rem`, 圆角: `0.375rem`
- 字体: 辅助字体栈, `0.75rem`, `letter-spacing: 0.025em`, `text-transform: uppercase`

**描边按钮 `.btn-outline`**
- 背景: 透明, 边框: `1px solid var(--BordersPrimary)`, 文字: `var(--ForegroundSecondary)`
- 悬停: 背景变为 `var(--ForegroundPrimary)`, 文字变为 `var(--BackgroundPrimary)`

### 卡片
- 统一边框: `1px solid var(--BordersPrimary)`
- 统一圆角: `0.25rem`
- 背景: 透明（默认）→ `var(--BackgroundHover)`（悬停）
- 内边距: `1rem`
- 悬停时箭头图标渐显

### 导航链接（侧边栏）
- 默认 opacity: `0.5`
- 悬停: opacity `0.8` + 背景 `var(--BackgroundHover)`
- 选中: opacity `1` + 背景 `var(--BackgroundTertiary)`
- 圆角: `0.375rem`, 过渡: `0.2s`

### 导航链接（移动端抽屉）
- 默认 opacity: `0.3`
- 悬停: opacity `0.8` + 背景 `var(--BackgroundHover)`
- 选中: opacity `1`
- 圆角: `6px`, 字号: `1.125rem`

### 主题切换按钮
- 按钮: `72px × 2.25rem`, 圆角: `9999px`, 背景: `var(--BackgroundSecondary)`
- 指示器: `2rem × 2rem`, 圆角: `9999px`, 背景: `var(--BackgroundPrimary)`
- 亮色: `translateX(4px)`, 暗色: `translateX(36px)`
- 过渡: `0.2s cubic-bezier(0.4, 0, 0.2, 1)`

### 社交按钮
- `2rem × 2rem`, 圆角: `9999px`
- 背景: `var(--BackgroundTertiary)`
- 图标: `0.875em`
- 悬停: `background-color: rgba(var(--ForegroundTertiary) / 0.3)`

### Tab 栏
- 底部边框: `1px solid var(--BordersPrimary)`
- Tab 项默认 opacity: `0.4`, 选中: `1` + `border-bottom: 2px solid var(--ForegroundPrimary)`
- 字体: 辅助字体栈, `0.75rem`, `letter-spacing: 0.05em`, `text-transform: uppercase`

---

## 11. 交互模式

### SPA 路由
- 通过 `data-page` 属性管理页面显示/隐藏
- `navigateTo(pageName)` 函数处理页面切换
- 使用 `visitedPages` Set 追踪已访问页面
- 首次访问: 交错渐显动画
- 再次访问: 整页透明度渐显

### 移动端导航（Vaul-style 底部抽屉）
1. 点击菜单按钮 → 遮罩层渐显 + 抽屉从底部滑入
2. 背景内容（`#vaulWrapper`）同时: scale(0.9333) + translateY(14px) + border-radius(8px)
3. 顶部导航栏**不参与缩放**，被遮罩层覆盖（z-index 50 < 60）
4. 点击遮罩或导航链接关闭

### 图片加载
- 全局图片初始 `opacity: 0`
- JavaScript 监听 `load` 事件添加 `.img-loaded` 类
- 图片容器使用 shimmer 骨架屏占位
- 加载完成后容器添加 `.img-ready` 隐藏骨架

### 滚动行为
- 使用 Lenis 实现平滑滚动
- `IntersectionObserver` 触发 `[data-animate]` 元素的渐显动画
- 页面切换时 `lenis.scrollTo(0, { immediate: true })` 瞬时回顶

### 主题切换流程
1. 添加 `.theme-switching` 类（强制所有元素 `transition-duration: 0s`）
2. 切换 `html` 的 `light`/`dark` 类
3. 保留主题切换按钮自身的 `0.2s` 滑动动画
4. 双帧 `requestAnimationFrame` 后移除 `.theme-switching`

---

> **维护提示**: 修改样式时请优先使用上述 CSS 变量和 token，确保亮/暗模式的一致性。新增组件应遵循现有的间距系统（以 `1rem` 为基础单位）、圆角规则（卡片 4px、按钮/图片 6px、面板 8px）和动效时长规范。字体使用请参考 [4.6 字体使用规范](#46-字体使用规范)，始终使用完整的中英文字体栈声明（`PPNeueMontreal, "MiSans", sans-serif` 或 `Martha, "LXGW WenKai", sans-serif`），不要省略中文回退字体。
