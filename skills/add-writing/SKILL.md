---
name: add-writing
description: Add a new writing article to the CaiKong website. Handles article authoring, cover image prompt generation (style tailored to article content), frontmatter setup, internal linking, and site rebuild. Use when the user says "添加文章", "新增文章", "写一篇文章", "add writing", or wants to publish content to the Writing page.
---

# Add Writing Article

Publish an article to the Writing section of the CaiKong site. Each article needs a Markdown file with frontmatter, a cover image (local or external), and a site rebuild.

---

## Workflow

### Step 1: Gather Article Info

Collect from the user or derive from provided content:

| Field | Required | Description |
|-------|----------|-------------|
| `title` | Yes | Article title (Chinese or English) |
| `date` | Yes | Publish date, format `YYYY-MM-DD` |
| `tags` | Yes | Array of topic tags, e.g. `[Design, AI, Career]` |
| `cover` | Recommended | Cover image path or URL (see Step 2) |
| `cover_caption` | No | One-line caption shown below cover image (italic) |
| `featured` | No | `true` to pin as featured article on Writing page |
| `excerpt` | Yes | 1-2 sentence summary shown on article card |
| `slug` | No | Custom URL slug — if omitted, auto-derived from filename |

**Filename convention:** Use lowercase kebab-case matching the article topic.
```
content/writing/your-article-slug.md
```

---

### Step 2: Generate Cover Image Prompt

Cover image style should reflect the **emotional tone and subject matter** of the article — not a fixed visual style. Derive the prompt from the article's core metaphor, mood, and audience.

#### Style selection guide

| Article tone | Suggested visual direction |
|---|---|
| Analytical / systematic (AI, cognition, frameworks) | Abstract geometric, Swiss editorial, neural lattice structures, controlled palette |
| Personal / reflective (life, career, growth) | Painterly, warm light, figurative, loose brushwork |
| Design / craft | Flat illustration, tool-forward, Malika Favre / McBess reference, bold color blocks |
| Cultural / emotional | Ink wash, expressive line, Victo Ngai reference, layered texture |
| Technical / product | Clean isometric, product-adjacent, minimal with one accent color |

#### Prompt structure

Build the prompt in this order:

```
[Medium/style declaration]. [Core visual subject — the article's central metaphor rendered as an image]. [Mood and atmosphere]. [Color palette]. [Texture and technique]. [Composition note]. [Style references]. --ar 16:9
```

**Example — analytical article (AI / cognition):**
> A minimal editorial illustration. An abstract neural lattice floats above a near-black void, thin crisp lines branching into structured data points that dissolve at the edges into white noise. Cool steel blue accent on pure black ground. No gradients, generous negative space. Style: Swiss International Typographic Style, Stripe product illustration. `--ar 16:9 --style raw --stylize 200 --v 6`

**Example — design / craft article:**
> A detailed editorial illustration. A human figure at a desk surrounded by floating half-formed sketches and geometric shapes gradually resolving into clean structured forms — the gap between inner feeling and outward expression. Warm amber and dusty rose bleeding into cool indigo shadows. Ink wash textures mixed with flat graphic elements. Loose expressive linework with occasional precise insets. Style: Malika Favre, Victo Ngai, McBess. `--ar 16:9 --style raw --stylize 400 --v 6`

#### Cover image delivery

- **If using AI generation:** User generates externally (Midjourney, DALL·E, Gemini), saves to `static/images/<article-slug>-cover.png`, then update frontmatter with local path `/static/images/<article-slug>-cover.png`
- **If using external URL:** Paste directly into `cover` field — e.g. cosmos.so CDN links work well

---

### Step 3: Write Article Content

#### Frontmatter template

```yaml
---
title: "Article Title"
date: YYYY-MM-DD
tags: [Tag1, Tag2, Tag3]
cover: "/static/images/article-slug-cover.png"
cover_caption: "One line caption for the cover image."
featured: false
excerpt: "1-2 sentence summary of the article shown on the card."
---
```

#### Body conventions

- First element after frontmatter should be the cover image + caption in Markdown (the build system deduplicates it from the body when rendering the detail page):
  ```markdown
  ![Cover](/static/images/article-slug-cover.png)
  *Cover caption text.*
  ```
- Use `##` and `###` for section headings
- Blockquotes (`>`) for key callouts or summaries
- Bold (`**text**`) for emphasis within paragraphs
- Tables for structured comparisons
- End with a horizontal rule `---` before any footer notes

#### Internal links

To link to another article on the site, use the `/writing/<slug>` path format — the build system automatically converts these to SPA `data-detail` links:
```markdown
[Article Title](/writing/other-article-slug)
```

**Do not use** `href="#"` or `data-detail` directly in Markdown — those are build artifacts.

#### Excerpt writing tips

- Lead with the article's sharpest claim or most surprising framing
- 1-2 sentences max, no trailing period required
- Avoid generic openers ("In this article…", "This post explores…")

---

### Step 4: Place the File

Save the article to:
```
content/writing/<article-slug>.md
```

If a cover image was provided as a local file, copy it to:
```
static/images/<article-slug>-cover.png
```

---

### Step 5: Add Cross-links (Optional)

If the new article is thematically related to existing articles, add a footer cross-link in both files:

```markdown
---

*延伸阅读：[Related Article Title](/writing/related-slug)*
```

---

### Step 6: Build and Verify

```bash
node build.js       # Rebuild static site
node dev.js         # Start dev server to preview
```

**Check after build:**
- Article card appears on `/writing` page
- Featured article slot updated if `featured: true`
- Cover image loads correctly at both `/` and `/writing/<slug>` URL depths (absolute paths required — `/static/images/...` not `./static/images/...`)
- Internal cross-links navigate within SPA (no full-page reload)
- Tags appear and filter correctly

---

### Step 7: Commit and Push

```bash
git add content/writing/<slug>.md static/images/<slug>-cover.png
git commit -m "feat(writing): 新增文章 <title>"
git push
```

Vercel auto-deploys on push to `main`.

---

## Frontmatter Field Reference

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `title` | string | — | Quoted. Chinese titles work fine. |
| `date` | date | — | `YYYY-MM-DD`. Controls sort order. |
| `tags` | array | `[]` | Drives the filter tabs on the Writing page. New tags auto-appear. |
| `cover` | string | — | Absolute path `/static/images/...` or external URL. Omit if no cover. |
| `cover_caption` | string | — | Shown as italic text below cover image. |
| `featured` | boolean | `false` | Only one article should be featured at a time. |
| `excerpt` | string | — | Single-quoted if contains double quotes; double-quoted otherwise. |
| `slug` | string | auto | Override the auto-generated slug. Auto format: `writing-<hash>`. |

---

## File Locations

| File | Purpose |
|------|---------|
| `content/writing/` | Article Markdown files |
| `static/images/` | Cover images (use absolute path in frontmatter) |
| `build.js` → `genArticleCard()` | Article card rendering |
| `build.js` → `genFeaturedArticle()` | Featured article rendering |
| `build.js` → `genWritingDetail()` | Article detail page rendering |
| `build.js` → `renderWritingBody()` | Markdown body → HTML blocks |

---

## Cover Image Prompt: Quick Reference

When generating prompts, always ask yourself:

1. **What is the article's central metaphor?** (e.g. "the gap between feeling and form", "a chain of cognitive abilities", "abstraction as compression")
2. **What emotional register does it operate in?** (analytical / warm / melancholic / energetic)
3. **Who is the reader?** (designer, developer, generalist thinker)

Then pick a visual language that matches — **not** a fixed brand style.

| Stylize level | When to use |
|---|---|
| `--stylize 100–200` | Clean, restrained, editorial |
| `--stylize 300–500` | Expressive, illustrative, textured |
| `--stylize 600–800` | Painterly, loose, emotionally charged |
