import React from 'react';
import { Palette, Share2, Bot, Play } from 'lucide-react';
import '../../globals.css';

const TopBarRow1 = ({ onPresent }) => {
    return (
        <div style={{
            height: '50px',
            display: 'flex',
            alignItems: 'center',
            padding: '0 20px',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--editor-border)',
            background: 'white'
        }}>
            {/* Left: Project Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                    type="text"
                    defaultValue="Untitled Project"
                    className="editor-input-title"
                />
            </div>

            {/* Right: Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button className="editor-btn-icon" title="Theme">
                    <Palette size={18} />
                </button>

                <button className="editor-btn-icon" title="Share">
                    <Share2 size={18} />
                </button>

                <button className="editor-btn-icon" title="Agent">
                    <Bot size={18} />
                </button>

                <div style={{ width: '1px', height: '20px', background: '#e5e7eb', margin: '0 4px' }} />

                <button
                    className="editor-btn-primary"
                    onClick={onPresent}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                    <Play size={16} fill="currentColor" />
                    Present
                </button>
            </div>
        </div>
    );
};

export default TopBarRow1;
