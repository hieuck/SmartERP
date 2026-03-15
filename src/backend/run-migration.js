/**
 * Run TypeORM migrations
 * Usage: node run-migration.js
 */

const { execSync } = require('child_process');
require('dotenv').config();

async function runMigration() {
  try {
    console.log('🚀 Running TypeORM migrations...\n');
    
    // Run migrations using TypeORM CLI
    execSync('npm run migration:run', {
      stdio: 'inherit',
      env: {
        ...process.env,
        TS_NODE_PROJECT: './tsconfig.json',
      },
    });

    console.log('\n✅ All migrations completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed');
    console.error('Error:', error.message);
    console.error('\nTrying alternative approach: Build and run migrations from dist...\n');
    
    try {
      // Build first
      console.log('📦 Building backend...');
      execSync('npm run build', { stdio: 'inherit' });
      
      // Run migrations from dist
      console.log('\n🚀 Running migrations from dist...');
      execSync('typeorm migration:run -d dist/config/database.config.js', {
        stdio: 'inherit',
      });
      
      console.log('\n✅ Migrations completed successfully!');
    } catch (buildError) {
      console.error('\n❌ Alternative approach also failed');
      console.error('Error:', buildError.message);
      process.exit(1);
    }
  }
}

runMigration();
