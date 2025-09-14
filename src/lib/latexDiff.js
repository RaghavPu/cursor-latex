/**
 * LaTeX Diff Parser and Applicator
 * Handles parsing AI responses with selective edit operations
 */

/**
 * Parse a LaTeX diff block with metadata
 * Expected format:
 * ```latex-diff
 * @@ operation:replace line:10 delete:3 @@
 * new content here
 * ```
 */
export function parseLatexDiff(content) {
  const diffBlocks = [];
  const blockRegex = /```latex-diff\s*\n@@\s*(.*?)\s*@@\s*\n([\s\S]*?)```/g;
  
  let match;
  while ((match = blockRegex.exec(content)) !== null) {
    const metadataStr = match[1];
    const code = match[2];
    
    console.log('[LatexDiff] Found diff block:', {
      metadataStr,
      code: JSON.stringify(code),
      fullMatch: match[0]
    });
    
    // Parse metadata
    const metadata = {};
    const metadataPairs = metadataStr.split(/\s+/);
    
    for (const pair of metadataPairs) {
      const [key, value] = pair.split(':');
      if (key && value !== undefined) {
        metadata[key] = isNaN(value) ? value : parseInt(value);
      }
    }
    
    // Validate required fields
    if (!metadata.operation || metadata.line === undefined) {
      console.warn('Invalid diff block metadata:', metadataStr);
      console.warn('Full match:', match[0]);
      continue;
    }
    
    // Special handling for delete operations
    if (metadata.operation === 'delete' && !metadata.delete) {
      console.warn('Delete operation missing delete count, defaulting to 1');
      metadata.delete = 1;
    }
    
    diffBlocks.push({
      operation: metadata.operation, // 'add', 'replace', 'delete'
      line: metadata.line, // 1-based line number
      deleteCount: metadata.delete || (metadata.operation === 'delete' ? 1 : 0), // number of lines to delete
      insertContent: code.trim(),
      metadata: metadata,
      raw: match[0]
    });
  }
  
  return diffBlocks;
}

/**
 * Apply diff blocks to LaTeX content
 */
export function applyLatexDiffs(originalContent, diffBlocks) {
  const lines = originalContent.split('\n');
  
  // Sort diff blocks by line number (descending) to apply from bottom up
  // This prevents line number shifts from affecting subsequent operations
  const sortedBlocks = [...diffBlocks].sort((a, b) => b.line - a.line);
  
  for (const block of sortedBlocks) {
    const { operation, line, deleteCount, insertContent } = block;
    const zeroBasedLine = line - 1; // Convert to 0-based indexing
    
    switch (operation) {
      case 'add':
        // Insert content at specified line
        const insertLines = insertContent ? insertContent.split('\n') : [];
        lines.splice(zeroBasedLine, 0, ...insertLines);
        break;
        
      case 'replace':
        // Replace specified number of lines
        const replaceLines = insertContent ? insertContent.split('\n') : [];
        lines.splice(zeroBasedLine, deleteCount || 1, ...replaceLines);
        break;
        
      case 'delete':
        // Delete specified number of lines
        const linesToDelete = deleteCount || 1;
        console.log('[LatexDiff] Deleting', linesToDelete, 'lines starting at line', line, '(zero-based:', zeroBasedLine, ')');
        console.log('[LatexDiff] Lines before delete:', lines.length);
        console.log('[LatexDiff] Content to delete:', lines.slice(zeroBasedLine, zeroBasedLine + linesToDelete));
        lines.splice(zeroBasedLine, linesToDelete);
        console.log('[LatexDiff] Lines after delete:', lines.length);
        break;
        
      default:
        console.warn('Unknown diff operation:', operation);
    }
  }
  
  return lines.join('\n');
}

/**
 * Generate a preview of what changes would be made
 */
export function previewLatexDiffs(originalContent, diffBlocks) {
  const lines = originalContent.split('\n');
  const changes = [];
  
  // Sort by line number for preview
  const sortedBlocks = [...diffBlocks].sort((a, b) => a.line - b.line);
  
  for (const block of sortedBlocks) {
    const { operation, line, deleteCount, insertContent } = block;
    const zeroBasedLine = line - 1;
    
    const change = {
      operation,
      line,
      before: [],
      after: [],
      context: {
        before: lines.slice(Math.max(0, zeroBasedLine - 2), zeroBasedLine),
        after: lines.slice(zeroBasedLine + (deleteCount || 1), zeroBasedLine + (deleteCount || 1) + 2)
      }
    };
    
    switch (operation) {
      case 'add':
        change.after = insertContent ? insertContent.split('\n') : [];
        break;
        
      case 'replace':
        change.before = lines.slice(zeroBasedLine, zeroBasedLine + (deleteCount || 1));
        change.after = insertContent ? insertContent.split('\n') : [];
        break;
        
      case 'delete':
        change.before = lines.slice(zeroBasedLine, zeroBasedLine + (deleteCount || 1));
        break;
    }
    
    changes.push(change);
  }
  
  return changes;
}

/**
 * Check if content contains LaTeX diff blocks
 */
export function hasLatexDiffs(content) {
  return /```latex-diff\s*\n@@.*?@@/g.test(content);
}

/**
 * Parse streaming latex-diff content and create preview changes for git diff UI
 * Returns both the original content and parsed changes for streaming display
 */
export function parseStreamingDiff(content) {
  // For streaming, we'll keep the original content but try to extract changes
  const diffBlocks = [];
  const diffBlockRegex = /```latex-diff\s*\n@@\s*(.*?)\s*@@\s*\n([\s\S]*?)(?:\n```|$)/g;
  
  let match;
  let blockIndex = 0;
  
  while ((match = diffBlockRegex.exec(content)) !== null) {
    const metadataStr = match[1];
    const code = match[2];
    
    // Parse metadata
    const metadata = {};
    const metadataPairs = metadataStr.split(/\s+/);
    
    for (const pair of metadataPairs) {
      const [key, value] = pair.split(':');
      if (key && value !== undefined) {
        metadata[key] = isNaN(value) ? value : parseInt(value);
      }
    }
    
    // Create a diff block for streaming
    if (metadata.operation && metadata.line) {
      diffBlocks.push({
        operation: metadata.operation,
        line: metadata.line,
        deleteCount: metadata.delete || 0,
        insertContent: code.trim(),
        metadata: metadata,
        streaming: true,
        blockIndex: blockIndex++
      });
    }
  }
  
  return {
    content: content,
    diffBlocks: diffBlocks,
    hasStreamingDiffs: diffBlocks.length > 0
  };
}

/**
 * Check if content has streaming latex-diff blocks
 */
export function hasStreamingLatexDiffs(content) {
  return /```latex-diff\s*\n@@.*?@@/g.test(content);
}

/**
 * Create preview changes for streaming diff blocks (for git diff UI)
 * This creates a mock preview since we don't have the original document during streaming
 */
export function createStreamingChanges(diffBlocks) {
  return diffBlocks.map((block, index) => {
    const change = {
      operation: block.operation,
      line: block.line,
      before: [],
      after: [],
      context: {
        before: [`Line ${Math.max(1, block.line - 1)}: ...`],
        after: [`Line ${block.line + 1}: ...`]
      },
      streaming: true
    };
    
    switch (block.operation) {
      case 'add':
        change.after = block.insertContent ? block.insertContent.split('\n') : [];
        break;
        
      case 'replace':
        change.before = [`[${block.deleteCount || 1} line(s) to be replaced]`];
        change.after = block.insertContent ? block.insertContent.split('\n') : [];
        break;
        
      case 'delete':
        change.before = [`[${block.deleteCount || 1} line(s) to be deleted]`];
        break;
    }
    
    return change;
  });
}

/**
 * Extract regular LaTeX blocks (non-diff)
 */
export function extractRegularLatexBlocks(content) {
  const blocks = [];
  const blockRegex = /```latex\n([\s\S]*?)\n```/g;
  
  let match;
  while ((match = blockRegex.exec(content)) !== null) {
    blocks.push({
      type: 'latex',
      content: match[1],
      raw: match[0]
    });
  }
  
  return blocks;
}

/**
 * Get line numbers for content (helper function)
 */
export function getLineNumbers(content) {
  return content.split('\n').map((line, index) => ({
    number: index + 1,
    content: line
  }));
}

/**
 * Validate diff block against content
 */
export function validateDiffBlock(content, diffBlock) {
  const lines = content.split('\n');
  const { operation, line, deleteCount } = diffBlock;
  
  const errors = [];
  
  if (line < 1 || line > lines.length + 1) {
    errors.push(`Line ${line} is out of range (content has ${lines.length} lines)`);
  }
  
  if (operation === 'replace' || operation === 'delete') {
    const endLine = line + (deleteCount || 1) - 1;
    if (endLine > lines.length) {
      errors.push(`Cannot delete/replace lines ${line}-${endLine} (content only has ${lines.length} lines)`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}