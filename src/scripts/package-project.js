import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

// Get current date in YYYYMMDD format
const date = new Date();
const dateString = date.toISOString().slice(0, 10).replace(/-/g, '');

// Define the output filename
const outputDir = 'project-backup';
const outputFile = path.join(outputDir, `${dateString}_codex_project_backup.zip`);

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Create a file to stream archive data to
const output = fs.createWriteStream(outputFile);
const archive = archiver('zip', {
  zlib: { level: 9 } // Sets the compression level
});

// Listen for all archive data to be written
output.on('close', function () {
  console.log(`${archive.pointer()} total bytes`);
  console.log(`Backup created successfully: ${outputFile}`);
  
  // Get file size in MB
  const stats = fs.statSync(outputFile);
  const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`Backup file size: ${fileSizeInMB} MB`);
});

// Catch warnings (e.g. stat failures and permission errors)
archive.on('warning', function(err) {
  if (err.code === 'ENOENT') {
    // log warning
    console.warn('Warning:', err);
  } else {
    // throw error
    throw err;
  }
});

// Catch errors
archive.on('error', function(err) {
  throw err;
});

// Pipe archive data to the file
archive.pipe(output);

// Read .gitignore and create exclude patterns
const gitignorePath = '.gitignore';
let excludePatterns = [];

if (fs.existsSync(gitignorePath)) {
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  excludePatterns = gitignoreContent
    .split('\n')
    .filter(line => line.trim() !== '' && !line.startsWith('#'))
    .map(pattern => pattern.trim().replace(/\/$/, '')); // Remove trailing slash
}

// Add the output directory to exclude patterns to avoid including backups in backups
excludePatterns.push('project-backup');

console.log(`Creating backup: ${outputFile}`);
console.log(`Excluding patterns: ${excludePatterns.join(', ')}`);

// Function to check if a file should be excluded
function shouldExclude(filePath) {
  return excludePatterns.some(pattern => {
    // Check for direct match
    if (filePath === pattern) return true;
    
    // Check for directory match
    if (filePath.startsWith(pattern + '/')) return true;
    
    // Check for extension match
    if (pattern.startsWith('*') && filePath.endsWith(pattern.substring(1))) return true;
    
    return false;
  });
}

// Recursively add files to the archive
function addFiles(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const relativePath = path.relative('.', filePath);
    
    // Skip excluded files/directories
    if (shouldExclude(relativePath)) {
      return;
    }
    
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      addFiles(filePath);
    } else {
      archive.file(filePath, { name: relativePath });
    }
  });
}

// Add all files starting from the root
addFiles('.');

// Finalize the archive
archive.finalize();