import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif', padding: '2rem'
        }}>
          <div style={{
            maxWidth: '480px', textAlign: 'center', background: 'white',
            borderRadius: '20px', padding: '3rem', boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', background: '#fef2f2',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem'
            }}>
              <span style={{ fontSize: '28px' }}>⚠️</span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.5rem' }}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                style={{
                  background: '#ef4444', color: 'white', border: 'none', borderRadius: '12px',
                  padding: '12px 24px', fontSize: '14px', fontWeight: 600, cursor: 'pointer'
                }}
              >
                Clear Data & Reload
              </button>
              <button
                onClick={() => window.location.href = '/shop'}
                style={{
                  background: 'white', color: '#0f172a', border: '1.5px solid #e2e8f0',
                  borderRadius: '12px', padding: '12px 24px', fontSize: '14px', fontWeight: 600, cursor: 'pointer'
                }}
              >
                Back to Shop
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

