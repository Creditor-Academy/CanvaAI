import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TemplatePreviewModal from '../components/TemplatePreviewModal';
import '../components/TemplatePreviewModal.css';

const Templates = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
        // Fetch all templates since there's no category
        const response = await fetch(`${API_BASE_URL}/api/templates`);
        if (!response.ok) {
          throw new Error('Failed to fetch templates');
        }
        const data = await response.json();
        setTemplates(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const handleTemplateClick = (template) => {
    setSelectedTemplate(template);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTemplate(null);
  };

  const handleEditTemplate = (template) => {
    navigate(`/canva-clone/${template._id}`, { state: { template } });
  };
  
  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h2>All Templates</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
        {templates.map((template) => (
          <div
            key={template._id}
            style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer' }}
            onClick={() => handleTemplateClick(template)}
          >
            <img src={template.thumbnailUrl} alt={template.name} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
            <div style={{ padding: '1rem' }}>
              <h3>{template.name}</h3>
              <p>{template.description}</p>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <TemplatePreviewModal
          template={selectedTemplate}
          onClose={handleCloseModal}
          onEdit={handleEditTemplate}
        />
      )}
    </div>
  );
};

export default Templates;
