import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import type { Metadata } from 'next';

const SITE_URL = 'https://giongdoc.com';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: 'GiongDoc.com | Trợ Lý AI Tạo Văn Khấn & Dâng Sớ Tự Động',
      template: '%s | GiongDoc.com',
    },
    description:
      'Ứng dụng AI tiên phong giúp gia chủ tự động soạn văn khấn, dâng sớ cá nhân hóa và lưu giữ giọng đọc tâm linh. Chuẩn bị lễ Rằm, Mùng 1 trọn vẹn, tinh tế và thành tâm.',
    keywords: [
      'văn khấn AI',
      'tạo sớ tự động',
      'sớ gia đạo',
      'trợ lý tâm linh',
      'giọng đọc AI',
      'văn khấn rằm',
      'văn khấn mùng 1',
      'giongdoc.com',
    ],
    authors: [{ name: 'SoAI Team' }],
    creator: 'SoAI Team',
    publisher: 'GiongDoc.com',
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    alternates: {
      canonical: `${SITE_URL}/${locale}`,
      languages: {
        'vi-VN': `${SITE_URL}/vi`,
      },
    },
    openGraph: {
      type: 'website',
      url: `${SITE_URL}/${locale}`,
      siteName: 'GiongDoc',
      title: 'GiongDoc.com | Tạo Sớ & Văn Khấn Tự Động Bằng AI',
      description:
        'Trải nghiệm không gian tâm linh tinh tế. AI giúp bạn tự động điền thông tin gia đạo vào văn khấn và đọc sớ bằng chính giọng nói của bạn.',
      locale: 'vi_VN',
      images: [
        {
          url: '/og-image.jpg',
          width: 1200,
          height: 630,
          alt: 'GiongDoc.com — AI tạo văn khấn & dâng sớ',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'GiongDoc.com | Trợ Lý AI Tạo Văn Khấn & Dâng Sớ',
      description:
        'Ứng dụng AI tiên phong giúp tự động soạn văn khấn, dâng sớ cá nhân hóa chuẩn xác.',
      images: ['/og-image.jpg'],
    },
    icons: {
      icon: '/favicon.svg',
      apple: '/apple-touch-icon.png',
    },
    themeColor: '#ca8a04',
    formatDetection: {
      telephone: false,
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: 'GiongDoc',
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Serif:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* JSON-LD Schema cho Google rich snippet */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'GiongDoc.com',
              url: SITE_URL,
              description:
                'Trợ lý AI tạo văn khấn & dâng sớ tự động cho người Việt',
              applicationCategory: 'LifestyleApplication',
              operatingSystem: 'Web',
              inLanguage: 'vi-VN',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'VND',
              },
            }),
          }}
        />
      </head>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}