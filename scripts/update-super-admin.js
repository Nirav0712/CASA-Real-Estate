/**
 * CASA Real Estate — Secure Super Admin Maintenance Script
 *
 * Requirements:
 * 1. Find existing Super Admin account ('nirav', 'prajapatinirav710@gmail.com', mobile: '+919925843531')
 * 2. Update email to 'info.mypropertyin@gmail.com'
 * 3. Hash password using bcrypt (12 rounds) as defined in backend/src/modules/auth/utils/password.util.ts
 * 4. Preserve existing SUPER_ADMIN role, permissions, status (ACTIVE), and all associated data
 * 5. Do not modify other accounts or create duplicates
 * 6. Never log or output passwords or password hashes
 * 7. Verify login against API with updated email
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const readline = require('readline');
const http = require('http');

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const BCRYPT_SALT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 8;
const TARGET_OLD_EMAIL = 'prajapatinirav710@gmail.com';
const TARGET_NEW_EMAIL = 'info.mypropertyin@gmail.com';
const TARGET_MOBILE = '+919925843531';

async function getPasswordInput() {
  // Option A: Environment variable
  if (process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.trim()) {
    return process.env.ADMIN_PASSWORD.trim();
  }

  // Option B: Temporary secret file
  const secretPath = path.join(__dirname, '../backend/.admin_secret');
  if (fs.existsSync(secretPath)) {
    const content = fs.readFileSync(secretPath, 'utf8').trim();
    // Delete file immediately after reading
    try { fs.unlinkSync(secretPath); } catch (_) {}
    if (content) return content;
  }

  // Option C: Interactive prompt via readline
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question('Enter new password for Super Admin (min 8 chars): ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function verifyApiLogin(email, password) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ email, password });
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });

    req.on('error', (err) => resolve({ error: err.message }));
    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log('=== CASA Super Admin Account Maintenance ===\n');

  const password = await getPasswordInput();
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    console.error(`Error: Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
    process.exit(1);
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('Error: MONGODB_URI not found in backend/.env');
    process.exit(1);
  }

  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;
  const usersCollection = db.collection('users');

  // 1. Find existing Super Admin
  const adminUser = await usersCollection.findOne({
    $or: [
      { email: TARGET_OLD_EMAIL },
      { email: TARGET_NEW_EMAIL },
      { normalizedMobile: TARGET_MOBILE, role: 'SUPER_ADMIN' },
    ],
  });

  if (!adminUser) {
    console.error(`Error: Super Admin account not found with email ${TARGET_OLD_EMAIL} or mobile ${TARGET_MOBILE}.`);
    await mongoose.disconnect();
    process.exit(1);
  }

  if (adminUser.role !== 'SUPER_ADMIN' && adminUser.platformRole !== 'SUPER_ADMIN') {
    console.error(`Safety check failed: Target user exists but is not a SUPER_ADMIN (found role: ${adminUser.role}).`);
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log(`Located existing Super Admin:`);
  console.log(`- ID: ${adminUser._id}`);
  console.log(`- Name: ${adminUser.name}`);
  console.log(`- Mobile: ${adminUser.mobile}`);
  console.log(`- Current Email: ${adminUser.email}`);
  console.log(`- Role: ${adminUser.role}`);
  console.log(`- Platform Role: ${adminUser.platformRole}`);
  console.log(`- Permissions: ${JSON.stringify(adminUser.permissions)}`);

  // 2. Hash password securely
  console.log('\nGenerating secure bcrypt hash (cost factor 12)...');
  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  // 3. Update document preserving all other fields
  console.log(`Updating account email to '${TARGET_NEW_EMAIL}' and status to 'ACTIVE'...`);
  const updateResult = await usersCollection.updateOne(
    { _id: adminUser._id },
    {
      $set: {
        email: TARGET_NEW_EMAIL,
        passwordHash,
        status: 'ACTIVE',
        isEmailVerified: true,
        updatedAt: new Date(),
      },
      $unset: {
        emailVerificationTokenHash: '',
        emailVerificationExpiresAt: '',
      },
    },
  );

  console.log(`Database update confirmed. Modified count: ${updateResult.modifiedCount}`);

  // 4. Verify updated document in DB
  const updatedDoc = await usersCollection.findOne({ _id: adminUser._id });
  console.log('\nVerified updated account in MongoDB Atlas:');
  console.log(`- ID: ${updatedDoc._id}`);
  console.log(`- Email: ${updatedDoc.email}`);
  console.log(`- Status: ${updatedDoc.status}`);
  console.log(`- Role: ${updatedDoc.role}`);
  console.log(`- Platform Role: ${updatedDoc.platformRole}`);
  console.log(`- isEmailVerified: ${updatedDoc.isEmailVerified}`);
  console.log(`- passwordHash set: ${!!updatedDoc.passwordHash}`);

  await mongoose.disconnect();

  // 5. Test API login
  console.log('\nVerifying login via API (/api/v1/auth/login)...');
  const loginTest = await verifyApiLogin(TARGET_NEW_EMAIL, password);
  if (loginTest.status === 200 && loginTest.data?.success) {
    const user = loginTest.data?.user || loginTest.data?.data?.user;
    const tokens = loginTest.data?.tokens || loginTest.data?.data?.tokens;
    console.log('[SUCCESS] API Login verified successfully!');
    console.log(`- Authenticated User: ${user?.name} (${user?.email})`);
    console.log(`- Role: ${user?.role} | Platform Role: ${user?.platformRole}`);
    console.log(`- Access Token Issued: ${!!tokens?.accessToken}`);
  } else {
    console.warn(`[WARNING] API Login returned status ${loginTest.status}:`, loginTest.data || loginTest.error);
    console.log('(Note: If the backend dev server is restarting, please verify login manually in Admin Portal)');
  }

  console.log('\n=== Super Admin Maintenance Complete ===');
}

main().catch((err) => {
  console.error('Fatal error during maintenance:', err.message);
  process.exit(1);
});
