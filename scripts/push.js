const { execSync } = require('child_process');

try {
  console.log('📦 Adding all files...');
  execSync('git add .', { stdio: 'inherit' });

  console.log('💾 Committing changes...');
  execSync('git commit -m "feat: Complete healthcare app with all features - AI symptom checker, appointments, health records, notifications, RBAC, and more"', { stdio: 'inherit' });

  console.log('🚀 Pushing to GitHub...');
  execSync('git push origin vercel-configuration-file', { stdio: 'inherit' });

  console.log('\n✅ Successfully pushed to GitHub!');
  console.log('📝 Check your repository: https://github.com/shekharmahato549-sudo/health-care');
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
