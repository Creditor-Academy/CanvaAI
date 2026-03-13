import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiEye, FiTrash2 } from "react-icons/fi";
import api from "../../services/api";

export const ProjectCards = () => {
  const navigate = useNavigate();


  

  

  

  return (
    <div style={{
      width: "100%",
      maxWidth: 1320,
      margin: "0 auto", 
      padding: "28px 24px 20px 24px"
    }}>
      {/* Templates Section */}
      <div style={{ marginBottom: 40 }}>
        <div 
          onClick={() => navigate('/projects/templates')}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            marginBottom: 20,
            cursor: 'pointer',
            padding: '12px',
            borderRadius: 12,
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <h2 style={{ 
            margin: 0, 
            fontSize: '1.5rem', 
            fontWeight: 700, 
            color: '#0f172a',
            letterSpacing: '-0.02em'
          }}>
            Templates
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ 
              color: '#64748b', 
              fontWeight: 600,
              fontSize: '0.9375rem',
              background: '#f1f5f9',
              padding: '6px 12px',
              borderRadius: 12
            }}>
              Browse templates
            </span>
            <span style={{ color: '#8b5cf6', fontSize: '0.875rem', fontWeight: 600 }}>
              View all →
            </span>
          </div>
        </div>
        <div style={{ 
          background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
          border: '1.5px solid #e2e8f0',
          borderRadius: 20,
          padding: 40,
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s',
        }}
        onClick={() => navigate('/projects/templates')}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 12px 32px rgba(139, 92, 246, 0.15)';
          e.currentTarget.style.borderColor = '#8b5cf6';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.borderColor = '#e2e8f0';
        }}
        >
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>📄</div>
          <div style={{ fontWeight: 600, fontSize: '1.1rem', color: '#0f172a', marginBottom: 8 }}>
            Explore Templates
          </div>
          <div style={{ color: '#64748b', fontSize: '0.95rem' }}>
            Browse and use pre-designed templates for your projects
          </div>
        </div>
      </div>

     

    </div>
  );
};

export default ProjectCards;
