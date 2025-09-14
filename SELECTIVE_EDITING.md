# LaTeX Selective Editing Feature

This document describes the new selective editing feature that allows the AI to make targeted changes to specific sections of your LaTeX document with automatic application and undo functionality.

## Overview

Instead of replacing the entire document, the AI can now make specific edits that are **automatically applied** to your document. This allows for:

- **Add**: Insert new content at a specific line
- **Replace**: Replace specific lines with new content  
- **Delete**: Remove specific lines from the document
- **Automatic Application**: Changes are applied immediately
- **Undo Support**: Easily revert changes with one click

## How It Works

### 1. AI Response Format

When the AI wants to make selective edits, it uses special `latex-diff` code blocks:

```latex-diff
@@ operation:replace line:10 delete:2 @@
new content to replace lines 10-11
```

### 2. Operations Available

- `operation:add line:N` - Insert content at line N
- `operation:replace line:N delete:M` - Replace M lines starting at line N
- `operation:delete line:N delete:M` - Delete M lines starting at line N

### 3. User Interface

The AI chat displays changes with **real-time git diff interface**:

**During Streaming:**
- **Git diff-like interface** appears immediately as changes stream
- **Blue header** with "X changes incoming..." and streaming indicator
- **Live diff display** with context lines, additions (+), deletions (-)
- **Individual change status** shows "streaming..." in blue
- **Real-time updates** as AI generates more content

**After Completion:**
- **Same git diff interface** with updated status
- **Green header** with "X changes applied automatically"
- **Individual changes** show "applied" status in green
- **Orange "Undo" button** to revert all changes
- **Global undo button** in the chat header for quick access

## Example Usage

### Original LaTeX (with line numbers):
```
1: \documentclass{article}
2: \usepackage{amsmath}
3: 
4: \begin{document}
5: 
6: \section{Introduction}
7: This is old text.
8: 
9: \end{document}
```

### AI Response:
```latex-diff
@@ operation:replace line:7 delete:1 @@
This is improved text with more detail.
```

### Result:
The interface shows:
- Line 7: `- This is old text.`
- Line 7: `+ This is improved text with more detail.`
- Status: "Applied automatically"

The change is applied immediately to the document. User can click "Undo" to revert it.

## Benefits

1. **Precision**: Make targeted changes without affecting the rest of the document
2. **Speed**: Changes applied automatically, no manual approval needed
3. **Real-time Feedback**: See formatted changes as they stream in
4. **Clean Interface**: Technical metadata hidden from user view
5. **Safety**: Full undo support - easily revert any changes
6. **Clarity**: See exactly what changed with git diff-style display
7. **Efficiency**: Faster processing for small changes
8. **Line Number Accuracy**: AI receives precise line numbers to avoid mistakes

## Technical Details

### File Structure
- `src/lib/latexDiff.js` - Core diff parsing and application logic
- `src/components/LatexDiffViewer.js` - UI component for displaying diffs
- `src/lib/simpleAgent.js` - Updated to handle diff responses
- `src/components/AIChat.js` - Updated to display diff interface

### Metadata Format
Each diff block includes metadata in the header:
```
@@ operation:OPERATION line:LINE_NUMBER delete:DELETE_COUNT @@
```

Where:
- `OPERATION`: add, replace, or delete
- `LINE_NUMBER`: 1-based line number where operation starts
- `DELETE_COUNT`: number of lines to delete (for replace/delete operations)

## Undo System

The undo system provides:
- **Automatic History Tracking**: Every change is saved to undo history
- **One-Click Undo**: Revert the last change from chat header or diff viewer
- **History Limit**: Maintains last 20 changes to prevent memory issues
- **Smart Undo**: Doesn't create undo loops when undoing changes

## Usage Tips

1. **Ask for specific changes**: "Add a new section after line 15" or "Replace the equation on line 23"
2. **Watch the streaming**: Changes appear in real-time with clean formatting
3. **No metadata clutter**: Technical details are hidden - you see only what matters
4. **Use the undo button**: If you don't like a change, click undo immediately
5. **Line numbers are accurate**: The AI sees exact line numbers, so references are precise
6. **Multiple changes**: The AI can make several changes at once, all applied automatically
7. **Real-time preview**: See exactly what's being changed as it streams

## Future Enhancements

Possible future improvements:
- Multi-level undo/redo stack
- Selective undo of individual changes from a batch
- Visual highlighting in the LaTeX editor
- Change history panel with timestamps
- Conflict resolution for overlapping changes