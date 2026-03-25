import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiPlus,
  FiTrash2,
  FiFileText,
  FiImage,
  FiMonitor,
  FiX,
} from "react-icons/fi";

export default function AllProjects(){

const navigate = useNavigate();

const demoProjects = [
{
id:1,
title:"Marketing Slides",
type:"ppt",
date:"2026-03-01",
img:"https://images.unsplash.com/photo-1557804506-669a67965ba0"
},
{
id:2,
title:"Company Report",
type:"doc",
date:"2026-03-02",
img:"https://images.unsplash.com/photo-1519389950473-47ba0277781c"
},
{
id:3,
title:"Instagram Banner",
type:"image",
date:"2026-03-05",
img:"https://images.unsplash.com/photo-1542744173-8e7e53415bb0"
},
{
id:4,
title:"Sales Presentation",
type:"ppt",
date:"2026-03-06",
img:"https://images.unsplash.com/photo-1522202176988-66273c2fd55f"
}
];

const [projects,setProjects] = useState(demoProjects);
const [search,setSearch] = useState("");
const [page,setPage] = useState(0);
const [modal,setModal] = useState(false);

const [deleteModal,setDeleteModal] = useState(false);
const [selectedProject,setSelectedProject] = useState(null);

const itemsPerPage = 8;

const filtered = useMemo(()=>{
return projects.filter(p =>
p.title.toLowerCase().includes(search.toLowerCase())
);
},[projects,search]);

const totalPages = Math.ceil(filtered.length/itemsPerPage);

const paginated = filtered.slice(
page*itemsPerPage,
page*itemsPerPage + itemsPerPage
);

const openDeleteModal = (project)=>{
setSelectedProject(project);
setDeleteModal(true);
};

const confirmDelete = async ()=>{

// API CALL HERE
// await api.deleteProject(selectedProject.id)

setProjects(prev => prev.filter(p => p.id !== selectedProject.id));

setDeleteModal(false);
setSelectedProject(null);

};

return(

<div className="w-full mx-auto my-auto p-26 pt-25 pl-34 bg-[#e9f4ff]">

<div className=" bg-[#f9fafb]  rounded-3xl p-16 shadow-sm">

{/* HEADER */}

<div className="text-center mb-12">

<h1 className="text-4xl font-bold text-black">
Projects
</h1>

<p className="text-gray-500 mt-2">
Total Projects – {projects.length}
</p>

</div>

{/* SEARCH + CREATE */}

<div className="flex items-center justify-between mb-12 flex-wrap gap-4">

<div className="relative w-80 max-w-full">

<FiSearch className="absolute left-4 top-3.5 text-gray-400"/>

<input
value={search}
onChange={(e)=>setSearch(e.target.value)}
placeholder="Search projects..."
className="w-full bg-gray-50 border border-gray-200 rounded-full py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
/>

</div>

<button
onClick={()=>setModal(true)}
className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-full hover:bg-blue-700 shadow"
>
<FiPlus/>
Create
</button>

</div>

{/* PROJECT GRID */}

<h2 className="text-xl font-semibold mb-6">
Your Projects
</h2>

<div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">

{paginated.map(p=>(

<div
key={p.id}
className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition"
>

<div className="relative">

<img
src={p.img}
alt=""
className="w-full h-44 object-cover"
/>

<span className="absolute top-3 left-3 text-xs px-2 py-1 bg-black/70 text-white rounded">
{p.type.toUpperCase()}
</span>

</div>

<div className="p-4">

<h3 className="font-semibold text-sm text-black">
{p.title}
</h3>

<p className="text-xs text-gray-500 mt-1">
Created {new Date(p.date).toLocaleDateString()}
</p>

<button
onClick={()=>openDeleteModal(p)}
className="flex items-center gap-1 mt-4 text-red-500 text-sm hover:text-red-600"
>
<FiTrash2 size={14}/>
Delete
</button>

</div>

</div>

))}

</div>

{/* PAGINATION */}

{totalPages>1 && (

<div className="flex justify-center items-center gap-4 mt-10">

<button
onClick={()=>setPage(p=>Math.max(0,p-1))}
className="p-2 border rounded-lg hover:bg-gray-100"
>
<FiChevronLeft/>
</button>

<span className="text-gray-600">
Page {page+1}/{totalPages}
</span>

        {/* SEARCH + CREATE */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 sm:mb-10 md:mb-12 gap-4">
          <div className="relative w-full sm:w-[320px] md:w-[360px] max-w-full">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="w-full bg-gray-50 border border-gray-200 rounded-full py-3 pl-11 pr-4 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={() => setModal(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-5 sm:px-6 py-3 rounded-full hover:bg-blue-700 shadow"
          >
            <FiPlus />
            Create
          </button>
        </div>

        {/* PROJECT GRID */}
        <h2 className="text-lg sm:text-xl font-semibold mb-5 sm:mb-6">
          Your Projects
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5 sm:gap-6 lg:gap-8">
          {paginated.map((p) => (
            <div
              key={p.id}
              className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition w-full min-w-0"
            >
              <div className="relative">
                <img
                  src={p.img}
                  alt={p.title}
                  className="w-full h-44 sm:h-48 object-cover"
                />

                <span className="absolute top-3 left-3 text-[10px] sm:text-xs px-2 py-1 bg-black/70 text-white rounded">
                  {p.type.toUpperCase()}
                </span>
              </div>

              <div className="p-4 sm:p-5">
                <h3 className="font-semibold text-sm sm:text-base text-black break-words">
                  {p.title}
                </h3>

                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Created {new Date(p.date).toLocaleDateString()}
                </p>

                <button
                  onClick={() => openDeleteModal(p)}
                  className="flex items-center gap-1 mt-4 text-red-500 text-sm hover:text-red-600"
                >
                  <FiTrash2 size={14} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {paginated.length === 0 && (
          <div className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-white/70 p-8 text-center text-gray-500">
            No projects found.
          </div>
        )}

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 sm:gap-4 mt-8 sm:mt-10 flex-wrap">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="p-2.5 border rounded-lg hover:bg-gray-100"
            >
              <FiChevronLeft />
            </button>

            <span className="text-sm sm:text-base text-gray-600">
              Page {page + 1}/{totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              className="p-2.5 border rounded-lg hover:bg-gray-100"
            >
              <FiChevronRight />
            </button>
          </div>
        )}

        {/* TEMPLATE SECTION */}
        <div className="mt-12 sm:mt-14 md:mt-16">
          <h2 className="text-lg sm:text-xl font-semibold mb-6 sm:mb-8">
            Templates
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
            <div
              onClick={() => navigate("/presentationTemplates")}
              className="cursor-pointer rounded-2xl p-6 sm:p-8 md:p-10 text-center shadow-sm bg-blue-50 hover:shadow-lg hover:-translate-y-1 transition"
            >
              <FiMonitor size={36} className="mx-auto text-blue-600" />
              <h3 className="mt-4 font-semibold text-black text-lg">
                Presentation
              </h3>
              <p className="text-sm text-gray-600">Slides & PPT templates</p>
            </div>

            <div
              onClick={() => navigate("/documentTemplates")}
              className="cursor-pointer rounded-2xl p-6 sm:p-8 md:p-10 text-center shadow-sm bg-yellow-50 hover:shadow-lg hover:-translate-y-1 transition"
            >
              <FiFileText size={36} className="mx-auto text-yellow-600" />
              <h3 className="mt-4 font-semibold text-black text-lg">
                Document
              </h3>
              <p className="text-sm text-gray-600">Reports & Docs</p>
            </div>

            <div
              onClick={() => navigate("/imageTemplates")}
              className="cursor-pointer rounded-2xl p-6 sm:p-8 md:p-10 text-center shadow-sm bg-indigo-50 hover:shadow-lg hover:-translate-y-1 transition"
            >
              <FiImage size={36} className="mx-auto text-indigo-600" />
              <h3 className="mt-4 font-semibold text-black text-lg">Image</h3>
              <p className="text-sm text-gray-600">Social graphics</p>
            </div>
          </div>
        </div>
      </div>

      {/* CREATE MODAL */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-blue-200/40 via-blue-200/40 to-pink-200/40 backdrop-blur-md">
          <div className="relative w-full max-w-3xl rounded-3xl bg-white/25 backdrop-blur-xl border border-white/40 shadow-xl p-5 sm:p-6 md:p-8 lg:p-10">
            <button
              onClick={() => setModal(false)}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 w-9 h-9 flex items-center justify-center rounded-full bg-white/30 hover:bg-white/50 transition"
            >
              <FiX />
            </button>

            <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 text-center mb-6 sm:mb-8">
              Create New Design
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
              <div
                onClick={() => navigate("/presentation")}
                className="group cursor-pointer p-5 sm:p-6 rounded-xl bg-white/30 backdrop-blur-lg border border-white/40 hover:bg-white/40 hover:-translate-y-1 transition"
              >
                <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-blue-500 text-white mb-4">
                  <FiMonitor size={22} />
                </div>

                <h4 className="font-semibold text-gray-800">Presentation</h4>
                <p className="text-xs text-gray-600 mt-1">Slides & decks</p>
              </div>

              <div
                onClick={() => navigate("/canva-clone")}
                className="group cursor-pointer p-5 sm:p-6 rounded-xl bg-white/30 backdrop-blur-lg border border-white/40 hover:bg-white/40 hover:-translate-y-1 transition"
              >
                <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-yellow-500 text-white mb-4">
                  <FiFileText size={22} />
                </div>

                <h4 className="font-semibold text-gray-800">Document</h4>
                <p className="text-xs text-gray-600 mt-1">Reports & docs</p>
              </div>

              <div
                onClick={() => navigate("/editor")}
                className="group cursor-pointer p-5 sm:p-6 rounded-xl bg-white/30 backdrop-blur-lg border border-white/40 hover:bg-white/40 hover:-translate-y-1 transition"
              >
                <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-indigo-500 text-white mb-4">
                  <FiImage size={22} />
                </div>

                <h4 className="font-semibold text-gray-800">Image</h4>
                <p className="text-xs text-gray-600 mt-1">Social graphics</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-5 sm:p-6 md:p-8 w-full max-w-[420px] shadow-xl text-center">
            <h3 className="text-lg sm:text-xl font-semibold mb-3">
              Delete Project
            </h3>

            <p className="text-sm sm:text-base text-gray-600 mb-6">
              Are you sure you want to delete this project?
            </p>

            <div className="flex justify-center gap-3 sm:gap-4 flex-wrap">
              <button
                onClick={() => setDeleteModal(false)}
                className="px-5 sm:px-6 py-2 border rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>

              <button
                onClick={confirmDelete}
                className="px-5 sm:px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}