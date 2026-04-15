"use client";

interface AdLandingSectionProps {
  onCtaClick: () => void;
}

export default function AdLandingSection({ onCtaClick }: AdLandingSectionProps) {
  return (
    <div className="bg-white">
      {/* Trust Bar */}
      <div className="bg-gray-900 text-white py-3">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-center gap-6 text-xs md:text-sm">
          <span className="flex items-center gap-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            법률 전문 자동화
          </span>
          <span className="hidden md:flex items-center gap-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            실시간 검증 엔진
          </span>
          <span className="flex items-center gap-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            무료 체험 가능
          </span>
        </div>
      </div>

      {/* Features Section */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-3">
            왜 <span className="text-blue-600">개인회생 자동화</span>인가요?
          </h2>
          <p className="text-gray-500 text-sm md:text-base">
            복잡한 서식 작성과 계산, 이제 시스템이 대신합니다
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {/* Feature 1 */}
          <div className="bg-gray-50 rounded-2xl p-6 md:p-8 text-center hover:shadow-lg transition-shadow">
            <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-2">자동 서식 생성</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              채권자목록, 변제계획안 등<br />
              법원 제출 서류를 자동 생성
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-gray-50 rounded-2xl p-6 md:p-8 text-center hover:shadow-lg transition-shadow">
            <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-2">실시간 검증</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              청산가치 보장, 가용소득 검증 등<br />
              입력 즉시 오류를 자동 체크
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-gray-50 rounded-2xl p-6 md:p-8 text-center hover:shadow-lg transition-shadow">
            <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-2">채권별 관리</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              채권 단위 구조화로 복잡한<br />
              사건도 체계적으로 관리
            </p>
          </div>
        </div>
      </section>

      {/* Social Proof / Stats Section */}
      <section className="bg-blue-600 py-12 md:py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-3 gap-4 text-center text-white">
            <div>
              <div className="text-2xl md:text-4xl font-bold mb-1">98%</div>
              <div className="text-blue-200 text-xs md:text-sm">서식 정확도</div>
            </div>
            <div>
              <div className="text-2xl md:text-4xl font-bold mb-1">5분</div>
              <div className="text-blue-200 text-xs md:text-sm">평균 처리 시간</div>
            </div>
            <div>
              <div className="text-2xl md:text-4xl font-bold mb-1">24/7</div>
              <div className="text-blue-200 text-xs md:text-sm">언제든 이용 가능</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-3">
            이용 방법
          </h2>
          <p className="text-gray-500 text-sm md:text-base">
            3단계로 간편하게 시작하세요
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              1
            </div>
            <h3 className="font-bold text-gray-900 mb-2">사건 등록</h3>
            <p className="text-gray-500 text-sm">
              채무자 정보와 사건번호를<br />간단히 입력합니다
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              2
            </div>
            <h3 className="font-bold text-gray-900 mb-2">채권 입력</h3>
            <p className="text-gray-500 text-sm">
              채권 정보를 입력하면<br />자동으로 계산/검증됩니다
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              3
            </div>
            <h3 className="font-bold text-gray-900 mb-2">서류 생성</h3>
            <p className="text-gray-500 text-sm">
              법원 제출용 서식이<br />자동으로 완성됩니다
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-gray-900 py-12 md:py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-xl md:text-3xl font-bold text-white mb-3">
            지금 바로 시작하세요
          </h2>
          <p className="text-gray-400 text-sm md:text-base mb-8">
            복잡한 개인회생 서류 작성, 더 이상 고민하지 마세요
          </p>
          <button
            onClick={onCtaClick}
            className="ad-cta-button bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-10 rounded-full text-lg shadow-lg shadow-blue-600/30 transition-all hover:scale-105"
          >
            무료로 시작하기
          </button>
          <p className="text-gray-500 text-xs mt-4">
            회원가입 없이 바로 이용 가능
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 py-6 text-center">
        <p className="text-gray-500 text-xs">
          &copy; 2026 개인회생 서식 자동화 시스템 |
          <a href="https://lawyersurim.dbcart.net" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white ml-1">
            Powered by Dbcart.net
          </a>
        </p>
      </footer>
    </div>
  );
}
