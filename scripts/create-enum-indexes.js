const fs = require('fs');
const path = require('path');

// Hàm để tìm tất cả enum folders
function findEnumFolders(dir, folderList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules' && file !== 'dist') {
      if (file === 'enums') {
        folderList.push(filePath);
      } else {
        findEnumFolders(filePath, folderList);
      }
    }
  });

  return folderList;
}

// Hàm để tạo index.ts cho enum folder
function createEnumIndex(enumDir) {
  const files = fs.readdirSync(enumDir).filter((f) => f.endsWith('.enum.ts'));

  if (files.length === 0) return;

  const exports = files.map((file) => {
    const enumName = file
      .replace('.enum.ts', '')
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');

    return `export { ${enumName} } from './${file.replace('.ts', '')}';`;
  });

  const indexPath = path.join(enumDir, 'index.ts');
  const indexContent = exports.join('\n') + '\n';

  fs.writeFileSync(indexPath, indexContent);
  console.log(`✓ Created: ${indexPath}`);
}

// Main
const backendSrcDir = path.join(__dirname, '..', 'src', 'backend', 'src');
const enumFolders = findEnumFolders(backendSrcDir);

console.log(`Found ${enumFolders.length} enum folders\n`);

enumFolders.forEach((enumDir) => {
  createEnumIndex(enumDir);
});

console.log(`\n✓ Created index.ts files for all enum folders!`);
