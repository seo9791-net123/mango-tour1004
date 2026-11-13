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
        <div style={{ padding: '40px', fontFamily: "'Pretendard', 'Pretendard Variable', -apple-system, BlinkMacSystemFont, system-ui, sans-serif", textAlign: 'center', backgroundColor: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ backgroundColor: '#ffffff', padding: '32px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', maxWidth: '500px' }}>
            <h2 style={{ color: '#004d40', marginBottom: '12px', fontSize: '24px', fontWeight: 'bold' }}>MANGO TOUR 시스템 안내</h2>
            <p style={{ color: '#475569', marginBottom: '20px', fontSize: '15px', lineHeight: '1.6' }}>
              화면을 불러오는 도중 잠시 문제가 발생했습니다.<br />아래 버튼을 눌러 초기 데이터 상태로 복구하실 수 있습니다.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={async () => {
                  try {
                    localStorage.clear();
                    sessionStorage.clear();
                    if ('serviceWorker' in navigator) {
                      const regs = await navigator.serviceWorker.getRegistrations();
                      await Promise.all(regs.map((r) => r.unregister()));
                    }
                    if ('caches' in window) {
                      const names = await caches.keys();
                      await Promise.all(names.map((n) => caches.delete(n)));
                    }
                  } catch {
                    // ignore cleanup error
                  }
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

// 기존 등록된 서비스 워커(sw.js) 모두 해제 및 캐시 스토리지 자동 삭제
const clearLegacyServiceWorkersAndCaches = async () => {
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      if (registrations && registrations.length > 0) {
        await Promise.all(registrations.map((reg) => reg.unregister()));
        console.log('🧹 Legacy Service Workers unregistered.');
      }
      navigator.serviceWorker.addEventListener?.('message', (event) => {
        if (event.data?.type === 'SW_CLEANED_UP') {
          window.location.reload();
        }
      });
    }
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      if (cacheNames && cacheNames.length > 0) {
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
        console.log('🧹 Legacy Cache Storage cleared.');
      }
    }
  } catch (e) {
    console.warn('ServiceWorker/Cache cleanup skipped:', e);
  }
};

clearLegacyServiceWorkersAndCaches();

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
