import React, { useState, useEffect } from 'react';

const ProjectNameModal = ({ open, onClose, onConfirm, initialName }) => {
    const [name, setName] = useState(initialName || '');

    useEffect(() => {
        if (open) {
            setName(initialName || '');
        }
    }, [open, initialName]);

    if (!open) return null;

    const handleConfirm = () => {
        if (name.trim()) {
            onConfirm(name.trim());
        } else {
            alert("Please enter a project name");
        }
    };

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2000
            }}
            onClick={onClose}
        >
            <div
                style={{
                    width: 400,
                    maxWidth: '90%',
                    background: 'white',
                    borderRadius: 12,
                    boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
                    padding: 24,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontWeight: 700, fontSize: 18, color: '#111827' }}>Save Project</div>
                    <button
                        onClick={onClose}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 20, color: '#6b7280' }}
                    >
                        ×
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>Project Name</label>
                    <input
                        autoFocus
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                        placeholder="Enter project name..."
                        style={{
                            padding: '10px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: 8,
                            fontSize: 14,
                            outline: 'none',
                            transition: 'border-color 0.2s',
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                        onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                    />
                </div>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '10px 16px',
                            border: '1px solid #e5e7eb',
                            borderRadius: 8,
                            background: 'white',
                            cursor: 'pointer',
                            fontSize: 14,
                            fontWeight: 500
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        style={{
                            padding: '10px 24px',
                            border: 'none',
                            borderRadius: 8,
                            background: '#2563eb',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: 14,
                            fontWeight: 600,
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProjectNameModal;
