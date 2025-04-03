const pool = require('./db');
const bcrypt = require('bcryptjs');

const createAdminUser = async () => {
  try {
    // Check if admin user already exists
    const checkResult = await pool.query('SELECT * FROM users WHERE email = $1', ['admin@example.com']);
    
    if (checkResult.rows.length > 0) {
      console.log('Admin user already exists');
      process.exit(0);
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Insert admin user
    await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)',
      ['Admin User', 'admin@example.com', hashedPassword, 'admin']
    );
    
    console.log('Admin user created successfully');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin user:', err);
    process.exit(1);
  }
};

createAdminUser(); 