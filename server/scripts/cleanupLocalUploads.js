#!/usr/bin/env node

/**
 * Cleanup Script: Remove Old Local Uploads
 * 
 * This script safely removes old local upload directories that have been
 * migrated to Cloudinary. Run this after verifying all images are properly
 * uploaded to Cloudinary.
 * 
 * Usage: node server/scripts/cleanupLocalUploads.js
 */

const fs = require('fs');
const path = require('path');

const uploadsDir = path.join(__dirname, '..', 'uploads');

console.log('🧹 Cleanup Script: Remove Old Local Uploads');
console.log('==========================================\n');

const directoriestoClean = [
  { path: path.join(uploadsDir, 'candidates'), name: 'Candidates' },
  { path: path.join(uploadsDir, 'elections'), name: 'Elections' },
];

let totalFilesRemoved = 0;
let totalDirsRemoved = 0;

// Function to recursively delete directory
const deleteDirectoryRecursive = (dirPath) => {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach((file) => {
      const curPath = path.join(dirPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteDirectoryRecursive(curPath);
        totalDirsRemoved++;
      } else {
        fs.unlinkSync(curPath);
        totalFilesRemoved++;
      }
    });
    fs.rmdirSync(dirPath);
  }
};

console.log('📊 Scan Results:');
console.log('-'.repeat(40));

try {
  directoriestoClean.forEach(({ path: dirPath, name }) => {
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath);
      console.log(`✓ ${name}: ${files.length} file(s) found`);
    } else {
      console.log(`✗ ${name}: Directory not found (already cleaned)`);
    }
  });

  console.log('\n⚠️  WARNING: This will DELETE all files in the directories above!');
  console.log('Make sure you have:');
  console.log('  1. Verified images are uploaded to Cloudinary');
  console.log('  2. Updated database with Cloudinary URLs');
  console.log('  3. Backed up important files (if needed)\n');

  // Ask for confirmation (in real usage, you'd add user input)
  console.log('To proceed with cleanup, uncomment the deletion code below.');
  console.log('(This is intentionally blocked as a safety measure)\n');

  // SAFETY: Deletion is commented out
  // Uncomment only after verifying migration is complete
  /*
  console.log('🗑️  Starting cleanup...\n');

  directoriestoClean.forEach(({ path: dirPath, name }) => {
    deleteDirectoryRecursive(dirPath);
    console.log(`✓ Cleaned: ${name}`);
  });

  console.log('\n✅ Cleanup Complete!');
  console.log(`   Files removed: ${totalFilesRemoved}`);
  console.log(`   Directories removed: ${totalDirsRemoved}`);
  console.log('\n📁 The uploads/ directory structure remains for future use.');
  */

} catch (error) {
  console.error('\n❌ Error during cleanup:', error.message);
  process.exit(1);
}

console.log('\n📝 Manual Cleanup Instructions:');
console.log('-'.repeat(40));
console.log('1. Manually delete these directories when ready:');
directoriestoClean.forEach(({ path: dirPath }) => {
  console.log(`   - ${dirPath}`);
});
console.log('\n2. Or uncomment the deletion code in this script');
console.log('3. The empty uploads/ folder can be kept for future use\n');
