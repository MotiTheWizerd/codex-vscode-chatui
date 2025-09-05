const fs = require('fs');
const path = require('path');

// Read the symbol index
const symbolIndex = JSON.parse(fs.readFileSync('./project-backup/symbol-index.json', 'utf8'));
const codebaseIndex = JSON.parse(fs.readFileSync('./project-backup/codebase-index.json', 'utf8'));

// Create a map of file to imports for quick lookup
const fileImportsMap = {};
codebaseIndex.forEach(entry => {
  fileImportsMap[entry.file] = entry.imports;
});

// Group symbols by file
const symbolsByFile = {};
symbolIndex.forEach(symbol => {
  if (!symbolsByFile[symbol.file]) {
    symbolsByFile[symbol.file] = [];
  }
  symbolsByFile[symbol.file].push(symbol);
});

// Create a map of symbol references (where each symbol is used)
const symbolReferences = {};
symbolIndex.forEach(symbol => {
  symbolReferences[symbol.name] = symbolReferences[symbol.name] || [];
});

// For each file, check which symbols are referenced in other files
codebaseIndex.forEach(entry => {
  const fileName = entry.file;
  const imports = entry.imports;
  
  // For each import, check if it references a known symbol
  imports.forEach(imp => {
    // Skip external imports (vscode, etc.)
    if (imp.startsWith('@/')) {
      // Extract the file path from the import
      const importedFilePath = imp.replace('@/', 'src/') + '.ts';
      // Check if we have symbols in this file
      if (symbolsByFile[importedFilePath]) {
        symbolsByFile[importedFilePath].forEach(symbol => {
          if (symbol.export) {
            symbolReferences[symbol.name] = symbolReferences[symbol.name] || [];
            if (!symbolReferences[symbol.name].includes(fileName)) {
              symbolReferences[symbol.name].push(fileName);
            }
          }
        });
      }
    }
  });
});

// Group files by layer (core, ui, modules, etc.)
const layers = {};
Object.keys(symbolsByFile).forEach(filePath => {
  const layer = filePath.split('/')[1]; // src/core/manager.ts -> core
  if (!layers[layer]) {
    layers[layer] = [];
  }
  layers[layer].push(filePath);
});

// Generate documentation for each file
Object.keys(symbolsByFile).forEach(filePath => {
  const symbols = symbolsByFile[filePath];
  const dirname = path.dirname(filePath);
  const filename = path.basename(filePath, '.ts');
  
  // Create directory if it doesn't exist
  const docDir = path.join('docs', 'auto-generated', dirname);
  if (!fs.existsSync(docDir)) {
    fs.mkdirSync(docDir, { recursive: true });
  }
  
  // Generate markdown content
  let content = `# ${filename}\n\n`;
  content += `File: \`${filePath}\`\n\n`;
  
  // Add import path for exported symbols
  const exportedSymbols = symbols.filter(s => s.export);
  if (exportedSymbols.length > 0) {
    content += `## Import\n\n`;
    content += '```typescript\n';
    exportedSymbols.forEach(symbol => {
      content += `import { ${symbol.name} } from '@/${filePath.replace('src/', '').replace('.ts', '')}';\n`;
    });
    content += '```\n\n';
  }
  
  // Add table of contents
  content += `## Table of Contents\n\n`;
  symbols.forEach(symbol => {
    content += `- [${symbol.name} (${symbol.kind})](#${symbol.name.toLowerCase()})\n`;
  });
  content += '\n';
  
  // Add details for each symbol
  symbols.forEach(symbol => {
    content += `## ${symbol.name}\n\n`;
    content += `**Kind**: ${symbol.kind}\n\n`;
    content += `**File**: \`${filePath}\`\n\n`;
    content += `**Line**: ${symbol.line}\n\n`;
    content += `**Signature**:\n\n`;
    content += '```typescript\n';
    content += `${symbol.signature}\n`;
    content += '```\n\n';
    
    if (symbol.doc) {
      content += `**Description**:\n\n`;
      content += `${symbol.doc}\n\n`;
    }
    
    // Add "See also" references
    if (symbolReferences[symbol.name] && symbolReferences[symbol.name].length > 0) {
      content += `**See also**:\n\n`;
      symbolReferences[symbol.name].forEach(refFile => {
        content += `- [\`${refFile}\`](./${refFile.replace('src/', '').replace('.ts', '.md')})\n`;
      });
      content += '\n';
    }
    
    content += '---\n\n';
  });
  
  // Write the file
  const docFilePath = path.join('docs', 'auto-generated', `${filePath.replace('.ts', '.md')}`);
  fs.writeFileSync(docFilePath, content);
});

// Generate main README
let readmeContent = `# Auto-Generated Documentation\n\n`;
readmeContent += `This documentation was automatically generated from the codebase symbol index.\n\n`;

// Group by layers
Object.keys(layers).sort().forEach(layer => {
  readmeContent += `## ${layer.charAt(0).toUpperCase() + layer.slice(1)} Layer\n\n`;
  layers[layer].sort().forEach(filePath => {
    const filename = path.basename(filePath, '.ts');
    readmeContent += `- [${filename}](./${filePath.replace('.ts', '.md')})\n`;
  });
  readmeContent += '\n';
});

// Write the README
fs.writeFileSync('docs/auto-generated/README.md', readmeContent);

console.log('Documentation generated successfully!');