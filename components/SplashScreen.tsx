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
        {/* Flight Path, Airplane & Vietnam Map Illustration */}
        <div className="relative w-[300px] xs:w-[330px] sm:w-[380px] aspect-[380/164] mb-5 sm:mb-6">
          {/* Layer 1: Background Sky, Sun & Horizon */}
          <svg
            viewBox="0 0 380 164"
            className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="mangoSkyGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FDE047" stopOpacity="0.42" />
                <stop offset="100%" stopColor="#A7F3D0" stopOpacity="0.18" />
              </linearGradient>
            </defs>

            {/* Warm Resort Sun Behind Vietnam */}
            <circle cx="328" cy="44" r="26" fill="url(#mangoSkyGlow)" />
            <circle cx="328" cy="44" r="11" fill="#FACC15" fillOpacity="0.45" />

            {/* Soft Rolling Horizon Accent */}
            <path
              d="M 18 144 Q 108 118 196 138 T 358 134 L 358 154 L 18 154 Z"
              fill="#D1FAE5"
              fillOpacity="0.42"
            />

            {/* Soft Cloud Accents */}
            <g fill="#FFFFFF" fillOpacity="0.88">
              <path d="M 84 48 a 8.5 8.5 0 0 1 16 -2.5 a 10 10 0 0 1 19 2 a 7.5 7.5 0 0 1 2 14 H 84 a 6.5 6.5 0 0 1 0 -13.5 Z" />
              <path d="M 210 24 a 6.5 6.5 0 0 1 12 -2 a 7.5 7.5 0 0 1 14 2 a 5.5 5.5 0 0 1 1 10.5 H 210 a 5 5 0 0 1 0 -10.5 Z" />
            </g>
          </svg>

          {/* Layer 2: User-Provided Illustrated Vietnam Map */}
          <div className="absolute right-[3%] top-[3%] bottom-[3%] w-[28%] flex items-center justify-center pointer-events-none select-none">
            <img
              src="/assets/aistudio/_____2026-11-15_213254-removebg-preview_499f2f5b.png"
              alt="베트남 지도"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain drop-shadow-[0_4px_10px_rgba(10,126,84,0.14)]"
            />
          </div>

          {/* Layer 3: Dashed Flight Trajectory, Pulsing Yellow Pin & Airplane */}
          <svg
            viewBox="0 0 380 164"
            className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
            role="img"
            aria-label="베트남 지도로 향하는 망고투어 비행기 궤적 애니메이션"
          >
            <defs>
              <linearGradient id="mangoRouteGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0A7E54" stopOpacity="0.32" />
                <stop offset="55%" stopColor="#EAB308" stopOpacity="0.82" />
                <stop offset="100%" stopColor="#0A7E54" stopOpacity="0.95" />
              </linearGradient>
              <path
                id="mango-flight-curve"
                d="M 32 114 C 92 114, 126 32, 198 52 C 250 66, 288 46, 330 96"
              />
            </defs>

            {/* Base Dashed Flight Trajectory */}
            <use
              href="#mango-flight-curve"
              fill="none"
              stroke="#0A7E54"
              strokeOpacity="0.22"
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

            {/* Departure Marker (Left) */}
            <circle cx="32" cy="114" r="5" fill="#FFFDF7" stroke="#0A7E54" strokeWidth="2.5" />
            <circle cx="32" cy="114" r="2" fill="#FACC15" />

            {/* Yellow Location Pin + Arrival Synchronized Pulse Ripples Overlaid on Vietnam Map */}
            <g transform="translate(330, 96)">
              {/* Synchronized Arrival Pulse Ring 1 */}
              <circle cx="0" cy="0" r="4" fill="none" stroke="#FACC15" strokeWidth="2.2" opacity="0">
                <animate
                  attributeName="r"
                  values="4;4;19;27"
                  keyTimes="0;0.55;0.82;1"
                  dur="2.8s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0;0;0.82;0"
                  keyTimes="0;0.55;0.74;1"
                  dur="2.8s"
                  repeatCount="indefinite"
                />
              </circle>

              {/* Synchronized Arrival Pulse Ring 2 */}
              <circle cx="0" cy="0" r="4" fill="none" stroke="#0A7E54" strokeWidth="1.6" opacity="0">
                <animate
                  attributeName="r"
                  values="4;4;16;23"
                  keyTimes="0;0.66;0.88;1"
                  dur="2.8s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0;0;0.5;0"
                  keyTimes="0;0.66;0.82;1"
                  dur="2.8s"
                  repeatCount="indefinite"
                />
              </circle>

              {/* Soft Glow Halo Around Pin Base */}
              <circle cx="0" cy="0" r="6" fill="#FACC15" opacity="0.28">
                <animate
                  attributeName="r"
                  values="6;6;11;6"
                  keyTimes="0;0.64;0.86;1"
                  dur="2.8s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.22;0.22;0.6;0.22"
                  keyTimes="0;0.64;0.86;1"
                  dur="2.8s"
                  repeatCount="indefinite"
                />
              </circle>

              {/* Pin Contact Shadow */}
              <ellipse cx="0" cy="0.5" rx="4.5" ry="2.2" fill="#0A7E54" fillOpacity="0.34" />

              {/* Yellow Location Pin Icon */}
              <g>
                <path
                  d="M 0 0 C -5 -6.5, -8.5 -10.5, -8.5 -15 C -8.5 -19.7, -4.7 -23.5, 0 -23.5 C 4.7 -23.5, 8.5 -19.7, 8.5 -15 C 8.5 -10.5, 5 -6.5, 0 0 Z"
                  fill="#FACC15"
                  stroke="#0A7E54"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <circle cx="0" cy="-14.8" r="3.2" fill="#FFFDF7" stroke="#0A7E54" strokeWidth="1.3" />
              </g>
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
                {/* Main Fuselage (Deep Green) */}
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
