import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import api from "../../../services/api";


export const AIDesign = () => {
  const navigate = useNavigate();


  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [activePreview, setActivePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showBalancePopup, setShowBalancePopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  const styles = [
    { name: "Realistic", img: "https://i.pinimg.com/736x/19/b2/74/19b274d1f2cf1c2fc90a111c1093eb94.jpg" },
    { name: "Anime", img: "https://i.pinimg.com/736x/58/19/d2/5819d2ed10ee0f8142341f08aa928cd3.jpg" },
    { name: "Cartoon", img: "https://i.pinimg.com/736x/42/62/67/426267b169ac8c49155ee9abc071ae3e.jpg" },
    { name: "Sketch", img: "https://i.pinimg.com/avif/736x/89/5c/93/895c931f7182dbc68efa4ee87254fc81.avf" },
    { name: "Painting", img: "https://i.pinimg.com/1200x/e4/47/93/e44793bcfda653dd605c105308cf3a1a.jpg" },
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
      setSelectedImages([]);
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
        setSelectedImages([]);
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

  const toggleImageSelection = (img) => {
    setSelectedImages((prev) =>
      prev.includes(img)
        ? prev.filter((i) => i !== img)
        : [...prev, img]
    );
  };


  const handleImport = () => {
    alert(`Importing ${selectedImages.length} images`);
  };


  const openEditor = () => {
    navigate("/edito", { state: { image: activePreview } });
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
              <div className="w-full max-w-[360px] text-center">
                <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-2 text-blue-900 font-semibold text-sm">
                  {Math.floor(progress)}% Generating images
                </p>
              </div>
            )}

            {generatedImages.length > 0 && (
              <>
                <div className="grid w-full grid-cols-2 gap-2 sm:gap-3">
                  {generatedImages.map((img, idx) => {
                    const selected = selectedImages.includes(img);
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleImageSelection(img)}
                        className={`relative group rounded-lg overflow-hidden cursor-pointer
                          ${selected
                            ? "ring-4 ring-yellow-400"
                            : "ring-1 ring-blue-700"
                          }`}
                      >
                        <img
                          src={img}
                          className="w-full h-[110px] sm:h-[130px] object-cover"
                          alt=""
                        />
                        {!selected && (
                          <>
                            {/* Desktop hover overlay */}
                            <div className="absolute inset-0 hidden sm:flex bg-black/35 items-center justify-center opacity-0 group-hover:opacity-100 transition">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActivePreview(img);
                                }}
                                className="bg-white px-3 py-1 rounded-full text-xs font-medium text-slate-800 shadow-sm"
                              >
                                Preview
                              </button>
                            </div>
                            {/* Mobile bottom chip */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActivePreview(img);
                              }}
                              className="absolute bottom-2 right-2 sm:hidden bg-white/95 backdrop-blur px-3 py-1 rounded-full text-[11px] font-medium text-slate-800 shadow-md border border-slate-200"
                            >
                              Preview
                            </button>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={handleImport}
                  disabled={!selectedImages.length}
                  className="mt-4 bg-blue-800 hover:bg-blue-900 text-white px-5 sm:px-6 py-2 rounded-full text-sm disabled:opacity-40"
                >
                  Import Selected ({selectedImages.length})
                </button>
              </>
            )}
          </div>
        </div>
      </div>


      {/* MODAL */}
      {activePreview &&
        createPortal(
          <div className="fixed inset-0 backdrop-blur-md bg-black/40 flex items-center justify-center z-[999]">
            <button
              onClick={() => setActivePreview(null)}
              className="absolute top-4 right-4 sm:top-6 sm:right-8 text-white text-2xl sm:text-3xl"
            >
              ✕
            </button>


            <div className="text-center">
              <img
                src={activePreview}
                className="max-h-[75vh] sm:max-h-[85vh] max-w-[92vw] rounded-xl"
                alt=""
              />
              <div className="flex gap-6 justify-center mt-6">
                <button
                  onClick={openEditor}
                  className="bg-blue-800 text-white px-6 py-2 rounded-lg"
                >
                  Open In Editor
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
