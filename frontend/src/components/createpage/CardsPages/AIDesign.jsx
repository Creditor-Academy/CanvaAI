import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";

export const AIDesign = () => {
  const navigate = useNavigate();

  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [activePreview, setActivePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const styles = [
    { name: "Realistic", img: "https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=200" },
    { name: "Anime", img: "https://images.unsplash.com/photo-1627667661797-d113e31a3e6f?w=200" },
    { name: "Cartoon", img: "https://images.unsplash.com/photo-1673328021673-17902775371d?w=200" },
    { name: "Sketch", img: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=200" },
    { name: "Painting", img: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=200" },
  ];

  const examplePrompts = [
    "Futuristic neon city",
    "Minimalist mountain logo",
    "Cyberpunk samurai portrait",
    "Luxury gold emblem",
    "Cartoon astronaut mascot",
  ];

  const mockImages = [
    "https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=600",
    "https://images.unsplash.com/photo-1611521448635-a3a774ee7c7d?w=600",
    "https://images.unsplash.com/photo-1627667661797-d113e31a3e6f?w=600",
    "https://images.unsplash.com/photo-1690037704521-f614da226dac?w=600",
  ];

  useEffect(() => {
    if (!isLoading) return;

    setProgress(0);

    const timer = setInterval(() => {
      setProgress((p) => (p < 95 ? p + Math.random() * 6 : p));
    }, 200);

    return () => clearInterval(timer);
  }, [isLoading]);

  const handleGenerate = () => {
    if (!prompt.trim() || !selectedStyle) return;

    setIsLoading(true);
    setGeneratedImages([]);
    setSelectedImages([]);

    setTimeout(() => {
      setProgress(100);
      setGeneratedImages(mockImages);
      setTimeout(() => setIsLoading(false), 400);
    }, 2300);
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
    <div className="h-screen bg-[#e9f4ff] relative overflow-hidden flex flex-col">

     

      {/* HERO */}
      <div className="text-center pt-30 z-10 pl-10">
        <h1 className="text-4xl font-bold text-blue-900">
          AI IMAGE GENERATOR
        </h1>
        <p className="text-blue-700 text-sm mt-1">
          Generate original images with AI
        </p>
      </div>

      {/* MAIN */}
      <div className="flex-1 flex items-center justify-center pl-10 z-10">

        <div className="w-full max-w-6xl grid md:grid-cols-2 gap-6">

          {/* LEFT PANEL */}
          <div className="bg-white border border-blue-700 rounded-xl shadow-md p-5">

            <label className="text-sm font-semibold text-blue-900">
              Prompt
            </label>

            <textarea
              placeholder="for example: Medusa"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="mt-2 w-full border border-blue-700 rounded-lg p-2 h-[80px] resize-none outline-none text-blue-900"
            />

            {/* EXAMPLE PROMPTS */}
            <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">

              {examplePrompts.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(ex)}
                  className="bg-yellow-300 hover:bg-yellow-400 text-blue-900 text-xs px-3 py-1 rounded-full whitespace-nowrap"
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

              <div className="flex gap-2 overflow-x-auto no-scrollbar">

                {styles.map((style) => {

                  const active = selectedStyle === style.name;

                  return (
                    <button
                      key={style.name}
                      onClick={() => setSelectedStyle(style.name)}
                      className={`relative group min-w-[60px] rounded-lg overflow-hidden border
                        ${active
                          ? "border-yellow-400 ring-2 ring-yellow-400"
                          : "border-blue-700"
                        }`}
                    >

                      <img
                        src={style.img}
                        className="w-full h-[55px] object-cover"
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
              className="w-full mt-4 bg-blue-800 hover:bg-blue-900 text-white py-2.5 rounded-full font-semibold disabled:opacity-40"
            >
              Generate
            </button>

          </div>

          {/* RIGHT PANEL */}
          <div className="relative bg-white border border-blue-700 rounded-xl shadow-md p-5 flex flex-col items-center justify-center">

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
              <div className="w-[360px] max-w-full text-center">

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

            {generatedImages.length > 0 && !isLoading && (

              <>
                <div className="grid grid-cols-2 gap-3">

                  {generatedImages.map((img, idx) => {

                    const selected = selectedImages.includes(img);

                    return (
                      <div
                        key={idx}
                        onClick={() => toggleImageSelection(img)}
                        className={`relative rounded-lg overflow-hidden cursor-pointer
                          ${selected
                            ? "ring-4 ring-yellow-400"
                            : "ring-1 ring-blue-700"
                          }`}
                      >

                        <img
                          src={img}
                          className="w-full h-[130px] object-cover"
                          alt=""
                        />

                        {!selected && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition">

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActivePreview(img);
                              }}
                              className="bg-white px-3 py-1 rounded-full text-xs"
                            >
                              Preview
                            </button>

                          </div>
                        )}

                      </div>
                    );
                  })}

                </div>

                <button
                  onClick={handleImport}
                  disabled={!selectedImages.length}
                  className="mt-4 bg-blue-800 hover:bg-blue-900 text-white px-6 py-2 rounded-full text-sm disabled:opacity-40"
                >
                  Import Selected ({selectedImages.length})
                </button>

              </>
            )}

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

        </div>

      </div>

      {/* MODAL */}
      {activePreview &&
        createPortal(
          <div className="fixed inset-0 backdrop-blur-md bg-black/40 flex items-center justify-center z-[999]">

            <button
              onClick={() => setActivePreview(null)}
              className="absolute top-6 right-8 text-white text-3xl"
            >
              ✕
            </button>

            <div className="text-center">

              <img
                src={activePreview}
                className="max-h-[85vh] rounded-xl"
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