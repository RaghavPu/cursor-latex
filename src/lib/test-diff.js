/**
 * Test file for LaTeX Diff functionality
 * This demonstrates how the new selective editing feature works
 */

import { parseLatexDiff, applyLatexDiffs, previewLatexDiffs } from './latexDiff.js';

// Sample LaTeX content
const sampleLatex = `\\documentclass{article}
\\usepackage{amsmath}
\\usepackage{amsfonts}

\\title{Sample Document}
\\author{Your Name}

\\begin{document}

\\maketitle

\\section{Introduction}
This is a sample document.

\\section{Mathematics}
Here is an equation:
\\[
E = mc^2
\\]

\\end{document}`;

// Sample AI response with diff blocks (auto-applied)
const sampleResponse = `I'll help you improve your document by adding a new section and fixing the equation. These changes will be applied automatically.

\`\`\`latex-diff
@@ operation:add line:13 @@
\\section{Background}
This section provides important background information.

\`\`\`

\`\`\`latex-diff
@@ operation:replace line:16 delete:3 @@
Here are some important equations:
\\begin{align}
E &= mc^2 \\\\
F &= ma
\\end{align}
\`\`\`

The changes have been applied automatically. You can use the undo button if you want to revert them.`;

// Test the functionality
function testDiffFunctionality() {
  console.log('=== Testing LaTeX Diff Functionality ===\n');
  
  console.log('Original LaTeX:');
  console.log(sampleLatex);
  console.log('\n' + '='.repeat(50) + '\n');
  
  console.log('AI Response with diffs:');
  console.log(sampleResponse);
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Parse diff blocks
  const diffBlocks = parseLatexDiff(sampleResponse);
  console.log('Parsed diff blocks:');
  console.log(JSON.stringify(diffBlocks, null, 2));
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Preview changes
  const changes = previewLatexDiffs(sampleLatex, diffBlocks);
  console.log('Preview of changes:');
  changes.forEach((change, index) => {
    console.log(`Change ${index + 1}: ${change.operation} at line ${change.line}`);
    if (change.before.length > 0) {
      console.log('  Removing:', change.before);
    }
    if (change.after.length > 0) {
      console.log('  Adding:', change.after);
    }
    console.log('');
  });
  
  // Apply changes
  const updatedLatex = applyLatexDiffs(sampleLatex, diffBlocks);
  console.log('Updated LaTeX:');
  console.log(updatedLatex);
  console.log('\n' + '='.repeat(50) + '\n');
  
  console.log('✅ Test completed successfully!');
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.testDiffFunctionality = testDiffFunctionality;
}

export { testDiffFunctionality };