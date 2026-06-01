/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  visible: boolean;
  onClose: () => void;
}

export default function Toast({ message, type, visible, onClose }: ToastProps) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  if (!visible) return null;

  const isError = type === 'error';

  return (
    <div
      className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-3 rounded-xl border px-6 py-4.5 font-medium text-sm shadow-2xl transition-all duration-300 animate-slide-in ${
        isError
          ? 'border-red-500/30 bg-[#161b22] text-red-400'
          : 'border-emerald-500/30 bg-[#161b22] text-emerald-400'
      }`}
    >
      <span className="text-base">{isError ? '🆘' : '✅'}</span>
      <span>{message}</span>
    </div>
  );
}
