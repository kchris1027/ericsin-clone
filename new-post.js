#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

function slugify(str) {
  return str.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

async function main() {
  console.log('\n  Create a new article\n');

  const title = await ask('  Title: ');
  if (!title.trim()) {
    console.log('  Title is required.');
    rl.close();
    return;
  }

  const tagsInput = await ask('  Tags (comma-separated, e.g. Career, Design): ');
  const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);

  const excerpt = await ask('  Excerpt (one-liner description): ');

  const featured = (await ask('  Featured? (y/N): ')).toLowerCase() === 'y';

  const slug = slugify(title);
  const filename = `${slug}.md`;
  const filepath = path.join(__dirname, 'content', 'writing', filename);

  if (fs.existsSync(filepath)) {
    console.log(`\n  File already exists: content/writing/${filename}`);
    rl.close();
    return;
  }

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];

  const tagsYaml = tags.length ? `[${tags.join(', ')}]` : '[]';

  const content = `---
title: "${title}"
date: ${dateStr}
tags: ${tagsYaml}
featured: ${featured}
excerpt: "${excerpt}"
---

Your content here.
`;

  fs.writeFileSync(filepath, content, 'utf8');
  console.log(`\n  Created: content/writing/${filename}`);
  console.log(`  Edit in VS Code / Typora, then run \`npm run dev\` to preview.\n`);

  rl.close();
}

main();
