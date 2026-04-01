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

const SOCIAL_ICONS = {
  instagram: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M13.028 2c1.125.003 1.696.009 2.189.023l.194.007c.224.008.445.018.712.03c1.064.05 1.79.218 2.427.465c.66.254 1.216.598 1.772 1.153a4.9 4.9 0 0 1 1.153 1.772c.247.637.415 1.363.465 2.428c.012.266.022.487.03.712l.006.194c.015.492.021 1.063.023 2.188l.001.746v1.31a79 79 0 0 1-.023 2.188l-.006.194c-.008.225-.018.446-.03.712c-.05 1.065-.22 1.79-.466 2.428a4.9 4.9 0 0 1-1.153 1.772a4.9 4.9 0 0 1-1.772 1.153c-.637.247-1.363.415-2.427.465l-.712.03-.194.006c-.493.014-1.064.021-2.189.023l-.746.001h-1.309a78 78 0 0 1-2.189-.023l-.194-.006a63 63 0 0 1-.712-.031c-1.064-.05-1.79-.218-2.428-.465a4.9 4.9 0 0 1-1.771-1.153a4.9 4.9 0 0 1-1.154-1.772c-.247-.637-.415-1.363-.465-2.428l-.03-.712-.005-.194A79 79 0 0 1 2 13.028v-2.056a79 79 0 0 1 .022-2.188l.007-.194c.008-.225.018-.446.03-.712c.05-1.065.218-1.79.465-2.428A4.9 4.9 0 0 1 3.68 3.678a4.9 4.9 0 0 1 1.77-1.153c.638-.247 1.363-.415 2.428-.465c.266-.012.488-.022.712-.03l.194-.006a79 79 0 0 1 2.188-.023zM12 7a5 5 0 1 0 0 10a5 5 0 0 0 0-10m0 2a3 3 0 1 1 .001 6a3 3 0 0 1 0-6m5.25-3.5a1.25 1.25 0 0 0 0 2.5a1.25 1.25 0 0 0 0-2.5"/></svg>',
  linkedin: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M6.94 5a2 2 0 1 1-4-.002a2 2 0 0 1 4 .002M7 8.48H3V21h4zm6.32 0H9.34V21h3.94v-6.57c0-3.66 4.77-4 4.77 0V21H22v-7.93c0-6.17-7.06-5.94-8.72-2.91z"/></svg>',
  threads: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M16.705 11.108c-.162-2.987-1.794-4.697-4.534-4.714c-1.652-.01-3.033.69-3.879 1.973L9.8 9.4c.634-.961 1.635-1.16 2.36-1.153c.903.006 1.583.268 2.024.78c.32.372.535.887.642 1.536q-1.202-.204-2.59-.125c-2.606.15-4.28 1.67-4.168 3.781c.057 1.071.59 1.993 1.502 2.595c.77.509 1.764.757 2.795.701c1.363-.075 2.432-.594 3.178-1.545c.566-.722.924-1.658 1.082-2.836c.65.392 1.13.907 1.397 1.527c.452 1.054.478 2.786-.935 4.198c-1.238 1.236-2.726 1.772-4.975 1.788c-2.495-.018-4.382-.819-5.608-2.378c-1.15-1.46-1.743-3.57-1.765-6.269c.022-2.7.616-4.809 1.765-6.27c1.226-1.559 3.113-2.359 5.608-2.377c2.513.019 4.432.822 5.706 2.39c.625.768 1.095 1.734 1.406 2.86l1.766-.47c-.377-1.387-.969-2.582-1.774-3.573c-1.633-2.01-4.033-3.039-7.11-3.06c-3.071.021-5.432 1.055-7.019 3.071c-1.411 1.795-2.14 4.306-2.164 7.436c.024 3.13.753 5.627 2.164 7.422c1.587 2.016 3.96 3.05 7.03 3.071c2.731-.019 4.655-.734 6.24-2.317c2.075-2.073 2.012-4.67 1.329-6.264c-.525-1.225-1.57-2.206-2.98-2.81m-4.438 4.557c-1.142.064-2.328-.448-2.387-1.546c-.043-.814.58-1.722 2.457-1.83a9.4 9.4 0 0 1 2.533.174c-.216 2.702-1.485 3.14-2.603 3.202"/></svg>'
};

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

function genSocialLinksHtml(social) {
  const items = social.map(s => {
    const icon = SOCIAL_ICONS[s.platform] || '';
    return `<li><a href="${s.url}" target="_blank" rel="noopener noreferrer" class="social-btn">${icon}</a></li>`;
  }).join('\n              ');
  return `<ul class="social-list">\n              ${items}\n            </ul>`;
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

function genFriendCard(f) {
  return `<a href="${f.url}" target="_blank" rel="noopener noreferrer" class="friend-card" data-category="${f.category}"><div class="friend-avatar"></div><div class="friend-info"><h3>${f.name}</h3><p>${f.title}</p></div></a>`;
}

function genTrinketCard(t, idx) {
  return `<div class="trinket-card" data-trinket="${idx}"><div class="trinket-product"><div class="trinket-images"><div class="trinket-img-wrap"><img src="${t.image}" alt="" onerror="this.outerHTML='<div style=font-size:3rem;line-height:1>${t.emoji}</div>'"></div></div><div style="display:flex;align-items:flex-end;justify-content:space-between;"><div><h4>${t.name}</h4><p>${t.brand}</p></div><span class="arrow-reveal">${ARROW_SVG}</span></div></div></div>`;
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
  const friends = readYaml('content/data/friends.yml');
  const trinketsData = readYaml('content/data/trinkets.yml');

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
    '<title>Eric Sin / Selected Works</title>': `<title>${config.site.title}</title>`,
    'content="Selected works of Eric Sin, Product & Brand Designer."': `content="${config.site.description}"`,

    // Profile (sidebar)
    'src="./profile-photo.jpg" alt="Eric Sin"': `src="${config.profile.avatar}" alt="${config.profile.name}"`,
    '<h1>Eric Sin</h1>': `<h1>${config.profile.name}</h1>`,
    '<h2>Designer</h2>': `<h2>${config.profile.title}</h2>`,

    // Clock timezone
    '<span class="tz-abbr">PST</span>': `<span class="tz-abbr">${config.clock.label}</span>`,
    '<span id="tzAbbr">PST</span>': `<span id="tzAbbr">${config.clock.label}</span>`,

    // Hero
    'Designing thoughtful brand &amp; product experiences.': config.hero.heading,
    'Based in Orange County, CA.': config.hero.subheading,
    "I've worked in varied startups throughout the past 20 years. I excel in 0-1 situations and enjoy crafting the vision of what could be.": config.hero.description,
    '>View Resume</a>': ` onclick="navigateTo('${config.hero.cta_primary.action}');return false;">${config.hero.cta_primary.text}</a>`,
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
    '&copy; 2026 Eric Sin': config.site.footer_right,

    // Clock timezone in JS
    "timeZone: 'America/Los_Angeles'": `timeZone: '${config.clock.timezone}'`,
  };

  // Page headers
  const pageHeaders = {
    projects: { title: 'Projects', desc: "I've worked primarily in 0-1 digital product spaces to great success, helping to design thoughtful brand and product experiences. Below are a select collection of some of the businesses I've touched during that time." },
    resume: { title: 'Resume', desc: 'I operate in the space between product and brand design, while dabbling a little bit here and there with development. I gravitate toward complex niches and enjoy making them more accessible and simple.' },
    writing: { title: 'Writing', desc: "I have a lot of thoughts, and realized I didn't have a proper outlet for them until recently. This is now a place for all of my musings, explorations, and retrospectives that I feel may be of value for someone!" },
    friends: { title: 'Friends', desc: 'People I have strong relationships with, have great respect for, or just identify to be good people with kind hearts. Definitely worth a follow and a look at if you\'re looking for talent or great collaborators.' },
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

  // ── Social links replacement ──
  const socialHtml = genSocialLinksHtml(config.social);
  // Replace both sidebar and drawer social link blocks
  html = html.replace(/<ul class="social-list">[\s\S]*?<\/ul>/g, socialHtml);

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
    /(<div class="articles-grid" style="margin-top:1rem;">)[\s\S]*?(<\/div>\s*<\/section>\s*<\/div>\s*<!-- ===== FRIENDS)/,
    `$1\n              ${articlesGridHtml}\n            </div>\n          </section>\n        </div>\n\n        <!-- ===== FRIENDS`
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

  // ── Friends grid ──
  const friendsGridHtml = friends.friends.map(f => genFriendCard(f)).join('\n              ');
  html = html.replace(
    /(<div class="friends-grid"[^>]*>)[\s\S]*?(<\/div>\s*<\/section>\s*<\/div>\s*<!-- ===== TRINKETS)/,
    `$1\n              ${friendsGridHtml}\n            </div>\n          </section>\n        </div>\n\n        <!-- ===== TRINKETS`
  );

  // ── Friends tabs ──
  const friendsCats = friends.categories || [
    { key: 'all', label: 'All' },
    { key: 'brand', label: 'Brand' },
    { key: 'engineer', label: 'Engineer' },
    { key: 'product', label: 'Product' }
  ];
  const friendsTabsHtml = friendsCats.map(c =>
    `<li class="tab-item${c.key === 'all' ? ' active' : ''}" data-tab="${c.key}" data-i18n="filter.${c.key}">${c.label}</li>`
  ).join('\n              ');
  html = html.replace(
    /(<ul class="tab-bar" data-filter="friends">)[\s\S]*?(<\/ul>)/,
    `$1\n              ${friendsTabsHtml}\n            $2`
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

  // ── Write output ──
  if (!fs.existsSync(DIST)) fs.mkdirSync(DIST, { recursive: true });
  fs.writeFileSync(path.join(DIST, 'index.html'), html, 'utf8');

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
