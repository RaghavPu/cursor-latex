'use client';

import { useState, useRef, useEffect } from 'react';

export default function ResizableDivider({ 
  children,
  onResize, 
  minWidth = 280, 
  maxWidth = 600, 
  defaultWidth = 320,
  className = "" 
}) {
  const [isResizing, setIsResizing] = useState(false);
  const [width, setWidth] = useState(defaultWidth);
  const dividerRef = useRef(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(defaultWidth);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      
      const deltaX = e.clientX - startXRef.current;
      const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidthRef.current + deltaX));
      
      setWidth(newWidth);
      if (onResize) {
        onResize(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    if (isResizing) {
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, minWidth, maxWidth, onResize]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = width;
  };

  return (
    <div
      ref={dividerRef}
      className={`relative ${className}`}
      style={{ width: `${width}px` }}
    >
      {/* Content area */}
      <div className="w-full h-full">
        {children}
      </div>
      
      {/* Resize handle */}
      <div
        className="absolute top-0 right-0 w-1 h-full cursor-col-resize group hover:bg-gray-400 transition-colors duration-200"
        onMouseDown={handleMouseDown}
      >
        {/* Visual indicator */}
        <div className="absolute top-1/2 right-0 transform -translate-y-1/2 w-0.5 h-12 bg-gray-200 dark:bg-gray-700 group-hover:bg-gray-400 group-hover:w-1 rounded-l transition-all duration-200" />
      </div>
    </div>
  );
}