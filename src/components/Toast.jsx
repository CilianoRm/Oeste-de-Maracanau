export function Toast({ toast }) { if (!toast) return null; return <div className={`toast ${toast.type || 'success'}`}><span>{toast.type === 'error' ? '!' : '✓'}</span>{toast.message}</div> }
