import React, { useState, useRef } from 'react';

interface Props {
  images: string[];
  activeIdx: number;
  onIdxChange: (idx: number) => void;
  altPrefix?: string;
}

const AdaptiveImageViewer: React.FC<Props> = ({
  images,
  activeIdx,
  onIdxChange,
  altPrefix = 'Photo',
}) => {
  const [fitMode, setFitMode] = useState<'contain' | 'cover'>('contain');
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragStartRef = useRef({ x: 0, y: 0 });

  if (!images || images.length === 0) return null;
  const currentImg = images[activeIdx] || images[0];

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onIdxChange((activeIdx + 1) % images.length);
    setZoomScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onIdxChange((activeIdx - 1 + images.length) % images.length);
    setZoomScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomScale((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomScale((prev) => {
      const next = Math.max(prev - 0.25, 1);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const toggleFitMode = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFitMode((prev) => (prev === 'contain' ? 'cover' : 'contain'));
    setZoomScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Drag handlers for zoomed image
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomScale <= 1) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoomScale <= 1) return;
    setPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div className="space-y-2.5 w-full select-none">
      {/* Dynamic Main Photo Container */}
      <div
        className="relative w-full h-[260px] xs:h-[320px] sm:h-[400px] md:h-[440px] rounded-2xl overflow-hidden bg-gray-950 flex items-center justify-center shadow-lg border border-gray-800 transition-all cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Ambient Blurred Background (renders photo proportions adaptively without dead borders) */}
        <img
          src={currentImg}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover filter blur-2xl opacity-35 scale-125 pointer-events-none transition-all duration-500"
        />

        {/* Foreground Adaptive Image */}
        <img
          src={currentImg}
          alt={`${altPrefix} ${activeIdx + 1}`}
          style={{
            transform: `scale(${zoomScale}) translate(${position.x / zoomScale}px, ${position.y / zoomScale}px)`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
          }}
          className={`relative z-10 max-h-full max-w-full duration-300 ${
            fitMode === 'contain' ? 'object-contain' : 'w-full h-full object-cover'
          }`}
          onClick={() => {
            if (zoomScale === 1) {
              setZoomScale(1.5);
            } else {
              setZoomScale(1);
              setPosition({ x: 0, y: 0 });
            }
          }}
        />

        {/* Top Floating Control Bar: Active Size & Fit Controls */}
        <div className="absolute top-2.5 left-2.5 right-2.5 z-20 flex items-center justify-between pointer-events-none gap-2">
          {/* Badge: Photo Counter & Fit Indicator */}
          <div className="pointer-events-auto bg-black/60 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 shadow-md">
            <span>📷 {activeIdx + 1} / {images.length}</span>
            <span className="opacity-40">|</span>
            <span className="text-gold-300">{fitMode === 'contain' ? '원본비율' : '채우기'}</span>
            {zoomScale > 1 && (
              <span className="text-emerald-400 font-extrabold">{Math.round(zoomScale * 100)}%</span>
            )}
          </div>

          {/* Right Floating Quick Action Buttons */}
          <div className="pointer-events-auto flex items-center gap-1.5 bg-black/60 backdrop-blur-md p-1 rounded-full shadow-md">
            {/* Fit Mode Toggle */}
            <button
              type="button"
              onClick={toggleFitMode}
              className="px-2.5 py-1 text-white hover:text-gold-300 text-[11px] font-bold rounded-full hover:bg-white/10 transition flex items-center gap-1 cursor-pointer"
              title={fitMode === 'contain' ? '화면 가득 채우기' : '원본 비율로 전체보기'}
            >
              <span>{fitMode === 'contain' ? '🔲 채우기' : '🖼️ 원본 비율'}</span>
            </button>

            {/* Zoom In/Out Controls */}
            <div className="hidden xs:flex items-center gap-0.5 border-l border-white/20 pl-1.5">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomScale <= 1}
                className="w-6 h-6 flex items-center justify-center text-white hover:text-gold-300 font-black rounded-full hover:bg-white/10 transition disabled:opacity-30 cursor-pointer text-xs"
                title="축소"
              >
                －
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="px-1.5 py-0.5 text-[10px] text-gray-300 hover:text-white font-mono rounded hover:bg-white/10 transition cursor-pointer"
                title="100% 리셋"
              >
                {Math.round(zoomScale * 100)}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomScale >= 3}
                className="w-6 h-6 flex items-center justify-center text-white hover:text-gold-300 font-black rounded-full hover:bg-white/10 transition disabled:opacity-30 cursor-pointer text-xs"
                title="확대"
              >
                ＋
              </button>
            </div>

            {/* Fullscreen Expand Lightbox Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsFullscreen(true);
              }}
              className="w-7 h-7 flex items-center justify-center text-white hover:text-gold-300 font-bold rounded-full hover:bg-white/10 transition cursor-pointer text-xs"
              title="전체화면 크게보기"
              aria-label="전체화면 크게보기"
            >
              🔍
            </button>
          </div>
        </div>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 bg-black/40 hover:bg-black/75 text-white rounded-full flex items-center justify-center transition backdrop-blur-md active:scale-95 cursor-pointer font-bold shadow-md"
              aria-label="이전 사진"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 bg-black/40 hover:bg-black/75 text-white rounded-full flex items-center justify-center transition backdrop-blur-md active:scale-95 cursor-pointer font-bold shadow-md"
              aria-label="다음 사진"
            >
              ›
            </button>
          </>
        )}

        {/* Hint on bottom */}
        <div className="absolute bottom-2 right-3 z-20 pointer-events-none text-[10px] text-white/60 bg-black/40 px-2 py-0.5 rounded-md backdrop-blur-sm">
          {zoomScale > 1 ? '드래그하여 이동 | 클릭 시 리셋' : '클릭 또는 돋보기로 확대'}
        </div>
      </div>

      {/* Thumbnails Row */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide pt-1">
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                onIdxChange(idx);
                setZoomScale(1);
                setPosition({ x: 0, y: 0 });
              }}
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 transition relative ${
                activeIdx === idx
                  ? 'border-gold-500 scale-105 shadow-md ring-2 ring-gold-400/30'
                  : 'border-transparent opacity-60 hover:opacity-90'
              }`}
            >
              <img src={img} className="w-full h-full object-cover" alt={`Thumb ${idx + 1}`} />
              <div className="absolute bottom-0 right-0 bg-black/60 text-white text-[9px] px-1 rounded-tl font-bold">
                {idx + 1}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ================= FULLSCREEN LIGHTBOX MODAL ================= */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-[10020] bg-black/95 flex flex-col justify-between p-3 sm:p-6 backdrop-blur-xl animate-fade-in"
          onClick={() => setIsFullscreen(false)}
        >
          {/* Top Bar in Lightbox */}
          <div className="flex items-center justify-between text-white shrink-0 z-30" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base text-gold-400">
                사진 상세 크게보기 ({activeIdx + 1} / {images.length})
              </span>
              <button
                type="button"
                onClick={toggleFitMode}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 text-xs font-bold rounded-lg transition"
              >
                {fitMode === 'contain' ? '🔲 채우기' : '🖼️ 원본 비율'}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomScale <= 1}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold disabled:opacity-30"
              >
                －
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="px-2 py-1 bg-white/10 hover:bg-white/20 text-xs font-mono rounded"
              >
                {Math.round(zoomScale * 100)}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomScale >= 3}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold disabled:opacity-30"
              >
                ＋
              </button>
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white font-bold ml-2 text-sm"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Fullscreen Photo Area */}
          <div
            className="flex-1 relative flex items-center justify-center overflow-hidden my-3 cursor-grab active:cursor-grabbing"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            <img
              src={currentImg}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover filter blur-3xl opacity-25 scale-125 pointer-events-none"
            />
            <img
              src={currentImg}
              alt={`${altPrefix} full`}
              style={{
                transform: `scale(${zoomScale}) translate(${position.x / zoomScale}px, ${position.y / zoomScale}px)`,
                transition: isDragging ? 'none' : 'transform 0.2s ease-out',
              }}
              className={`relative z-10 max-h-[85vh] max-w-[95vw] ${
                fitMode === 'contain' ? 'object-contain' : 'w-full h-full object-cover'
              }`}
            />

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-black/50 hover:bg-black/80 text-white rounded-full flex items-center justify-center text-xl font-bold backdrop-blur-md"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-black/50 hover:bg-black/80 text-white rounded-full flex items-center justify-center text-xl font-bold backdrop-blur-md"
                >
                  ›
                </button>
              </>
            )}
          </div>

          {/* Lightbox Bottom Thumbnails */}
          {images.length > 1 && (
            <div className="flex justify-center gap-2 overflow-x-auto py-2 shrink-0 z-30" onClick={(e) => e.stopPropagation()}>
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    onIdxChange(idx);
                    setZoomScale(1);
                    setPosition({ x: 0, y: 0 });
                  }}
                  className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition ${
                    activeIdx === idx ? 'border-gold-500 scale-110 shadow-lg' : 'border-transparent opacity-50'
                  }`}
                >
                  <img src={img} className="w-full h-full object-cover" alt={`Thumb ${idx + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdaptiveImageViewer;
