import React from "react";

const ProjectHero = () => {
  return (
    <section className="w-full max-w-[1400px] mx-auto px-6 pt-10">
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

        {/* Left Content */}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
            My Projects
          </h1>

          <p className="text-gray-500 mt-2 text-lg">
            Manage your projects, templates, and brand kits
          </p>
        </div>

        {/* Right Button */}
        <div className="flex items-center">
          <button
            className="
            bg-indigo-500
            text-white
            font-semibold
            px-6 py-2.5
            rounded-full
            shadow-sm
            transition-all
            duration-300
            hover:bg-indigo-600
            hover:shadow-lg
            hover:-translate-y-[2px]
            active:scale-95
            "
          >
            + New Project
          </button>
        </div>

      </div>

      {/* Divider */}
      <div className="mt-8 border-t border-gray-200"></div>

    </section>
  );
};

export default ProjectHero;