import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in React tree:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', fontFamily: 'sans-serif', textAlign: 'center', backgroundColor: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ backgroundColor: '#ffffff', padding: '32px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', maxWidth: '500px' }}>
            <h2 style={{ color: '#004d40', marginBottom: '12px', fontSize: '24px', fontWeight: 'bold' }}>MANGO TOUR 시스템 안내</h2>
            <p style={{ color: '#475569', marginBottom: '20px', fontSize: '15px', lineHeight: '1.6' }}>
              화면을 불러오는 도중 잠시 문제가 발생했습니다.<br />아래 버튼을 눌러 초기 데이터 상태로 복구하실 수 있습니다.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  localStorage.clear();
                  sessionStorage.clear();
                  window.location.reload();
                }}
                style={{ backgroundColor: '#004d40', color: '#ffffff', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                캐시 삭제 및 새로고침
              </button>
            </div>
            {this.state.error && (
              <details style={{ marginTop: '20px', textAlign: 'left', backgroundColor: '#f1f5f9', padding: '12px', borderRadius: '8px', fontSize: '12px', color: '#64748b', overflowX: 'auto' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>상세 오류 보기</summary>
                <pre style={{ marginTop: '8px', whiteSpace: 'pre-wrap' }}>{this.state.error.toString()}</pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
