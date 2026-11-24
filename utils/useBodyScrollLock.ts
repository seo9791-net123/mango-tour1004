import { useEffect } from 'react';

let activeLockCount = 0;
let savedHtmlOverflow = '';
let savedHtmlOverflowY = '';
let savedHtmlOverscroll = '';
let savedBodyOverflow = '';
let savedBodyOverflowY = '';
let savedBodyOverscroll = '';
let savedBodyPaddingRight = '';
let touchStartX = 0;
let touchStartY = 0;
let listenersAttached = false;

function handleTouchStart(e: TouchEvent) {
  if (e.touches.length === 1) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }
}

function handleTouchMove(e: TouchEvent) {
  if (e.touches.length !== 1) return;

  const touch = e.touches[0];
  const deltaX = touch.clientX - touchStartX;
  const deltaY = touch.clientY - touchStartY;

  const rawTarget = e.target as Node | null;
  let el: HTMLElement | null =
    rawTarget && rawTarget.nodeType === Node.ELEMENT_NODE
      ? (rawTarget as HTMLElement)
      : rawTarget?.parentElement ?? null;

  const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);

  while (el && el !== document.body && el !== document.documentElement) {
    const style = window.getComputedStyle(el);

    if (isHorizontalSwipe) {
      const canScrollX =
        (style.overflowX === 'auto' || style.overflowX === 'scroll') &&
        el.scrollWidth > el.clientWidth + 1;
      if (canScrollX) {
        const atLeft = el.scrollLeft <= 0;
        const atRight = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
        if (!(deltaX > 0 && atLeft) && !(deltaX < 0 && atRight)) {
          return;
        }
      }
    } else {
      const canScrollY =
        (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
        el.scrollHeight > el.clientHeight + 1;
      if (canScrollY) {
        const isScrollingUp = deltaY > 0;
        const isScrollingDown = deltaY < 0;
        const atTop = el.scrollTop <= 0;
        const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;

        if (!(isScrollingUp && atTop) && !(isScrollingDown && atBottom)) {
          return;
        }
      }
    }

    el = el.parentElement;
  }

  if (e.cancelable) {
    e.preventDefault();
  }
}

function acquireScrollLock() {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  if (activeLockCount === 0) {
    const html = document.documentElement;
    const body = document.body;

    savedHtmlOverflow = html.style.overflow;
    savedHtmlOverflowY = html.style.overflowY;
    savedHtmlOverscroll = html.style.overscrollBehavior;
    savedBodyOverflow = body.style.overflow;
    savedBodyOverflowY = body.style.overflowY;
    savedBodyOverscroll = body.style.overscrollBehavior;
    savedBodyPaddingRight = body.style.paddingRight;

    const scrollbarWidth = window.innerWidth - html.clientWidth;
    if (scrollbarWidth > 0) {
      const computedPaddingRight = parseFloat(window.getComputedStyle(body).paddingRight) || 0;
      body.style.paddingRight = `${computedPaddingRight + scrollbarWidth}px`;
    }

    html.style.overflow = 'hidden';
    html.style.overflowY = 'hidden';
    html.style.overscrollBehavior = 'none';
    body.style.overflow = 'hidden';
    body.style.overflowY = 'hidden';
    body.style.overscrollBehavior = 'none';

    if (!listenersAttached) {
      document.addEventListener('touchstart', handleTouchStart, { passive: true });
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      listenersAttached = true;
    }
  }

  activeLockCount += 1;
}

function releaseScrollLock() {
  if (typeof document === 'undefined') return;

  activeLockCount = Math.max(0, activeLockCount - 1);

  if (activeLockCount === 0) {
    const html = document.documentElement;
    const body = document.body;

    html.style.overflow = savedHtmlOverflow;
    html.style.overflowY = savedHtmlOverflowY;
    html.style.overscrollBehavior = savedHtmlOverscroll;
    body.style.overflow = savedBodyOverflow;
    body.style.overflowY = savedBodyOverflowY;
    body.style.overscrollBehavior = savedBodyOverscroll;
    body.style.paddingRight = savedBodyPaddingRight;

    if (listenersAttached) {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      listenersAttached = false;
    }
  }
}

/**
 * Reference-counted body scroll lock for detail modals and popups.
 * Prevents background page scrolling on both desktop and mobile (including iOS Safari touch-drag).
 */
export function useBodyScrollLock(isLocked: boolean): void {
  useEffect(() => {
    if (!isLocked) return;
    acquireScrollLock();
    return () => {
      releaseScrollLock();
    };
  }, [isLocked]);
}
