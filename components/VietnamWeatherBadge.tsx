import React, { useEffect, useState } from 'react';

interface WeatherState {
  temp: number;
  icon: string;
  label: string;
  fetchedAt: number;
}

const HO_CHI_MINH_LAT = 10.8231;
const HO_CHI_MINH_LON = 106.6297;
const WEATHER_CACHE_KEY = 'mango_hcm_weather_v1';
const WEATHER_CACHE_TTL_MS = 10 * 60 * 1000; // 10분

function mapWmoWeatherCode(code: number, isDay: boolean): { icon: string; label: string } {
  if (code === 0) {
    return { icon: isDay ? '☀️' : '🌙', label: '맑음' };
  }
  if (code === 1) {
    return { icon: isDay ? '🌤️' : '🌙', label: '대체로 맑음' };
  }
  if (code === 2) {
    return { icon: '⛅', label: '구름 조금' };
  }
  if (code === 3) {
    return { icon: '☁️', label: '흐림' };
  }
  if (code === 45 || code === 48) {
    return { icon: '🌫️', label: '안개' };
  }
  if ((code >= 51 && code <= 57) || code === 80) {
    return { icon: '🌦️', label: '이슬비' };
  }
  if ((code >= 61 && code <= 67) || code === 81 || code === 82) {
    return { icon: '🌧️', label: '비' };
  }
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    return { icon: '❄️', label: '눈' };
  }
  if (code >= 95 && code <= 99) {
    return { icon: '⛈️', label: '뇌우' };
  }
  return { icon: '🌤️', label: '현지 날씨' };
}

function readCachedWeather(): WeatherState | null {
  try {
    const raw = sessionStorage.getItem(WEATHER_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<WeatherState>;
    if (
      typeof parsed.temp === 'number' &&
      typeof parsed.icon === 'string' &&
      typeof parsed.label === 'string' &&
      typeof parsed.fetchedAt === 'number' &&
      Date.now() - parsed.fetchedAt < WEATHER_CACHE_TTL_MS
    ) {
      return parsed as WeatherState;
    }
  } catch {
    // ignore storage access issues
  }
  return null;
}

const VietnamWeatherBadge: React.FC = () => {
  const [weather, setWeather] = useState<WeatherState | null>(() => readCachedWeather());

  useEffect(() => {
    let isMounted = true;
    let activeController: AbortController | null = null;

    const fetchWeather = async () => {
      activeController?.abort();
      const controller = new AbortController();
      activeController = controller;
      const timeoutId = window.setTimeout(() => controller.abort(), 6000);

      try {
        const url =
          `https://api.open-meteo.com/v1/forecast?latitude=${HO_CHI_MINH_LAT}&longitude=${HO_CHI_MINH_LON}` +
          `&current=temperature_2m,weather_code,is_day&timezone=Asia%2FHo_Chi_Minh`;

        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) return;

        const data = await res.json();
        const current = data?.current;
        if (!current || typeof current.temperature_2m !== 'number') return;

        const code = typeof current.weather_code === 'number' ? current.weather_code : 1;
        const isDay = current.is_day !== 0;
        const { icon, label } = mapWmoWeatherCode(code, isDay);

        const nextWeather: WeatherState = {
          temp: Math.round(current.temperature_2m),
          icon,
          label,
          fetchedAt: Date.now(),
        };

        if (!isMounted) return;
        setWeather(nextWeather);
        try {
          sessionStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(nextWeather));
        } catch {
          // ignore storage quota errors
        }
      } catch {
        // 일시적 네트워크 오류 시 레이아웃 깨짐 없이 조용히 숨김 유지
      } finally {
        window.clearTimeout(timeoutId);
      }
    };

    if (!weather || Date.now() - weather.fetchedAt >= WEATHER_CACHE_TTL_MS) {
      fetchWeather();
    }

    const intervalId = window.setInterval(fetchWeather, WEATHER_CACHE_TTL_MS);

    return () => {
      isMounted = false;
      activeController?.abort();
      window.clearInterval(intervalId);
    };
  }, []);

  if (!weather) return null;

  return (
    <div
      className="inline-flex items-center gap-0.5 min-[400px]:gap-1 sm:gap-1.5 px-1.5 min-[400px]:px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-[#F2F2F7]/90 border border-black/[0.06] text-[10px] min-[400px]:text-[11px] sm:text-xs font-semibold text-[#3A3A3C] whitespace-nowrap shrink-0 animate-fade-in select-none"
      title={`베트남 호치민 실시간 날씨: ${weather.label} ${weather.temp}°C`}
      aria-label={`베트남 호치민 현재 날씨 ${weather.label} ${weather.temp}도`}
    >
      <span className="leading-none text-[10px] min-[400px]:text-xs sm:text-[13px]" aria-hidden="true">
        {weather.icon}
      </span>
      <span className="hidden min-[350px]:inline text-gray-600 tracking-tight">호치민</span>
      <span className="font-bold text-[#0A7E54] tabular-nums">{weather.temp}°C</span>
    </div>
  );
};

export default VietnamWeatherBadge;
