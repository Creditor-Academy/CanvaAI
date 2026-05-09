import React from 'react';

const SkeletonCard = () => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden h-[210px]">
      <div className="skeleton h-[140px] w-full" />
      <div className="p-4 flex justify-between items-center">
        <div className="flex-1">
          <div className="skeleton h-4 w-[70%] rounded mb-2" />
          <div className="skeleton h-3 w-[40%] rounded" />
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;
