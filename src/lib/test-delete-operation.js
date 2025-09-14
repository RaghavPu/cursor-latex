/**
 * Test file for Delete Operations
 * This tests the delete functionality specifically
 */

import { parseLatexDiff, applyLatexDiffs, previewLatexDiffs } from './latexDiff.js';

// Sample LaTeX content with sections to delete
const sampleLatex = `\\documentclass{article}
\\usepackage{amsmath}
\\usepackage{amsfonts}

\\title{Sample Document}
\\author{Your Name}

\\begin{document}

\\maketitle

\\section{Introduction}
This is the introduction section.

\\section{More Examples}
Here are some more mathematical expressions:

\\begin{align}
f(x) &= ax^2 + bx + c \\\\
g(x) &= \\sin(x) + \\cos(x) \\\\
h(x) &= \\frac{1}{x^2 + 1}
\\end{align}

\\section{Conclusion}
This is the conclusion.

\\end{document}`;

// Test different delete operations
const deleteTests = [
  {
    name: "Delete single line",
    response: `I'll delete line 6 (the author line).

\`\`\`latex-diff
@@ operation:delete line:6 delete:1 @@
\`\`\`

The author line has been removed.`
  },
  {
    name: "Delete section (multiple lines)",
    response: `I'll remove the "More Examples" section (lines 15-22).

\`\`\`latex-diff
@@ operation:delete line:15 delete:8 @@
\`\`\`

The section has been removed.`
  },
  {
    name: "Delete without explicit count (should default to 1)",
    response: `I'll delete the title line.

\`\`\`latex-diff
@@ operation:delete line:5 @@
\`\`\`

Title removed.`
  }
];

function testDeleteOperations() {
  console.log('=== Testing Delete Operations ===\n');
  
  deleteTests.forEach((test, index) => {
    console.log(`Test ${index + 1}: ${test.name}`);
    console.log('Original lines:', sampleLatex.split('\n').length);
    
    // Parse the diff
    const diffBlocks = parseLatexDiff(test.response);
    console.log('Parsed diff blocks:', diffBlocks);
    
    if (diffBlocks.length > 0) {
      // Preview the changes
      const changes = previewLatexDiffs(sampleLatex, diffBlocks);
      console.log('Changes preview:', changes);
      
      // Apply the changes
      const result = applyLatexDiffs(sampleLatex, diffBlocks);
      console.log('Result lines:', result.split('\n').length);
      console.log('Lines deleted:', sampleLatex.split('\n').length - result.split('\n').length);
      
      // Show the affected area
      const resultLines = result.split('\n');
      const deleteBlock = diffBlocks[0];
      const startLine = Math.max(0, deleteBlock.line - 3);
      const endLine = Math.min(resultLines.length, deleteBlock.line + 2);
      
      console.log('Result around deletion point:');
      for (let i = startLine; i < endLine; i++) {
        console.log(`${i + 1}: ${resultLines[i]}`);
      }
    } else {
      console.log('❌ No diff blocks found!');
    }
    
    console.log('-'.repeat(50));
  });
  
  console.log('✅ Delete operation tests completed!');
}

// Test the specific case from the user's issue
function testUserCase() {
  console.log('\n=== Testing User\'s Specific Case ===\n');
  
  // This is what the AI should have sent
  const correctResponse = `Sure, I can remove Section 2 titled "More Examples" for you. This includes the text of the section and the mathematical expressions within it.

Here is the selective edit operation to remove lines 15 to 22:

\`\`\`latex-diff
@@ operation:delete line:15 delete:8 @@
\`\`\`

This operation will remove the section titled "More Examples" and all the content within it.`;

  // This is what the AI actually sent (missing the diff block)
  const incorrectResponse = `Sure, I can remove Section 2 titled "More Examples" for you. This includes the text of the section and the mathematical expressions within it.

Here is the selective edit operation to remove lines 21 to 28:



This operation will remove the section titled "More Examples" and all the content within it.`;
  
  console.log('Testing CORRECT response:');
  const correctDiffs = parseLatexDiff(correctResponse);
  console.log('Diff blocks found:', correctDiffs.length);
  
  if (correctDiffs.length > 0) {
    const result = applyLatexDiffs(sampleLatex, correctDiffs);
    console.log('✅ Delete operation successful');
    console.log('Lines before:', sampleLatex.split('\n').length);
    console.log('Lines after:', result.split('\n').length);
  }
  
  console.log('\nTesting INCORRECT response:');
  const incorrectDiffs = parseLatexDiff(incorrectResponse);
  console.log('Diff blocks found:', incorrectDiffs.length);
  console.log('❌ This is why the delete didn\'t work - no diff block!');
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.testDeleteOperations = testDeleteOperations;
  window.testUserCase = testUserCase;
}

export { testDeleteOperations, testUserCase };