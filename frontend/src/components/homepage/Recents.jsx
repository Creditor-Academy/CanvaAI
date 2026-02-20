import React, { useState, useEffect } from "react";
import {
  FiImage,
  FiFileText,
  FiLayout,
} from "react-icons/fi";

/* ===== BRAND COLORS ===== */
const COLORS = {
  deepBlue: "#1d3fAf",
  Grey: "#455469",
  navyText: "#0c496e",
  bgLight: "#f9fafb",
};
const {
  deepBlue,
  Grey,
  navyText,
  bgLight,
} = COLORS;

/* ===== DEMO DATA ===== */
const DEMO_PROJECTS = [
  {
    id: 1,
    title: "Marketing PPT",
    desc: "Sales strategy presentation",
    type: "presentation",
    date: new Date(),
  },
  {
    id: 2,
    title: "Company Profile",
    desc: "Business overview document",
    type: "document",
    date: new Date(Date.now() - 86400000),
  },
  {
    id: 3,
    title: "Instagram Post",
    desc: "Social media design",
    type: "image",
    date: new Date(Date.now() - 10 * 86400000),
  },
  {
    id: 4,
    title: "Product Launch Slides",
    desc: "Startup pitch deck",
    type: "presentation",
    date: new Date(Date.now() - 20 * 86400000),
  },
  {
    id: 5,
    title: "AI Generated Poster",
    desc: "Creative visual",
    type: "image",
    date: new Date(Date.now() - 40 * 86400000),
  },
];

const Recents = ({
  selectedCategory = "all",
  selectedDate = "all",
  searchQuery = ""
}) => {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    setProjects(DEMO_PROJECTS);
  }, []);

  /* ===== DATE FILTER FUNCTION ===== */
  const filterByDate = (itemDate) => {
    if (selectedDate === "all") return true;

    const today = new Date();
    const item = new Date(itemDate);
    const diffDays = Math.floor(
      (today - item) / (1000 * 60 * 60 * 24)
    );

    if (selectedDate === "today") return diffDays === 0;
    if (selectedDate === "yesterday") return diffDays === 1;
    if (selectedDate === "30") return diffDays <= 30;
    if (selectedDate === "90") return diffDays <= 90;

    return true;
  };

  /* ===== APPLY FILTERS ===== */
  const filteredProjects = projects.filter((project) => {
    const categoryMatch =
      selectedCategory === "all" ||
      project.type === selectedCategory;
    const searchMatch =
      project.title.toLowerCase().includes(searchQuery.toLowerCase());

    const dateMatch = filterByDate(project.date);

    return categoryMatch && dateMatch && searchMatch;
  });

  const getIcon = (type) => {
    if (type === "presentation")
      return <FiLayout size={22} color={deepBlue} />;
    if (type === "document")
      return <FiFileText size={22} color={navyText} />;
    return <FiImage size={22} color={Grey} />;
  };

  return (
    <div className="w-full py-10">
      <div className="max-w-6xl mx-auto px-4">

        <h2
          className="text-4xl font-bold text-center mb-12 bg-clip-text text-transparent"
          style={{
            backgroundImage:
             "linear-gradient(135deg,#1e40af 0%,#3b82f6 50%,#60a5fa 100%)",
          }}
        >
          Recent Designs
        </h2>

        {filteredProjects.length === 0 ? (
          <div
            className="text-center py-16 rounded-2xl"
            style={{
              background: "#f9fafb",
              backdropFilter: "blur(8px)",
              border: `1px solid ${navyText}`,
              color: Grey,
            }}
          >
            No matching results found.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">

            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="rounded-2xl p-5 transition-all duration-300 cursor-pointer"
                style={{
                  background: bgLight,
                  border: `1px solid ${deepBlue}`,
                  boxShadow: "0 4px 18px rgba(0,0,0,0.05)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-6px)";
                  e.currentTarget.style.boxShadow =
                    "0 10px 30px rgba(0,0,0,0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 18px rgba(0,0,0,0.05)";
                }}
              >
                <div className="mb-4">
                  {getIcon(project.type)}
                </div>

                <div
                  className="font-semibold text-sm mb-1 truncate"
                  style={{ color: navyText }}
                >
                  {project.title}
                </div>

                <div
                  className="text-xs line-clamp-2"
                  style={{ color: Grey }}
                >
                  {project.desc}
                </div>

                <div
                  className="mt-4 text-[10px] font-semibold px-3 py-1 rounded-full inline-block"
                  style={{
                    background:
                      project.type === "presentation"
                        ? navyText
                        : project.type === "document"
                          ? deepBlue
                          : Grey,
                    color: "#fff",
                  }}
                >
                  {project.type}
                </div>
              </div>
            ))}

          </div>
        )}
      </div>
    </div>
  );
};

export default Recents;