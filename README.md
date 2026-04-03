# Personal Blog — Static Site Generator

基于 Node.js 的静态博客系统。通过 YAML 配置个人信息，Markdown 编写文章，构建脚本生成最终的单页静态 HTML，保留完整的 SPA 交互和动效体验。

## 目录结构

```
├── site.config.yml          # 全局配置（个人信息、导航、社交链接等）
├── content/
│   ├── writing/             # 文章（Markdown + frontmatter）
│   ├── projects/            # 项目（Markdown frontmatter，描述 + 媒体）
│   └── data/
│       ├── resume.yml       # 简历（工作经历、客户列表）
│       ├── friends.yml      # 朋友列表
│       └── trinkets.yml     # Trinkets 数据
├── static/
│   ├── fonts/               # 字体文件
│   └── images/              # 图片资源（头像、favicon、微信二维码等）
├── locales/
│   ├── en.yml               # 英文界面翻译
│   └── zh.yml               # 中文界面翻译
├── templates/
│   └── index.html           # HTML 模板（构建基底）
├── build.js                 # 构建脚本
├── dev.js                   # 开发服务器（热更新）
├── new-post.js              # 交互式新建文章
├── dist/                    # 构建输出（部署此目录）
└── .github/workflows/
    └── deploy.yml           # GitHub Actions 自动部署
```

## 快速开始

```bash
# 安装依赖
npm install

# 本地开发（启动 HTTP 服务器 + 文件监听 + 自动重构建 + 浏览器热刷新）
npm run dev

# 生产构建（输出到 dist/）
npm run build

# 新建文章（交互式创建 Markdown 模板）
npm run new
```

## 配置说明

所有站点级配置集中在 `site.config.yml` 中：

### site — 站点元信息

```yaml
site:
  title: "站点标题"             # 浏览器标签页标题
  description: "站点描述"       # <meta description>
  footer_left: "左侧页脚文案"
  footer_right: "右侧页脚文案"  # 支持 HTML 实体如 &copy;
  defaultLocale: "en"          # 默认语言
  locales: ["en", "zh"]        # 可选语言列表
  fonts:
    chinese:                   # 中文 Web 字体 CDN（按需子集加载）
      - "https://cdn.jsdelivr.net/npm/misans-webfont@4.3.1/misans-style.min.css"
      - "https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.7.0/lxgwwenkai-regular.css"
      - "https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.7.0/lxgwwenkai-light.css"
      - "https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.7.0/lxgwwenkai-bold.css"
```

### profile — 个人资料

```yaml
profile:
  name: "你的名字"
  title: "你的头衔"
  avatar: "./static/images/profile-photo.jpg"
```

### hero — 首页主视觉

```yaml
hero:
  heading: "主标题"
  subheading: "副标题"
  description: "简介描述"
  cta_primary:
    text: "按钮文字"
    href: "https://example.com"  # 外部链接（新标签打开）
    # action: "resume"           # 或内部跳转到指定页面
  cta_secondary:
    text: "按钮文字"
    action: "wechat"             # 弹出微信二维码弹窗
```

### social — 社交链接

支持的平台：`instagram`、`linkedin`、`threads`。

```yaml
social:
  - platform: instagram
    url: "https://instagram.com/yourhandle"
  - platform: linkedin
    url: "https://linkedin.com/in/yourprofile"
```

### clock — 时钟

```yaml
clock:
  label: "PST"                  # 显示的时区缩写
  timezone: "America/Los_Angeles"  # IANA 时区名
```

### status — 首页状态卡片（走马灯）

状态卡片以无限循环走马灯展示，包含音乐、游戏、进行中项目和天气四种卡片。

```yaml
status:
  music:
    label: "Current Listens"
    song: "歌曲名"
    artist: "艺术家"
    thumb: "https://example.com/cover.jpg"     # 歌曲封面图 URL
    song_url: "https://example.com/song.mp3"   # 音频源 URL
  game:
    label: "Currently Playing"
    title: "游戏名称"
    studio: "开发工作室"
    thumb: "https://example.com/game-cover.jpg" # 游戏封面图 URL
  wip:
    label: "Work in Progress"
    text: "项目名称"
```

天气卡片无需配置，自动通过 Open-Meteo API 获取上海实时天气数据。

**音乐播放器**：点击音乐卡片播放/暂停；鼠标悬停时光标变为跳动的音频均衡器动效，卡片右上角也有固定的均衡器指示器。

### pages — 各页面标题和描述

```yaml
pages:
  projects:
    title: "Projects"
    description: "页面介绍文字"
  resume:
    title: "Resume"
    description: "..."
  writing:
    title: "Writing"
    description: "..."
  friends:
    title: "Friends"
    description: "..."
  trinkets:
    title: "Trinkets"
    description: "..."
```

## 字体系统

项目采用中英文双字体栈，英文使用本地字体文件，中文通过 CDN 按需加载（unicode-range 子集化，仅下载页面实际使用的字符）。

| 用途 | 英文字体 | 中文字体 | CSS 引用 |
|------|---------|---------|---------|
| 主字体（标题、正文、UI） | PP Neue Montreal | MiSans | `PPNeueMontreal, "MiSans", sans-serif` |
| 辅助字体（标签、按钮、tab） | Martha | 霞鹜文楷 (LXGW WenKai) | `Martha, "LXGW WenKai", sans-serif` |

中文字体 CDN 地址在 `site.config.yml` 的 `site.fonts.chinese` 中配置，构建时自动注入 `<link>` 标签。

## 国际化（i18n）

站点支持中英文切换。页面右上角有语言切换按钮，用户选择的语言偏好保存在 `localStorage`。

### 配置

在 `site.config.yml` 中设置默认语言和可用语言列表：

```yaml
site:
  defaultLocale: "en"        # 默认语言（"en" 或 "zh"）
  locales: ["en", "zh"]      # 可选语言列表
```

### 翻译文件

翻译存放在 `locales/` 目录下，每种语言一个 YAML 文件：

- `locales/en.yml` — 英文
- `locales/zh.yml` — 中文

翻译文件涵盖导航、页面标题、按钮文本、筛选标签等所有 UI 文案。要修改某个语言的翻译，直接编辑对应的 YAML 文件即可。

### 新增语言

1. 在 `locales/` 下创建新的 YAML 文件（如 `ja.yml`），参照 `en.yml` 的结构翻译所有键值
2. 在 `site.config.yml` 的 `locales` 列表中添加新语言代码：`locales: ["en", "zh", "ja"]`
3. 重新构建即可

## 内容管理

### 写文章

1. 运行 `npm run new`，按提示输入标题、标签、摘要
2. 或者手动在 `content/writing/` 下创建 `.md` 文件：

```markdown
---
title: "文章标题"
date: 2026-04-01
tags: [Career, Design]
featured: false
excerpt: "一句话摘要"
cover: "https://example.com/cover.jpg"
cover_caption: "封面图说明"
---

正文内容，支持完整的 **GFM Markdown** 语法：

## 标题

段落文字、**加粗**、*斜体*、[链接](url)、`行内代码`。

> 引用文本

- 无序列表
- 列表项

1. 有序列表
2. 列表项

| 表头 | 表头 |
|------|------|
| 单元 | 单元 |
```

````markdown
```javascript
const hello = "代码块支持语法高亮";
```
````

```markdown
![图片描述](url)
*图片说明会渲染为 caption*
```

### Frontmatter 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `title` | string | 是 | 文章标题 |
| `date` | date | 是 | 发布日期，用于排序 |
| `tags` | string[] | 否 | 标签列表，会自动生成筛选标签页 |
| `featured` | boolean | 否 | 设为 `true` 会显示为 Writing 页的置顶文章 |
| `excerpt` | string | 否 | 摘要 |
| `cover` | string | 否 | 封面图 URL |
| `cover_caption` | string | 否 | 封面图说明 |

### 添加项目

在 `content/projects/` 下创建 `.md` 文件：

```markdown
---
title: "项目名"
slug: "project-my-project"
category: "brand"              # brand 或 product
year: "2025"
type: "Identity Design, Web Design"
description: "项目描述"
team: "团队成员"               # 可选
thumbnail: "https://example.com/thumb.jpg"
card_title: "卡片标题"
card_meta: "Brand &bull; 2025"
media:
  - { type: "image", url: "https://example.com/1.jpg" }
  - { type: "video", url: "https://example.com/1.mp4" }
  - { type: "image", url: "https://example.com/2.jpg", layout: "grid-2" }
  - { type: "image", url: "https://example.com/3.jpg", layout: "grid-2" }
quotes:
  - "引用文字"
stats:
  - { value: "$2M", label: "ARR in Year 1" }
---
```

`layout: "grid-2"` 的图片会两张并排显示。连续两张 `grid-2` 图片自动组成一行。

### 编辑简历、朋友、Trinkets

直接编辑对应的 YAML 文件：

- `content/data/resume.yml` — 工作经历和客户列表
- `content/data/friends.yml` — 朋友列表及分类
- `content/data/trinkets.yml` — Trinkets 收藏

## 开发

```bash
npm run dev
```

启动后访问 `http://localhost:3000`（端口被占用时可通过环境变量指定：`PORT=3001 npm run dev`）。

修改以下任意文件后会自动重新构建并刷新浏览器：

- `site.config.yml`
- `content/` 下的所有文件
- `templates/index.html`
- `static/` 下的资源

## 部署

### GitHub Pages（自动）

项目已配置 GitHub Actions（`.github/workflows/deploy.yml`）：

1. 在 GitHub 仓库 Settings → Pages 中，将 Source 设为 **GitHub Actions**
2. 推送到 `main` 分支即自动构建并部署

### 手动部署

```bash
npm run build
```

将 `dist/` 目录部署到任意静态托管服务（Netlify、Vercel、Cloudflare Pages 等）。

## 特色功能

| 功能 | 说明 |
|------|------|
| 走马灯状态栏 | 音乐、游戏、WIP、天气卡片无限循环滚动，悬停暂停 |
| 音乐播放器 | 点击播放/暂停，自定义光标均衡器动效，卡片固定指示器 |
| 实时天气 | 通过 Open-Meteo API 获取上海天气，emoji 图标 + 温度 |
| 3D 倾斜 + 视差 | 弹窗卡片鼠标跟随倾斜，内部元素多层视差 + 光泽高光 |
| 主题适配二维码 | 微信二维码透明背景，暗色白色 / 亮色黑色自动切换 |
| 图片加载优化 | shimmer 骨架屏 + 10 秒超时兜底 + emoji 占位符 |
| 首屏加载动画 | 品牌 "CK" 字标 clip-path 揭示 + 横线展开 + "PORTFOLIO" 淡入，等待资源就绪后退场；`sessionStorage` 控制同会话仅播放一次 |
| 双语 i18n | 中英文实时切换，`localStorage` 持久化 |

## 技术栈

| 用途 | 技术 |
|------|------|
| 构建 | Node.js 脚本（无框架依赖） |
| 图片处理 | sharp（二维码抠背景） |
| 内容 | Markdown + YAML frontmatter |
| 配置 | YAML |
| 模板 | 原生 HTML + 正则注入 |
| Markdown 渲染 | markdown-it + 插件 |
| 代码高亮 | highlight.js |
| 天气 API | Open-Meteo（免费，无 API Key） |
| 开发服务器 | HTTP server + chokidar + SSE 热刷新 |
| 部署 | GitHub Pages + GitHub Actions |
