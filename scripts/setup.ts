#!/usr/bin/env npx ts-node

/**
 * Setup script to generate .env.local with hashed password
 * 
 * Usage:
 *   npx ts-node scripts/setup.ts
 * 
 * Or run directly:
 *   npm run setup
 */

import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import bcrypt from 'bcryptjs';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('\n🔧 LEGO REPLAY Logistics Tracker - Setup\n');

  // Check if .env.local already exists
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const overwrite = await question('.env.local already exists. Overwrite? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Aborted.');
      rl.close();
      process.exit(0);
    }
  }

  // Gather inputs
  const databaseUrl = await question('Database URL (from Neon): ');
  const email = await question('Your email (for login): ');
  const password = await question('Choose a password: ');

  // Generate secret
  const secret = crypto.randomBytes(32).toString('base64');

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Generate .env.local
  const envContent = `# Database (Neon Postgres)
DATABASE_URL=${databaseUrl}

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=${secret}

# App user credentials
APP_USER_EMAIL=${email}
APP_USER_PASSWORD_HASH=${passwordHash}
`;

  fs.writeFileSync(envPath, envContent);
  console.log('\n✅ Created .env.local');
  console.log('\nNext steps:');
  console.log('1. Run migrations: psql "$DATABASE_URL" < db/migrations/001_initial_schema.sql');
  console.log('2. Start the app: npm run dev');
  console.log('3. Open http://localhost:3000 and log in\n');

  rl.close();
}

main().catch((err) => {
  console.error('Error:', err);
  rl.close();
  process.exit(1);
});
