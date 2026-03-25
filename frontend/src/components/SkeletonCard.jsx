import React from 'react';

const SkeletonCard = () => {
  return (
    <div style={styles.card}>
      <div className="skeleton" style={styles.preview} />
      <div style={styles.info}>
        <div style={styles.textGroup}>
          <div className="skeleton" style={styles.title} />
          <div className="skeleton" style={styles.subtitle} />
        </div>
      </div>
    </div>
  );
};

const styles = {
  card: {
    background: '#fff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    height: '210px', // Matches the combined height of preview (140px) + info (ca. 70px)
  },
  preview: {
    height: '140px',
    width: '100%',
  },
  info: {
    padding: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textGroup: {
    flex: 1,
  },
  title: {
    height: '16px',
    width: '70%',
    borderRadius: '4px',
    marginBottom: '8px',
  },
  subtitle: {
    height: '12px',
    width: '40%',
    borderRadius: '4px',
  },
};

export default SkeletonCard;
