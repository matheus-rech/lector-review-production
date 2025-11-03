import React from 'react';

interface LoadingProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  overlay?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({
  message = 'Loading...',
  size = 'medium',
  overlay = false,
}) => {
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { width: '20px', height: '20px', borderWidth: '2px' };
      case 'large':
        return { width: '60px', height: '60px', borderWidth: '6px' };
      default:
        return { width: '40px', height: '40px', borderWidth: '4px' };
    }
  };

  const sizeStyles = getSizeStyles();

  const spinner = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
      }}
    >
      <div
        style={{
          ...sizeStyles,
          border: `${sizeStyles.borderWidth} solid #e5e7eb`,
          borderTop: `${sizeStyles.borderWidth} solid #3b82f6`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
      {message && (
        <p
          style={{
            margin: 0,
            color: overlay ? 'white' : '#6b7280',
            fontSize: size === 'small' ? '12px' : size === 'large' ? '16px' : '14px',
            fontWeight: '500',
          }}
        >
          {message}
        </p>
      )}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );

  if (overlay) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9998,
        }}
      >
        {spinner}
      </div>
    );
  }

  return spinner;
};

interface LoadingBarProps {
  progress: number; // 0-100
  message?: string;
}

export const LoadingBar: React.FC<LoadingBarProps> = ({ progress, message }) => {
  return (
    <div style={{ width: '100%', padding: '16px' }}>
      {message && (
        <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#6b7280' }}>{message}</p>
      )}
      <div
        style={{
          width: '100%',
          height: '8px',
          backgroundColor: '#e5e7eb',
          borderRadius: '4px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${Math.min(100, Math.max(0, progress))}%`,
            height: '100%',
            backgroundColor: '#3b82f6',
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  );
};
