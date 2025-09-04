import { readdirSync, statSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, extname, relative } from 'path';

// Configuration
const DOCS_DIR = join(process.cwd(), 'docs');
const BACKUP_DIR = join(DOCS_DIR, 'docs-backups');
const MAX_LINES_PER_FILE = 5000;

// Ensure backup directory exists
if (!existsSync(BACKUP_DIR)) {
  mkdirSync(BACKUP_DIR, { recursive: true });
}

// Function to get all markdown files recursively
function getAllMarkdownFiles(dir) {
  let results = [];
  const list = readdirSync(dir);

  list.forEach(file => {
    file = join(dir, file);
    const stat = statSync(file);

    if (stat && stat.isDirectory()) {
      // Skip the backup directory
      if (file !== BACKUP_DIR) {
        results = results.concat(getAllMarkdownFiles(file));
      }
    } else if (extname(file) === '.md') {
      results.push(file);
    }
  });

  return results;
}

// Function to read all lines from a file
function readAllLines(filePath) {
  const content = readFileSync(filePath, 'utf8');
  return content.split('\n');
}d

// Function to write lines to a file
function writeLinesToFile(filePath, lines) {
  const content = lines.join('\n');
  writeFileSync(filePath, content, 'utf8');
}

// Get all markdown files
const markdownFiles = getAllMarkdownFiles(DOCS_DIR);

// Read all content from all files
let allLines = [];
markdownFiles.forEach(file => {
  // Add a comment to indicate the source file
  allLines.push(`<!-- SOURCE: ${relative(DOCS_DIR, file)} -->`);
  allLines = allLines.concat(readAllLines(file));
  // Add a separator after each file
  allLines.push('');
  allLines.push('---');
  allLines.push('');
});

console.log(`Total lines collected: ${allLines.length}`);
console.log(`Number of files processed: ${markdownFiles.length}`);

// Split into chunks of MAX_LINES_PER_FILE lines
let fileIndex = 1;
for (let i = 0; i < allLines.length; i += MAX_LINES_PER_FILE) {
  const chunk = allLines.slice(i, i + MAX_LINES_PER_FILE);
  const outputPath = join(BACKUP_DIR, `consolidated-docs-${fileIndex}.md`);
  writeLinesToFile(outputPath, chunk);
  console.log(`Created ${outputPath} with ${chunk.length} lines`);
  fileIndex++;
}

console.log(`Consolidation complete. Created ${fileIndex - 1} files in ${BACKUP_DIR}`);
