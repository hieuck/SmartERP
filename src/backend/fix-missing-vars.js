const fs = require('fs');
const path = require('path');

// Files and their missing variable declarations
const fixes = [
  // cache-invalidation.helper.ts
  {
    file: 'src/common/helpers/cache-invalidation.helper.ts',
    search: /async invalidateRelatedCaches\(\s*cacheService: CacheService,\s*entity: string,\s*entityId: string,\s*\): Promise<void> \{/,
    replace: `async invalidateRelatedCaches(
    cacheService: CacheService,
    entity: string,
    entityId: string,
    tenantId: string,
  ): Promise<void> {`
  },
  
  // production.service.spec.ts - fix _result to result
  {
    file: 'src/domains/manufacturing/mrp/production.service.spec.ts',
    search: /_result: QualityCheckResult\.PASSED/g,
    replace: 'result: QualityCheckResult.PASSED'
  },
  {
    file: 'src/domains/manufacturing/mrp/production.service.spec.ts',
    search: /_result: QualityCheckResult\.FAILED/g,
    replace: 'result: QualityCheckResult.FAILED'
  },
  {
    file: 'src/domains/manufacturing/mrp/production.service.spec.ts',
    search: /expect\(result\._result\)/g,
    replace: 'expect(result.result)'
  },
];

// Process each fix
fixes.forEach(fix => {
  const filePath = path.join(__dirname, fix.file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (fix.search instanceof RegExp) {
    content = content.replace(fix.search, fix.replace);
  } else {
    content = content.split(fix.search).join(fix.replace);
  }
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Fixed: ${fix.file}`);
});

console.log('Done!');
