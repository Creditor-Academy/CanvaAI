import React from 'react';

const OPTIONS = [
  { id: 'low', title: 'Low', description: 'Visual heavy' },
  { id: 'medium', title: 'Medium', description: 'Balanced' },
  { id: 'high', title: 'High', description: 'Text heavy' },
];

const TextAmountSelector = ({ value, onChange }) => (
  <div className="ps-field-block">
    <label className="ps-field-label">Text Amount</label>
    <div className="ps-text-amount-grid">
      {OPTIONS.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-pressed={value === option.id}
          className={`ps-text-amount-card ${value === option.id ? 'active' : ''}`}
          onClick={() => onChange(option.id)}
        >
          <span className="ps-text-amount-title">{option.title}</span>
          <span className="ps-text-amount-description">{option.description}</span>
        </button>
      ))}
    </div>
  </div>
);

export default TextAmountSelector;
