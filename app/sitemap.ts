import type { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

const SITE_URL = 'https://giongdoc.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/vi`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/vi/gia-dao`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];

  // Dynamic: từng template
  const { data: templates } = await supabase
    .from('templates')
    .select('slug, updated_at')
    .eq('locale', 'vi')
    .eq('is_active', true);

  const templateRoutes: MetadataRoute.Sitemap = (templates ?? []).map((t) => ({
    url: `${SITE_URL}/vi/so/${t.slug}`,
    lastModified: t.updated_at ? new Date(t.updated_at) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.9,
  }));

  return [...staticRoutes, ...templateRoutes];
}