// Utility script to hash passwords for manual database insertion
const bcrypt = require('bcryptjs');

const password = process.argv[2] || 'admin123';

bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('\nUse this hash in your database INSERT statement');
});
