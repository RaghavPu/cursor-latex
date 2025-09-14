/**
 * Test file for Streaming LaTeX Diff functionality
 * This demonstrates how diff blocks are formatted in real-time during streaming
 */

import { parseStreamingDiff, hasStreamingLatexDiffs } from './latexDiff.js';

// Sample streaming content at different stages
const streamingStages = [
  "I'll help you add a new section to your document.",
  
  "I'll help you add a new section to your document.\n\n```latex-diff",
  
  "I'll help you add a new section to your document.\n\n```latex-diff\n@@",
  
  "I'll help you add a new section to your document.\n\n```latex-diff\n@@ operation:add",
  
  "I'll help you add a new section to your document.\n\n```latex-diff\n@@ operation:add line:15 @@",
  
  "I'll help you add a new section to your document.\n\n```latex-diff\n@@ operation:add line:15 @@\n\\section{New Section}",
  
  "I'll help you add a new section to your document.\n\n```latex-diff\n@@ operation:add line:15 @@\n\\section{New Section}\nThis is the new content.",
  
  "I'll help you add a new section to your document.\n\n```latex-diff\n@@ operation:add line:15 @@\n\\section{New Section}\nThis is the new content.\n```\n\nThe section has been added automatically!"
];

// Test the streaming diff functionality
function testStreamingDiff() {
  console.log('=== Testing Streaming LaTeX Diff Functionality ===\n');
  
  streamingStages.forEach((content, index) => {
    console.log(`Stage ${index + 1}:`);
    console.log('Raw content:', JSON.stringify(content));
    console.log('Has streaming diffs:', hasStreamingLatexDiffs(content));
    
    if (hasStreamingLatexDiffs(content)) {
      const formatted = parseStreamingDiff(content);
      console.log('Formatted content:');
      console.log(formatted);
    } else {
      console.log('No formatting needed');
    }
    
    console.log('-'.repeat(50));
  });
  
  console.log('\n✅ Streaming diff test completed!');
}

// Example of what the user sees vs raw content
function demonstrateUserExperience() {
  console.log('=== User Experience Demonstration ===\n');
  
  const rawContent = `I'll make some changes to your document.

\`\`\`latex-diff
@@ operation:replace line:10 delete:2 @@
\\section{Improved Section}
This is much better content.
\`\`\`

The changes have been applied automatically.`;

  console.log('What AI sends (raw):');
  console.log(rawContent);
  console.log('\nWhat gets parsed for streaming:');
  const parsed = parseStreamingDiff(rawContent);
  console.log('Diff blocks:', parsed.diffBlocks);
  console.log('Has streaming diffs:', parsed.hasStreamingDiffs);
  
  console.log('\n📝 Note: User sees git diff-like interface with streaming indicator during AI response');
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.testStreamingDiff = testStreamingDiff;
  window.demonstrateUserExperience = demonstrateUserExperience;
}

export { testStreamingDiff, demonstrateUserExperience };