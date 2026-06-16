import React from 'react';

/** Static skeleton — no pulse/shimmer animation */
const SkeletonCard = ({ variant = 'recent' }) => {
  if (variant === 'template') {
    return (
      <div className="aspect-video rounded-2xl bg-[#e7eeff]" aria-hidden />
    );
  }

  return (
    <div
      className="overflow-hidden rounded-3xl bg-white shadow-[0_10px_30px_rgba(0,0,0,0.04)]"
      aria-hidden
    >
      <div className="h-32 bg-[#e7eeff]" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-3/4 rounded bg-[#e7eeff]" />
        <div className="h-3 w-1/2 rounded bg-[#e7eeff]" />
      </div>
    </div>
  );
};

export default SkeletonCard;
