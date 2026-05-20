import React from 'react'

const ThemePanel = ({ onClose = () => { } }) => {
    return (
        <div className="fixed top-[60px] right-1 w-[min(360px,calc(100vw-40px))] h-[100vh] p-5 bg-white/95 border border-amber-300/60 rounded-[20px] shadow-[0_28px_72px_rgba(0,0,0,0.18)] backdrop-blur-[16px] z-30 overflow-auto flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
                <h1 className="text-lg font-bold text-slate-900 m-0">Theme Panel</h1>
                <button
                    className="rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-900 transition-all duration-200 hover:-translate-y-0.5 hover:bg-amber-500"
                    onClick={onClose}
                >
                    Close
                </button>
            </div>

            <div className="flex flex-col gap-4">
                <section className="rounded-xl border border-slate-200/90 bg-white p-4">
                    <h2 className="text-sm font-semibold text-slate-900 mb-2">Theme preview</h2>
                    <p className="text-sm leading-6 text-slate-600">
                        This panel is intentionally elevated above the Properties panel so theme controls remain visible and interactive.
                    </p>
                </section>

                <section className="rounded-xl border border-slate-200/90 bg-white p-4">
                    <h2 className="text-sm font-semibold text-slate-900 mb-2">Colors</h2>
                    <p className="text-sm leading-6 text-slate-600">
                        Add your theme colors, text styles and background presets here.
                    </p>
                </section>
            </div>
        </div>
    )
}

export default ThemePanel;


