import React from 'react';

const Loading = () => {
  return (
    <div style={styles.container}>
      <div style={styles.spinner}></div>
      <p style={styles.text}>Loading...</p>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#F9FAFB'
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '4px solid #E5E7EB',
    borderTop: '4px solid #4F46E5',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  text: {
    marginTop: '1rem',
    color: '#6B7280',
    fontSize: '1rem'
  }
};

export default Loading;