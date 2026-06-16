import React from 'react';
import { CheckCircle, X } from 'lucide-react';

export function Toast({ message, onClose }: { message: string; onClose?: () => void }) {
  return (
    <div className="fixed top-6 right-6 z-[100] flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white text-sm bg-green-600">
      <CheckCircle className="w-4 h-4" />
      <div className="flex-1">{message}</div>
      {onClose && (
        <button onClick={onClose} className="text-white/80 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
