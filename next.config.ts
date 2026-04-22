import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig = {
  // giữ nguyên config cũ
};

export default withNextIntl(nextConfig);