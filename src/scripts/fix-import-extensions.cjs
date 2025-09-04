/*
  Post-build fix: ensure relative ESM imports in dist include .js extensions.
  This complements tsc-alias when using ESM + VS Code.
*/
const fs = require('fs');
const path = require('path');

const distRoot = path.resolve(__dirname, '../../dist');

function listFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) listFiles(full, out);
    else if (entry.isFile() && full.endsWith('.js')) out.push(full);
  }
  return out;
}

function hasExt(spec) {
  const last = spec.split('/').pop() || '';
  return last.includes('.') || spec.endsWith('/');
}

const re = /((?:import|export)\s[^'"`]*?from\s*|import\s*\(\s*)["']([^"']+)["'](\s*\)?)/g;

const files = listFiles(distRoot);
let touched = 0;
for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  let changed = false;
  const out = src.replace(re, (m, prefix, spec, suffix) => {
    if (!spec.startsWith('.')) return m; // only relative
    if (hasExt(spec)) return m;          // already has ext
    if (spec.includes('?')) return m;    // skip query
    changed = true;
    return `${prefix}'${spec}.js'${suffix}`;
  });
  if (changed) {
    fs.writeFileSync(file, out, 'utf8');
    touched++;
  }
}

// Fallback: explicitly patch known bootstrap file if present
const bootstrapPath = path.join(distRoot, 'core', 'bootstrap.js');
if (fs.existsSync(bootstrapPath)) {
  const src = fs.readFileSync(bootstrapPath, 'utf8');
  const out = src.replace(/from\s+["'](\.\.?(?:\/[^"']+)+)["']/g, (m, spec) => {
    if (!spec.startsWith('.')) return m;
    const last = spec.split('/').pop() || '';
    if (last.includes('.')) return m;
    return m.replace(spec, spec + '.js');
  });
  if (out !== src) {
    fs.writeFileSync(bootstrapPath, out, 'utf8');
    touched++;
  }
}

console.log(`[fix-import-extensions] processed ${files.length} files; updated ${touched}`);
