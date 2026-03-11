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

const fadeUp = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: "easeOut" }
  }
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.25 }
  }
};



export default function Dashboard() {
  const navigate = useNavigate();
  const sectionRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"]
  });
  
  const scrollToTools = () => {
    sectionRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  };
  
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -80])

  return (
    <div className="min-h-screen bg-[#f9fafb] overflow-x-hidden">

      {/* HERO SECTION */}
      <motion.section
        className="relative w-full overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1492724441997-5dc865305da7?q=80&w=2000&auto=format&fit=crop"
            alt="hero"
            className="w-full h-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-[#0b1b4a]/80" />

          <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/20 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-10 right-20 w-72 h-72 bg-cyan-400/20 blur-[120px] rounded-full"></div>
        </div>

        <motion.div
          style={{ y: heroY }}
          className="relative z-10 max-w-6xl mx-auto px-6 pt-[140px] pb-[220px] text-center text-white"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.p
            variants={fadeUp}
            className="uppercase tracking-widest text-sm mb-4 opacity-90"
          >
            Designova AI Workspace
          </motion.p>

          <motion.h1
            variants={fadeUp}
            className="text-6xl md:text-7xl font-bold leading-tight font-georgia "
          >
            Create Presentations, Images and Documents with AI
            
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-6 text-lg max-w-2xl mx-auto opacity-90"
          >
            Build professional presentations, edit images, craft documents —
            or let AI generate everything instantly for you.
          </motion.p>
          <button
            onClick={scrollToTools}
            className="mt-8 px-8 py-3 bg-white text-[#0c4a6e] rounded-lg font-semibold hover:scale-105 transition"
          >
            Try AI Tools →
          </button>
        </motion.div>

        <svg
          viewBox="0 0 1440 200"
          className="absolute bottom-0 left-0 w-full"
          preserveAspectRatio="none"
        >
          <path
            fill="#f9fafb"
            d="M0,120 C300,200 500,0 800,80 C1100,160 1300,40 1440,120 L1440,200 L0,200 Z"
          />
        </svg>
      </motion.section>

      {/* FEATURE CARDS */}
      <motion.section
        className="max-w-6xl mx-auto px-6 -mt-25 relative z-20"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <div className="grid md:grid-cols-3 gap-10 justify-items-center">

          {FEATURES.map((feature, i) => {
            const Icon = feature.icon;

            return (
              <motion.div
                key={i}
                variants={fadeUp}
                whileHover={{ scale: 1.05 }}
                className="card"
              >
                <div className="card-content">

                  <div className="card-header">
                    <div className="icon-box">
                      <Icon size={22} />
                    </div>
                    <p className="card-title">{feature.name}</p>
                  </div>
                  <p className="card-para">{feature.desc}</p>

                  {/* CTA BUTTON */}
                  <button
                    onClick={() => navigate(feature.route)}
                    className="mt-3 px-4 py-2 text-sm bg-white text-[#0c4a6e] rounded-lg font-semibold hover:bg-[#e2e8f0] transition"
                  >
                    Try Now →
                  </button>

                </div>
              </motion.div>
            );
          })}

        </div>
      </motion.section>

      {/* ================= EXPLORE AI TOOLS ================= */}

      <section ref={sectionRef} className="relative bg-[#f9fafb]">

        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-34 px-6 py-32">

          {/* LEFT SIDE STICKY */}
          <div className="sticky top-0 h-screen flex items-center justify-center">

            <div className="flex items-center justify-between w-full gap-0 md:gap-10">

              {/* TEXT AREA */}
              <div className="max-w-lg ">

                <p className="text-[#0c4a6e] text-sm font-semibold mb-3 tracking-wide">
                  Your Needs, Our Solution
                </p>

                <h2 className="text-6xl font-extrabold leading-tight text-[#0c4a6e]">
                  Explore Powerful <br />
                  AI Tools
                </h2>

                <p className="text-slate-600 mt-5 mb-8">
                  Create presentations, generate images and write documents
                  faster with our AI powered workspace.
                </p>

              </div>

              {/* ILLUSTRATION */}
              <motion.img
                src={homepageImage}
                alt="hand illustration"
                className="w-64"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              />

            </div>

          </div>


          {/* RIGHT SIDE SCROLLING CARDS */}
          <div className="space-y-10">

            {TOOLS.map((tool, i) => {

              const Icon = tool.icon;

              return (

                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 80 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.6 }}
                  whileHover={{
                    scale: 1.05,
                    rotateX: 4,
                    rotateY: -4
                  }}
                  className="bg-white p-8 rounded-2xl shadow-md border border-slate-200"
                >

                  <div className="flex items-start gap-5 ">

                    <div className="w-12 h-12 bg-[#0c4a6e] text-white rounded-lg flex items-center justify-center ">
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
                        className="text-sm font-medium text-[#0c4a6e]"
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

      </section>


      

      {/* TEMPLATE SECTION */}
      <motion.section className="max-w-6xl mx-auto px-6  pb-24">

        <motion.h2 className="text-3xl font-bold mb-12 text-center">
          Ready-to-Use Templates
        </motion.h2>

        <motion.div className="grid md:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.05 }}
              className="relative bg-white rounded-2xl overflow-hidden shadow-md border"
            >
              <img
                src={`https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=800&auto=format&fit=crop&sig=${i}`}
                alt="template"
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
        </motion.div>

      </motion.section>

      {/* CARD STYLES */}
      <style>{`
        .card{
  width:350px;
  height:200px;
  background:linear-gradient(135deg,#0c4a6ecc,#1e40afcc,#0ea5e9cc);
  border-radius:14px;
  color:white;
  overflow:hidden;
  position:relative;
  transform-style:preserve-3d;
  perspective:1000px;
  transition:all .5s cubic-bezier(.23,1,.32,1);
  cursor:pointer;
  padding:20px;
  border:none;
}


.card-header{
  display:flex;
  align-items:center;
  gap:14px;
}

.icon-box{
  width:38px;
  height:38px;
  border-radius:8px;
  background:rgba(255,255,255,0.2);
  display:flex;
  align-items:center;
  justify-content:center;
}
        .card-content{
  position:relative;
  z-index:2;
  display:flex;
  flex-direction:column;
  gap:12px;
  align-items:flex-start;
  justify-content:space-between;
  text-align:left;
  height:100%;
}

        .card-title{
  font-size:18px;
  font-weight:700;
  margin-top:2px;
}

        .card-para{
  font-size:13px;
  opacity:.9;
  line-height:1.4;
}

        .card:hover{
          transform:rotateY(10deg) rotateX(10deg) scale(1.05);  
        }

        .card:before,
        .card:after{
          content:"";
          position:absolute;
          top:0;
          width:100%;
          height:100%;
          background:linear-gradient(transparent,rgba(0,0,0,0.15));
          transition:transform .5s cubic-bezier(.23,1,.32,1);
        }

        .card:before{ left:0; }
        .card:after{ right:0; }

        .card:hover:before{ transform:translateX(-100%); }
        .card:hover:after{ transform:translateX(100%); }
      `}</style>

    </div>
  );
}
