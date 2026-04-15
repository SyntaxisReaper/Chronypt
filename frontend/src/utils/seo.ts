import { useEffect } from 'react';

type MetaConfig = {
  title: string;
  description: string;
  path?: string;
};

function upsertMeta(name: string, content: string, attr: 'name' | 'property' = 'name'): void {
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.content = content;
}

function upsertCanonical(url: string): void {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = url;
}

export function usePageMeta({ title, description, path }: MetaConfig): void {
  useEffect(() => {
    const siteName = 'Chronypt';
    document.title = `${title} | ${siteName}`;

    const origin = window.location.origin;
    const canonicalPath = path || window.location.pathname;
    const canonicalUrl = `${origin}${canonicalPath}`;

    upsertMeta('description', description);
    upsertMeta('og:title', `${title} | ${siteName}`, 'property');
    upsertMeta('og:description', description, 'property');
    upsertMeta('og:type', 'website', 'property');
    upsertMeta('og:url', canonicalUrl, 'property');
    upsertMeta('twitter:card', 'summary_large_image');
    upsertMeta('twitter:title', `${title} | ${siteName}`);
    upsertMeta('twitter:description', description);
    upsertCanonical(canonicalUrl);
  }, [description, path, title]);
}
