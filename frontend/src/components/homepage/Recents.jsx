import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  FiImage,
  FiFileText,
  FiLayout,
} from "react-icons/fi";
import { useDocuments } from "../../hooks/useDocuments";
import { TextEditorService } from "../../services/Text-Editor/text.service";

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

const Recents = ({
  selectedCategory = "all",
  selectedDate = "all",
  searchQuery = "",
  userId // Add userId prop to fetch user's documents
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Fetch real documents from backend
  const { 
    data: projects = [], 
    isLoading, 
    error 
  } = useDocuments(userId);

  // Prefetch document data on hover for instant loading (when you have real IDs)
  const handleCardHover = (projectId) => {
    // Only prefetch if it looks like a MongoDB ID
    if (typeof projectId === 'string' && projectId.length === 24) {
      queryClient.prefetchQuery({
        queryKey: ['document', projectId],
        queryFn: async () => {
          return await TextEditorService.getDocumentById(projectId);
        },
        staleTime: 30 * 60 * 1000, // Keep cached for 30 minutes
      });
    }
  };

  const handleClick = (project) => {
    // Navigate based on document type
    if (project.type === 'document' || project.template === 'document') {
      navigate(`/editor/${project.id}`);
    } else if (project.type === 'presentation') {
      navigate(`/presentation/${project.id}`);
    } else if (project.type === 'image') {
      navigate(`/image-editor/${project.id}`);
    } else {
      // Default to editor for unknown types
      navigate(`/editor/${project.id}`);
    }
  };

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
      project.type === selectedCategory ||
      project.template === selectedCategory;
    const searchMatch =
      project.title?.toLowerCase().includes(searchQuery.toLowerCase());

    const dateMatch = filterByDate(project.updatedAt || project.createdAt || Date.now());

    return categoryMatch && searchMatch && dateMatch;
  });

  const getIcon = (type) => {
    if (type === "presentation")
      return <FiLayout size={22} color={deepBlue} />;
    if (type === "document")
      return <FiFileText size={22} color={navyText} />;
    return <FiImage size={22} color={Grey} />;
  };

  // Show loading state
  if (isLoading) {
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
            Recent Documents
          </h2>
          <div className="text-center py-16">
            <p style={{ color: Grey }}>Loading your documents...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
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
            Recent Documents
          </h2>
          <div
            className="text-center py-16 rounded-2xl"
            style={{
              background: "#fee2e2",
              border: `1px solid #ef4444`,
              color: "#dc2626",
            }}
          >
            Failed to load documents. Please try again later.
          </div>
        </div>
      </div>
    );
  }

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
          Recent Documents
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
            No documents found. Create your first document!
          </div>
        ) : (
          <div 
            className="relative max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-gray-100 hover:scrollbar-thumb-blue-400"
            role="region"
            aria-label="Recent documents list"
            tabIndex={0}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 p-2">

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
                  handleCardHover(project.id);
                  e.currentTarget.style.transform = "translateY(-6px)";
                  e.currentTarget.style.boxShadow =
                    "0 10px 30px rgba(0,0,0,0.08)";
                }}
                onClick={() => handleClick(project)}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 18px rgba(0,0,0,0.05)";
                }}
              >
                <div className="mb-4">
                  {getIcon(project.template || project.type || 'document')}
                </div>

                <div
                  className="font-semibold text-sm mb-1 truncate"
                  style={{ color: navyText }}
                >
                  {project.title || 'Untitled Document'}
                </div>

                <div
                  className="text-xs line-clamp-2"
                  style={{ color: Grey }}
                >
                  Last updated: {new Date(project.updatedAt || project.createdAt || Date.now()).toLocaleDateString()}
                </div>

                <div
                  className="mt-4 text-[10px] font-semibold px-3 py-1 rounded-full inline-block"
                  style={{
                    background:
                      (project.template || project.type) === "presentation"
                        ? navyText
                        : (project.template || project.type) === "document"
                          ? deepBlue
                          : Grey,
                    color: "#fff",
                  }}
                >
                  {project.template || project.type || 'document'}
                </div>
              </div>
            ))}

            </div>
            
            {/* Scroll indicator for better UX */}
            <div className="sticky bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-100 to-transparent pointer-events-none opacity-50" />
          </div>
        )}
      </div>
    </div>
  );
};

export default Recents;