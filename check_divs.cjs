const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');
const lines = content.split('\n');

for (let i = 2130; i < 2550; i++) {
  if (lines[i] && (lines[i].includes('leaderboard-section') || lines[i].includes('max-w-4xl') || lines[i].includes('Right rail') || lines[i].includes('Mobile rails'))) {
    console.log((i + 1) + ': ' + lines[i]);
  }
}

