import bcrypt from 'bcrypt';
import prisma from '../prisma/client';
import { generateDefaultPassword } from '../utils/password.util';

async function migrateHardcodedPasswords() {
  console.log('🔍 Auditing existing users in live database for hardcoded shared passwords...');
  const users = await prisma.user.findMany();
  console.log(`Found ${users.length} total user account(s) in DB.`);

  const hardcodedPasswords = ['student123', 'admin123'];
  const affectedUsers: { id: string; email: string; fullName: string; role: string; matchedPassword: string }[] = [];

  for (const user of users) {
    let matchesHardcoded = false;
    let matchedStr = '';

    for (const pwd of hardcodedPasswords) {
      if (user.password === pwd) {
        matchesHardcoded = true;
        matchedStr = pwd;
        break;
      }
      try {
        const isMatch = await bcrypt.compare(pwd, user.password);
        if (isMatch) {
          matchesHardcoded = true;
          matchedStr = pwd;
          break;
        }
      } catch {
        // Ignored
      }
    }

    if (matchesHardcoded) {
      affectedUsers.push({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        matchedPassword: matchedStr,
      });
    }
  }

  console.log(`\n⚠️ Identified ${affectedUsers.length} user account(s) with known hardcoded passwords ('student123' / 'admin123').`);

  if (affectedUsers.length === 0) {
    console.log('✅ No users found with hardcoded passwords.');
    return;
  }

  console.log('\n🔒 Resetting hardcoded passwords to random secure temporary passwords & enforcing mustChangePassword=true...');

  let updatedCount = 0;
  for (const affected of affectedUsers) {
    const firstName = affected.fullName ? affected.fullName.split(' ')[0] : 'User';
    const newTempPassword = generateDefaultPassword(firstName);
    const newHash = await bcrypt.hash(newTempPassword, 10);

    await prisma.user.update({
      where: { id: affected.id },
      data: {
        password: newHash,
        mustChangePassword: true,
      },
    });

    updatedCount++;
    console.log(`  [${updatedCount}/${affectedUsers.length}] Updated account: ${affected.email} (${affected.role}) | mustChangePassword: true`);
  }

  console.log(`\n==================================================`);
  console.log(`✅ MIGRATION STEP 0 COMPLETE!`);
  console.log(`Total DB Users Inspected: ${users.length}`);
  console.log(`Hardcoded Passwords Found: ${affectedUsers.length}`);
  console.log(`Successfully Updated Accounts: ${updatedCount}`);
  console.log(`All affected accounts now have random bcrypt-hashed passwords and mustChangePassword=true.`);
  console.log(`==================================================\n`);
}

migrateHardcodedPasswords()
  .catch((err) => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
