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

  const styles = [
    { name: "Realistic", img: "https://i.pinimg.com/736x/5c/b9/62/5cb9627a8d35ff42a96510c58fd68cd2.jpg" },
    { name: "Anime", img: "https://i.pinimg.com/736x/92/bf/03/92bf03bfcd83247fab3b468fe560cfc7.jpg" },
    { name: "Cartoon", img: "https://i.pinimg.com/736x/69/a2/7e/69a27e12ec3e857c925abb47590dd928.jpg" },
    { name: "Sketch", img: "https://i.pinimg.com/736x/98/18/3a/98183a4a3b3e8ea0dec2ff3fb3c33317.jpg" },
    { name: "Painting", img: "https://i.pinimg.com/736x/ee/3d/9b/ee3d9bbd7bcba1287c2ba4f995423e8c.jpg" },
  ];


  const examplePrompts = [
    "Futuristic neon city",
    "Minimalist mountain logo",
    "Cyberpunk samurai portrait",
    "Luxury gold emblem",
    "Cartoon astronaut mascot",
  ];


  useEffect(() => {
    if (!isLoading) return;

    setProgress(0);

    const timer = setInterval(() => {
      setProgress((p) => (p < 95 ? p + Math.random() * 6 : p));
    }, 200);

    return () => clearInterval(timer);
  }, [isLoading]);


  const handleGenerate = async () => {
    if (!prompt.trim() || !selectedStyle) return;

    try {
      setIsLoading(true);
      setGeneratedImages([]);
      setShowPanel(false);
      setPanelIndex(0);
      setProgress(10);

      const style = selectedStyle.toLowerCase();
      const res = await api.generateLogo(prompt, style);

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
    <div className="min-h-screen bg-[#e9f4ff] relative overflow-y-auto flex flex-col px-4 sm:px-5 md:px-6 lg:px-8 xl:pl-[96px] pb-[96px] md:pb-8">
      {/* HERO */}
      <div className="text-center pt-24 md:pt-24 xl:pt-20 z-10 px-2 sm:px-4">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-blue-900">
          AI IMAGE GENERATOR
        </h1>
        <p className="text-blue-700 text-xs sm:text-sm mt-1">
          Generate original images with AI
        </p>
      </div>


      {/* MAIN */}
      <div className="flex-1 flex items-start justify-center w-full z-10 pt-6 sm:pt-8">
        <div className="w-full max-w-sm sm:max-w-2xl lg:max-w-5xl xl:max-w-6xl grid grid-cols-1 xl:grid-cols-2 gap-5 lg:gap-6">
          {/* LEFT PANEL */}
          <div className="bg-white border border-blue-700 rounded-xl shadow-md p-4 sm:p-5">
            <label className="text-sm font-semibold text-blue-900">
              Prompt
            </label>

            <textarea
              placeholder="for example: Medusa"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="mt-2 w-full border border-blue-700 rounded-lg p-2.5 h-[84px] resize-none outline-none text-sm text-blue-900"
            />

            {/* EXAMPLE PROMPTS */}
            <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {examplePrompts.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(ex)}
                  className="bg-yellow-300 hover:bg-yellow-400 text-blue-900 text-[11px] sm:text-xs px-3 py-1.5 rounded-full whitespace-nowrap shrink-0"
                >
                  {ex}
                </button>
              ))}
            </div>

            {/* STYLES */}
            <div className="mt-4">
              <p className="text-sm font-semibold text-blue-900 mb-2">
                Styles
              </p>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {styles.map((style) => {
                  const active = selectedStyle === style.name;
                  return (
                    <button
                      key={style.name}
                      onClick={() => setSelectedStyle(style.name)}
                      className={`relative group min-w-[64px] sm:min-w-[68px] rounded-lg overflow-hidden border shrink-0
                        ${active
                          ? "border-yellow-400 ring-2 ring-yellow-400"
                          : "border-blue-700"
                        }`}
                    >
                      <img
                        src={style.img}
                        className="w-full h-[52px] sm:h-[55px] object-cover"
                        alt=""
                      />
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition">
                        {style.name}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* GENERATE */}
            <button
              onClick={handleGenerate}
              disabled={!prompt || !selectedStyle}
              className="w-full mt-4 bg-blue-800 hover:bg-blue-900 text-white py-2.5 rounded-full font-semibold disabled:opacity-40 text-sm sm:text-base"
            >
              Generate
            </button>
          </div>

          {/* RIGHT PANEL */}
          <div className="relative bg-white border border-blue-700 rounded-xl shadow-md p-4 sm:p-5 flex flex-col items-center justify-center min-h-[300px] sm:min-h-[340px] md:min-h-[420px]">
            {!generatedImages.length && !isLoading && (
              <>
                <img
                  src="https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=900"
                  className="absolute inset-0 w-full h-full object-cover opacity-20"
                  alt=""
                />
                <p className="relative text-blue-900 text-sm font-medium">
                  Generated images will appear here
                </p>
              </>
            )}

           {isLoading && (
  <div className="flex flex-col items-center justify-center gap-4">
    <div className="w-16 h-16 rounded-full border-4 border-transparent border-t-blue-700 border-r-yellow-400 animate-spin"></div>
  </div>
)}

            {generatedImages.length > 0 && (
              <>
                <div className="grid w-full grid-cols-2 gap-2 sm:gap-3">
                  {generatedImages.map((img, idx) => {
                    return (
                      <div
                        key={idx}
                        className="relative group rounded-lg overflow-hidden ring-1 ring-blue-700"
                      >
                        <img
                          src={img}
                          className="w-full h-[110px] sm:h-[130px] object-cover"
                          alt=""
                        />
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={openPanel}
                  className="mt-4 bg-blue-800 hover:bg-blue-900 text-white px-5 sm:px-6 py-2 rounded-full text-sm disabled:opacity-40"
                >
                  Open Panel ({generatedImages.length} Images)
                </button>
              </>
            )}
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
