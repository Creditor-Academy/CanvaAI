import React from 'react';

const LoadingPage = () => {
    return (
        <div className="fixed inset-0  flex items-center justify-center">
            {/* 1. Main container: Transparent white with blur effect and shadow */}
            <div className="flex flex-col items-center gap-14 px-16 py-16 ">

                {/* Diamond Container */}
                <div className="relative w-24 h-24 rotate-45">
                    {/* 2. Top-Left Diamond */}
                    <div className="absolute top-0 left-0 w-10 h-10 bg-[#1e40af] animate-switch-1" />

                    {/* Top-Right Diamond */}
                    <div className="absolute top-0 right-0 w-10 h-10 bg-[#fbbf24] animate-switch-2" />

                    {/* Bottom-Left Diamond */}
                    <div className="absolute bottom-0 left-0 w-10 h-10 bg-[#fbbf24] animate-switch-3" />

                    {/* Bottom-Right Diamond */}
                    <div className="absolute bottom-0 right-0 w-10 h-10 bg-[#1e40af] animate-switch-4" />
                </div>

                <span className="text-lg font-bold tracking-[0.3em] text-slate-500 uppercase ml-2">
                    Loading
                </span>
            </div>

            <style jsx>{`
        /* 
           Distance is calculated as: 
           Container Size (96px) - Diamond Size (40px) = 56px move distance 
        */
        
        @keyframes switch-1 {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(56px, 0); }
          50% { transform: translate(56px, 56px); }
          75% { transform: translate(0, 56px); }
        }
        
        @keyframes switch-2 {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(0, 56px); }
          50% { transform: translate(-56px, 56px); }
          75% { transform: translate(-56px, 0); }
        }
        
        @keyframes switch-3 {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(0, -56px); }
          50% { transform: translate(56px, -56px); }
          75% { transform: translate(56px, 0); }
        }
        
        @keyframes switch-4 {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(-56px, 0); }
          50% { transform: translate(-56px, -56px); }
          75% { transform: translate(0, -56px); }
        }

        .animate-switch-1 { animation: switch-1 2.5s infinite ease-in-out; }
        .animate-switch-2 { animation: switch-2 2.5s infinite ease-in-out; }
        .animate-switch-3 { animation: switch-3 2.5s infinite ease-in-out; }
        .animate-switch-4 { animation: switch-4 2.5s infinite ease-in-out; }
      `}</style>
        </div>
    );
};

export default LoadingPage;

