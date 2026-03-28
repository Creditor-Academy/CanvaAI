import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  listPresentations,
  deletePresentation,
} from "../services/presentation/presentation.service";
import {
  getPublicPresentations,
  getUnpublicPresentations,
  updatePPTVisibility,
} from "../services/Admin/admin";
import {
  getUserImages,
  deleteImage,
  updateImageVisibility,
} from "../services/imageEditor/imageApi";
import { ImageThumbPreview } from "../components/canva/ImageLayout/ImageLayout";
import { toast } from "sonner";
import { Trash2, Globe, Lock, Search } from "lucide-react";
import { FiLayout } from "react-icons/fi";
import "./AdminDash.css";
import PresentationThumbnail from "../components/PresentationThumbnail";
import { useNavigate } from "react-router-dom";

const AdminDash = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeView, setActiveView] = useState("create");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // ── PPT state ─────────────────────────────────────────────────────────
  const [templates, setTemplates] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // ── Image state ───────────────────────────────────────────────────────
  const [images, setImages] = useState([]);
  const [imagesLoading, setImagesLoading] = useState(true);
  const [imgSearchTerm, setImgSearchTerm] = useState("");
  const [imgStatusFilter, setImgStatusFilter] = useState("all");
  const [imgVisLoading, setImgVisLoading] = useState({});

  useEffect(() => {
    if (!user?._id) return;

    const fetchAllData = async () => {
      setLoading(true);
      try {
        const [res, publicList, privateList] = await Promise.all([
          listPresentations(user._id),
          getPublicPresentations(user._id),
          getUnpublicPresentations(user._id),
        ]);

        const all = Array.isArray(res) ? res : res?.data || [];
        const publicIds = new Set(publicList.map((p) => p._id));

        const mapped = all.map((ppt) => ({
          id: ppt._id,
          title: ppt.title || "Untitled Presentation",
          category: "presentation",
          createdAt: ppt.createdAt || ppt.updatedAt,
          updatedAt: ppt.updatedAt || ppt.createdAt,
          data: ppt.data,
          url: `/presentation-editor-v3/${ppt._id}`,
          isPublished: publicIds.has(ppt._id),
        }));

        setTemplates(mapped);
      } catch (err) {
        console.error(err);
        setTemplates([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [user?._id]);

  // ── Fetch images ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?._id) return;
    let mounted = true;
    const fetchImages = async () => {
      try {
        setImagesLoading(true);
        const res = await getUserImages(user._id);
        if (mounted) setImages(Array.isArray(res) ? res : res?.data || []);
      } catch (err) {
        console.error("Fetch images error:", err);
      } finally {
        if (mounted) setImagesLoading(false);
      }
    };
    fetchImages();
    return () => { mounted = false; };
  }, [user?._id]);

  const getSlideData = (data) => {
    if (!data) return null;
    let parsedData = data;

    if (typeof data === "string") {
      try {
        parsedData = JSON.parse(data);
      } catch (e) {
        return null;
      }
    }

    return parsedData.slides?.[0] || (parsedData.layers ? parsedData : null);
  };

  const getSlideCount = (data) => {
    if (!data) return 0;
    let parsedData = data;

    if (typeof data === "string") {
      try {
        parsedData = JSON.parse(data);
      } catch (e) {
        return 0;
      }
    }

    if (Array.isArray(parsedData.slides)) return parsedData.slides.length;
    return parsedData.layers ? 1 : 0;
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this presentation?"))
      return;

    try {
      await deletePresentation(id, user._id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch (error) {
      console.error("Failed to delete presentation:", error);
      alert("Failed to delete presentation. Please try again.");
    }
  };

  const handleTemplateSelect = (path) => {
    navigate(path);
  };

  const handleVisibilityChange = async (id, currentStatus, e) => {
    e.stopPropagation();

    try {
      await updatePPTVisibility(id, user._id, !currentStatus);

      setTemplates((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, isPublished: !currentStatus } : t
        )
      );
    } catch (error) {
      console.error("Error updating visibility:", error);
      alert(error.response?.data?.error || "Failed to update visibility");
    }
  };

  // ── Image handlers ──────────────────────────────────────────────────────
  const handleImageDelete = async (imageId, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this image?")) return;
    try {
      const img = images.find((i) => i._id === imageId);
      if (img?.isPublic) {
        await updateImageVisibility(imageId, { userId: user._id, isPublic: false }).catch(() => {});
      }
      await deleteImage(imageId);
      setImages((prev) => prev.filter((i) => i._id !== imageId));
      toast.success("Image deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete image");
    }
  };

  const handleImageVisibility = async (imageId, currentStatus, e) => {
    e.stopPropagation();
    try {
      setImgVisLoading((prev) => ({ ...prev, [imageId]: true }));
      await updateImageVisibility(imageId, { userId: user._id, isPublic: !currentStatus });
      setImages((prev) =>
        prev.map((i) => (i._id === imageId ? { ...i, isPublic: !currentStatus } : i))
      );
      toast.success(!currentStatus ? "Image published" : "Image unpublished");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update visibility");
    } finally {
      setImgVisLoading((prev) => { const c = { ...prev }; delete c[imageId]; return c; });
    }
  };

  const filteredTemplates = templates
    .filter((t) => {
      if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
      if (statusFilter === "published") return t.isPublished === true;
      if (statusFilter === "unpublished") return t.isPublished === false;
      if (searchTerm && !t.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));

  const filteredImages = images
    .filter((img) => {
      if (imgStatusFilter === "published") return img.isPublic === true;
      if (imgStatusFilter === "unpublished") return img.isPublic === false;
      if (imgSearchTerm && !(img.title || "Untitled").toLowerCase().includes(imgSearchTerm.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="min-h-screen bg-[#e9f4ff]">
    <div className="admin-dash">
      <div className="admin-dash__shell">
        <div className="admin-dash__container">
          {/* <section className="admin-hero">
            <div className="admin-hero__text">
              <p className="admin-hero__eyebrow">Welcome back, {user?.firstName || 'Admin'}</p>
              <h1>Create or manage templates from one place</h1>
              <p className="admin-hero__subtext">
                Choose what you want to build and jump into the right workspace. Presentation opens
                the layout picker instantly.
              </p>
            </div>

            <div className="admin-hero__actions">
              <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                + Create Template
              </button>
              <button
                className={`btn btn-ghost ${activeView === 'manage' ? 'is-active' : ''}`}
                onClick={() => setActiveView('manage')}
              >
                Manage Templates
              </button>
            </div>
          </section> */}

          {/* ===== Recent Templates Section ===== */}
          <section className="admin-recents">
            <div className="admin-section-card">

            <div className="admin-recents__header">
              <div className="admin-recents__title-group">
                <h2>Recent Templates</h2>
                <span className="admin-count-badge">{filteredTemplates.length} templates</span>
              </div>

              <div className="admin-recents__controls">
                <div className="admin-search-wrap">
                  <Search size={15} className="admin-search-icon" />
                  <input
                    type="text"
                    placeholder="Search templates…"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="admin-search-input"
                  />
                </div>

                <div className="admin-recents__filters">
                  <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                    <option value="all">All Categories</option>
                    <option value="presentation">Presentation</option>
                    <option value="document">Document</option>
                    <option value="image">Image</option>
                  </select>

                  <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="all">All Status</option>
                    <option value="published">Published</option>
                    <option value="unpublished">Unpublished</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="admin-recents__grid">
                {loading ? (
                  <p>Loading presentations...</p>
                ) : filteredTemplates.length === 0 ? (
                  <p className="admin-empty-msg">No templates found</p>
                ) : (
                  filteredTemplates.map((temp) => (
                    <div
                      key={temp.id}
                      className="recent-card"
                      onClick={() => temp.url && window.open(temp.url, "_blank")}
                      style={{ cursor: temp.url ? "pointer" : "default" }}
                    >
                      <div className="recent-thumb">
                        {getSlideData(temp.data) ? (
                          <PresentationThumbnail
                            slide={getSlideData(temp.data)}
                            width="100%"
                            height="100%"
                          />
                        ) : (
                          <div className="recent-thumb__empty">
                            No preview
                          </div>
                        )}
                      </div>

                      <div className="recent-info">
                        <div className="recent-info__top">
                          <h4>{temp.title}</h4>
                          <button
                            className="card-action-btn delete-btn"
                            onClick={(e) => handleDelete(temp.id, e)}
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div className="recent-info__mid">
                          <div className={`badge badge-${temp.category}`}>
                            {temp.category}
                          </div>

                          <button
                            className={`visibility-btn ${
                              temp.isPublished ? "published" : "unpublished"
                            }`}
                            onClick={(e) =>
                              handleVisibilityChange(
                                temp.id,
                                temp.isPublished,
                                e
                              )
                            }
                          >
                            {temp.isPublished ? (
                              <>
                                <Globe size={14} /> Published
                              </>
                            ) : (
                              <>
                                <Lock size={14} /> Unpublished
                              </>
                            )}
                          </button>
                        </div>

                        <span className="recent-date">
                          {new Date(temp.createdAt).toLocaleDateString()}
                          {getSlideCount(temp.data) > 0 && (
                            <span className="slide-badge">
                              <FiLayout
                                size={12}
                                style={{ marginRight: "4px" }}
                              />
                              {getSlideCount(temp.data)}{" "}
                              {getSlideCount(temp.data) === 1
                                ? "Slide"
                                : "Slides"}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>{/* /admin-section-card */}
            </section>

          {/* ===== Image Templates Section ===== */}
          <section className="admin-recents">
            <div className="admin-section-card">

              <div className="admin-recents__header">
                <div className="admin-recents__title-group">
                  <h2>Image Templates</h2>
                  <span className="admin-count-badge">{filteredImages.length} images</span>
                </div>

                <div className="admin-recents__controls">
                  <div className="admin-search-wrap">
                    <Search size={15} className="admin-search-icon" />
                    <input
                      type="text"
                      placeholder="Search images…"
                      value={imgSearchTerm}
                      onChange={e => setImgSearchTerm(e.target.value)}
                      className="admin-search-input"
                    />
                  </div>

                  <div className="admin-recents__filters">
                    <select value={imgStatusFilter} onChange={e => setImgStatusFilter(e.target.value)}>
                      <option value="all">All Status</option>
                      <option value="published">Published</option>
                      <option value="unpublished">Unpublished</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="admin-recents__grid">
                {imagesLoading ? (
                  <p>Loading images…</p>
                ) : filteredImages.length === 0 ? (
                  <p className="admin-empty-msg">No images found</p>
                ) : (
                  filteredImages.map((img) => {
                    const canvasSize = img.data?.canvasSize || { width: 800, height: 600 };
                    return (
                      <div
                        key={img._id}
                        className="recent-card"
                        onClick={() => window.open(`/canva-clone/${img._id}`, "_blank")}
                        style={{ cursor: "pointer" }}
                      >
                        <div
                          className="recent-thumb"
                          style={{ position: "relative", overflow: "hidden" }}
                        >
                          <div
                            style={{ position: "absolute", inset: 0 }}
                            ref={(el) => {
                              if (!el) return;
                              const setScale = () => {
                                const w = el.offsetWidth || el.clientWidth;
                                const h = el.offsetHeight || el.clientHeight;
                                if (!w || !h) return;
                                const scale = Math.min(
                                  w / (canvasSize.width || 800),
                                  h / (canvasSize.height || 600)
                                );
                                el.style.setProperty("--thumb-scale", String(scale));
                              };
                              setScale();
                              const ro = new ResizeObserver(() => { setScale(); ro.disconnect(); });
                              ro.observe(el);
                            }}
                          >
                            <ImageThumbPreview image={img} />
                          </div>
                        </div>

                        <div className="recent-info">
                          <div className="recent-info__top">
                            <h4>{img.title || "Untitled Image"}</h4>
                            <button
                              className="card-action-btn delete-btn"
                              onClick={(e) => handleImageDelete(img._id, e)}
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>

                          <div className="recent-info__mid">
                            <div className="badge badge-image">image</div>

                            <button
                              className={`visibility-btn ${img.isPublic ? "published" : "unpublished"}`}
                              disabled={!!imgVisLoading[img._id]}
                              onClick={(e) => handleImageVisibility(img._id, img.isPublic, e)}
                            >
                              {imgVisLoading[img._id] ? (
                                "Updating…"
                              ) : img.isPublic ? (
                                <><Globe size={14} /> Published</>
                              ) : (
                                <><Lock size={14} /> Unpublished</>
                              )}
                            </button>
                          </div>

                          <span className="recent-date">
                            {new Date(img.createdAt).toLocaleDateString()}
                            {canvasSize.width && (
                              <span className="slide-badge">
                                {canvasSize.width}×{canvasSize.height}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>{/* /admin-section-card */}
          </section>

          </div>
        </div>

        {showCreateModal && (
          <div
            className="admin-modal__backdrop"
            onClick={() => setShowCreateModal(false)}
          >
            <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
              <div className="admin-modal__header">
                <div>
                  <h2>Choose what you want to create</h2>
                </div>
                <button
                  className="admin-modal__close"
                  onClick={() => setShowCreateModal(false)}
                >
                  ×
                </button>
              </div>

              <div className="admin-modal__grid">
                <div className="modal-card modal-card--green">
                  <div className="modal-card__title">Presentation</div>
                  <p className="modal-card__body">
                    Jump straight into the presentation layout picker to select
                    the perfect slide format.
                  </p>
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleTemplateSelect("/Presentation")}
                  >
                    Create Presentation
                  </button>
                </div>

                <div className="modal-card modal-card--amber">
                  <div className="modal-card__title">Document</div>
                  <p className="modal-card__body">
                    Start with a square canvas ideal for logo uploads or quick
                    drafts.
                  </p>
                  <button
                    className="btn btn-second"
                    onClick={() => handleTemplateSelect("/editor")}
                  >
                    Create Document
                  </button>
                </div>

                <div className="modal-card modal-card--teal">
                  <div className="modal-card__title">Image Editor</div>
                  <p className="modal-card__body">
                    Keep standard 3.5 × 2 inch proportions ready for print
                    cards.
                  </p>
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleTemplateSelect("/canva-clone")}
                  >
                    Edit Image
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDash;