import React, { useState, useMemo, useEffect } from "react";

import { useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiPlus,
  FiTrash2,
  FiFileText,
  FiImage,
  FiMonitor,
  FiLayout,
  FiFilter,
  FiChevronDown
} from "react-icons/fi";
import { useAuth } from "../contexts/AuthContext";
import { listPresentations, deletePresentation } from "../services/presentation";
import { getUserImages, deleteImage } from "../services/imageEditor/imageApi";
import PresentationThumbnail from "../components/PresentationThumbnail";
import SkeletonCard from "../components/SkeletonCard";
import { toast } from "sonner";
import { exportCanvasAsImage } from "../components/canva/export/exportCanvasAsImage";

export default function AllProjects() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?._id;

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [page, setPage] = useState(0);
  const [modal, setModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [thumbnails, setThumbnails] = useState({});

  const itemsPerPage = 8;

  // 1. Fetch & Normalize Data
  useEffect(() => {
    if (!userId) return;

    async function fetchData() {
      setLoading(true);
      try {
        const [pptRes, imgRes] = await Promise.all([
          listPresentations(userId),
          getUserImages(userId)
        ]);

        const pptList = Array.isArray(pptRes) ? pptRes : (pptRes.data || []);
        const imgList = Array.isArray(imgRes) ? imgRes : (imgRes.data || []);

        const normalizedPpts = pptList.map(p => ({
          id: p._id,
          title: p.title || "Untitled PPT",
          type: "ppt",
          updatedAt: p.updatedAt || p.createdAt,
          createdAt: p.createdAt,
          data: p.data,
          original: p
        }));

        const normalizedImages = imgList.map(i => ({
          id: i._id,
          title: i.title || "Untitled Image",
          type: "image",
          updatedAt: i.updatedAt || i.createdAt,
          createdAt: i.createdAt,
          data: i.data,
          original: i
        }));

        const allProjects = [...normalizedPpts, ...normalizedImages].sort(
          (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
        );

        setProjects(allProjects);
      } catch (error) {
        console.error("Failed to fetch projects:", error);
        toast.error("Failed to load projects");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [userId]);

  // 2. Image Thumbnail Generation (Incremental)
  useEffect(() => {
    let mounted = true;
    const imagesToProcess = projects.filter(p => p.type === "image" && !thumbnails[p.id]);

    const gen = async () => {
      const map = {};
      for (const project of imagesToProcess) {
        if (!mounted) break;
        try {
          const image = project.original;
          const layers = image.data?.layer || [];
          const canvasSize = image.data?.canvasSize || { width: 800, height: 600 };
          const bgColor = image.data?.canvasBgColor || layers[0]?.canvasBgColor || '#ffffff';
          const bgImage = image.data?.canvasBgImage || layers[0]?.canvasBgImage || null;

          let dataUrl = null;
          try {
            dataUrl = await exportCanvasAsImage(layers, canvasSize, 'png', 1, bgColor, bgImage);
          } catch (err) { }

          if (!dataUrl) {
            const firstImgLayer = (layers || []).find(l => l && l.type === 'image' && l.src);
            if (firstImgLayer && firstImgLayer.src) dataUrl = firstImgLayer.src;
          }

          if (mounted && dataUrl) map[project.id] = dataUrl;
        } catch (err) { }
      }
      if (mounted && Object.keys(map).length) {
        setThumbnails(prev => ({ ...prev, ...map }));
      }
    };

    if (imagesToProcess.length) gen();
    return () => { mounted = false };
  }, [projects, thumbnails]);

  // Helper to get PPT slide data
  const getSlideData = (ppt) => {
    if (!ppt?.data) return null;
    let data = ppt.data;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch (e) { return null; }
    }
    return data.slides?.[0] || (data.layers ? data : null);
  };

  const getSlideCount = (ppt) => {
    const original = ppt.original;
    if (original.slideCount !== undefined) return original.slideCount;
    let rawData = ppt.data;
    if (typeof rawData === 'string') {
      try { rawData = JSON.parse(rawData); } catch (e) { }
    }
    if (Array.isArray(rawData?.slides)) return rawData.slides.length;
    return rawData?.layers ? 1 : 0;
  };

  // Filter & Pagination
  const filtered = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
      const matchesType = filterType === "All" ? true : (filterType === "PPT" ? p.type === "ppt" : p.type === "image");
      return matchesSearch && matchesType;
    });
  }, [projects, search, filterType]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice(
    page * itemsPerPage,
    page * itemsPerPage + itemsPerPage
  );

  const openDeleteModal = (e, project) => {
    e.stopPropagation();
    setSelectedProject(project);
    setDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedProject) return;
    try {
      if (selectedProject.type === "ppt") {
        await deletePresentation(selectedProject.id, userId);
      } else {
        await deleteImage(selectedProject.id);
      }
      setProjects(prev => prev.filter(p => p.id !== selectedProject.id));
      toast.success("Project deleted successfully");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete project");
    } finally {
      setDeleteModal(false);
      setSelectedProject(null);
    }
  };

  const handleProjectClick = (project) => {
    if (project.type === "ppt") {
      window.open(`/presentation-editor-v3/${project.id}?template=false`, '_blank');
    } else {
      window.open(`/canva-clone/${project.id}`, '_blank');
    }
  };

  // Custom SVGs from user requirements
  const ImageIcon = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="3" y="3" width="18" height="18" rx="3"></rect>
      <circle cx="8.5" cy="8.5" r="1.5"></circle>
      <path d="M21 15l-5-5-4 4-3-3-6 6"></path>
    </svg>
  );

  const PPTIcon = ({ size = 16, active = false }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={active ? "white" : "black"}
      strokeWidth="1.176"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4.99787498 9 L4.99787498 1 L19.5 1 L23 4.5 L23 23 L4 23" />
      <path d="M18 1 L18 6 L23 6" />
      <path d="M4 12 L4.25 12 L5.5 12 C7.5 12 9 12.5 9 14.25 C9 16 7.5 16.5 5.5 16.5 L4.25 16.5 L4.25 19 L4 19 L4 12 Z" />
    </svg>
  );

  return (
    <div className="w-full min-h-screen px-4 md:px-10 lg:px-24 py-10 md:py-20 bg-[#e9f4ff]">
      <div className="max-w-7xl mx-auto bg-white/80 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-sm border border-white/40">
        
        {/* HEADER */}
        <div className="text-center mb-10" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 400, letterSpacing: '-0.02em' }}>Your Creative Projects</h1>
          <p className="text-slate-500 mt-3 text-[1.1rem]">
            Total Projects – {projects.length}
          </p>
        </div>

        {/* SEARCH + CREATE */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6">
          
          {/* Unified Search & Filter Container */}
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto bg-white p-1.5 rounded-[1.25rem] shadow-sm border border-slate-200/60 transition-all hover:shadow-md focus-within:shadow-md focus-within:border-blue-400 group">
            
            <div className="relative w-full sm:flex-1 sm:w-72">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search projects..."
                className="w-full bg-transparent border-none py-2.5 pl-11 pr-4 text-sm font-semibold text-slate-700 placeholder:text-slate-400 placeholder:font-medium focus:outline-none focus:ring-0"
              />
            </div>

            <div className="w-[1px] h-8 bg-slate-200 hidden sm:block"></div>

            <div className="relative w-full sm:w-auto flex-shrink-0">
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setPage(0); // reset page
                }}
                className="appearance-none w-full bg-slate-50/80 hover:bg-slate-100 border border-slate-200/60 rounded-xl py-2 pl-4 pr-10 text-sm font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer h-full outline-none"
              >
                <option value="All">All Projects</option>
                <option value="PPT">Presentations</option>
                <option value="Image">Images</option>
              </select>
              <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            </div>
          </div>

          {/* Elevated Create Button */}
          <button
            onClick={() => setModal(true)}
            className="group relative flex items-center justify-center gap-2 w-full md:w-auto bg-gradient-to-r from-blue-600 to-blue-500 text-white px-7 py-3 rounded-2xl overflow-hidden shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0.5 transition-all duration-300 font-semibold"
          >
            <div className="absolute inset-0 w-full h-full bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
            <FiPlus className="transition-transform group-hover:rotate-90 duration-300" size={20} />
            <span>Create Design</span>
          </button>
        </div>

        {/* PROJECT GRID */}
        <h2 className="text-[1.6rem] font-normal text-slate-900 mb-6 flex items-center gap-2" style={{ fontFamily: 'Georgia, "Times New Roman", serif', letterSpacing: '-0.01em' }}>
          Recent Designs
        </h2>

        {loading ? (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
            <div className="max-w-xs mx-auto">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <FiLayout size={24} className="text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium">No projects found. Try a different search or create a new design!</p>
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {paginated.map(p => (
              <div
                key={`${p.type}-${p.id}`}
                onClick={() => handleProjectClick(p)}
                className="group bg-white border border-blue-200/60 rounded-2xl overflow-hidden hover:border-blue-400 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col"
              >
                <div className="relative aspect-[16/9] bg-slate-50 overflow-hidden border-b border-blue-100 group-hover:border-blue-400/50">
                  {p.type === "ppt" ? (
                    getSlideData(p) ? (
                      <PresentationThumbnail slide={getSlideData(p)} width="100%" height="100%" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FiMonitor size={40} className="text-slate-300" />
                      </div>
                    )
                  ) : (
                    thumbnails[p.id] ? (
                      <img src={thumbnails[p.id]} alt={p.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )
                  )}

                  {/* Type Tag */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-white/90 border border-blue-200 rounded-sm text-[10px] font-black uppercase tracking-wider text-blue-800 group-hover:border-blue-400 group-hover:text-blue-600 transition-colors">
                    {p.type === 'ppt' ? <PPTIcon size={12} /> : <ImageIcon size={12} />}
                    {p.type}
                  </div>
                </div>

                <div className="p-4 sm:p-5">
                  <h3 className="font-extrabold text-[16px] text-slate-900 truncate group-hover:text-blue-600 transition-colors mb-1">
                    {p.title}
                  </h3>

                  <div className="flex items-end justify-between mt-3">
                    <div className="flex flex-col gap-1.5">
                      <p className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                        Edited {new Date(p.updatedAt).toLocaleDateString()}
                      </p>
                      {p.type === 'ppt' && getSlideCount(p) > 0 && (
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] font-bold text-blue-700 border border-blue-200 bg-blue-50 px-2 py-0.5 rounded-sm w-fit group-hover:border-blue-400 transition-colors">
                           <FiLayout size={12} />
                           {getSlideCount(p)} {getSlideCount(p) === 1 ? 'Slide' : 'Slides'}
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={(e) => openDeleteModal(e, p)}
                      className="p-1.5 sm:p-2 text-red-600 bg-red-50 border border-red-200 hover:bg-red-500 hover:text-white hover:border-red-600 rounded-md transition-all font-bold"
                      title="Delete Project"
                    >
                      <FiTrash2 size={15} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-12 bg-slate-50 w-fit mx-auto p-1.5 rounded-2xl border border-slate-100">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className={`p-2 rounded-xl transition-all ${page === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-white hover:shadow-sm'}`}
            >
              <FiChevronLeft size={20} />
            </button>
            <span className="text-sm font-bold text-slate-600 px-4">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className={`p-2 rounded-xl transition-all ${page === totalPages - 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-white hover:shadow-sm'}`}
            >
              <FiChevronRight size={20} />
            </button>
          </div>
        )}

        {/* TEMPLATE SECTION */}
        {/* <div className="mt-16 border-t border-slate-100 pt-12">
          <h2 className="text-[1.6rem] text-slate-900 mb-8 text-center italic" style={{ fontFamily: 'Georgia, "Times New Roman", serif', letterSpacing: '-0.01em', fontWeight: 400 }}>
            Need inspiration? Start with a template
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <div
              onClick={() => navigate("/presentationTemplates")}
              className="group cursor-pointer rounded-3xl p-8 text-center bg-blue-50 hover:bg-blue-600 hover:shadow-2xl hover:shadow-blue-500/30 hover:-translate-y-1 transition-all duration-300"
            >
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <FiMonitor size={32} className="text-blue-600" />
              </div>
              <h3 className="font-bold text-slate-900 text-xl group-hover:text-white transition-colors">Presentation</h3>
              <p className="text-sm text-slate-600 mt-1 group-hover:text-blue-100 transition-colors">Professional Slides & Decks</p>
            </div>

            <div
              onClick={() => navigate("/imageTemplates")}
              className="group cursor-pointer rounded-3xl p-8 text-center bg-indigo-50 hover:bg-indigo-600 hover:shadow-2xl hover:shadow-indigo-500/30 hover:-translate-y-1 transition-all duration-300"
            >
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <FiImage size={32} className="text-indigo-600" />
              </div>
              <h3 className="font-bold text-slate-900 text-xl group-hover:text-white transition-colors">Images</h3>
              <p className="text-sm text-slate-600 mt-1 group-hover:text-indigo-100 transition-colors">Social & Creative Visuals</p>
            </div>
          </div>
        </div> */}
      </div>

      {/* CREATE MODAL */}
      {modal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 md:p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setModal(false)} />
          <div className="relative w-full max-w-2xl rounded-2xl md:rounded-[32px] bg-white p-6 md:p-10 shadow-2xl animate-in fade-in zoom-in duration-300">
            <button
              onClick={() => setModal(false)}
              className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"
            >
              ✕
            </button>
            <h3 className="text-2xl md:text-3xl text-slate-900 text-center mb-8 md:mb-10 font-normal" style={{ fontFamily: 'Georgia, "Times New Roman", serif', letterSpacing: '-0.01em' }}>Select Design Type</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8">
              <div
                onClick={() => window.open('/presentation', '_blank')}
                className="group cursor-pointer p-6 md:p-8 rounded-2xl md:rounded-3xl bg-slate-50 border-2 border-transparent hover:border-blue-500 hover:bg-white hover:shadow-xl transition-all text-center"
              >
                <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-blue-100 text-blue-600 mb-4 mx-auto group-hover:scale-110 transition-transform">
                  <FiMonitor size={32} />
                </div>
                <h4 className="font-bold text-slate-900 text-xl">Presentation</h4>
                <p className="text-sm text-slate-500 mt-2">Slides, decks & pitches</p>
              </div>

              <div
                onClick={() => window.open('/create-image', '_blank')}
                className="group cursor-pointer p-6 md:p-8 rounded-2xl md:rounded-3xl bg-slate-50 border-2 border-transparent hover:border-indigo-500 hover:bg-white hover:shadow-xl transition-all text-center"
              >
                <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 mb-4 mx-auto group-hover:scale-110 transition-transform">
                  <FiImage size={32} />
                </div>
                <h4 className="font-bold text-slate-900 text-xl">Image Design</h4>
                <p className="text-sm text-slate-500 mt-2">Social posts & graphics</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 md:p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDeleteModal(false)} />
          <div className="relative bg-white rounded-2xl md:rounded-[32px] p-6 md:p-10 w-full max-w-md shadow-2xl text-center">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-red-50 rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto mb-4 md:mb-6 text-red-500">
              <FiTrash2 size={40} />
            </div>
            <h3 className="text-[1.6rem] text-slate-900 font-normal mb-4" style={{ fontFamily: 'Georgia, "Times New Roman", serif', letterSpacing: '-0.01em' }}>Delete Project?</h3>
            <p className="text-slate-500 mb-8 px-4">
              Are you sure? This action cannot be undone and your design will be permanently lost.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteModal(false)}
                className="flex-1 px-6 py-3.5 border-2 border-slate-100 text-slate-600 rounded-2xl hover:bg-slate-50 font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-6 py-3.5 bg-red-500 text-white rounded-2xl hover:bg-red-600 font-bold shadow-lg shadow-red-500/30 transition-all active:scale-95"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
