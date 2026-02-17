import React, { useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
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
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="30">Last 30 Days</option>
                  <option value="90">Last 90 Days</option>
                </select>

              </div>
            </div>

            <div className="admin-recents__grid">

              {filteredTemplates.length === 0 ? (
                <p>No templates created yet</p>
              ) : (
                filteredTemplates.map(temp => (
                  <div key={temp.id} className="recent-card">

                    <div className="recent-thumb">
                      <img src={temp.preview} alt="preview" />
                    </div>

                    <div className="recent-info">
                      <h4>{temp.title}</h4>

                      <div className={`badge badge-${temp.category}`}>
                        {temp.category}
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