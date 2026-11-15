import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  isExiting: boolean;
}

const LOADING_MESSAGES = [
  '베트남의 푸른 필드로 떠날 준비 중!',
  '나만의 프라이빗 휴양을 세팅하고 있어요',
  '설레는 맞춤 여행을 불러오는 중...'
];

const SplashScreen: React.FC<SplashScreenProps> = ({ isExiting }) => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 1500);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div
      aria-live="polite"
      aria-label="망고투어 로딩 화면"
      className={`fixed inset-0 z-[10050] flex flex-col items-center justify-center px-6 text-center overflow-hidden select-none transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        isExiting
          ? '-translate-y-full opacity-0 pointer-events-none'
          : 'translate-y-0 opacity-100'
      }`}
      style={{
        backgroundColor: '#FFFDF7',
        backgroundImage: [
          'radial-gradient(circle at 18% 20%, rgba(254, 240, 138, 0.48) 0%, rgba(254, 240, 138, 0) 48%)',
          'radial-gradient(circle at 84% 24%, rgba(167, 243, 208, 0.36) 0%, rgba(167, 243, 208, 0) 46%)',
          'radial-gradient(circle at 52% 84%, rgba(209, 250, 229, 0.45) 0%, rgba(254, 249, 195, 0.28) 45%, rgba(255, 253, 247, 0) 75%)',
          'linear-gradient(160deg, #FFFDF7 0%, #F7FDF9 52%, #FFFBEB 100%)'
        ].join(', ')
      }}
    >
      {/* Subtle decorative resort horizon glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -left-24 w-80 h-80 rounded-full blur-3xl opacity-50"
        style={{ background: 'radial-gradient(circle, rgba(250,204,21,0.22) 0%, transparent 70%)' }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -right-24 w-96 h-96 rounded-full blur-3xl opacity-55"
        style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 70%)' }}
      />

      <div className="relative z-10 flex flex-col items-center w-full max-w-md">
        {/* Flight Path & Airplane SVG Animation */}
        <div className="w-[290px] xs:w-[320px] sm:w-[360px] mb-5 sm:mb-6">
          <svg
            viewBox="0 0 360 156"
            className="w-full h-auto overflow-visible"
            role="img"
            aria-label="망고투어 비행기 궤적 애니메이션"
          >
            <defs>
              <linearGradient id="mangoSkyGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FDE047" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#A7F3D0" stopOpacity="0.2" />
              </linearGradient>
              <linearGradient id="mangoRouteGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0A7E54" stopOpacity="0.35" />
                <stop offset="55%" stopColor="#EAB308" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#0A7E54" stopOpacity="0.95" />
              </linearGradient>
              <path
                id="mango-flight-curve"
                d="M 28 118 C 82 118, 108 42, 178 62 C 234 78, 266 28, 330 42"
              />
            </defs>

            {/* Warm Resort Sun */}
            <circle cx="294" cy="40" r="24" fill="url(#mangoSkyGlow)" />
            <circle cx="294" cy="40" r="11" fill="#FACC15" fillOpacity="0.65" />

            {/* Soft Rolling Fairway Hills */}
            <path
              d="M 18 134 Q 95 104 176 126 T 342 122 L 342 142 L 18 142 Z"
              fill="#D1FAE5"
              fillOpacity="0.55"
            />
            <path
              d="M 48 138 Q 145 116 238 132 T 342 130 L 342 144 L 48 144 Z"
              fill="#A7F3D0"
              fillOpacity="0.35"
            />

            {/* Soft Cloud Accents */}
            <g fill="#FFFFFF" fillOpacity="0.88">
              <path d="M 76 48 a 9 9 0 0 1 17 -3 a 11 11 0 0 1 20 2 a 8 8 0 0 1 2 15 H 76 a 7 7 0 0 1 0 -14 Z" />
              <path d="M 218 26 a 7 7 0 0 1 13 -2 a 8 8 0 0 1 15 2 a 6 6 0 0 1 1 11 H 218 a 5.5 5.5 0 0 1 0 -11 Z" />
            </g>

            {/* Base Dashed Flight Trajectory */}
            <use
              href="#mango-flight-curve"
              fill="none"
              stroke="#0A7E54"
              strokeOpacity="0.2"
              strokeWidth="2.5"
              strokeDasharray="6 7"
              strokeLinecap="round"
            />

            {/* Animated Traveling Dashed Highlight */}
            <use
              href="#mango-flight-curve"
              fill="none"
              stroke="url(#mangoRouteGrad)"
              strokeWidth="2.8"
              strokeDasharray="7 9"
              strokeLinecap="round"
              className="mango-dash-flow"
            />

            {/* Departure Marker */}
            <circle cx="28" cy="118" r="5" fill="#FFFDF7" stroke="#0A7E54" strokeWidth="2.5" />
            <circle cx="28" cy="118" r="2" fill="#FACC15" />

            {/* Destination Resort Pin / Golf Flag */}
            <g transform="translate(330, 42)">
              <circle cx="0" cy="0" r="5" fill="#0A7E54" />
              <circle cx="0" cy="0" r="2" fill="#FACC15" />
              <line x1="0" y1="0" x2="0" y2="-16" stroke="#0A7E54" strokeWidth="2" strokeLinecap="round" />
              <path d="M 0 -16 L 13 -11.5 L 0 -7 Z" fill="#FACC15" stroke="#0A7E54" strokeWidth="1" strokeLinejoin="round" />
            </g>

            {/* Airplane Following the Curved Dashed Path */}
            <g>
              <animateMotion
                dur="2.8s"
                repeatCount="indefinite"
                rotate="auto"
                calcMode="linear"
              >
                <mpath href="#mango-flight-curve" />
              </animateMotion>

              {/* Soft shadow beneath plane */}
              <ellipse cx="-2" cy="8" rx="12" ry="3" fill="#0A7E54" fillOpacity="0.14" />

              {/* Airplane Vector (Nose pointing +X) */}
              <g transform="translate(0, 0)">
                {/* Tail Fin (Mango Yellow) */}
                <path
                  d="M -15 -1 L -21 -10 L -13 -9 L -7 -1 Z"
                  fill="#FACC15"
                  stroke="#0A7E54"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
                {/* Lower Wing / Back Wing (Deep Green) */}
                <path
                  d="M -4 -3 L -9 -14 L -2 -14 L 5 -3 Z"
                  fill="#086945"
                />
                {/* Main Fuselage (Deep Green + Cream Belly) */}
                <path
                  d="M -17 1 C -17 -3, -10 -5, 4 -5 C 14 -5, 21 -2, 23 0.5 C 21 3, 13 4.5, 2 4.5 C -9 4.5, -16 3.2, -17 1 Z"
                  fill="#0A7E54"
                />
                {/* Signature Mango Yellow Nose & Window Stripe */}
                <path
                  d="M -9 -1.2 H 14 C 17 -1.2, 20 -0.4, 21.5 0.5 C 19.5 1.2, 16 1.5, 13 1.5 H -10 Z"
                  fill="#FACC15"
                />
                {/* Cockpit Window */}
                <path
                  d="M 13 -3.2 C 16 -3.2, 18.5 -2, 19.5 -0.8 H 13 Z"
                  fill="#FFFDF7"
                  fillOpacity="0.92"
                />
                {/* Foreground Wing (Mango Yellow + Deep Green Tip) */}
                <path
                  d="M -1 2 L -8 15 L -1 15 L 8 2 Z"
                  fill="#FDE047"
                  stroke="#0A7E54"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
                <path
                  d="M -8 15 L -1 15 L -3 11.5 L -6.5 11.5 Z"
                  fill="#0A7E54"
                />
              </g>
            </g>
          </svg>
        </div>

        {/* Clean Brand Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[12px] bg-[#0A7E54] flex items-center justify-center shadow-sm ring-2 ring-[#FACC15]/50">
            <span className="text-[#FDE047] font-black text-base sm:text-lg tracking-tight">M</span>
          </div>
          <h1 className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-gray-900 uppercase leading-none">
            MANGO TOUR
          </h1>
        </div>

        {/* Smooth 1.5s Crossfading Messages */}
        <div className="relative h-7 w-full max-w-xs sm:max-w-sm mt-1">
          {LOADING_MESSAGES.map((msg, idx) => {
            const isActive = idx === messageIndex;
            return (
              <p
                key={msg}
                aria-hidden={!isActive}
                className={`absolute inset-0 flex items-center justify-center text-sm sm:text-[15px] font-semibold text-[#0A7E54] tracking-tight transition-all duration-500 ease-out whitespace-nowrap ${
                  isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1.5 pointer-events-none'
                }`}
              >
                {msg}
              </p>
            );
          })}
        </div>

        {/* Subtle Resort Progress Hairline */}
        <div className="mt-5 w-40 h-1 rounded-full bg-[#0A7E54]/12 overflow-hidden">
          <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-[#0A7E54] via-[#EAB308] to-[#0A7E54] mango-progress-slide" />
        </div>
      </div>

      <style>{`
        @keyframes mangoDashFlow {
          from { stroke-dashoffset: 32; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes mangoProgressSlide {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
          100% { transform: translateX(220%); }
        }
        .mango-dash-flow {
          animation: mangoDashFlow 1.2s linear infinite;
        }
        .mango-progress-slide {
          animation: mangoProgressSlide 1.6s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .mango-dash-flow,
          .mango-progress-slide {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
