#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const matter = require('gray-matter');
const MarkdownIt = require('markdown-it');
const anchor = require('markdown-it-anchor');
const hljs = require('highlight.js');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');
const TEMPLATE = path.join(ROOT, 'templates', 'index.html');
const LOCALES_DIR = path.join(ROOT, 'locales');

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight(str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try { return hljs.highlight(str, { language: lang }).value; } catch (_) {}
    }
    return '';
  }
}).use(anchor, { permalink: false });

function readYaml(relPath) {
  return yaml.load(fs.readFileSync(path.join(ROOT, relPath), 'utf8'));
}

function readConfig() {
  return readYaml('site.config.yml');
}

function readContentDir(dir, ext = '.md') {
  const full = path.join(ROOT, 'content', dir);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full)
    .filter(f => f.endsWith(ext))
    .map(f => {
      const raw = fs.readFileSync(path.join(full, f), 'utf8');
      const { data, content } = matter(raw);
      return { ...data, _content: content, _filename: f };
    });
}

// Generate slug from markdown filename if not in frontmatter
function slugify(str) {
  return str.replace(/\.md$/, '').replace(/[^a-z0-9-]/gi, '-').toLowerCase();
}

function readingTime(text) {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

const ARROW_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--ForegroundSecondary)"><path d="M5 12h14m-7-7l7 7-7 7"/></svg>';
const BACK_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7m7 7H5"/></svg>';


// ── Locale loading ──

function loadLocales() {
  const locales = {};
  if (!fs.existsSync(LOCALES_DIR)) return locales;
  for (const f of fs.readdirSync(LOCALES_DIR)) {
    if (f.endsWith('.yml') || f.endsWith('.yaml')) {
      const lang = f.replace(/\.ya?ml$/, '');
      locales[lang] = yaml.load(fs.readFileSync(path.join(LOCALES_DIR, f), 'utf8'));
    }
  }
  return locales;
}

// ── HTML generators ──

function genUtilityBarHtml() {
  const RSS_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/></svg>';
  return `<ul class="utility-bar">
              <li><button class="lang-toggle-btn" id="langToggle" title="Switch language">EN</button></li>
              <li><a href="./feed.xml" target="_blank" rel="noopener noreferrer" class="utility-btn" title="RSS Feed">${RSS_SVG}</a></li>
            </ul>`;
}

function genProjectCard(p) {
  return `<li class="group" data-category="${p.category}"><a href="#" data-detail="${p.slug}" class="project-card"><div class="thumb"><img src="${p.thumbnail}" alt="${p.card_title}"></div><div class="info"><div class="info-text"><h3>${p.card_title}</h3><p>${p.card_meta}</p></div><span class="arrow-reveal">${ARROW_SVG}</span></div></a></li>`;
}

function genProjectDetail(p) {
  let mediaHtml = '';
  let i = 0;
  while (i < (p.media || []).length) {
    const m = p.media[i];
    if (m.layout === 'grid-2' && i + 1 < p.media.length && p.media[i + 1].layout === 'grid-2') {
      const m2 = p.media[i + 1];
      mediaHtml += `<div class="detail-media-row detail-grid-2" data-animate">`;
      mediaHtml += genMediaItem(m) + genMediaItem(m2);
      mediaHtml += `</div>\n`;
      i += 2;
    } else {
      mediaHtml += `<div class="detail-media-row" data-animate>${genMediaItem(m)}</div>\n`;
      i++;
    }
  }

  let extraHtml = '';
  if (p.quotes && p.quotes.length) {
    const quotesBeforeStats = p.stats ? p.quotes.slice(0, -1) : p.quotes;
    const quoteAfterStats = p.stats ? p.quotes.slice(-1) : [];
    quotesBeforeStats.forEach(q => {
      extraHtml += `<section class="detail-quote" data-animate><h2>${q}</h2></section>\n`;
    });
    if (p.stats && p.stats.length) {
      extraHtml += `<section class="detail-stats" data-animate>`;
      p.stats.forEach(s => { extraHtml += `<div class="stat-item"><h1>${s.value}</h1><p>${s.label}</p></div>`; });
      extraHtml += `</section>\n`;
    }
    quoteAfterStats.forEach(q => {
      extraHtml += `<section class="detail-quote" data-animate><h2>${q}</h2></section>\n`;
    });
  }

  const teamHtml = p.team ? `<div class="detail-meta-col"><h3 data-i18n="detail.team">Team</h3><p>${p.team}</p></div>` : '';

  return `
        <div id="${p.slug}" data-page="${p.slug}">
          <section class="detail-back">
            <button class="back-btn" onclick="navigateTo('projects')">${BACK_SVG} <span data-i18n="detail.back_projects">Back to Projects</span></button>
          </section>
          <div class="detail-content">
            <section class="detail-header" data-animate>
              <h1>${p.title}</h1>
              <p class="detail-desc">${p.description}</p>
              <div class="detail-meta">
                <div class="detail-meta-col"><h3 data-i18n="detail.type">Type</h3><p>${p.type}</p><p class="detail-year">${p.year}</p></div>
                ${teamHtml}
              </div>
            </section>
            ${mediaHtml}
            ${extraHtml}
          </div>
        </div>`;
}

function genMediaItem(m) {
  if (m.type === 'video') {
    return `<video src="${m.url}" autoplay loop muted playsinline class="detail-video"></video>`;
  }
  if (m.type === 'html') {
    const title = m.title ? ` title="${m.title}"` : '';
    return `<div class="detail-html-wrap">
      <iframe src="./${m.url}" sandbox="allow-scripts allow-same-origin"${title} loading="lazy"></iframe>
      <button class="detail-html-fullscreen-btn" aria-label="Toggle fullscreen">
        <svg class="icon-expand" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
        <svg class="icon-shrink" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>
      </button>
    </div>`;
  }
  return `<div class="detail-img-wrap"><img src="${m.url}" alt="" loading="lazy"></div>`;
}

function genArticleCard(a, idx) {
  const slug = a.slug || `writing-${slugify(a._filename)}`;
  const cats = (a.tags || []).map(t => t.toLowerCase()).join(' ');
  const tagsHtml = (a.tags || []).map((t, i, arr) =>
    `<span class="article-tag">${t}${i < arr.length - 1 ? ' <span class="dot">&bull;</span>' : ''}</span>`
  ).join('');

  return `<a href="#" data-detail="${slug}" class="article-card" data-category="${cats}">
                <div class="article-thumb placeholder-blog-${idx + 1}"></div>
                <div class="article-body">
                  <h3>${a.title}</h3>
                  <p>${a.excerpt || ''}</p>
                  <div class="article-tags" style="display:flex;align-items:center;justify-content:space-between;"><div style="display:flex;gap:0.5rem;flex-wrap:wrap;">${tagsHtml}</div><span class="arrow-reveal">${ARROW_SVG}</span></div>
                </div>
              </a>`;
}

function genFeaturedArticle(a) {
  const slug = a.slug || `writing-${slugify(a._filename)}`;
  const tagsHtml = (a.tags || []).map((t, i, arr) =>
    `<span class="article-tag">${t}</span>${i < arr.length - 1 ? '<span class="article-tag"> &bull; </span>' : ''}`
  ).join('');
  return `<a href="#" data-detail="${slug}" class="featured-article">
              <div class="feat-thumb placeholder-blog-featured"></div>
              <div class="feat-body">
                <h3>${a.title}</h3>
                <p>${a.excerpt || ''}</p>
                <div class="article-tags">${tagsHtml}</div>
              </div>
            </a>`;
}

function renderWritingBody(article) {
  const html = md.render(article._content);
  const blocks = [];
  const lines = html.split('\n');
  let buffer = '';

  for (const line of lines) {
    if (line.trim() === '') continue;
    const isBlock = /^<(h[1-6]|p|blockquote|ul|ol|pre|table|hr|div)[\s>]/i.test(line.trim());
    if (isBlock && buffer) {
      blocks.push(buffer);
      buffer = '';
    }
    buffer += line + '\n';
  }
  if (buffer.trim()) blocks.push(buffer);

  return blocks.map(b => {
    const trimmed = b.trim();
    if (trimmed.startsWith('<p><img')) {
      const imgMatch = trimmed.match(/<img\s+[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/);
      if (imgMatch) {
        return `<div class="notion-block" data-animate><div class="notion-image"><img src="${imgMatch[1]}" alt="${imgMatch[2]}" onerror="this.style.display='none'"></div></div>`;
      }
    }
    if (trimmed.startsWith('<p><em>') && !trimmed.includes('</em></p>\n<p>')) {
      const inner = trimmed.replace(/^<p><em>/, '').replace(/<\/em><\/p>$/, '');
      if (inner.length < 200 && !inner.includes('<')) {
        return `<div class="notion-block" data-animate><div class="notion-image-caption">${inner}</div></div>`;
      }
    }
    return `<div class="notion-block" data-animate>${trimmed}</div>`;
  }).join('\n              ');
}

function genWritingDetail(a) {
  const slug = a.slug || `writing-${slugify(a._filename)}`;
  const bodyHtml = renderWritingBody(a);
  const tagsHtml = (a.tags || []).map(t => `<span class="writing-tag">${t}</span>`).join('');

  return `
        <div id="${slug}" data-page="${slug}">
          <section class="detail-back">
            <button class="back-btn" onclick="navigateTo('writing')">${BACK_SVG} <span data-i18n="detail.back_writing">Back to Writing</span></button>
          </section>
          <article class="writing-article">
            <section class="writing-header" data-animate>
              <h1>${a.title}</h1>
              ${a.excerpt ? `<p class="writing-subtitle">${a.excerpt}</p>` : ''}
              <div class="writing-tags">${tagsHtml}</div>
            </section>
            <div class="notion-content">
              ${bodyHtml}
            </div>
          </article>
        </div>`;
}

function genExpItem(e) {
  return `<li class="exp-item"><div class="exp-item-inner"><div class="exp-company"><div class="exp-logo"><img src="${e.logo}" alt=""></div><span>${e.company}</span></div><div class="exp-detail"><h2>${e.role}</h2><p>${e.description}</p></div><div class="exp-date"></div></div></li>`;
}

function genClientItem(c) {
  return `<li class="client-item"><h2>${c.name}</h2><span class="services">${c.services}</span><span class="date">${c.date}</span></li>`;
}

function genGameCard(g, idx) {
  const gotyBadge = g.goty ? '<span class="game-goty-badge"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01z"/></svg> GOTY</span>' : '';
  return `<div class="game-card${g.goty ? ' is-goty' : ''}" data-game="${idx}" data-category="${g.year || ''}"><div class="game-cover"><img src="${g.image}" alt="${g.name}" loading="lazy">${gotyBadge}</div><div class="game-info"><div class="game-info-text"><h3>${g.name}</h3><div class="game-genre">${g.genre || ''}</div></div><span class="arrow-reveal">${ARROW_SVG}</span></div></div>`;
}

function genFeaturedGame(g, idx) {
  return `<div class="featured-game" data-game="${idx}">
              <div class="feat-thumb"><img src="${g.image}" alt="${g.name}" loading="lazy"></div>
              <div class="feat-body">
                <div class="feat-label"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01z"/></svg> <span data-i18n="games.favorite">All-Time Favorite</span></div>
                <h3 class="feat-game-name">${g.name}</h3>
                <p class="feat-game-comment">${g.comment || ''}</p>
                <div class="feat-meta">
                  <span class="feat-game-genre">${g.genre || ''}</span>
                  <span>&bull;</span>
                  <span class="feat-game-rating">${(g.rating || 0).toFixed(1)} / 10</span>
                </div>
              </div>
            </div>`;
}

function genGameDataJS(games) {
  const items = games.map(g => {
    const name = (g.name || '').replace(/"/g, '\\"');
    const genre = (g.genre || '').replace(/"/g, '\\"');
    const dev = (g.developer || '').replace(/"/g, '\\"');
    const plat = (g.platform || '').replace(/"/g, '\\"');
    const lp = (g.link_platform || '').replace(/"/g, '\\"');
    return `      { name: "${name}", image: "${g.image}", genre: "${genre}", developer: "${dev}", platform: "${plat}", rating: ${g.rating || 0}, year: "${g.year || ''}", link: "${g.link || ''}", link_platform: "${lp}" }`;
  });
  return `[\n${items.join(',\n')}\n    ]`;
}

function genTrinketCard(t, idx) {
  return `<div class="trinket-card" data-trinket="${idx}"><div class="trinket-product"><div class="trinket-images"><div class="trinket-img-wrap"><img src="${t.image}" alt="" onerror="this.parentElement.classList.add('img-ready');this.outerHTML='<div style=font-size:3rem;line-height:1>${t.emoji}</div>'"></div></div><div style="display:flex;align-items:flex-end;justify-content:space-between;"><div><h4>${t.name}</h4><p>${t.brand}</p></div><span class="arrow-reveal">${ARROW_SVG}</span></div></div></div>`;
}

function genTrinketDataJS(trinkets) {
  const items = trinkets.map(t => {
    const desc = t.description.replace(/"/g, '\\"');
    const name = t.name.replace(/"/g, '\\"');
    return `      { brand: "${t.brand}", name: "${name}", image: "${t.image}", description: "${desc}", link: "${t.link}" }`;
  });
  return `[\n${items.join(',\n')}\n    ]`;
}

function genTrinketEmojisJS(trinkets) {
  return '[' + trinkets.map(t => `'${t.emoji}'`).join(',') + ']';
}

// ── Main build ──

function build() {
  const config = readConfig();
  const locales = loadLocales();
  const projects = readContentDir('projects');
  const writing = readContentDir('writing');
  const resume = readYaml('content/data/resume.yml');
  const gamesData = readYaml('content/data/games.yml');
  const trinketsData = readYaml('content/data/trinkets.yml');

  // Sort projects by year descending (newest first)
  projects.sort((a, b) => parseInt(b.year || '0') - parseInt(a.year || '0'));

  // Sort writing by date descending
  writing.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Assign slugs
  writing.forEach(a => {
    if (!a.slug) a.slug = 'writing-' + slugify(a._filename);
  });

  let html = fs.readFileSync(TEMPLATE, 'utf8');

  // ── Font paths ──
  html = html.replace(/src: url\(\.\/PPNeueMontreal/g, 'src: url(./static/fonts/PPNeueMontreal');
  html = html.replace(/src: url\(\.\/Martha/g, 'src: url(./static/fonts/Martha');

  // ── Simple text replacements ──
  const simpleReplacements = {
    // Title & meta
    '<title>Cai Kong / Selected Works</title>': `<title>${config.site.title}</title>`,
    'content="Selected works of Cai Kong, Product & Brand Designer."': `content="${config.site.description}"`,

    // Profile (sidebar)
    'src="./profile-photo.jpg" alt="Cai Kong"': `src="${config.profile.avatar}" alt="${config.profile.name}"`,
    '<h1>Cai Kong</h1>': `<h1>${config.profile.name}</h1>`,
    '<h2>Designer</h2>': `<h2>${config.profile.title}</h2>`,

    // Clock timezone
    '<span class="tz-abbr">PST</span>': `<span class="tz-abbr">${config.clock.label}</span>`,
    '<span id="tzAbbr">PST</span>': `<span id="tzAbbr">${config.clock.label}</span>`,

    // Hero
    'Designing thoughtful brand &amp; product experiences.': config.hero.heading,
    'Based in Orange County, CA.': config.hero.subheading,
    "I've worked in varied startups throughout the past 20 years. I excel in 0-1 situations and enjoy crafting the vision of what could be.": config.hero.description,
    'href="#" class="btn-filled" data-i18n="hero.cta_primary">View Resume</a>': config.hero.cta_primary.href
      ? `href="${config.hero.cta_primary.href}" target="_blank" rel="noopener noreferrer" class="btn-filled" data-i18n="hero.cta_primary">${config.hero.cta_primary.text}</a>`
      : `href="#" class="btn-filled" data-i18n="hero.cta_primary" onclick="navigateTo('${config.hero.cta_primary.action}');return false;">${config.hero.cta_primary.text}</a>`,
    'href="mailto:hello@ericsin.com"': `href="${config.hero.cta_secondary.href}"`,
    'Open for Freelance': config.hero.cta_secondary.text,

    // Status
    '>Current Listens</span>': `>${config.status.music.label}</span>`,
    '<h4>Bubble Gum</h4>': `<h4>${config.status.music.song}</h4>`,
    '<p>NewJeans</p>': `<p>${config.status.music.artist}</p>`,
    '>Currently Playing</span>': `>${config.status.game.label}</span>`,
    '>Work in Progress</span>': `>${config.status.wip.label}</span>`,
    'VESSEL SUPPLY&reg;': config.status.wip.text,

    // Footer
    'Built with Vue.JS &amp; Tailwind CSS': config.site.footer_left,
    '&copy; 2026 Cai Kong': config.site.footer_right,

    // Clock timezone in JS
    "timeZone: 'America/Los_Angeles'": `timeZone: '${config.clock.timezone}'`,
  };

  // Page headers
  const pageHeaders = {
    projects: { title: 'Projects', desc: "I've worked primarily in 0-1 digital product spaces to great success, helping to design thoughtful brand and product experiences. Below are a select collection of some of the businesses I've touched during that time." },
    resume: { title: 'Resume', desc: 'I operate in the space between product and brand design, while dabbling a little bit here and there with development. I gravitate toward complex niches and enjoy making them more accessible and simple.' },
    writing: { title: 'Writing', desc: "I have a lot of thoughts, and realized I didn't have a proper outlet for them until recently. This is now a place for all of my musings, explorations, and retrospectives that I feel may be of value for someone!" },
    games: { title: 'Games', desc: 'A collection of games I\'ve played and enjoyed. From epic adventures to competitive shooters — these are the titles that left an impression.' },
    trinkets: { title: 'Trinkets', desc: "These are a collection of things that I've bought that I enjoy, find useful, or straight up just look nice." }
  };

  for (const [key, orig] of Object.entries(pageHeaders)) {
    const cfg = config.pages[key];
    if (cfg) {
      if (cfg.title !== orig.title) {
        simpleReplacements[`<h1>${orig.title}</h1>`] = `<h1>${cfg.title}</h1>`;
      }
      if (cfg.description !== orig.desc) {
        simpleReplacements[orig.desc] = cfg.description;
      }
    }
  }

  for (const [search, replace] of Object.entries(simpleReplacements)) {
    html = html.split(search).join(replace);
  }

  // ── Utility bar replacement (lang toggle + RSS) ──
  const utilityHtml = genUtilityBarHtml();
  html = html.replace(/<ul class="social-list">[\s\S]*?<\/ul>/g, utilityHtml);

  // ── Project grid ──
  const projectGridHtml = projects.map(p => genProjectCard(p)).join('\n              ');
  html = html.replace(
    /(<ul class="project-grid"[^>]*>)[\s\S]*?(<\/ul>\s*<\/section>\s*<\/div>\s*<!-- ===== RESUME)/,
    `$1\n              ${projectGridHtml}\n            $2`
  );

  // ── Project detail pages ──
  const projectDetailHtml = projects.map(p => genProjectDetail(p)).join('\n');
  // Remove all existing project-* detail pages
  html = html.replace(
    /(\s*<div id="project-[\s\S]*?)(\s*<div id="writing-|<!-- ===== WRITING DETAIL|<div id="trinkets-page")/,
    (match, _existing, next) => {
      if (next.includes('writing-')) return projectDetailHtml + '\n' + next;
      return projectDetailHtml + '\n        ' + next;
    }
  );

  // ── Resume experience ──
  const expHtml = resume.experience.map(e => genExpItem(e)).join('\n              ');
  html = html.replace(
    /(<ul class="exp-list">)[\s\S]*?(<\/ul>)/,
    `$1\n              ${expHtml}\n            $2`
  );

  // ── Resume clients ──
  const clientsHtml = resume.clients.map(c => genClientItem(c)).join('\n              ');
  html = html.replace(
    /(<ul class="client-list">)[\s\S]*?(<\/ul>)/,
    `$1\n              ${clientsHtml}\n            $2`
  );

  // ── Writing featured article ──
  const featured = writing.find(a => a.featured) || writing[0];
  if (featured) {
    const featHtml = genFeaturedArticle(featured);
    html = html.replace(
      /<a href="#" data-detail="writing-[^"]*" class="featured-article">[\s\S]*?<\/a>/,
      featHtml
    );
  }

  // ── Writing tabs (derive from all tags) ──
  const allTags = [...new Set(writing.flatMap(a => (a.tags || []).map(t => t.toLowerCase())))];
  const tabsHtml = `<li class="tab-item active" data-tab="all" data-i18n="filter.all">All</li>\n` +
    allTags.map(t => `              <li class="tab-item" data-tab="${t}" data-i18n="filter.${t}">${t.charAt(0).toUpperCase() + t.slice(1)}</li>`).join('\n');
  html = html.replace(
    /(<ul class="tab-bar" data-filter="writing">)[\s\S]*?(<\/ul>)/,
    `$1\n              ${tabsHtml}\n            $2`
  );

  // ── Writing articles grid ──
  const articlesGridHtml = writing.map((a, i) => genArticleCard(a, i)).join('\n              ');
  html = html.replace(
    /(<div class="articles-grid" style="margin-top:1rem;">)[\s\S]*?(<\/div>\s*<\/section>\s*<\/div>\s*<!-- ===== GAMES)/,
    `$1\n              ${articlesGridHtml}\n            </div>\n          </section>\n        </div>\n\n        <!-- ===== GAMES`
  );

  // ── Home page articles ──
  const homeArticlesHtml = writing.slice(0, 2).map((a, i) => genArticleCard(a, i)).join('\n                ');
  html = html.replace(
    /(<section style="padding-top:0;">\s*<div class="articles-grid">)[\s\S]*?(<\/div>\s*<\/section>\s*<\/section>\s*<!-- Trinkets)/,
    `$1\n                ${homeArticlesHtml}\n              $2`
  );

  // ── Writing detail pages ──
  const writingDetailHtml = writing.map(a => genWritingDetail(a)).join('\n');
  html = html.replace(
    /(\s*<div id="writing-[\s\S]*?)(\s*<!-- Footer -->)/,
    writingDetailHtml + '\n\n        $2'
  );

  // ── Featured game ──
  const featuredGameIdx = gamesData.games.findIndex(g => g.featured);
  const featuredGame = featuredGameIdx >= 0 ? gamesData.games[featuredGameIdx] : null;
  if (featuredGame) {
    const featHtml = genFeaturedGame(featuredGame, featuredGameIdx);
    html = html.replace(
      /<div class="featured-game"[^>]*>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/section>/,
      featHtml + '\n          </section>'
    );
  }

  // ── Games grid (GOTY games sort first within each year) ──
  const sortedGameIndices = gamesData.games
    .map((g, i) => ({ game: g, origIdx: i }))
    .sort((a, b) => {
      if (a.game.year !== b.game.year) return 0;
      if (a.game.goty && !b.game.goty) return -1;
      if (!a.game.goty && b.game.goty) return 1;
      return 0;
    });
  const gamesGridHtml = sortedGameIndices.map(({ game, origIdx }) => genGameCard(game, origIdx)).join('\n              ');
  html = html.replace(
    /(<div class="games-grid"[^>]*>)[\s\S]*?(<\/div>\s*<\/section>\s*<\/div>\s*<!-- ===== TRINKETS)/,
    `$1\n              ${gamesGridHtml}\n            </div>\n          </section>\n        </div>\n\n        <!-- ===== TRINKETS`
  );

  // ── Games tabs ──
  const gamesCats = gamesData.categories || [
    { key: 'all', label: 'All' }
  ];
  const gamesTabI18n = { all: 'filter.all', playing: 'games.tab_playing' };
  const gamesTabsHtml = gamesCats.map(c => {
    const i18nAttr = gamesTabI18n[c.key] ? ` data-i18n="${gamesTabI18n[c.key]}"` : '';
    return `<li class="tab-item${c.key === 'all' ? ' active' : ''}" data-tab="${c.key}"${i18nAttr}>${c.label}</li>`;
  }).join('\n              ');
  html = html.replace(
    /(<ul class="tab-bar" data-filter="games">)[\s\S]*?(<\/ul>)/,
    `$1\n              ${gamesTabsHtml}\n            $2`
  );

  // ── Trinkets grid ──
  const trinkets = trinketsData.trinkets;
  const trinketsGridHtml = trinkets.map((t, i) => genTrinketCard(t, i)).join('\n              ');
  html = html.replace(
    /(<div class="trinkets-full-grid"[^>]*>)[\s\S]*?(<\/div>\s*<\/section>\s*<\/div>\s*<div id="project-)/,
    `$1\n              ${trinketsGridHtml}\n            </div>\n          </section>\n        </div>\n\n\n        <div id="project-`
  );

  // ── Home trinkets preview ──
  const previewIndices = trinketsData.home_preview_indices || [0, 3, 4];
  const homeTrinketsHtml = previewIndices.map(i => genTrinketCard(trinkets[i], i)).join('\n                ');
  html = html.replace(
    /(<div class="trinkets-grid">)[\s\S]*?(<\/div>\s*<\/section>\s*<\/div>\s*<!-- ===== PROJECTS)/,
    `$1\n                ${homeTrinketsHtml}\n              </div>\n          </section>\n        </div>\n\n        <!-- ===== PROJECTS`
  );

  // ── Trinket JS data ──
  const trinketDataJS = genTrinketDataJS(trinkets);
  const trinketEmojisJS = genTrinketEmojisJS(trinkets);
  html = html.replace(
    /const trinketData = \[[\s\S]*?\];/,
    `const trinketData = ${trinketDataJS};`
  );
  html = html.replace(
    /const trinketEmojis = \[[\s\S]*?\];/,
    `const trinketEmojis = ${trinketEmojisJS};`
  );

  // ── Game JS data ──
  const gameDataJS = genGameDataJS(gamesData.games);
  html = html.replace(
    /const gameData = \[[\s\S]*?\];/,
    `const gameData = ${gameDataJS};`
  );

  // ── Inject external font CDN links from config ──
  const fontLinks = (config.site.fonts && config.site.fonts.chinese) || [];
  if (fontLinks.length > 0) {
    const linkTags = fontLinks.map(url => `  <link rel="stylesheet" href="${url}">`).join('\n');
    html = html.replace(
      /\s*<!-- Chinese web fonts \(unicode-range split, on-demand loading\) -->[\s\S]*?(?=\s*<style>)/,
      `\n  <!-- Chinese web fonts (unicode-range split, on-demand loading) -->\n${linkTags}\n`
    );
  }

  // ── Inject i18n locale data ──
  const defaultLocale = config.site.defaultLocale || 'en';
  const availableLocales = config.site.locales || Object.keys(locales);
  html = html.replace(
    'const __LOCALES__ = /*__LOCALES_PLACEHOLDER__*/ {};',
    `const __LOCALES__ = ${JSON.stringify(locales)};`
  );
  html = html.replace(
    "const __DEFAULT_LOCALE__ = /*__DEFAULT_LOCALE_PLACEHOLDER__*/ 'en';",
    `const __DEFAULT_LOCALE__ = ${JSON.stringify(defaultLocale)};`
  );
  html = html.replace(
    "const __AVAILABLE_LOCALES__ = /*__AVAILABLE_LOCALES_PLACEHOLDER__*/ ['en','zh'];",
    `const __AVAILABLE_LOCALES__ = ${JSON.stringify(availableLocales)};`
  );

  // ── Generate RSS feed for Writing articles ──
  const siteUrl = config.site.url || '';
  const rssItems = writing.slice(0, 20).map(a => {
    const pubDate = a.date ? new Date(a.date).toUTCString() : '';
    const slug = a.slug || 'writing-' + slugify(a._filename);
    const link = siteUrl ? `${siteUrl}/#${slug}` : `#${slug}`;
    const desc = (a.excerpt || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const title = (a.title || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `    <item>
      <title>${title}</title>
      <link>${link}</link>
      <guid>${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${desc}</description>
    </item>`;
  }).join('\n');
  const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${(config.site.title || '').replace(/&/g, '&amp;')}</title>
    <link>${siteUrl}</link>
    <description>${(config.site.description || '').replace(/&/g, '&amp;')}</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
${rssItems}
  </channel>
</rss>`;

  // ── Write output ──
  if (!fs.existsSync(DIST)) fs.mkdirSync(DIST, { recursive: true });
  fs.writeFileSync(path.join(DIST, 'index.html'), html, 'utf8');
  fs.writeFileSync(path.join(DIST, 'feed.xml'), rssFeed, 'utf8');

  // Copy static assets
  copyDir(path.join(ROOT, 'static'), path.join(DIST, 'static'));

  // Copy images folder if it exists
  const imagesDir = path.join(ROOT, 'images');
  if (fs.existsSync(imagesDir)) {
    copyDir(imagesDir, path.join(DIST, 'images'));
  }

  console.log(`Build complete → dist/index.html (${(html.length / 1024).toFixed(1)} KB)`);
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

// Allow use as module (for dev server)
module.exports = { build };

if (require.main === module) {
  build();
}
