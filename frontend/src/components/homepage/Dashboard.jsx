import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { HiOutlinePresentationChartLine } from "react-icons/hi2";
import { IoDocument } from "react-icons/io5";
import { CiImageOn } from "react-icons/ci";
import homepageImage from "../../assets/homepage.png";

const FEATURES = [
  {
    name: "Presentation Builder",
    icon: HiOutlinePresentationChartLine,
    route: "/presentation",
    desc: "Generate stunning presentation slides instantly with our Presentation Builder."
  },
  {
    name: "Image Editor",
    icon: CiImageOn,
    route: "/canva-clone",
    desc: "Create and enhance visuals using powerful Image Editor tools."
  },
  {
    name: "Document Workspace",
    icon: IoDocument,
    route: "/editor",
    desc: "Write professional documents faster with our Document Workspace."
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
    icon: IoDocument,
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
        className="relative w-full py-16 px-6"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: false }}
        transition={{ duration: 1 }}
      >

        <div className="absolute inset-0 -z-10 " />

        <div className="max-w-7xl -mt-10 h-[480px] rounded-2xl overflow-hidden shadow-xl relative">

          <div className="absolute inset-0">

            <img
              src="https://i.pinimg.com/736x/79/b4/d4/79b4d4c366baaa4ff87cc0b4786ee91e.jpg"
              alt="hero"
              className="w-full h-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-[#0b1b4a]/80" />

          </div>

          <motion.div
            style={{ y: heroY }}
            className="relative z-10 text-center text-white px-6 pt-[80px] pb-[180px]"
          >

            <p className="uppercase tracking-widest text-sm mb-4 opacity-90">
              Designova AI Workspace
            </p>

            <h1 className="md:text-[38px] font-bold leading-tight">
              Create Presentations, Images and <br />
              Documents with AI
            </h1>

            <p className="mt-6 text-lg max-w-2xl mx-auto opacity-90">
              Build professional presentations, edit images, craft documents —
              or let AI generate everything instantly for you.
            </p>

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

     <section className="max-w-6xl mx-auto -mt-12 px-24 py-20">

  <div className="text-center mb-14">

    <h2 className="text-4xl font-bold text-black">
      Powerful Features
    </h2>

    <p className="text-slate-600 mt-4 max-w-2xl mx-auto">
      Build presentations, design images and create documents faster with
      intelligent AI powered tools.
    </p>

  </div>


  <div className="grid md:grid-cols-3 gap-8 mt-14">

    {FEATURES.map((feature, i) => {

  const Icon = feature.icon;

  return (

    <motion.div
      key={i}
      onClick={() => navigate(feature.route)}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ x: -3, y: -3 }}
      transition={{ duration: 0.2 }}
      viewport={{ once: false }}
      className="w-[300px] rounded-xl overflow-hidden
      border-2 border-black/40
      shadow-[4px_4px_0px_#000000B3]
      bg-[#f8fbff]
      cursor-pointer
      hover:shadow-[6px_6px_0px_#000000B3]
      transition-all"
    >

      {/* HEADER */}

      <div className="bg-gradient-to-r from-[#fefff7] via-[#fdffed] to-[#fcffcc] px-6 py-6">

        <div className="flex justify-between items-center mb-4">

          <div className="text-[#0c4a6e]">
            <Icon size={26} />
          </div>

          <div className="bg-yellow-200 text-[#0c4a6e] px-3 py-1 rounded-full text-xs font-semibold">
            Tool
          </div>

        </div>

        <h3 className="text-xl font-bold text-[#0c4a6e] mb-1">
          {feature.name}
        </h3>

        <p className="text-sm text-slate-600">
          Designova Feature
        </p>

      </div>


      {/* CONTENT */}

      <div className="bg-white px-6 py-6">

        <p className="text-sm text-slate-600 text-center">
          {feature.desc}
        </p>

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

              {/* TEXT */}

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


              {/* IMAGE */}

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

        <svg className="absolute bottom-0 left-0 w-full rotate-180 -mb-2" viewBox="0 0 1440 100">
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