import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

/* FEATURES WITH REAL UNSPLASH IMAGES */
const FEATURES = [
  {
    title: "Create AI Presentations",
    desc: "Generate slides instantly",
    route: "/presentation",
    img: "https://images.unsplash.com/photo-1557804506-669a67965ba0",
  },
  {
    title: "Design Stunning Images",
    desc: "Create social media visuals",
    route: "/canva-clone",
    img: "https://images.unsplash.com/photo-1519389950473-47ba0277781c",
  },
  {
    title: "Write Documents Easily",
    desc: "Create notes & reports",
    route: "/editor",
    img: "https://images.unsplash.com/photo-1455390582262-044cdead277a",
  },
  {
    title: "Generate AI Graphics",
    desc: "Create images using AI",
    route: "/canva-clone",
    img: "https://images.unsplash.com/photo-1504639725590-34d0984388bd",
  },
  {
    title: "Build Smart Slides",
    desc: "Automated presentation maker",
    route: "/presentation",
    img: "https://images.unsplash.com/photo-1531496730074-83b638c0a7ac",
  },
  {
    title: "Generate AI Content",
    desc: "Reports & writing assistant",
    route: "/editor",
    img: "https://images.unsplash.com/photo-1499750310107-5fef28a66643",
  },
];

const AISuggestTemp = () => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(
    window.innerWidth < 768 ? 1 : 5
  );

  useEffect(() => {
    const handleResize = () => {
      setVisible(window.innerWidth < 768 ? 1 : 5);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const autoRef = useRef();
  const transitionRef = useRef(true);
  const sliderRef = useRef(null);
  const offsetRef = useRef(0);


  /* CLONE SETUP FOR TRUE INFINITE */
  const clones = [
    ...FEATURES.slice(-visible),
    ...FEATURES,
    ...FEATURES.slice(0, visible),
  ];

  const [index, setIndex] = useState(visible);

  useEffect(() => {
    setIndex(visible);
  }, [visible]);

  const [hover, setHover] = useState(false);


  /* AUTO SCROLL */
  useEffect(() => {
    if (hover) return;

    autoRef.current = setInterval(() => {
      setIndex((prev) => prev + 1);
    }, 2500);

    return () => clearInterval(autoRef.current);
  }, [hover]);





  /* TRUE LOOP RESET (NO JUMP) */
  useEffect(() => {
    if (index === FEATURES.length + visible) {
      transitionRef.current = false;
      setIndex(visible);
    }

    if (index === visible - 1) {
      transitionRef.current = false;
      setIndex(FEATURES.length + visible - 1);
    }
  }, [index]);


  /* ENABLE TRANSITION AGAIN */
  useEffect(() => {
    const t = setTimeout(() => {
      transitionRef.current = true;
    }, 50);
    return () => clearTimeout(t);
  }, [index]);

  return (
    <section className="py-20" >
      <div className="max-w-7xl mx-auto px-6">

        <h2
          className="text-4xl font-bold text-center mb-12 bg-clip-text text-transparent"
          style={{
            backgroundImage:
             "linear-gradient(135deg,#1e40af 0%,#3b82f6 50%,#60a5fa 100%)",
          }}
        >
          What would you like to create?
        </h2>


        <div
          className="relative"
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
        >
          {/* ARROWS */}
          <button
            onClick={() => {
              transitionRef.current = true;
              setIndex((i) => i - 1);
            }}
            className="absolute left-0 hidden md:block  top-1/2 -translate-y-1/2 z-20 bg-white shadow p-3 rounded-full"
          >
            <FiChevronLeft />
          </button>

          <button
            onClick={() => {
              transitionRef.current = true;
              setIndex((i) => i + 1);
            }}

            className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white shadow p-3 rounded-full"
          >
            <FiChevronRight />
          </button>

          {/* CAROUSEL */}
          <div className="overflow-hidden">
            <div
              ref={sliderRef}
              onTransitionEnd={() => {
                if (index === clones.length - visible) {
                  transitionRef.current = false;
                  setIndex(visible);
                }

                if (index === 0) {
                  transitionRef.current = false;
                  setIndex(FEATURES.length);
                }
              }}
              className="flex "
              style={{
                transition: transitionRef.current ? "transform 0.5s ease" : "none",
                transform: `translateX(-${index * (100 / visible)}%)`,
              }}
            >
              {clones.map((item, i) => (
                <div
                  key={i}
                  style={{ width: `${100 / visible}%`, padding: "0 12px" }}
                  className="flex-shrink-0"
                >
                  {/* CARD */}
                  <div
                    onClick={() => navigate(item.route)}
                    className="group relative h-[260px] rounded-2xl overflow-hidden cursor-pointer shadow-lg"
                  >
                    {/* IMAGE */}
                    <img
                      src={item.img}
                      className="w-full h-full object-cover transition duration-500 group-hover:scale-110"
                    />

                    {/* DARK OVERLAY */}
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition" />

                    {/* BLUR BG ON HOVER */}
                    <div className="absolute inset-0 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition" />

                    {/* CONTENT */}
                    <div className="absolute bottom-0 p-6 text-white">
                      <h3 className="text-lg font-semibold mb-2">
                        {item.title}
                      </h3>

                      <p className="text-sm opacity-80">
                        {item.desc}
                      </p>

                      {/* CTA */}
                      <button
                        className="mt-4 opacity-0 group-hover:opacity-100 transition
                        bg-[#fabf23] text-black px-4 py-2 rounded-lg font-semibold text-sm"
                      >
                        Get Started →
                      </button>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default AISuggestTemp;