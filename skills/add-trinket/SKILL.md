---
name: add-trinket
description: Add a new trinket (好物) to the CaiKong website. Handles product data entry, image sourcing, transparent background processing, and site rebuild. Use when the user says "添加好物", "新增好物", "add trinket", or wants to add a product to the Trinkets page.
---

# Add Trinket

Add a product to the Trinkets (好物) section of the CaiKong site. Each trinket needs a YAML data entry, a transparent-background product image, and a site rebuild.

## Workflow

### Step 1: Gather Product Info

Collect from the user or search the web:

| Field | Required | Description |
|-------|----------|-------------|
| `brand` | Yes | Brand name (e.g. "Apple", "Huawei") |
| `name` | Yes | Product name (e.g. "Mac mini M4") |
| `link` | Yes | Official product page URL |
| `description` | Yes | 1-2 sentence personal take, casual tone matching existing entries |
| `emoji` | Yes | HTML entity fallback icon (e.g. `&#127911;` for 🎧) |
| `image` | Yes | Local path after processing (e.g. `./static/images/product-name.png`) |
| `release_date` | Yes | Product launch date, format `"Mon YYYY"` (e.g. `"Nov 2024"`) |

**Description tone reference** — match the casual, first-person style of existing entries:
> "Tiny but mighty. Swapped my bulky tower for this little silver puck and never looked back."

### Step 2: Source Product Image

Priority order for sourcing a clean product image:

1. **Apple CDN** (Apple products only) — supports native transparent PNG:
   ```
   https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/{asset-id}?wid=800&hei=800&fmt=png-alpha
   ```
   Find `{asset-id}` by fetching the Apple Store page and extracting image URLs.

2. **Official press kits** — e.g. mynewsdesk.com Cloudinary URLs:
   ```
   https://mnd-assets.mynewsdesk.com/image/upload/c_fill,g_auto,w_800/{public-id}
   ```

3. **Web search** — search `"{product name}" product image transparent PNG press kit`.

**Image requirements:**
- 800×800px preferred (square aspect ratio)
- Transparent background PNG
- Product clearly visible, not cropped

### Step 3: Process Image (Remove Background)

If the image already has a transparent background (e.g. Apple CDN with `fmt=png-alpha`), just trim transparent edges with PIL and skip to Step 4. **Do NOT re-run background removal on already-transparent images.**

For images with a solid background, use **rembg** with the **BiRefNet** model + **alpha matting**:

```python
from rembg import remove, new_session
from PIL import Image

session = new_session('birefnet-general')
inp = Image.open('input.jpg')
out = remove(inp, session=session,
             alpha_matting=True,
             alpha_matting_foreground_threshold=190,
             alpha_matting_background_threshold=100,
             alpha_matting_erode_size=3)
bbox = out.getbbox()
if bbox: out = out.crop(bbox)
out.save('static/images/product-name.png')
```

**Why these settings:**
- `birefnet-general` — best edge quality, smooth alpha transitions (vs U2Net which produces jagged edges)
- `alpha_matting=True` — enables continuous alpha prediction on edges instead of binary mask
- `foreground_threshold=190, background_threshold=100` — optimal for crisp product boundaries
- `erode_size=3` — prevents white fringe artifacts

**Prerequisites:** `pip install "rembg[cpu,cli]"` (first run downloads ~973MB BiRefNet model)

**Low-res source images** — if the source is small (e.g. <600px), upscale 2× with Lanczos before processing for better edge quality:
```python
scale = 2
inp = inp.resize((inp.width * scale, inp.height * scale), Image.LANCZOS)
```

**Verify result** after processing:
```python
px = out.load()
w, h = out.size
# Corners should be transparent (alpha=0)
# Center/product body should be opaque (alpha=255)
```

**Legacy fallback** — if rembg/Python is unavailable, use the flood-fill script:
```bash
node skills/add-trinket/scripts/remove-bg.js <input> <output> [threshold]
```

### Step 4: Add YAML Entry

Append to `content/data/trinkets.yml` under the `trinkets:` list:

```yaml
  - brand: "Brand Name"
    name: "Product Name"
    image: "./static/images/product-slug.png"
    description: "Personal description with unicode escapes for special chars."
    link: "https://example.com/product"
    emoji: "&#128187;"
    release_date: "Mar 2025"
```

**YAML escaping rules:**
- Use `\u2014` for em-dash (—), `\u2019` for curly apostrophe (')
- Wrap `description` in double quotes
- Wrap `name` in double quotes if it contains special characters

### Step 5: Update Home Preview (Optional)

If the trinket should appear on the homepage preview, update `home_preview_indices` in `content/data/trinkets.yml`:

```yaml
home_preview_indices: [0, 3, 4]  # indices into the trinkets array
```

### Step 6: Build and Verify

```bash
npm run build    # Rebuild static site
npm run dev      # Start dev server to preview
```

Check both dark and light themes — transparent PNG should blend seamlessly with the theme-adaptive `.trinket-img-wrap` background.

**Modal display**: The trinket modal shows brand, name, product image, description, release date label, and a "View Product" link button. The release date renders as an uppercase auxiliary-font label (`Martha / LXGW WenKai`, 12px, `var(--ForegroundTertiary)`). All body elements participate in the 3D tilt parallax system.

## Common Emoji Entities

| Emoji | Entity | Use for |
|-------|--------|---------|
| 🎧 | `&#127911;` | Headphones, earbuds |
| 💻 | `&#128187;` | Computers, laptops |
| 📷 | `&#128247;` | Cameras |
| ⌨ | `&#9000;` | Keyboards |
| 🎮 | `&#127918;` | Gaming devices |
| 🖱 | `&#128433;` | Mouse |
| ⏱ | `&#9201;` | Watches |
| 🧢 | `&#129506;` | Hats, caps |
| ♫ | `&#9835;` | Audio, speakers |
| 📱 | `&#128241;` | Phones |

## File Locations

| File | Purpose |
|------|---------|
| `content/data/trinkets.yml` | Trinket data entries |
| `static/images/` | Product images (transparent PNG) |
| `templates/index.html` | CSS for `.trinket-img-wrap` bg colors |
| `build.js` | `genTrinketCard()` and `genTrinketDataJS()` functions |

## Additional Resources

- **Primary**: rembg + BiRefNet model (Python, AI-based, smooth edges)
- **Fallback**: [scripts/remove-bg.js](scripts/remove-bg.js) (Node.js, flood-fill, fast but jagged edges)
