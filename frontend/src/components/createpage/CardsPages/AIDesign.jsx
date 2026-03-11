import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../utils/api";
import { createPortal } from "react-dom";

export const AIDesign = () => {
  const navigate = useNavigate();
  const previewRef = useRef(null);

  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [activePreview, setActivePreview] = useState(null);

  const styles = ["Realistic", "Anime", "Cartoon", "Sketch", "Painting"];
  const mockImages = [
    "https://images.unsplash.com/photo-1673328021673-17902775371d?w=600&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1611521448635-a3a774ee7c7d?w=600&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1627667661797-d113e31a3e6f?w=600&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1690037704521-f614da226dac?w=600&auto=format&fit=crop&q=60"
  ];

  /* ---------------- BACKGROUND IMAGES ---------------- */
  const bgImages = [
    "https://images.unsplash.com/photo-1632734467692-eb8a715e3871?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTI0fHxibHVlJTIwdmludGFnZXxlbnwwfHwwfHx8MA%3D%3D",
    "https://images.unsplash.com/photo-1642049935373-d0c33134ca82?w=600&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1673328021673-17902775371d?w=600&auto=format&fit=crop&q=60",
    "https://plus.unsplash.com/premium_photo-1661826076495-67280d6e7925?w=600&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1690037704521-f614da226dac?w=600&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1619014070282-c46f6b1322d8?w=600&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1557701434-aa5a992f0343?w=600&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1611521448635-a3a774ee7c7d?w=600&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1713330028954-e64e3dd4de3c?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NDh8fGJsdWUlMjBjYXJ8ZW58MHx8MHx8fDA%3D",
    "https://images.unsplash.com/photo-1627667661797-d113e31a3e6f?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fGJsdWUlMjB2aW50YWdlfGVufDB8fDB8fHww",
  ];

  const examplePrompts = [
    "Futuristic neon city at night",
    "Minimalist logo of a mountain",
    "Cyberpunk samurai portrait",
    "Luxury gold emblem badge",
    "Cartoon astronaut mascot"
  ];

  /* ---------------- REALISTIC PROGRESS ---------------- */
  useEffect(() => {
    if (!isLoading) return;

    setProgress(0);

    const timer = setInterval(() => {
      setProgress((p) => (p < 90 ? p + Math.random() * 8 : p));
    }, 300);

    return () => clearInterval(timer);
  }, [isLoading]);

  /* ---------------- AUTO SCROLL TO LOADER ---------------- */
  useEffect(() => {
    if (!isLoading) return;

    const timer = setTimeout(() => {
      const el = previewRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();

      const absoluteTop = rect.top + window.pageYOffset;

      // loader ko viewport ke exact middle me lane ka calculation
      const offset = absoluteTop - (window.innerHeight / 2) + (rect.height / 2);

      window.scrollTo({
        top: offset,
        behavior: "smooth"
      });
    }, 220); // transition + margin render hone ka wait

    return () => clearTimeout(timer);
  }, [isLoading]);

  /* ---------------- GENERATE ---------------- */
  const handleGenerate = () => {
    if (!prompt.trim() || !selectedStyle) return;

    setGeneratedImages([]);
    setSelectedImages([]);
    setProgress(5);
    setIsLoading(true);

    setTimeout(() => {
      setProgress(100);
      setGeneratedImages(mockImages);
      setTimeout(() => setIsLoading(false), 400);
    }, 3000);
  };

  const toggleImageSelection = (imgUrl) => {
    setSelectedImages((prev) =>
      prev.includes(imgUrl)
        ? prev.filter((url) => url !== imgUrl)
        : [...prev, imgUrl]
    );
  };

  const handleImport = () => {
    if (selectedImages.length === 0) return;
    alert(`Importing ${selectedImages.length} images... redirecting to Image Editor!`);
    // navigate("/edito", { state: { images: selectedImages } });
  };

  const openInEditor = () => {
    navigate("/edito", { state: { image: activePreview } });
  };

  const downloadImage = async () => {
    const res = await fetch(activePreview);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "ai-image.png";
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#e0f2ff] text-[#0c4a6e] relative overflow-hidden">

      {/* ---------------- BACKGROUND COLLAGE ---------------- */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">

        {/* LEFT BIG LANDSCAPE */}
        <img
          src={bgImages[0]}
          className="absolute left-[13%] top-[49vh] w-[220px] h-[190px] rounded-3xl shadow-2xl object-cover"
        />

        {/* LEFT SMALL PORTRAIT */}
        <img
          src={bgImages[1]}
          className="absolute left-[-5.5%] top-[40vh] w-[240px] h-[170px] rounded-3xl shadow-2xl object-cover"
        />

        {/* LEFT MID SQUARE */}
        <img
          src={bgImages[2]}
          className="absolute left-[29%] top-[58vh] w-[290px] h-[260px] rounded-3xl shadow-2xl object-cover"
        />

        <img
          src={bgImages[9]}
          className="absolute left-[13%] top-[78vh] w-[220px] h-[160px] rounded-3xl shadow-2xl object-cover"
        />

        {/* LEFT LOWER WIDE */}
        <img
          src={bgImages[3]}
          className="absolute left-[-5.5%] top-[67vh] w-[240px] h-[200px] rounded-3xl shadow-2xl object-cover"
        />

        {/* RIGHT BIG LANDSCAPE */}
        <img
          src={bgImages[4]}
          className="absolute right-[0%] top-[32vh] w-[220px] h-[140px] rounded-3xl shadow-2xl object-cover"
        />

        {/* RIGHT SMALL PORTRAIT */}
        <img
          src={bgImages[5]}
          className="absolute right-[78%] top-[32vh] w-[120px] h-[110px] rounded-3xl shadow-2xl object-cover"
        />

        {/* RIGHT MID SQUARE */}
        <img
          src={bgImages[6]}
          className="absolute right-[21%] top-[43vh] w-[360px] h-[360px] rounded-3xl shadow-2xl object-cover"
        />

        {/* RIGHT LOWER WIDE */}
        <img
          src={bgImages[7]}
          className="absolute right-[-1%] top-[70vh] w-[280px] h-[180px] rounded-3xl shadow-2xl object-cover"
        />

        <img
          src={bgImages[8]}
          className="absolute right-[-1%] top-[54vh] w-[280px] h-[100px] rounded-3xl shadow-2xl object-cover"
        />

      </div>

      {/* ---------------- HERO ---------------- */}
      <div className="relative z-20 flex flex-col items-center text-center pt-28 px-6">

        <h1 className="text-6xl font-semibold tracking-tight">
          AI Image Generator
        </h1>

        <p className="text-gray-500 mt-6 max-w-2xl text-lg leading-relaxed">
          Type any description and generate high-quality images instantly.
        </p>

        {/* PROMPT BOX */}
        <div className="mt-20 w-full max-w-3xl relative">
          <div className="absolute -inset-[1px] rounded-[32px] bg-gradient-to-r from-blue-500/10 via-indigo-500/40 to-purple-500/30 blur-xl opacity-60"></div>

          <div className="relative rounded-[30px] bg-white/10 backdrop-blur-[30px] border border-white/20 shadow-[0_20px_70px_rgba(0,0,0,0.65)] p-5 flex items-center gap-4">

            {/* TEXTAREA WRAPPER */}
            <div className="relative flex-1">

              {/* Visible only when empty */}
              {prompt.length === 0 && (
                <span className="pointer-events-none absolute left-3 top-3 text-black/50">
                  Describe your image...
                </span>
              )}

              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
                className="w-full bg-transparent outline-none resize-none text-lg min-h-[80px] text-black pt-3 pl-3"
              />

            </div>

            <button
              onClick={handleGenerate}
              disabled={isLoading || !prompt.trim() || !selectedStyle}
              className={`px-8 py-3 rounded-2xl font-semibold whitespace-nowrap transition-all duration-200 ${isLoading || !prompt.trim() || !selectedStyle
                  ? "bg-gray-400 text-gray-700 opacity-70 cursor-not-allowed"
                  : "bg-[linear-gradient(180deg,#f7971e_0%,#ffd200_100%)] hover:-translate-y-[2px] text-black hover:shadow-[0_14px_28px_rgba(250,204,21,0.45)]"
                }`}
            >
              Generate
            </button>

          </div>
        </div>

        {/* STYLE SELECTOR */}
        <div className="mt-8 flex flex-wrap justify-center gap-3 relative z-20">
          {styles.map((s) => (
            <button
              key={s}
              onClick={() => setSelectedStyle(s)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${selectedStyle === s
                  ? "bg-[linear-gradient(180deg,#f7971e_0%,#ffd200_100%)] text-black shadow-lg scale-105"
                  : "bg-white/20 text-[#0c4a6e] hover:bg-white/40 hover:text-black backdrop-blur-md border border-white/20"
                }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* EXAMPLES */}
        {generatedImages.length === 0 && !isLoading && (
          <div className="mt-8 flex flex-wrap justify-center gap-3 max-w-3xl">
            {examplePrompts.map((ex, i) => (
              <button
                key={i}
                onClick={() => setPrompt(ex)}
                className="bg-white/80 hover:bg-white border border-white/15 px-4 py-2 text-[#0c4a6e] rounded-full text-sm backdrop-blur-md transition-all shadow-sm hover:shadow-md"
              >
                {ex}
              </button>
            ))}
          </div>
        )}

      </div>

      {/* ---------------- RESULT SECTION ---------------- */}
      <div
        ref={previewRef}
        className={`relative z-30 flex flex-col items-center transition-all duration-500 w-full max-w-6xl ${isLoading || generatedImages.length > 0
            ? "mt-24 mb-24 opacity-100"
            : "h-0 overflow-hidden opacity-0"
          }`}
      >
        {isLoading && (
          <div className="w-[420px] max-w-full mt-10">
            <div className="h-3 bg-white/30 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-4 text-[#0c4a6e] font-semibold text-center">
              {Math.floor(progress)}% Generating designs...
            </p>
          </div>
        )}

        {generatedImages.length > 0 && !isLoading && (
          <div className="flex flex-col items-center w-full mt-10 px-4 animate-fade-in-up">
            <div className="flex gap-6 overflow-x-auto pb-8 w-full custom-scrollbar justify-start xl:justify-center">
              {generatedImages.map((img, idx) => {
                const isSelected = selectedImages.includes(img);
                return (
                  <div
                    key={idx}
                    onClick={() => toggleImageSelection(img)}
                    className={`relative w-[280px] h-[280px] shrink-0 rounded-3xl cursor-pointer transition-all duration-300 select-none bg-white ${isSelected
                        ? "ring-4 ring-amber-500 scale-[1.02] shadow-[0_20px_40px_rgba(245,158,11,0.25)]"
                        : "shadow-xl hover:-translate-y-2 hover:shadow-2xl ring-1 ring-[#0c4a6e]/10"
                      }`}
                  >
                    <img
                      src={img}
                      className="w-full h-full object-cover rounded-3xl"
                      alt=""
                      draggable={false}
                    />

                    {/* Hover Overlay */}
                    <div className={`absolute inset-0 bg-black/30 rounded-3xl flex flex-col items-center justify-center gap-3 opacity-0 transition duration-300 ${isSelected ? "hidden" : "hover:opacity-100"}`}>
                      <span className="bg-white text-black px-6 py-2 rounded-full font-semibold shadow-lg">
                        Select
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setActivePreview(img); }}
                        className="text-white text-sm border border-white/50 px-4 py-1.5 rounded-full hover:bg-white/20 backdrop-blur-sm transition"
                      >
                        Preview 🔍
                      </button>
                    </div>

                    {/* Selected Checkmark */}
                    {isSelected && (
                      <div className="absolute top-4 right-4 bg-amber-500 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg z-10 transition-transform scale-in">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleImport}
              disabled={selectedImages.length === 0}
              className={`mt-4 px-10 py-4 rounded-3xl font-bold text-lg transition-all shadow-xl ${selectedImages.length === 0
                  ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                  : "bg-[#0c4a6e] text-white hover:scale-105 hover:bg-[#072a42] border border-[#0c4a6e]"
                }`}
            >
              Import Selected ({selectedImages.length})
            </button>
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(12, 74, 110, 0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(12, 74, 110, 0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(12, 74, 110, 0.4); }
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fade-in-up 0.5s ease-out forwards; }
        @keyframes scale-in { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .scale-in { animation: scale-in 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
      `}</style>

      {/* ---------------- MODAL ---------------- */}
      {activePreview &&
        createPortal(
          <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[9999]">

            <button
              onClick={() => setActivePreview(null)}
              className="absolute top-6 right-8 text-white text-2xl font-bold"
            >
              ✕
            </button>

            <div className="text-center px-6 w-full">

              <img
                src={activePreview}
                className="max-h-[88vh] mx-auto rounded-2xl shadow-2xl mb-8"
                alt=""
              />

              <div className="flex gap-6 justify-center flex-wrap">

                <button
                  onClick={downloadImage}
                  className="bg-white text-black px-8 py-3 rounded-xl font-semibold hover:scale-105 transition"
                >
                  Download
                </button>

                <button
                  onClick={openInEditor}
                  className="bg-blue-600 px-8 py-3 rounded-xl font-semibold hover:scale-105 transition"
                >
                  Open In Editor
                </button>

              </div>

            </div>

          </div>,
          document.body
        )}
    </div>
  );
};

export default AIDesign;