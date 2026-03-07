const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing build errors...\n');

// 1. Remove RoutingModule from imports array in app.module.ts
const appModulePath = path.join(__dirname, 'app.module.ts');
let appModule = fs.readFileSync(appModulePath, 'utf8');

// Remove RoutingModule from imports array
appModule = appModule.replace(/\s*RoutingModule,\s*\/\/ Routing Management.*\n/g, '');

fs.writeFileSync(appModulePath, appModule);
console.log('✅ Fixed app.module.ts - removed RoutingModule from imports');

// 2. Fix GDPR controller - roles decorator import
const gdprControllerPath = path.join(__dirname, 'common/gdpr/gdpr.controller.ts');
if (fs.existsSync(gdprControllerPath)) {
  let gdprController = fs.readFileSync(gdprControllerPath, 'utf8');
  gdprController = gdprController.replace(
    /from '\.\.\/\.\.\/core\/auth\/decorators\/roles\.decorator'/g,
    "from '../../core/auth/decorators/roles.decorator'"
  );
  fs.writeFileSync(gdprControllerPath, gdprController);
  console.log('✅ Fixed gdpr.controller.ts - roles decorator import');
}

// 3. Fix metrics controller - public decorator import  
const metricsControllerPath = path.join(__dirname, 'common/logging/metrics.controller.ts');
if (fs.existsSync(metricsControllerPath)) {
  let metricsController = fs.readFileSync(metricsControllerPath, 'utf8');
  metricsController = metricsController.replace(
    /from '\.\.\/auth\/decorators\/public\.decorator'/g,
    "from '../../core/auth/decorators/public.decorator'"
  );
  fs.writeFileSync(metricsControllerPath, metricsController);
  console.log('✅ Fixed metrics.controller.ts - public decorator import');
}

// 4. Fix logger service spec - add mockUser
const loggerSpecPath = path.join(__dirname, 'common/logger/logger.service.spec.ts');
if (fs.existsSync(loggerSpecPath)) {
  let loggerSpec = fs.readFileSync(loggerSpecPath, 'utf8');
  if (!loggerSpec.includes('createMockUser')) {
    loggerSpec = loggerSpec.replace(
      /import { Test, TestingModule } from '@nestjs\/testing';/,
      "import { Test, TestingModule } from '@nestjs/testing';\nimport { createMockUser } from '../test/test-helpers';"
    );
    fs.writeFileSync(loggerSpecPath, loggerSpec);
    console.log('✅ Fixed logger.service.spec.ts - added mockUser import');
  }
}

console.log('\n✅ Build error fixes complete!');
