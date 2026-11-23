import { useEffect } from 'react';

const LOCKED_VIEWPORT_CONTENT =
  'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';

/**
 * Locks viewport pinch-zoom and horizontal multi-touch gestures ONLY while
 * the quotation modal ('여행 견적 및 일정 안내서') is open, and restores the
 * previous viewport meta content immediately when closed/unmounted.
 */
export function useQuotationMobileLock(isActive: boolean): void {
  useEffect(() => {
    if (!isActive || typeof document === 'undefined') return;

    const viewportMeta = document.querySelector('meta[name="viewport"]');
    const prevViewportContent = viewportMeta?.getAttribute('content') ?? null;

    if (viewportMeta) {
      viewportMeta.setAttribute('content', LOCKED_VIEWPORT_CONTENT);
    }

    const preventGesture = (e: Event) => {
      e.preventDefault();
    };

    const preventMultiTouch = (e: TouchEvent) => {
      if (e.touches && e.touches.length > 1) {
        e.preventDefault();
      }
    };

    const preventCtrlWheelZoom = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };

    document.addEventListener('gesturestart', preventGesture, { passive: false });
    document.addEventListener('gesturechange', preventGesture, { passive: false });
    document.addEventListener('gestureend', preventGesture, { passive: false });
    document.addEventListener('touchstart', preventMultiTouch, { passive: false });
    document.addEventListener('touchmove', preventMultiTouch, { passive: false });
    document.addEventListener('wheel', preventCtrlWheelZoom, { passive: false });

    return () => {
      if (viewportMeta) {
        if (prevViewportContent !== null) {
          viewportMeta.setAttribute('content', prevViewportContent);
        } else {
          viewportMeta.removeAttribute('content');
        }
      }

      document.removeEventListener('gesturestart', preventGesture);
      document.removeEventListener('gesturechange', preventGesture);
      document.removeEventListener('gestureend', preventGesture);
      document.removeEventListener('touchstart', preventMultiTouch);
      document.removeEventListener('touchmove', preventMultiTouch);
      document.removeEventListener('wheel', preventCtrlWheelZoom);
    };
  }, [isActive]);
}
