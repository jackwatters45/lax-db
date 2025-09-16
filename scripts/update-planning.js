#!/usr/bin/env node

/**
 * Script to update the planning document with current date
 * Usage: node scripts/update-planning.js
 */

const fs = require('node:fs');
const path = require('node:path');

const planningPath = path.join(
  __dirname,
  '..',
  'packages',
  'web',
  'src',
  'content',
  'planning.md',
);

try {
  // Read the current content
  const content = fs.readFileSync(planningPath, 'utf8');

  // Update the last modified date
  const now = new Date();
  const dateString = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const lastUpdatedRegex = /\*Last updated: .*\*/;
  const newLastUpdated = `*Last updated: ${dateString}*`;

  let updatedContent;
  if (lastUpdatedRegex.test(content)) {
    updatedContent = content.replace(lastUpdatedRegex, newLastUpdated);
  } else {
    updatedContent = `${content}\n\n---\n\n${newLastUpdated}`;
  }

  // Write back to file
  fs.writeFileSync(planningPath, updatedContent, 'utf8');

  console.log(`✅ Planning document updated with date: ${dateString}`);

  // Show some stats
  const lines = updatedContent.split('\n');
  const tasks = lines.filter(
    (line) =>
      line.includes('[ ]') || line.includes('[x]') || line.includes('[X]'),
  ).length;
  const completedTasks = lines.filter(
    (line) => line.includes('[x]') || line.includes('[X]'),
  ).length;

  console.log('📊 Document stats:');
  console.log(`   - Total lines: ${lines.length}`);
  console.log(`   - Total tasks: ${tasks}`);
  console.log(`   - Completed tasks: ${completedTasks}`);
  console.log(
    `   - Completion rate: ${tasks > 0 ? Math.round((completedTasks / tasks) * 100) : 0}%`,
  );
} catch (error) {
  console.error('❌ Error updating planning document:', error.message);
  process.exit(1);
}
