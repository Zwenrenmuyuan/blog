import { getAbsoluteSiteUrl, siteConfig } from '../site.config.ts';

export type PageKind =
  | 'home'
  | 'collection'
  | 'about'
  | 'article'
  | 'search'
  | 'not-found';

export interface SeoImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface ArticleSeoData {
  headline: string;
  publishedAt: Date;
  updatedAt?: Date;
  tags: string[];
  draft: boolean;
}

export interface StructuredDataInput {
  pageKind: PageKind;
  canonicalUrl?: string;
  title: string;
  description: string;
  image?: SeoImage;
  article?: ArticleSeoData;
}

export type JsonLdValue =
  | string
  | number
  | boolean
  | null
  | JsonLdValue[]
  | { [key: string]: JsonLdValue | undefined };

export function getDefaultSeoImage(): SeoImage {
  return {
    src: siteConfig.defaultOgImage,
    alt: siteConfig.defaultOgImageAlt,
    width: 1200,
    height: 630,
  };
}

export function resolveSeoImage(image?: SeoImage): SeoImage {
  return image ?? getDefaultSeoImage();
}

export function getAbsoluteSeoImage(image: SeoImage): SeoImage {
  return {
    ...image,
    src: new URL(image.src, siteConfig.siteUrl).toString(),
  };
}

export function createStructuredData(input: StructuredDataInput): JsonLdValue[] {
  const { pageKind, canonicalUrl, title, description, image, article } = input;

  if (!canonicalUrl || pageKind === 'search' || pageKind === 'not-found' || article?.draft) {
    return [];
  }

  const websiteId = getAbsoluteSiteUrl('/#website');
  const blogId = getAbsoluteSiteUrl('/#blog');
  const publisherId = getAbsoluteSiteUrl('/#publisher');
  const publisher = {
    '@type': 'Organization',
    '@id': publisherId,
    name: siteConfig.title,
    url: siteConfig.siteUrl,
  };

  if (pageKind === 'home') {
    return [
      {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebSite',
            '@id': websiteId,
            url: siteConfig.siteUrl,
            name: siteConfig.title,
            description: siteConfig.description,
            inLanguage: siteConfig.locale,
            publisher: { '@id': publisherId },
          },
          {
            '@type': 'Blog',
            '@id': blogId,
            url: siteConfig.siteUrl,
            name: siteConfig.title,
            description: siteConfig.description,
            inLanguage: siteConfig.locale,
            publisher: { '@id': publisherId },
          },
          publisher,
        ],
      },
    ];
  }

  if (pageKind === 'article' && article) {
    const articleImage = image
      ? {
          '@type': 'ImageObject',
          url: new URL(image.src, siteConfig.siteUrl).toString(),
          width: image.width,
          height: image.height,
          caption: image.alt,
        }
      : undefined;

    return [
      {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        '@id': `${canonicalUrl}#article`,
        url: canonicalUrl,
        headline: article.headline,
        description,
        inLanguage: siteConfig.locale,
        datePublished: article.publishedAt.toISOString(),
        dateModified: (article.updatedAt ?? article.publishedAt).toISOString(),
        keywords: article.tags,
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': canonicalUrl,
        },
        isPartOf: { '@id': blogId },
        publisher,
        ...(articleImage ? { image: articleImage } : {}),
      },
    ];
  }

  const type = pageKind === 'about' ? 'AboutPage' : 'CollectionPage';

  return [
    {
      '@context': 'https://schema.org',
      '@type': type,
      '@id': canonicalUrl,
      url: canonicalUrl,
      name: title,
      description,
      inLanguage: siteConfig.locale,
      isPartOf: { '@id': websiteId },
    },
  ];
}

const JSON_LD_ESCAPE_CHARACTERS: Record<string, string> = {
  '<': '\\u003c',
  '>': '\\u003e',
  '&': '\\u0026',
  '\u2028': '\\u2028',
  '\u2029': '\\u2029',
};

export function serializeJsonLd(value: JsonLdValue): string {
  return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, (character) =>
    JSON_LD_ESCAPE_CHARACTERS[character] ?? character,
  );
}
