import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { HiOutlinePresentationChartLine } from "react-icons/hi2";
import { IoDocumentTextOutline } from "react-icons/io5";
import { CiImageOn } from "react-icons/ci";
import homepageImage from "../../assets/homepage.png";

const FEATURES = [
  {
    name: "Presentation Builder",
    icon: HiOutlinePresentationChartLine,
    route: "/presentation",
    desc: "Generate stunning presentation slides instantly with our Presentation Builder.",
    image: "https://images.unsplash.com/photo-1573167507387-6b4b98cb7c13?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NTl8fHByZXNlbnRhdGlvbnxlbnwwfHwwfHx8MA%3D%3D"
  },
  {
    name: "Image Editor",
    icon: CiImageOn,
    route: "/canva-clone",
    desc: "Create and enhance visuals using powerful Image Editor tools.",
    image: "https://images.unsplash.com/photo-1575936123452-b67c3203c357?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8aW1hZ2V8ZW58MHx8MHx8fDA%3D"
  },
  {
    name: "Document Workspace",
    icon: IoDocumentTextOutline,
    route: "/editor",
    desc: "Write professional documents faster with our Document Workspace.",
    image: "https://images.unsplash.com/photo-1635859890085-ec8cb5466806?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
  }
];

const TOOLS = [
  {
    name: "AI-Presentation Builder",
    icon: HiOutlinePresentationChartLine,
    route: "/ai-presentation",
    desc: "Design AI-powered presentations with smart layouts and instant content generation."
  },
  {
    name: "AI-Image Editor",
    icon: CiImageOn,
    route: "/create/ai-design",
    desc: "Enhance, edit and generate stunning visuals using advanced AI tools."
  },
  {
    name: "AI-Document Workspace",
    icon: IoDocumentTextOutline,
    route: "/create/content-writer",
    desc: "Create professional documents faster with intelligent AI writing assistance."
  }
];

export default function Dashboard() {

  const navigate = useNavigate();
  const sectionRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"]
  });

  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -80]);

  const scrollToTools = () => {
    sectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (

    <div className="min-h-screen bg-[#f9fafb] overflow-x-hidden">

      {/* HERO SECTION */}

      <motion.section
        className="relative w-full py-12 px-6"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: false }}
        transition={{ duration: 1 }}
      >

        <div className="absolute inset-0 -z-10 " />

        <div className="max-w-7xl -mt-10 h-[280px] rounded-2xl overflow-hidden shadow-xl relative">

          <div className="absolute inset-0">

            <img
              src="https://i.pinimg.com/1200x/4c/49/cc/4c49cc9b0f4cb6764c38815faa5f567c.jpg"
              alt="hero"
              className="w-full h-full object-cover "
            />

            <div className="absolute inset-0 " />

          </div>

          <motion.div
            style={{ y: heroY }}
            className="relative z-10 text-center text-black px-6 pt-[20px] pb-[20px]"
          >

            <p className="uppercase tracking-widest text-sm mb-4 opacity-90">
              Designova AI Workspace
            </p>

            <h1 className="md:text-[38px] font-bold leading-tight">
              Create Presentations, Images and <br />
              Documents with AI
            </h1>

            <button
              onClick={scrollToTools}
              className="mt-8 px-8 py-3 bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 text-[#0c4a6e] rounded-lg font-semibold
              hover:scale-105 hover:shadow-xl hover:shadow-blue-300/40 transition"
            >
              Try AI Tools →
            </button>

          </motion.div>

        </div>

      </motion.section>


      {/* FEATURES */}



      {/* FEATURES */}

      <section className="max-w-6xl mx-auto px-6 py-24">

        <div className="text-center mb-16">

          <h2 className="text-4xl font-bold text-[#0c4a6e]">
            Our Features
          </h2>

          <p className="text-slate-600 mt-4 max-w-2xl mx-auto">
            Build presentations, design images and create documents faster with
            intelligent AI powered tools.
          </p>

        </div>


        <div className="grid md:grid-cols-3 gap-10">

          {FEATURES.map((feature, i) => {

            const Icon = feature.icon;

            return (

              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -8 }}
                transition={{ duration: 0.35 }}
                className="bg-gradient-to-b from-[#eef5ff] to-white
          rounded-3xl shadow-xl overflow-hidden"
              >

                {/* Top Image Area */}

                <div className="relative h-44  flex items-center justify-center">

                  <div className="relative h-40 w-80 overflow-hidden rounded-3xl mt-4">

                    <img
                      src={feature.image}
                      alt={feature.name}
                      className="w-full h-full object-cover"
                    />

                    {/* soft overlay like reference image */}

                    <div className="absolute inset-0 bg-gradient-to-r from-white/60 via-transparent to-transparent"></div>

                  </div>

                  {/* Floating Circle Button */}

                  <div className="absolute -bottom-6 right-6 w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center">

                    <div className="w-10 h-10 rounded-full bg-[#2563eb] flex items-center justify-center text-white">
                      <Icon size={18} />
                    </div>

                  </div>

                </div>


                {/* Content */}

                <div className="pt-10 pb-8 px-8">

                  <h3 className="text-xl font-semibold text-[#0c4a6e] mb-3">
                    {feature.name}
                  </h3>

                  <p className="text-slate-600 text-sm mb-6">
                    {feature.desc}
                  </p>

                  <button
                    onClick={() => navigate(feature.route)}
                    className="
              bg-[#e6f7ff]
              text-black
              rounded-full
              px-5 py-[7px]
              text-sm
              font-medium
              transition-all
              duration-300
              shadow-[inset_0_-20px_15px_-14px_rgba(56,189,248,0.18),0_1px_2px_rgba(56,189,248,0.12),0_2px_4px_rgba(56,189,248,0.12)]
              hover:scale-105
              hover:-rotate-1
              "
                  >
                    Open Tool →
                  </button>

                </div>

              </motion.div>

            )

          })}

        </div>

      </section>


      {/* AI TOOLS */}

      <section ref={sectionRef} className="relative bg-gradient-to-b from-blue-90 via-blue-100 to-[#0b1b4a]/60 -mt-5">

        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-34 px-6 py-32">

          <div className="sticky top-0 h-screen flex items-center">

            <div className="flex items-center gap-12">

              <div className="max-w-lg">

                <p className="text-[#0c4a6e] text-sm font-semibold mb-3">
                  Your Needs, Our Solution
                </p>

                <h2 className="text-6xl font-extrabold text-[#0c4a6e]">
                  Explore Powerful <br />
                  AI Tools
                </h2>

                <p className="text-slate-600 mt-5 mb-8">
                  Create presentations, generate images and write documents
                  faster with our AI powered workspace.
                </p>

              </div>

              <motion.img
                src={homepageImage}
                className="w-64"
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              />

            </div>

          </div>


          <div className="space-y-10">

            {TOOLS.map((tool, i) => {

              const Icon = tool.icon;

              return (

                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 80 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false }}
                  whileHover={{
                    scale: 1.05,
                    rotateX: 5,
                    rotateY: -5
                  }}
                  className="bg-white p-8 rounded-2xl border border-slate-200
                  shadow-md hover:shadow-xl transition"
                >

                  <div className="flex items-start gap-5">

                    <div className="w-12 h-12 bg-[#0c4a6e] text-white rounded-lg flex items-center justify-center">
                      <Icon size={22} />
                    </div>

                    <div>

                      <h3 className="text-xl font-semibold mb-2">
                        {tool.name}
                      </h3>

                      <p className="text-slate-600 text-sm mb-4">
                        {tool.desc}
                      </p>

                      <button
                        onClick={() => navigate(tool.route)}
                        className="text-sm font-medium text-[#0c4a6e] hover:underline"
                      >
                        Open Tool →
                      </button>

                    </div>

                  </div>

                </motion.div>

              )

            })}

          </div>

        </div>

        <svg className="absolute bottom-0 left-0 w-full rotate-180 -mb-1" viewBox="0 0 1440 100">
          <path fill="#f9fafb" d="M0,40 C360,120 1080,0 1440,80 L1440,0 L0,0 Z" />
        </svg>

      </section>


      {/* TEMPLATE SECTION */}

      <motion.section className="max-w-6xl mx-auto px-6 pb-24">

        <h2 className="text-3xl font-bold mb-12 text-center">
          Ready-to-Use Templates
        </h2>

        <div className="grid md:grid-cols-3 gap-8">

          {[1, 2, 3, 4, 5, 6].map((i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.05 }}
              className="relative bg-white rounded-2xl overflow-hidden shadow-md border"
            >

              <img
                src={`https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=800&auto=format&fit=crop&sig=${i}`}
                className="h-52 w-full object-cover"
              />

              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition flex items-center justify-center text-white font-semibold">
                Use Template
              </div>

              <div className="p-5">
                <p className="font-semibold">Template {i}</p>
                <p className="text-sm mt-1">
                  Fully customizable professional layout.
                </p>
              </div>

            </motion.div>
          ))}

        </div>

      </motion.section>

    </div>

  );

}