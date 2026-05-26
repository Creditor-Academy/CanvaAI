import React, { useEffect, useState } from 'react'
import { getAdminTemplates } from '../../../../services/presentation'
import PresentationThumbnail from '../../../PresentationThumbnail'
import SkeletonCard from '../../../SkeletonCard'
import { FiLayout } from 'react-icons/fi'

const ThemePanel = ({ onClose = () => { } }) => {
    const [templatesLoading, setTemplatesLoading] = useState(true)
    const [templates, setTemplates] = useState([])

    useEffect(() => {
        let mounted = true
        const load = async () => {
            try {
                const data = await getAdminTemplates()
                if (!mounted) return
                setTemplates(Array.isArray(data) ? data : [])
            } catch (e) {
                console.error('Failed to load templates', e)
            } finally {
                if (mounted) setTemplatesLoading(false)
            }
        }
        load()
        return () => { mounted = false }
    }, [])

    const getSlideData = (item) => {
        if (!item?.data) return null
        let data = item.data
        if (typeof data === 'string') {
            try { data = JSON.parse(data) } catch (e) { return null }
        }
        return data.slides?.[0] || (data.layers ? data : null)
    }

    const getSlideCount = (item) => {
        if (item.slideCount !== undefined) return item.slideCount
        const data = getSlideData(item)
        if (!data) return 0
        let rawData = item.data
        if (typeof rawData === 'string') {
            try { rawData = JSON.parse(rawData) } catch (e) { }
        }
        if (Array.isArray(rawData?.slides)) return rawData.slides.length
        return rawData?.layers ? 1 : 0
    }

    const handleViewTemplate = (template) => {
        const tplId = template._id || template.id
        // Navigate in the same tab
        window.location.href = `/presentation-editor-v3/${tplId}?template=true`
    }

    return (
        <div className="fixed top-[60px] right-1 w-[min(360px,calc(100vw-40px))] h-[100vh] p-5 bg-white/95 border border-amber-300/60 rounded-[20px] shadow-[0_28px_72px_rgba(0,0,0,0.18)] backdrop-blur-[16px] z-30 overflow-auto flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
                <h1 className="text-lg font-bold text-slate-900 m-0">Templates</h1>
                <button
                    className="rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-900 transition-all duration-200 hover:-translate-y-0.5 hover:bg-amber-500"
                    onClick={onClose}
                >
                    Close
                </button>
            </div>

            <div className="overflow-y-auto pr-2.5 custom-scrollbar mt-5">
                {templatesLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-5">
                        {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-5 fade-in">
                        {templates.map((tpl) => (
                            <div
                                key={tpl._id}
                                onClick={() => handleViewTemplate(tpl)}
                                className="bg-white rounded-2xl border border-slate-200 overflow-hidden cursor-pointer transition-all duration-200 hover:border-indigo-500 group"
                            >
                                <div className="h-[140px] bg-indigo-50 flex items-center justify-center relative">
                                    {getSlideData(tpl) ? (
                                        <>
                                            <PresentationThumbnail slide={getSlideData(tpl)} width="100%" height="100%" />
                                            <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-[1px]">
                                                <div className="absolute top-3 right-3 bg-white/95 px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-xl transform translate-x-2 group-hover:translate-x-0 transition-all duration-300 border border-indigo-100">
                                                    <FiLayout size={13} className="text-indigo-600" />
                                                    <span className="text-[0.7rem] font-extrabold text-slate-800 uppercase tracking-tight">
                                                        {getSlideCount(tpl)} {getSlideCount(tpl) === 1 ? 'Slide' : 'Slides'}
                                                    </span>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <FiLayout size={40} className="text-indigo-500" />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>
    )
}

export default ThemePanel;
