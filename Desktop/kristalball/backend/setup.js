const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Ensure we're in the backend directory
const backendDir = path.join(__dirname);
process.chdir(backendDir);

console.log('Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('Dependencies installed successfully');
} catch (error) {
  console.error('Error installing dependencies:', error);
  process.exit(1);
}

console.log('Initializing database...');
try {
  execSync('npm run init-db', { stdio: 'inherit' });
  console.log('Database initialized successfully');
} catch (error) {
  console.error('Error initializing database:', error);
  process.exit(1);
}

console.log('Setup completed successfully!');
console.log('You can now start the server with: npm run dev'); 