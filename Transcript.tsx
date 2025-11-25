import React, { useEffect, useRef, memo } from 'react';
import { TranscriptItem } from '../types';

interface TranscriptProps {
  items: TranscriptItem[];
}

// Custom comparison function for memo
const areEqual = (prevProps: TranscriptProps, nextProps: TranscriptProps) => {
  if (prevProps.items.length !== nextProps.items.length) return false;

  // Quick shallow comparison - if last item is the same, no need to re-render
  if (prevProps.items.length > 0 && nextProps.items.length > 0) {
    const prevLast = prevProps.items[prevProps.items.length - 1];
    const nextLast = nextProps.items[nextProps.items.length - 1];

    return prevLast.id === nextLast.id &&
      prevLast.text === nextLast.text &&
      prevLast.isFinal === nextLast.isFinal;
  }

  return true;
};

export const Transcript: React.FC<TranscriptProps> = memo(({ items }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [items]);

  return (
    <div
      ref={containerRef}
      className="w-full h-48 overflow-y-auto no-scrollbar space-y-3 p-4 mask-image-gradient"
    >
      <style>{`
        .mask-image-gradient {
          mask-image: linear-gradient(to bottom, transparent, black 20%, black 80%, transparent);
          -webkit-mask-image: linear-gradient(to bottom, transparent, black 20%, black 80%, transparent);
        }
      `}</style>

      {items.length === 0 && (
        <div className="text-center text-slate-500 italic mt-10">
          Ready to interpret...
        </div>
      )}

      {items.map((item, index) => (
        <div
          key={item.id || index} // Use item.id when available
          className={`flex flex-col ${item.sender === 'user' ? 'items-end' : 'items-start'}`}
        >
          <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm backdrop-blur-md 
            ${item.sender === 'user'
              ? 'bg-blue-500/10 text-blue-100 border border-blue-500/20'
              : 'bg-amber-500/10 text-amber-100 border border-amber-500/20'
            }`}
          >
            {item.text}
          </div>
          <span className="text-[10px] text-slate-600 mt-1 px-2 uppercase tracking-wider">
            {item.sender === 'user' ? 'You' : 'Synapse'}
          </span>
        </div>
      ))}
    </div>
  );
}, areEqual);