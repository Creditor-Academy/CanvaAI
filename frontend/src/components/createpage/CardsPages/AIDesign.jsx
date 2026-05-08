import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import api from "../../../services/api";


export const AIDesign = () => {
  const navigate = useNavigate();


  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [showPanel, setShowPanel] = useState(false);
  const [panelIndex, setPanelIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showBalancePopup, setShowBalancePopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [downloadFormat, setDownloadFormat] = useState("png");
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedSize, setSelectedSize] = useState(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const styles = [
    { name: "Realistic", img: "https://i.pinimg.com/736x/5c/b9/62/5cb9627a8d35ff42a96510c58fd68cd2.jpg" },
    { name: "Anime", img: "https://i.pinimg.com/736x/92/bf/03/92bf03bfcd83247fab3b468fe560cfc7.jpg" },
    { name: "Cartoon", img: "https://i.pinimg.com/736x/69/a2/7e/69a27e12ec3e857c925abb47590dd928.jpg" },
    { name: "Sketch", img: "https://i.pinimg.com/736x/98/18/3a/98183a4a3b3e8ea0dec2ff3fb3c33317.jpg" },
    { name: "Painting", img: "https://i.pinimg.com/736x/ee/3d/9b/ee3d9bbd7bcba1287c2ba4f995423e8c.jpg" },
  ];

  const SIZE_MAP = {
    square: "1024x1024",
    portrait: "1024x1536",
    landscape: "1536x1024",
  };

  const sizes = [
    { name: "Square", value: "square" },
    { name: "Portrait", value: "portrait" },
    { name: "Landscape", value: "landscape" },
  ];


  const examplePrompts = [
    "A sleek dark logo for a tech startup with geometric shapes",
    "Aerial view of a modern city at golden hour, cinematic lighting",
    "Abstract fluid art with deep ocean blues and electric teal",
    "Hyper-realistic product shot of a luxury perfume bottle",
    "Minimalist flat-design icon set for a finance app",
  ];

  const isPromptValid = Boolean(prompt.trim());
  const isStyleValid = Boolean(selectedStyle);
  const isSizeValid = Boolean(selectedSize);


  useEffect(() => {
    if (!isLoading) return;

    setProgress(0);

    const timer = setInterval(() => {
      setProgress((p) => (p < 95 ? p + Math.random() * 6 : p));
    }, 200);

    return () => clearInterval(timer);
  }, [isLoading]);


  const handleGenerate = async () => {
    setSubmitAttempted(true);
    if (!prompt.trim() || !selectedStyle || !selectedSize) return;

    try {
      setIsLoading(true);
      setGeneratedImages([]);
      setShowPanel(false);
      setPanelIndex(0);
      setProgress(10);

      const style = selectedStyle.toLowerCase();
      const res = await api.generateLogo({
        prompt,
        style,
        size: selectedSize,
      });

      console.log(res);

      const images = res?.data?.[0];

      const imageList = [
        images?.url1?.url,
        images?.url2?.url,
        images?.url3?.url,
        images?.url4?.url,
      ].filter(Boolean);

      setProgress(100);
      setGeneratedImages(imageList);

    } catch (error) {
      console.error("Logo generation failed:", error);
      const message = error?.message || "Image generation failed";

      if (message === "Not enough Balance for generate Image") {
        setGeneratedImages([]);
        setShowPanel(false);
        setPopupMessage(message);
        setShowBalancePopup(true);
      } else {
        alert(message);
      }
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  const openPanel = () => {
    if (!generatedImages.length) return;
    setPanelIndex(0);
    setShowPanel(true);
  };

  const goPrev = () => {
    if (!generatedImages.length) return;
    setPanelIndex((prev) =>
      prev === 0 ? generatedImages.length - 1 : prev - 1
    );
  };

  const goNext = () => {
    if (!generatedImages.length) return;
    setPanelIndex((prev) =>
      prev === generatedImages.length - 1 ? 0 : prev + 1
    );
  };

  const handleDownload = async (imgUrl) => {
    try {
      setIsDownloading(true);

      if (downloadFormat === 'svg') {
        // Fetch image as blob, embed as base64 inside SVG
        const imgRes = await fetch(imgUrl);
        const imgBlob = await imgRes.blob();
        const base64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(imgBlob);
        });
        const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1024" height="1024"><image href="${base64}" width="1024" height="1024" preserveAspectRatio="xMidYMid meet"/></svg>`;
        const blob = new Blob([svgContent], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-image.svg`;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }

      if (downloadFormat === 'pdf') {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(
          `<html><head><title>AI Image</title><style>` +
          `*{margin:0;padding:0;box-sizing:border-box}` +
          `body{display:flex;align-items:center;justify-content:center;min-height:100vh;background:#fff}` +
          `img{max-width:100%;height:auto}` +
          `@media print{body{margin:0}}</style></head>` +
          `<body><img src="${imgUrl}" onload="window.print();window.close();"/></body></html>`
        );
        printWindow.document.close();
        return;
      }

      // jpg / png / webp — backend converts and returns binary blob
      const blob = await api.exportS3Image(imgUrl, downloadFormat);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-image.${downloadFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setIsDownloading(false);
    }
  };


  return (
    <div>

      {/* ── HERO BANNER ── */}
      <div className="px-4 sm:px-8 pt-8 pb-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-blue-900/10 backdrop-blur-sm border border-blue-200/60 rounded-2xl px-6 py-7 text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-blue-950 tracking-tight leading-tight">
              AI Image Generator
            </h1>
            <p className="text-blue-500 mt-2 text-sm sm:text-base max-w-lg mx-auto">
              Describe your vision, pick a style &amp; size — let AI bring it to life in seconds.
            </p>
          </div>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-28 md:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 items-start">

          {/* ── OUTPUT PANEL (left on desktop) ── */}
          <div className="order-2 lg:order-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <span className="text-sm font-bold text-blue-900">Generated Output</span>
              {generatedImages.length > 0 && (
                <button
                  onClick={openPanel}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-900 transition flex items-center gap-1"
                >
                  View fullscreen
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                </button>
              )}
            </div>

            <div className="min-h-[360px] sm:min-h-[440px] flex flex-col items-center justify-center p-5">
              {!generatedImages.length && !isLoading && (
                <div className="flex flex-col items-center gap-3 text-center py-10">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
                    <svg className="w-8 h-8 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                    </svg>
                  </div>
                  <p className="text-blue-800 text-sm font-semibold">Your images will appear here</p>
                  <p className="text-slate-400 text-xs max-w-[220px]">Fill in all fields on the right, then hit Generate</p>
                </div>
              )}

              {isLoading && (
                <div className="flex flex-col items-center gap-4 py-10">
                  <div className="w-14 h-14 rounded-full border-4 border-blue-100 border-t-blue-700 border-r-yellow-400 animate-spin" />
                  <p className="text-blue-700 text-sm font-semibold animate-pulse">Generating your images…</p>
                  <p className="text-slate-400 text-xs">This may take a few seconds</p>
                </div>
              )}

              {generatedImages.length > 0 && (
                <div className="w-full grid grid-cols-2 gap-3">
                  {generatedImages.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => { setPanelIndex(idx); setShowPanel(true); }}
                      className="group relative rounded-xl overflow-hidden cursor-pointer ring-1 ring-slate-200 hover:ring-blue-400 transition"
                    >
                      <img src={img} className="w-full h-auto block" alt="" />
                      <div className="absolute inset-0 bg-blue-900/0 group-hover:bg-blue-900/25 transition flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 transition bg-white/90 text-blue-900 text-xs font-bold px-3 py-1 rounded-full shadow">
                          View
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── CONFIG PANEL (right on desktop) ── */}
          <div className="order-1 lg:order-2 flex flex-col gap-4">

            {/* PROMPT */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <label className="text-[11px] font-bold text-blue-900 uppercase tracking-widest">
                Describe your image
              </label>
              <textarea
                placeholder="e.g. A futuristic city at sunset, cyberpunk neon lights reflecting on wet streets…"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className={`mt-3 w-full border rounded-xl p-3 h-[96px] resize-none outline-none text-sm text-blue-900 placeholder-slate-400 transition
                  ${submitAttempted && !isPromptValid
                    ? "border-red-400 ring-2 ring-red-200 shadow-[0_0_12px_rgba(248,113,113,0.35)]"
                    : "border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  }`}
              />
              <div className="mt-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Quick examples</p>
                <div className="flex flex-wrap gap-1.5">
                  {examplePrompts.map((ex, i) => (
                    <button
                      key={i}
                      onClick={() => setPrompt(ex)}
                      className="bg-slate-50 hover:bg-yellow-300 border border-slate-200 hover:border-yellow-400 text-blue-800 text-[11px] px-2.5 py-1 rounded-full whitespace-nowrap transition"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* STYLE */}
            <div className={`bg-white rounded-2xl border shadow-sm p-5 transition ${submitAttempted && !isStyleValid ? "border-red-300 shadow-[0_0_12px_rgba(248,113,113,0.3)]" : "border-slate-200"}`}>
              <div className="flex items-center justify-between mb-3">
                <label className="text-[11px] font-bold text-blue-900 uppercase tracking-widest">Art Style</label>
                {selectedStyle && (
                  <span className="text-xs font-semibold text-yellow-600 bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded-full">
                    {selectedStyle}
                  </span>
                )}
              </div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {styles.map((style) => {
                  const active = selectedStyle === style.name;
                  return (
                    <button
                      key={style.name}
                      onClick={() => setSelectedStyle(style.name)}
                      className={`relative shrink-0 rounded-xl overflow-hidden transition ${
                        active
                          ? "ring-2 ring-yellow-400 ring-offset-1 scale-105"
                          : "ring-1 ring-slate-200 hover:ring-blue-300"
                      }`}
                    >
                      <img src={style.img} className="w-[72px] h-[72px] object-cover" alt={style.name} />
                      <div className={`absolute inset-0 flex items-end justify-center pb-1.5 ${active ? "bg-blue-900/50" : "bg-blue-900/30"}`}>
                        <span className="text-white text-[10px] font-bold drop-shadow">{style.name}</span>
                      </div>
                      {active && (
                        <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-blue-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SIZE */}
            <div className={`bg-white rounded-2xl border shadow-sm p-5 transition ${submitAttempted && !isSizeValid ? "border-red-300 shadow-[0_0_12px_rgba(248,113,113,0.3)]" : "border-slate-200"}`}>
              <div className="flex items-center justify-between mb-3">
                <label className="text-[11px] font-bold text-blue-900 uppercase tracking-widest">Canvas Size</label>
                {selectedSize && (
                  <span className="text-xs font-semibold text-yellow-600 bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded-full">
                    {SIZE_MAP[selectedSize]}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {sizes.map((size) => {
                  const active = selectedSize === size.value;
                  const ratioClass = size.value === "square"
                    ? "w-8 h-8"
                    : size.value === "portrait"
                    ? "w-6 h-9"
                    : "w-10 h-6";
                  return (
                    <button
                      key={size.value}
                      onClick={() => setSelectedSize(size.value)}
                      className={`flex flex-col items-center gap-2 py-3.5 px-2 rounded-xl border transition ${
                        active
                          ? "bg-yellow-50 border-yellow-400 ring-2 ring-yellow-200"
                          : "bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50"
                      }`}
                    >
                      <div className={`${ratioClass} rounded border-2 transition ${active ? "border-yellow-500 bg-yellow-200" : "border-blue-200 bg-blue-50"}`} />
                      <span className={`text-xs font-bold ${active ? "text-blue-900" : "text-blue-700"}`}>{size.name}</span>
                      <span className={`text-[10px] font-medium ${active ? "text-yellow-700" : "text-slate-400"}`}>{SIZE_MAP[size.value]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* GENERATE */}
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-800 to-blue-950 hover:from-blue-900 hover:to-blue-950 text-white font-bold text-sm sm:text-base tracking-wide shadow-lg shadow-blue-900/20 disabled:opacity-60 transition flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                  </svg>
                  Generate Images
                </>
              )}
            </button>

          </div>
        </div>
      </div>

      {/* MODAL */}
      {showPanel && generatedImages.length > 0 &&
        createPortal(
          <div className="fixed inset-0 backdrop-blur-md bg-black/40 flex items-center justify-center z-[999]">
            <button
              onClick={() => setShowPanel(false)}
              className="absolute top-4 right-4 sm:top-6 sm:right-8 text-white text-2xl sm:text-3xl"
            >
              ✕
            </button>


            <div className="text-center">
              <img
                src={generatedImages[panelIndex]}
                className="max-h-[65vh] sm:max-h-[75vh] max-w-[92vw] rounded-xl"
                alt=""
              />

              <div className="flex justify-center items-center gap-3 mt-3">
                <button
                  onClick={goPrev}
                  className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-lg"
                >
                  Prev
                </button>
                <span className="text-white text-sm font-semibold">
                  {panelIndex + 1} / {generatedImages.length}
                </span>
                <button
                  onClick={goNext}
                  className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-lg"
                >
                  Next
                </button>
              </div>

              {/* Format selector */}
              <div className="flex gap-2 justify-center mt-4 flex-wrap">
                {[
                  'png',
                  'jpg',
                  'webp',
                  // 'svg',
                  // 'pdf',
                ].map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setDownloadFormat(fmt)}
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide transition ${
                      downloadFormat === fmt
                        ? 'bg-yellow-400 text-blue-900'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>

              <div className="flex gap-4 justify-center mt-3 items-center">
                <button
                  onClick={() => handleDownload(generatedImages[panelIndex])}
                  disabled={isDownloading}
                  title={`Download as ${downloadFormat.toUpperCase()}`}
                  className="flex items-center gap-2 bg-blue-800 hover:bg-blue-900 disabled:opacity-50 text-white px-5 py-2 rounded-lg transition"
                >
                  {isDownloading ? (
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                  )}
                  Download {isDownloading ? '...' : downloadFormat.toUpperCase()}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      {showBalancePopup &&
        createPortal(
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[1000] px-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-5 sm:p-6 text-center border border-red-200">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-2xl">
                !
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-red-600">
                Insufficient Balance
              </h2>

              <p className="text-gray-700 mt-2 text-sm leading-6">
                {popupMessage || "Not enough Balance for generate Image"}
              </p>

              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => setShowBalancePopup(false)}
                  className="bg-blue-800 hover:bg-blue-900 text-white px-6 py-2 rounded-full"
                >
                  OK
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}


      <style>
        {`
        .no-scrollbar::-webkit-scrollbar { display:none; }
        .no-scrollbar { scrollbar-width:none; -ms-overflow-style:none; }
        `}
      </style>
    </div>
  );
};


export default AIDesign;
