import { useEffect } from 'react';
import Seo from './Seo';

type SEOHeadProps = {
  title: string;
  description: string;
  canonical: string;
  keywords?: string[];
  image?: string;
  structuredData?: Record<string, unknown> | Record<string, unknown>[];
  noIndex?: boolean;
};

function normalizePath(canonical: string) {
  try {
    if (canonical.startsWith('http')) {
      return new URL(canonical).pathname + new URL(canonical).search;
    }
  } catch {
    // ignore invalid URL and treat as path
  }
  return canonical.startsWith('/') ? canonical : `/${canonical}`;
}

export default function SEOHead({
  title,
  description,
  canonical,
  keywords = [],
  image,
  structuredData,
  noIndex = false,
}: SEOHeadProps) {
  useEffect(() => {
    if (title) {
      document.title = title;
    }

    const setMetaContent = (selector: string, value: string) => {
      const element = document.querySelector<HTMLMetaElement>(selector);
      if (element && value) {
        element.setAttribute('content', value);
      }
    };

    setMetaContent('meta[name="description"]', description);
    setMetaContent('meta[property="og:title"]', title);
    setMetaContent('meta[property="og:description"]', description);
    setMetaContent('meta[property="og:url"]', canonical);
    setMetaContent('meta[name="twitter:title"]', title);
    setMetaContent('meta[name="twitter:description"]', description);

    const canonicalLink = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonicalLink) {
      canonicalLink.setAttribute('href', canonical);
    }

    return () => {
      document.title = 'ProductTasks — AI Mock Interviews for Product Managers | 600+ PM Questions';
    };
  }, [title, description, canonical]);

  return (
    <>
      <Seo
        title={title}
        description={description}
        path={normalizePath(canonical)}
        keywords={keywords}
        image={image}
        noIndex={noIndex}
      />
      {structuredData ? (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      ) : null}
    </>
  );
}
