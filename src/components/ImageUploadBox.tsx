'use client';

import React, { useState, useEffect, useRef } from 'react';

interface ImageUploadBoxProps {
  onFileSelect: (file: File) => void;
  currentImage?: string;
  isUploading?: boolean;
  isUploadSuccess?: boolean;
  shape?: 'square' | 'rect' | 'circle';
  emptyText?: string;
  width?: string | number;
  height?: string | number;
  style?: React.CSSProperties;
  className?: string;
  isActiveModal?: boolean; // Set to true if the parent modal is open, to enable paste
}

export default function ImageUploadBox({
  onFileSelect,
  currentImage,
  isUploading = false,
  isUploadSuccess = false,
  shape = 'square',
  emptyText = 'រូបថត',
  width = '120px',
  height,
  style = {},
  className = '',
  isActiveModal = true
}: ImageUploadBoxProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const containerHeight = height || (shape === 'rect' ? '80px' : width);
  const borderRadius = shape === 'circle' ? '50%' : '8px';

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!isActiveModal || isUploading) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            onFileSelect(file);
            break; // Only take the first image
          }
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [isActiveModal, isUploading, onFileSelect]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isUploading) return;
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onFileSelect(file);
    }
  };

  const handleClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
    // Reset input value to allow selecting the same file again
    if (e.target) {
      e.target.value = '';
    }
  };

  return (
    <div
      className={className}
      style={{
        width,
        height: containerHeight,
        borderRadius,
        background: isDragging ? 'var(--bg-hover, rgba(59, 130, 246, 0.1))' : 'var(--bg-secondary)',
        overflow: 'hidden',
        border: `2px dashed ${isDragging ? 'var(--accent-primary, #3b82f6)' : (isUploadSuccess ? '#10B981' : 'var(--border-color)')}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isUploading ? 'not-allowed' : 'pointer',
        position: 'relative',
        transition: 'all 0.2s ease',
        ...style
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      title="ចុចជ្រើសរើស ឬទាញរូបថតទម្លាក់ទីនេះ (Drag & Drop) ឬចុច Ctrl+V ដើម្បី Paste"
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        style={{ display: 'none' }} 
      />
      
      {isUploading ? (
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>កំពុងបញ្ចូល...</span>
      ) : currentImage ? (
        <img 
          src={currentImage} 
          alt="Preview" 
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isDragging ? 0.5 : 1 }} 
        />
      ) : (
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textAlign: 'center', padding: '0.5rem' }}>
          {isDragging ? 'ទម្លាក់ទីនេះ' : emptyText}
        </span>
      )}
      
      {/* Overlay instruction on hover */}
      {!isUploading && !isDragging && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.7rem',
          opacity: 0,
          transition: 'opacity 0.2s',
          backdropFilter: 'blur(2px)'
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
        >
          ចុច ឬទម្លាក់ទីនេះ
        </div>
      )}
    </div>
  );
}
