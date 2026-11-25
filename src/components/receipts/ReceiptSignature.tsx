"use client";

import React from 'react';
import { resolveReceiptBannerSrc } from '@/utils/paymentBilling';

interface ReceiptSignatureProps {
  signatureUrl?: string;
  height?: string;
  color?: string;
}

/**
 * Renders either an admin-configured signature image (Google Drive / URL)
 * or a clean blue fountain-pen signature SVG matching the school cashier style.
 */
export default function ReceiptSignature({
  signatureUrl,
  height = '8.5mm',
  color = '#1e3a8a',
}: ReceiptSignatureProps) {
  const trimmed = String(signatureUrl || '').trim();
  if (trimmed) {
    const src = trimmed.startsWith('/')
      ? trimmed
      : trimmed.startsWith('data:')
        ? trimmed
        : `/api/proxy-image?url=${encodeURIComponent(trimmed)}`;

    return (
      <img
        src={src}
        alt="Cashier Signature"
        draggable={false}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = 'none';
        }}
        style={{
          height,
          maxWidth: '92%',
          objectFit: 'contain',
          display: 'block',
          margin: '0 auto',
        }}
      />
    );
  }

  // Stylized handwritten blue-ink signature SVG ("Vatanak" style stroke with underline flourish)
  return (
    <svg
      viewBox="0 0 210 68"
      fill="none"
      aria-hidden="true"
      style={{
        height,
        width: 'auto',
        maxWidth: '92%',
        display: 'block',
        margin: '0 auto',
        overflow: 'visible',
      }}
    >
      {/* Initial tall 'V' stroke */}
      <path
        d="M22 10 C25 22, 28 36, 31 44 C36 33, 45 19, 55 9"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Flowing cursive body ("atanak") */}
      <path
        d="M46 37 C43 32, 39 34, 40 39 C41 42, 46 40, 49 36 C50 40, 52 42, 55 39 C58 34, 62 22, 65 15 C63 26, 61 36, 62 41 C63 43, 67 40, 71 35 C74 32, 78 32, 77 37 C76 41, 71 42, 71 38 C72 34, 78 33, 81 39 C84 42, 87 37, 91 34 C94 32, 95 36, 95 40 C98 34, 102 32, 105 35 C107 37, 107 41, 111 39 C116 36, 121 31, 124 34 C126 37, 121 42, 119 39 C118 36, 124 33, 128 38 C132 41, 137 32, 143 13 C140 24, 136 36, 136 42 M139 32 C145 27, 152 24, 156 23 C149 28, 144 33, 141 35 C146 37, 153 41, 161 42"
        stroke={color}
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Crossbar on 't' */}
      <path
        d="M55 24 C63 23, 73 22, 82 21"
        stroke={color}
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      {/* Sweeping underline stroke */}
      <path
        d="M10 53 C58 47, 132 42, 200 39"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export { resolveReceiptBannerSrc };
