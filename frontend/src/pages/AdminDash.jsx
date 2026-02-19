import React, { useMemo, useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { listPresentations, deletePresentation } from '../services/presentation/presentation.service';
import { Trash2, Globe, Lock } from 'lucide-react';
// import TempUpload from '../components/admin/TempUpload';
// import TemplateManager from '../components/admin/TemplateManager';
import './AdminDash.css';

const COLORS = {
  deepBlue: "#1d3fAf",
  primaryBlue: "#60a5fa",
  Grey: "#455469",
  gold: "#fabf23",
  lightGold: "#f8d77d",
  navyText: "#0c496e",
  bgLight: "#f9fafb",
};
const {
  deepBlue,
  primaryBlue,
  Grey,
  gold,
  lightGold,
  navyText,
  bgLight,
} = COLORS;


const AdminDash = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Primary view toggle and create modal controls
  const [activeView, setActiveView] = useState('create');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPostOptions, setShowPostOptions] = useState(false);
  // ===== Templates Storage =====
  const [templates, setTemplates] = useState([]);

  // filters
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (categoryFilter === "presentation" && user?._id) {
      const fetchPresentations = async () => {
        setLoading(true);
        try {
          const res = await listPresentations(user._id);
          const list = Array.isArray(res) ? res : (res.data || []);

          // Map presentations to template structure
          const mappedPresentations = list.map(ppt => ({
            id: ppt._id,
            title: ppt.title || "Untitled Presentation",
            category: "presentation",
            createdAt: ppt.createdAt || ppt.updatedAt || new Date().toISOString(),
            preview: ppt.preview || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRI6kyGvk51WegGvlf-MdBLorUpRaZ8KfnaEg&s", // Default placeholder
            url: `/presentation-editor-v3/${ppt._id}`,
            isPublished: false // Default to unpublished
          }));

          setTemplates(mappedPresentations);
        } catch (error) {
          console.error("Failed to fetch presentations:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchPresentations();
    } else if (categoryFilter === "all" || categoryFilter === "document" || categoryFilter === "image") {
      // If switching away from presentation, we might want to clear or keep?
      // For now, let's just clear templates if it's not presentation to reflect "empty" for others
      // unless they also have fetching logic.
      if (templates.some(t => t.category === "presentation")) {
        setTemplates([]);
      }
    }
  }, [categoryFilter, user?._id]);

  const togglePublish = (id, e) => {
    e.stopPropagation();
    setTemplates(prev => prev.map(t =>
      t.id === id ? { ...t, isPublished: !t.isPublished } : t
    ));
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this presentation?")) return;

    try {
      await deletePresentation(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error("Failed to delete presentation:", error);
      alert("Failed to delete presentation. Please try again.");
    }
  };

  // const [selectedTemplateType, setSelectedTemplateType] = useState('');

  // const postOptions = useMemo(
  //   () => [
  //     'Insta Post',
  //     'Insta Story',
  //     'Facebook Post',
  //     'YouTube Thumbnail',
  //     'WhatsApp Status',
  //     'Custom',
  //   ],
  //   []
  // );





  const filteredTemplates = useMemo(() => {

    return templates.filter(template => {

      // category filter
      if (categoryFilter !== "all" && template.category !== categoryFilter)
        return false;

      // date filter
      if (dateFilter !== "all") {
        const now = new Date();
        const diffDays =
          (now - new Date(template.createdAt)) / (1000 * 60 * 60 * 24);

        if (dateFilter === "today" && diffDays > 1) return false;
        if (dateFilter === "yesterday" && (diffDays < 1 || diffDays > 2)) return false;
        if (dateFilter === "30" && diffDays > 30) return false;
        if (dateFilter === "90" && diffDays > 90) return false;
      }

      return true;
    });

  }, [templates, categoryFilter, dateFilter]);



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

                <select value={dateFilter} onChange={e => setDateFilter(e.target.value)}>
                  <option value="all">All</option>
                  <option value="published">Published</option>
                  <option value="unpublished">Unpuclished</option>
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
                      <img src={temp.preview} alt="preview" />
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
                          className={`publish-toggle-btn ${temp.isPublished ? 'is-published' : 'is-unpublished'}`}
                          onClick={(e) => togglePublish(temp.id, e)}
                        >
                          {temp.isPublished ? <Globe size={12} /> : <Lock size={12} />}
                          {temp.isPublished ? "Published" : "Unpublished"}
                        </button>
                      </div>

                      <span className="recent-date">
                        {new Date(temp.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                  </div>

                ))
              )}

            </div>

          </section>


          {/* <div className="admin-status">
            <div className="admin-status__left">
              <span className="status-dot" />
              <strong>Creation mode:</strong>
              <span className="status-label">
                {selectedTemplateType ? selectedTemplateType : 'Not chosen yet'}
              </span>
            </div>
            <div className="admin-status__right">
              View: {activeView === 'create' ? 'Create workspace' : 'Manage & delete'}
            </div>
          </div> */}

          {/* <div className="admin-workspace">
            {activeView === 'create' ? <TempUpload /> : <TemplateManager />}
          </div> */}
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
                // onClick={() => handleTemplateSelect("Presentation")}
                >
                  Create Presentation
                </button>

              </div>

              <div className="modal-card modal-card--amber">
                <div className="modal-card__title">Document</div>
                <p className="modal-card__body">
                  Start with a square canvas ideal for logo uploads or quick drafts.
                </p>
                <button className="btn btn-second" >
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
                >
                  Use Business Card
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDash;