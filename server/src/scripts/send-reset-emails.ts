import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';
import prisma from '../prisma/client';
import { generateDefaultPassword } from '../utils/password.util';
import { emailService } from '../services/email.service';

async function getTargetEmails(): Promise<string[]> {
  // 1. Check command-line arguments (e.g. npx tsx src/scripts/send-reset-emails.ts user1@example.com user2@example.com)
  const cliArgs = process.argv.slice(2).map((e) => e.trim().toLowerCase()).filter(Boolean);
  if (cliArgs.length > 0) {
    return cliArgs;
  }

  // 2. Check local untracked config file (.local-recipients.json)
  const configPaths = [
    path.resolve(process.cwd(), '.local-recipients.json'),
    path.resolve(process.cwd(), 'server', '.local-recipients.json'),
  ];

  for (const configPath of configPaths) {
    if (fs.existsSync(configPath)) {
      try {
        const fileData = fs.readFileSync(configPath, 'utf-8');
        const parsed = JSON.parse(fileData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((e: string) => String(e).trim().toLowerCase()).filter(Boolean);
        }
      } catch {
        // Ignore parse error and continue
      }
    }
  }

  return [];
}

async function sendResetEmails() {
  const targetEmails = await getTargetEmails();

  if (targetEmails.length === 0) {
    console.log('⚠️ No target email addresses specified.\n');
    console.log('Usage Options:');
    console.log('  Option 1 (CLI):   npx tsx src/scripts/send-reset-emails.ts user1@example.com user2@example.com');
    console.log('  Option 2 (Config): Create an untracked ".local-recipients.json" file containing ["user@example.com"]\n');
    return;
  }

  console.log(`🚀 Generating fresh temporary passwords and dispatching notification emails for ${targetEmails.length} account(s)...\n`);

  for (const email of targetEmails) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log(`❌ User not found: ${email}`);
      continue;
    }

    const firstName = user.fullName ? user.fullName.split(' ')[0] : 'User';
    const tempPassword = generateDefaultPassword(firstName);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Save hashed password & set mustChangePassword = true
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        mustChangePassword: true,
      } as any,
    });

    console.log(`🔒 Updated DB hash for ${user.email} | Name: ${user.fullName} | mustChangePassword: true`);

    // Dispatch email
    console.log(`📧 Dispatching initial credential email to ${user.email}...`);
    const success = await emailService.sendWelcomePasswordEmail(
      user.email,
      user.fullName,
      tempPassword,
      user.role
    );

    console.log(`Status for ${user.email}: ${success ? '✅ SENT SUCCESSFULLY' : '❌ DELIVERY FAILED'}\n`);
  }
}

sendResetEmails()
  .catch((err) => {
    console.error('❌ Script execution error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
