import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { listPresentations, deletePresentation } from '../services/presentation/presentation.service';
import { getPublicPresentations, getUnpublicPresentations, updatePPTVisibility } from '../services/Admin/admin';
import { Trash2, Globe, Lock } from 'lucide-react';
import { FiLayout } from 'react-icons/fi';
import './AdminDash.css';
import PresentationThumbnail from '../components/PresentationThumbnail';
import { useNavigate } from "react-router-dom";
import ImageDash from '@/components/canva/ImageLayout/imageDash';

const AdminDash = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Primary view toggle and create modal controls
  const [activeView, setActiveView] = useState('create');
  const [showCreateModal, setShowCreateModal] = useState(false);
  // ===== Templates Storage =====
  const [templates, setTemplates] = useState([]);

  // filters
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);

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

        const publicIds = new Set(publicList.map(p => p._id));

        const mapped = all.map(ppt => ({
          id: ppt._id,
          title: ppt.title || "Untitled Presentation",
          category: "presentation",
          createdAt: ppt.createdAt || ppt.updatedAt,
          data: ppt.data,
          url: `/presentation-editor-v3/${ppt._id}`,
          isPublished: publicIds.has(ppt._id) ? true : false,
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

  const getSlideData = (data) => {
    if (!data) return null;
    let parsedData = data;
    if (typeof data === 'string') {
      try {
        parsedData = JSON.parse(data);
      } catch (e) { return null; }
    }
    // Return first slide or the data itself if it has layers
    return parsedData.slides?.[0] || (parsedData.layers ? parsedData : null);
  };

  const getSlideCount = (data) => {
    if (!data) return 0;
    let parsedData = data;
    if (typeof data === 'string') {
      try {
        parsedData = JSON.parse(data);
      } catch (e) { return 0; }
    }
    if (Array.isArray(parsedData.slides)) return parsedData.slides.length;
    return parsedData.layers ? 1 : 0;
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this presentation?")) return;

    try {
      await deletePresentation(id, user._id);
      setTemplates(prev => prev.filter(t => t.id !== id));
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

      // UI update
      setTemplates(prev =>
        prev.map(t =>
          t.id === id
            ? { ...t, isPublished: !currentStatus }
            : t
        )
      );

    } catch (error) {
      console.error("Error updating visibility:", error);
      alert(error.response?.data?.error || "Failed to update visibility");
    }
  };

  const filteredTemplates = templates.filter(t => {
    if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
    if (statusFilter === "published") return t.isPublished === true;
    if (statusFilter === "unpublished") return t.isPublished === false;
    return true;
  });

  return (
    <div className="admin-dash">
      <div className="admin-dash__shell">
        <div className="admin-dash__container">
          <section className="admin-hero">
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
          </section>

          {/* ===== Recent Templates Section ===== */}
          <section className="admin-recents">

            <div className="admin-recents__header">
              <h2>Recent Templates</h2>

              <div className="admin-recents__filters">

                <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                  <option value="all">All Categories</option>
                  <option value="presentation">Presentation</option>
                  <option value="document">Document</option>
                  <option value="image">Image</option>
                </select>

                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  <option value="all">All</option>
                  <option value="published">Published</option>
                  <option value="unpublished">Unpublished</option>
                </select>
              </div>
            </div>

            <div className="admin-recents__grid">

              {loading ? (
                <p>Loading presentations...</p>
              ) : filteredTemplates.length === 0 ? (
                <p>No templates created yet</p>
              ) : (
                filteredTemplates.map(temp => (
                  <div
                    key={temp.id}
                    className="recent-card"
                    onClick={() => temp.url && window.open(temp.url, '_blank')}
                    style={{ cursor: temp.url ? 'pointer' : 'default' }}
                  >


                    <div className="recent-thumb">
                      {getSlideData(temp.data) ? (
                        <PresentationThumbnail slide={getSlideData(temp.data)} width="100%" height="100%" />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', color: '#94a3b8', fontSize: 14 }}>No preview</div>
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
                          className={`visibility-btn ${temp.isPublished ? "published" : "unpublished"}`}
                          onClick={(e) =>
                            handleVisibilityChange(temp.id, temp.isPublished, e)
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
                            <FiLayout size={12} style={{ marginRight: '4px' }} />
                            {getSlideCount(temp.data)} {getSlideCount(temp.data) === 1 ? 'Slide' : 'Slides'}
                          </span>
                        )}
                      </span>
                    </div>

                  </div>

                ))
              )}

            </div>

          </section>
        </div>
      </div>

      {showCreateModal && (
        <div className="admin-modal__backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <div>
                <h2>Choose what you want to create</h2>
              </div>
              <button className="admin-modal__close" onClick={() => setShowCreateModal(false)}>
                ×
              </button>
            </div>

            <div className="admin-modal__grid">
              <div className="modal-card modal-card--green">
                <div className="modal-card__title">Presentation</div>
                <p className="modal-card__body">
                  Jump straight into the presentation layout picker to select the perfect slide
                  format.
                </p>
                <button
                  className="btn  btn-secondary"
                  onClick={() => handleTemplateSelect("/Presentation")}
                >
                  Create Presentation
                </button>

              </div>

              <div className="modal-card modal-card--amber">
                <div className="modal-card__title">Document</div>
                <p className="modal-card__body">
                  Start with a square canvas ideal for logo uploads or quick drafts.
                </p>
                <button className="btn btn-second"
                  onClick={() => handleTemplateSelect("/editor")} >
                  Create Document
                </button>
              </div>

              <div className="modal-card modal-card--teal">
                <div className="modal-card__title">Image Editor</div>
                <p className="modal-card__body">
                  Keep standard 3.5 × 2 inch proportions ready for print cards.
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
      <ImageDash />
    </div>
  );
};

export default AdminDash;

