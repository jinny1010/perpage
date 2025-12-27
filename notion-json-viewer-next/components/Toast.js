import { useState, useEffect, createContext, useContext } from 'react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const showConfirm = (message, onConfirm, onCancel) => {
    const id = Date.now();
    setToasts(prev => [...prev, { 
      id, 
      message, 
      type: 'confirm',
      onConfirm: () => {
        setToasts(prev => prev.filter(t => t.id !== id));
        onConfirm?.();
      },
      onCancel: () => {
        setToasts(prev => prev.filter(t => t.id !== id));
        onCancel?.();
      }
    }]);
  };

  return (
    <ToastContext.Provider value={{ showToast, showConfirm }}>
      {children}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            {toast.type === 'confirm' ? (
              <>
                <p>{toast.message}</p>
                <div className="toast-buttons">
                  <button className="toast-btn toast-cancel" onClick={toast.onCancel}>취소</button>
                  <button className="toast-btn toast-confirm" onClick={toast.onConfirm}>확인</button>
                </div>
              </>
            ) : (
              <>
                <span className="toast-icon">
                  {toast.type === 'success' && '✓'}
                  {toast.type === 'error' && '✕'}
                  {toast.type === 'info' && 'ℹ'}
                </span>
                <span>{toast.message}</span>
              </>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
