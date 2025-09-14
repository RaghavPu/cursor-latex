/**
 * LaTeX Diff Viewer Component
 * Displays git diff-like interface for LaTeX changes
 */

'use client';

import { useState } from 'react';

export default function LatexDiffViewer({ 
  changes, 
  autoApplied = false,
  streaming = false,
  isDark = false 
}) {

  const getOperationIcon = (operation) => {
    switch (operation) {
      case 'add':
        return <span className="text-green-600 dark:text-green-400">+</span>;
      case 'delete':
        return <span className="text-red-600 dark:text-red-400">-</span>;
      case 'replace':
        return <span className="text-blue-600 dark:text-blue-400">~</span>;
      default:
        return <span className="text-gray-600 dark:text-gray-400">?</span>;
    }
  };

  const getOperationColor = (operation) => {
    switch (operation) {
      case 'add':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'delete':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'replace':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  // All changes are automatically applied, no status needed

  if (!changes || changes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Header with status and actions */}
      <div className={`flex items-center justify-between p-3 rounded-lg border ${
        streaming 
          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
          : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
      }`}>
        <div className="flex items-center space-x-2">
          {streaming ? (
            <>
              <div className="flex space-x-0.5">
                <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                {changes.length} change{changes.length !== 1 ? 's' : ''} incoming...
              </span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                {changes.length} change{changes.length !== 1 ? 's' : ''} applied automatically
              </span>
            </>
          )}
        </div>
        
      </div>

      {/* Individual changes */}
      {changes.map((change, index) => {
        const operationColor = getOperationColor(change.operation);
        
        return (
          <div 
            key={index} 
            className={`border rounded-lg overflow-hidden ${operationColor}`}
          >
            {/* Change header */}
            <div className="px-4 py-2 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  {getOperationIcon(change.operation)}
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                    {change.operation}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    line {change.line}
                  </span>
                </div>
                
                {streaming ? (
                  <span className="text-xs px-2 py-0.5 rounded font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                    streaming...
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                    applied
                  </span>
                )}
              </div>
            </div>

            {/* Diff content */}
            <div className="bg-gray-50 dark:bg-gray-900">
              {/* Context before */}
              {change.context?.before && change.context.before.length > 0 && (
                <div className="px-4 py-1">
                  {change.context.before.map((line, lineIndex) => (
                    <div key={`before-${lineIndex}`} className="text-xs font-mono text-gray-500 dark:text-gray-400">
                      <span className="inline-block w-8 text-right mr-2">{change.line - change.context.before.length + lineIndex}</span>
                      <span className="text-gray-400 dark:text-gray-600 mr-2">  </span>
                      {line}
                    </div>
                  ))}
                </div>
              )}

              {/* Removed lines */}
              {change.before && change.before.length > 0 && (
                <div className="px-4 py-1 bg-red-50 dark:bg-red-900/10">
                  {change.before.map((line, lineIndex) => (
                    <div key={`removed-${lineIndex}`} className="text-xs font-mono text-red-800 dark:text-red-200">
                      <span className="inline-block w-8 text-right mr-2">{change.line + lineIndex}</span>
                      <span className="text-red-600 dark:text-red-400 mr-2">- </span>
                      {line}
                    </div>
                  ))}
                </div>
              )}

              {/* Added lines */}
              {change.after && change.after.length > 0 && (
                <div className="px-4 py-1 bg-green-50 dark:bg-green-900/10">
                  {change.after.map((line, lineIndex) => (
                    <div key={`added-${lineIndex}`} className="text-xs font-mono text-green-800 dark:text-green-200">
                      <span className="inline-block w-8 text-right mr-2">{change.line + lineIndex}</span>
                      <span className="text-green-600 dark:text-green-400 mr-2">+ </span>
                      {line}
                    </div>
                  ))}
                </div>
              )}

              {/* Context after */}
              {change.context?.after && change.context.after.length > 0 && (
                <div className="px-4 py-1">
                  {change.context.after.map((line, lineIndex) => (
                    <div key={`after-${lineIndex}`} className="text-xs font-mono text-gray-500 dark:text-gray-400">
                      <span className="inline-block w-8 text-right mr-2">
                        {change.line + (change.before?.length || 0) + (change.after?.length || 0) + lineIndex}
                      </span>
                      <span className="text-gray-400 dark:text-gray-600 mr-2">  </span>
                      {line}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}