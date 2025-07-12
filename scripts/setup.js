const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up StackIt Forum...\n');

// Function to run commands
function runCommand(command, cwd = process.cwd()) {
  try {
    console.log(`Running: ${command}`);
    execSync(command, { cwd, stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`Failed to run: ${command}`);
    return false;
  }
}

// Function to copy file if it doesn't exist
function copyFileIfNotExists(source, destination) {
  if (!fs.existsSync(destination)) {
    try {
      fs.copyFileSync(source, destination);
      console.log(`✅ Created ${destination}`);
    } catch (error) {
      console.error(`❌ Failed to create ${destination}:`, error.message);
    }
  } else {
    console.log(`ℹ️  ${destination} already exists`);
  }
}

// Step 1: Install root dependencies
console.log('📦 Installing root dependencies...');
if (!runCommand('npm install')) {
  console.error('❌ Failed to install root dependencies');
  process.exit(1);
}

// Step 2: Install backend dependencies
console.log('\n📦 Installing backend dependencies...');
if (!runCommand('npm install', path.join(process.cwd(), 'backend'))) {
  console.error('❌ Failed to install backend dependencies');
  process.exit(1);
}

// Step 3: Install frontend dependencies
console.log('\n📦 Installing frontend dependencies...');
if (!runCommand('npm install', path.join(process.cwd(), 'frontend'))) {
  console.error('❌ Failed to install frontend dependencies');
  process.exit(1);
}

// Step 4: Set up environment files
console.log('\n🔧 Setting up environment files...');

// Backend .env
const backendEnvPath = path.join(process.cwd(), 'backend', '.env');
const backendEnvExamplePath = path.join(process.cwd(), 'backend', 'env.example');

if (fs.existsSync(backendEnvExamplePath)) {
  copyFileIfNotExists(backendEnvExamplePath, backendEnvPath);
} else {
  console.log('⚠️  Backend env.example not found, creating basic .env file...');
  const envContent = `MONGODB_URI=mongodb://localhost:27017/stackit
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=5000
NODE_ENV=development`;
  
  try {
    fs.writeFileSync(backendEnvPath, envContent);
    console.log('✅ Created backend/.env');
  } catch (error) {
    console.error('❌ Failed to create backend/.env:', error.message);
  }
}

console.log('\n✅ Setup completed successfully!');
console.log('\n📋 Next steps:');
console.log('1. Make sure MongoDB is running on your system');
console.log('2. Review and update the environment variables in backend/.env if needed');
console.log('3. Run "npm run dev" from the root directory to start the development servers');
console.log('\n🌐 The application will be available at:');
console.log('   Frontend: http://localhost:3000');
console.log('   Backend:  http://localhost:5000'); 