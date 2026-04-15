import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "개인회생 서식 자동화 시스템 | 법률 서류 자동 생성",
  description:
    "채권 계산부터 서식 작성까지 원클릭 자동화. 변호사·법무사를 위한 개인회생 스마트 솔루션.",
  openGraph: {
    title: "개인회생, 복잡한 서류 자동으로 해결하세요",
    description:
      "채권 계산부터 서식 작성까지 원클릭 자동화. 변호사·법무사를 위한 스마트 솔루션.",
    type: "website",
    locale: "ko_KR",
    siteName: "개인회생 서식 자동화",
  },
  other: {
    "facebook-domain-verification": "YOUR_VERIFICATION_CODE",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

  return (
    <html lang="ko">
      <body className="bg-gray-50 min-h-screen">
        {children}

        {/* Meta (Facebook/Threads) Pixel */}
        {metaPixelId && (
          <>
            <Script id="meta-pixel" strategy="afterInteractive">
              {`
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${metaPixelId}');
                fbq('track', 'PageView');
              `}
            </Script>
            <noscript>
              <img
                height="1"
                width="1"
                style={{ display: "none" }}
                src={`https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1`}
                alt=""
              />
            </noscript>
          </>
        )}
      </body>
    </html>
  );
}
