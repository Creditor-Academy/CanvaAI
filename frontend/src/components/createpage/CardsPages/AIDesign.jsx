import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import api from "../../../services/api";
import { toast } from "sonner";
import { RiAiGenerate2 } from "react-icons/ri";

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

    if (!prompt.trim()) {
      toast.error("Please give some prompt to generate image");
      return;
    }
    if (!selectedStyle) {
      toast.error("Please select a style");
      return;
    }
    if (!selectedSize) {
      toast.error("Please select a size");
      return;
    }

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
        toast.error(message);
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
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-2xl">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            AI Image Generator
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Generate AI images with different styles and formats
          </p>
        </div>
      </div>

      {/* Main Layout */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Panel */}
          <div className="lg:col-span-1 space-y-4">

            {/* Prompt */}
            <div className="bg-white rounded-2xl p-4">
              <textarea
                placeholder="Describe your image..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className={`w-full h-24 rounded-xl p-3 outline-none resize-none text-sm border transition
                ${submitAttempted && !isPromptValid
                    ? "border-red-400"
                    : "border-gray-200 focus:border-black"
                  }
              `}
              />

              <div className="mt-4">
                <p className="text-xs font-medium text-gray-500 mb-2">
                  Example Prompts
                </p>

                <div className="flex flex-wrap gap-2">
                  {examplePrompts.slice(0, 3).map((ex, i) => (
                    <button
                      key={i}
                      onClick={() => setPrompt(ex)}
                      className="text-xs rounded-sm px-3 py-1 hover:bg-gray-100"
                    >
                      {ex.length > 25
                        ? ex.substring(0, 25) + "..."
                        : ex}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Styles */}
            <div className="bg-white rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold">Styles</h2>

                {selectedStyle && (
                  <span className="text-[10px] bg-black text-white px-2 py-0.5 rounded-full">
                    {selectedStyle}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {styles.map((style) => {
                  const active = selectedStyle === style.name;

                  return (
                    <button
                      key={style.name}
                      onClick={() => setSelectedStyle(style.name)}
                      className={`rounded-xl overflow-hidden border transition
                      ${active
                          ? "border-black ring-1 ring-black"
                          : "border-gray-200"
                        }
                    `}
                    >
                      <img
                        src={style.img}
                        alt={style.name}
                        className="w-full h-14 object-cover"
                      />

                      <div className="py-1.5 text-[10px] font-bold bg-white">
                        {style.name}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sizes */}
            <div className="bg-white rounded-2xl p-4">
              <h2 className="text-sm font-bold mb-3">Image Size</h2>

              <div className="grid grid-cols-3 gap-2">
                {sizes.map((size) => {
                  const active = selectedSize === size.value;

                  return (
                    <button
                      key={size.value}
                      onClick={() => setSelectedSize(size.value)}
                      className={`rounded-xl border p-2 text-center transition
                      ${active
                          ? "bg-black text-white border-black"
                          : "border-gray-200 hover:bg-gray-100"
                        }
                    `}
                    >
                      <div
                        className={`mx-auto mb-1.5 border-2
                        ${active
                            ? "border-white"
                            : "border-gray-400"
                          }
                        ${size.value === "square"
                            ? "w-4 h-4"
                            : size.value === "portrait"
                              ? "w-3 h-5"
                              : "w-6 h-3"
                          }
                      `}
                      />


                      <p className="text-[10px] font-bold">
                        {size.name}
                      </p>
                      <p className={`text-[9px] mt-0.5 ${active ? "text-gray-300" : "text-gray-400"}`}>
                        {SIZE_MAP[size.value]}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="w-full bg-black hover:bg-gray-800 text-white py-3 rounded-2xl font-bold text-sm transition disabled:opacity-50"
            >
              {isLoading ? "Generating..." : "Generate Image"}
            </button>
          </div>

          {/* Right Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl min-h-[600px] p-6">

              {/* Loading */}
              {isLoading && (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>

                  <p className="mt-4 font-medium">
                    Generating image...
                  </p>

                  <div className="w-64 h-2 bg-gray-200 rounded-full mt-4 overflow-hidden">
                    <div
                      className="h-full bg-black transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <p className="text-sm text-gray-500 mt-2">
                    {Math.round(progress)}%
                  </p>
                </div>
              )}

              {/* Empty State */}
              {!generatedImages.length && !isLoading && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <RiAiGenerate2 className="text-3xl" color='blue' />
                  </div>

                  <h3 className="text-lg font-semibold">
                    <p>
                      Enter a prompt, choose style
                    </p>
                    <p>
                      and size,  then generate your AI image.
                    </p>
                  </h3>
                  {/* 
                  <p className="text-sm text-gray-500 mt-2 max-w-sm">
                    Enter a prompt, choose style and size, then generate your AI image.
                  </p> */}
                </div>
              )}

              {/* Images */}
              {generatedImages.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {generatedImages.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setPanelIndex(idx);
                        setShowPanel(true);
                      }}
                      className="relative rounded-2xl overflow-hidden border cursor-pointer group"
                    >
                      <img
                        src={img}
                        alt=""
                        className="w-full aspect-square object-cover"
                      />

                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 text-white text-sm font-medium transition">
                          Preview
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Fullscreen Modal */}
      {showPanel &&
        generatedImages.length > 0 &&
        createPortal(
          <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4">
            <button
              onClick={() => setShowPanel(false)}
              className="absolute top-5 right-5 text-white text-3xl"
            >
              ×
            </button>

            <div className="max-w-5xl w-full flex flex-col items-center">
              <img
                src={generatedImages[panelIndex]}
                alt=""
                className="max-h-[75vh] rounded-2xl"
              />

              <div className="flex flex-wrap items-center gap-3 mt-6">

                {["png", "jpg", "webp"].map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setDownloadFormat(fmt)}
                    className={`px-4 py-2 rounded-lg text-sm
                    ${downloadFormat === fmt
                        ? "bg-white text-black"
                        : "bg-white/10 text-white"
                      }
                  `}
                  >
                    {fmt}
                  </button>
                ))}

                <button
                  onClick={() =>
                    handleDownload(generatedImages[panelIndex])
                  }
                  disabled={isDownloading}
                  className="bg-white text-black px-5 py-2 rounded-lg font-medium"
                >
                  {isDownloading
                    ? "Downloading..."
                    : "Download"}
                </button>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={goPrev}
                  className="bg-white/10 text-white px-5 py-2 rounded-lg"
                >
                  Prev
                </button>

                <button
                  onClick={goNext}
                  className="bg-white/10 text-white px-5 py-2 rounded-lg"
                >
                  Next
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Balance Popup */}
      {showBalancePopup &&
        createPortal(
          <div className="fixed inset-0 bg-black/60 z-[10000] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 mx-auto flex items-center justify-center mb-4">
                <span className="text-red-600 text-2xl">!</span>
              </div>

              <h2 className="text-xl font-bold mb-2">
                Not Enough Balance
              </h2>

              <p className="text-gray-500 text-sm mb-6">
                {popupMessage}
              </p>

              <button
                onClick={() => setShowBalancePopup(false)}
                className="bg-black text-white px-5 py-3 rounded-xl w-full"
              >
                Close
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );


};

export default AIDesign;
