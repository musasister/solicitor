"use client";

import { useState, useRef, useEffect } from "react";

interface VideoAdHeroProps {
  onCtaClick: () => void;
}

export default function VideoAdHero({ onCtaClick }: VideoAdHeroProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay blocked by browser — keep muted state
      });
    }
  }, []);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <section className="relative w-full bg-black">
      {/* Video Container */}
      <div className="relative w-full" style={{ maxHeight: "70vh" }}>
        <video
          ref={videoRef}
          className="w-full h-auto object-cover"
          style={{ maxHeight: "70vh" }}
          autoPlay
          muted
          loop
          playsInline
          poster="/ad-poster.jpg"
        >
          {/* 실제 광고 영상 URL로 교체 필요 */}
          <source src="/ad-video.mp4" type="video/mp4" />
        </video>

        {/* Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Video Controls */}
        <div className="absolute top-4 right-4 flex gap-2 z-10">
          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition"
            aria-label={isPlaying ? "일시정지" : "재생"}
          >
            {isPlaying ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5,3 19,12 5,21" />
              </svg>
            )}
          </button>
          <button
            onClick={toggleMute}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition"
            aria-label={isMuted ? "음소거 해제" : "음소거"}
          >
            {isMuted ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" fill="currentColor" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" fill="currentColor" />
                <path d="M15.54,8.46a5,5,0,0,1,0,7.07" />
                <path d="M19.07,4.93a10,10,0,0,1,0,14.14" />
              </svg>
            )}
          </button>
        </div>

        {/* Hero Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-block bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-4 tracking-wide">
              Threads 광고
            </div>
            <h1 className="text-2xl md:text-4xl font-bold text-white leading-tight mb-3">
              개인회생, 복잡한 서류
              <br />
              <span className="text-blue-400">자동으로 해결하세요</span>
            </h1>
            <p className="text-gray-300 text-sm md:text-base mb-6 leading-relaxed">
              채권 계산부터 서식 작성까지 원클릭 자동화
              <br className="hidden md:block" />
              변호사·법무사를 위한 스마트 솔루션
            </p>
            <button
              onClick={onCtaClick}
              className="ad-cta-button bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-10 rounded-full text-lg shadow-lg shadow-blue-600/30 transition-all hover:scale-105 hover:shadow-xl"
            >
              무료로 시작하기
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
