import { Helmet } from 'react-helmet-async';
import { siteConfig } from '../lib/seo-config';

type SeoProps = {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
  image?: string;
  noIndex?: boolean;
};

export default function Seo({
  title,
  description,
  path = '/',
  keywords = [],
  image,
  noIndex = false,
}: SeoProps) {
  const canonicalUrl = `${siteConfig.url}${path}`;
  const pageTitle = title || siteConfig.name;
  const pageImage = image || siteConfig.ogImage;
  const robotsContent = noIndex ? 'noindex, nofollow' : 'index, follow';

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      <meta name="robots" content={robotsContent} />
      <link rel="canonical" href={canonicalUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={pageImage} />
      <meta property="og:site_name" content={siteConfig.name} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={siteConfig.twitterHandle} />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={pageImage} />
    </Helmet>
  );
}
