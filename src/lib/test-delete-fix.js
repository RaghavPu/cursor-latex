/**
 * Test the delete fix
 * Run this in browser console to test delete operations
 */

import { parseLatexDiff, applyLatexDiffs } from './latexDiff.js';

function testDeleteFix() {
  console.log('=== Testing Delete Fix ===');
  
  // Simple test content
  const content = `Line 1
Line 2
Line 3
Line 4
Line 5`;

  console.log('Original content:');
  console.log(content);
  console.log('');
  
  // Test delete operation
  const deleteResponse = `Delete line 3:

\`\`\`latex-diff
@@ operation:delete line:3 delete:1 @@
\`\`\`

Done.`;

  console.log('Testing delete response:');
  console.log(deleteResponse);
  console.log('');
  
  // Parse and apply
  const blocks = parseLatexDiff(deleteResponse);
  console.log('Parsed blocks:', blocks);
  
  if (blocks.length > 0) {
    const result = applyLatexDiffs(content, blocks);
    console.log('Result after delete:');
    console.log(result);
    console.log('');
    console.log('Success! Line 3 should be gone.');
  } else {
    console.log('❌ No blocks parsed');
  }
}

// Export for browser console
if (typeof window !== 'undefined') {
  window.testDeleteFix = testDeleteFix;
}

export { testDeleteFix };