import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcrypt';
import prisma from '../prisma/client';
import { generateDefaultPassword } from '../utils/password.util';
import { emailService } from '../services/email.service';

async function sendResetEmails() {
  console.log('🚀 Generating fresh temporary passwords and dispatching notification emails...\n');
  const targetEmails = ['abhirajpurohit1235@gmail.com', 'pallavisharma2121p@gmail.com'];

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
      },
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
