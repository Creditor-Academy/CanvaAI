import React, { useEffect, useState } from "react";
import { FiTrash2 } from "react-icons/fi";
import api from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

export default function TemplateTypes() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth(); // ⭐ logged in user
  const isAdmin = user?.role === "admin"; // ⭐ admin check

  /* -------- Preview Image -------- */
  const getPreviewImage = (slides = []) => {
    if (!Array.isArray(slides) || slides.length === 0) return null;

    const first = slides[0];

    if (first?.layers) {
      const imgLayer = first.layers.find(
        (l) => l?.type === "image" && (l?.src || l?.imageUrl)
      );
      if (imgLayer) return imgLayer.src || imgLayer.imageUrl;
    }

    if (first?.image?.url) return first.image.url;
    if (first?.backgroundImage) return first.backgroundImage;

    return null;
  };

  /* -------- Fetch Templates -------- */
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await api.getAdminContents();
        const list = Array.isArray(res?.data) ? res.data : [];

        const mapped = list
          .map((item, index) => ({
            id: item?._id || index,
            name:
              item?.title ||
              item?.data?.meta?.topic ||
              "Untitled Presentation",
            image: getPreviewImage(item?.data?.slides || []),
            updatedAt: item?.updatedAt || item?.createdAt,
            presentationId: item?.presentationId || item?.persentationId || null,
          }))
          .filter((t) => t.presentationId); // only usable templates

        setTemplates(mapped);
      } catch (err) {
        console.error(err);
        setTemplates([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  /* -------- Open PPT -------- */
  const openTemplate = (template) => {
    window.open(`/presentation-editor-v3/${template.presentationId}`, "_blank");
  };

  /* -------- Delete Template (ADMIN ONLY) -------- */
  const deleteTemplate = async (id, e) => {
    e.stopPropagation();

    if (!window.confirm("Delete this template?")) return;

    try {
      await api.deleteAdminTemplate(id); // your delete api
      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete template");
    }
  };

  const formatDate = (date) => {
    if (!date) return "Recently";
    return new Date(date).toLocaleDateString();
  };

  /* -------- UI -------- */
  return (
    <div style={{ padding: "40px" }}>
      <h2 className="text-3xl font-bold mb-10">Your Templates</h2>

      {loading ? (
        <div>Loading...</div>
      ) : templates.length === 0 ? (
        <div>No usable templates found</div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
            gap: "26px",
          }}
        >
          {templates.map((item) => (
            <div
              key={item.id}
              onClick={() => openTemplate(item)}
              style={{
                borderRadius: "18px",
                overflow: "hidden",
                background: "#fff",
                boxShadow: "0 10px 24px rgba(0,0,0,.08)",
                cursor: "pointer",
                transition: "0.25s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "translateY(-6px)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "translateY(0)")
              }
            >
              {/* Preview */}
              <div
                style={{
                  height: "160px",
                  background: "#e5e7eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                
              </div>

              {/* Info */}
              <div style={{ padding: "16px 18px" }}>
                <div
                  style={{
                    fontSize: "20px",
                    fontWeight: 700,
                    color: "#0f172a",
                    marginBottom: "6px",
                  }}
                >
                  {item.name}
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    color: "#64748b",
                    fontSize: "14px",
                  }}
                >
                  <span>Edited {formatDate(item.updatedAt)}</span>

                  {/* ⭐ DELETE ONLY FOR ADMIN */}
                  {isAdmin && (
                    <FiTrash2
                      color="#ef4444"
                      size={18}
                      style={{ cursor: "pointer" }}
                      onClick={(e) => deleteTemplate(item.id, e)}
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}