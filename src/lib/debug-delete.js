/**
 * Debug Delete Operations
 * Test the exact delete functionality with real examples
 */

import { parseLatexDiff, applyLatexDiffs } from './latexDiff.js';

// Simple test content
const testContent = `Line 1
Line 2
Line 3
Line 4
Line 5`;

// Test delete operations
function debugDelete() {
  console.log('=== Debug Delete Operations ===\n');
  
  console.log('Original content:');
  console.log(testContent);
  console.log('Lines:', testContent.split('\n').map((line, i) => `${i+1}: ${line}`));
  
  // Test 1: Delete single line
  console.log('\n--- Test 1: Delete line 3 ---');
  const deleteResponse1 = `Delete line 3:

\`\`\`latex-diff
@@ operation:delete line:3 delete:1 @@
\`\`\`

Done.`;
  
  console.log('AI Response:', deleteResponse1);
  const blocks1 = parseLatexDiff(deleteResponse1);
  console.log('Parsed blocks:', JSON.stringify(blocks1, null, 2));
  
  if (blocks1.length > 0) {
    const result1 = applyLatexDiffs(testContent, blocks1);
    console.log('Result:');
    console.log(result1);
    console.log('Result lines:', result1.split('\n').map((line, i) => `${i+1}: ${line}`));
  }
  
  // Test 2: Delete multiple lines
  console.log('\n--- Test 2: Delete lines 2-4 ---');
  const deleteResponse2 = `Delete lines 2-4:

\`\`\`latex-diff
@@ operation:delete line:2 delete:3 @@
\`\`\`

Done.`;
  
  console.log('AI Response:', deleteResponse2);
  const blocks2 = parseLatexDiff(deleteResponse2);
  console.log('Parsed blocks:', JSON.stringify(blocks2, null, 2));
  
  if (blocks2.length > 0) {
    const result2 = applyLatexDiffs(testContent, blocks2);
    console.log('Result:');
    console.log(result2);
    console.log('Result lines:', result2.split('\n').map((line, i) => `${i+1}: ${line}`));
  }
  
  // Test 3: Delete without explicit count
  console.log('\n--- Test 3: Delete line 1 (no count) ---');
  const deleteResponse3 = `Delete line 1:

\`\`\`latex-diff
@@ operation:delete line:1 @@
\`\`\`

Done.`;
  
  console.log('AI Response:', deleteResponse3);
  const blocks3 = parseLatexDiff(deleteResponse3);
  console.log('Parsed blocks:', JSON.stringify(blocks3, null, 2));
  
  if (blocks3.length > 0) {
    const result3 = applyLatexDiffs(testContent, blocks3);
    console.log('Result:');
    console.log(result3);
    console.log('Result lines:', result3.split('\n').map((line, i) => `${i+1}: ${line}`));
  }
}

// Test the exact scenario from user
function debugUserScenario() {
  console.log('\n=== Debug User Scenario ===\n');
  
  // Simulate a LaTeX document
  const latexDoc = `\\documentclass{article}
\\usepackage{amsmath}

\\begin{document}

\\section{Introduction}
This is intro.

\\section{More Examples}
Here are examples:
\\begin{align}
f(x) &= x^2
\\end{align}

\\section{Conclusion}
The end.

\\end{document}`;

  console.log('Original LaTeX:');
  console.log(latexDoc.split('\n').map((line, i) => `${String(i+1).padStart(2, ' ')}: ${line}`).join('\n'));
  
  // User asked to delete "More Examples" section (let's say lines 9-13)
  const deleteResponse = `I'll remove the "More Examples" section:

\`\`\`latex-diff
@@ operation:delete line:9 delete:5 @@
\`\`\`

Section removed.`;
  
  console.log('\nAI Response:', deleteResponse);
  const blocks = parseLatexDiff(deleteResponse);
  console.log('Parsed blocks:', JSON.stringify(blocks, null, 2));
  
  if (blocks.length > 0) {
    console.log('\nApplying delete...');
    const result = applyLatexDiffs(latexDoc, blocks);
    console.log('\nResult:');
    console.log(result.split('\n').map((line, i) => `${String(i+1).padStart(2, ' ')}: ${line}`).join('\n'));
    
    console.log('\nComparison:');
    console.log('Original lines:', latexDoc.split('\n').length);
    console.log('Result lines:', result.split('\n').length);
    console.log('Lines deleted:', latexDoc.split('\n').length - result.split('\n').length);
  } else {
    console.log('❌ No blocks parsed!');
  }
}

// Export for browser console
if (typeof window !== 'undefined') {
  window.debugDelete = debugDelete;
  window.debugUserScenario = debugUserScenario;
}

export { debugDelete, debugUserScenario };