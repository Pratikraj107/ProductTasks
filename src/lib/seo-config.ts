export const siteConfig = {
  name: 'ProductTasks',
  url: 'https://producttasks.com',
  description:
    'Master product management with hands-on tasks, real-world frameworks, and structured learning paths for aspiring and practicing product managers.',
  author: 'Pratik',
  locale: 'en_US',
  twitterHandle: '@producttasks',
  ogImage: '/vite.svg',
};

export type SeoPageConfig = {
  title: string;
  description: string;
  path: string;
  keywords: string[];
  image?: string;
};

export const defaultSeo: SeoPageConfig = {
  title: 'ProductTasks — Product Management Learning Platform',
  description: siteConfig.description,
  path: '/',
  keywords: [
    'product management',
    'PM interview prep',
    'product manager skills',
    'product strategy',
    'mock interview practice',
    'resume review',
  ],
  image: siteConfig.ogImage,
};

export const pageSeo: Record<string, SeoPageConfig> = {
  '/': defaultSeo,
  '/signin': {
    title: 'Sign In | ProductTasks',
    description:
      'Sign in to ProductTasks and continue your product management interview preparation with AI-powered mock interviews and feedback.',
    path: '/signin',
    keywords: ['sign in', 'product management login', 'PM practice login'],
    image: siteConfig.ogImage,
  },
  '/signup': {
    title: 'Sign Up | ProductTasks',
    description:
      'Create your ProductTasks account and start practicing product management interviews with expert feedback, real-world PM questions, and structured learning.',
    path: '/signup',
    keywords: ['sign up', 'product management account', 'PM practice registration'],
    image: siteConfig.ogImage,
  },
  '/dashboard': {
    title: 'ProductTasks Dashboard',
    description:
      'Your ProductTasks dashboard for managing AI mock interviews, resources, and product management preparation.',
    path: '/dashboard',
    keywords: ['product tasks dashboard', 'PM study dashboard', 'product management practice'],
    image: siteConfig.ogImage,
  },
  '/admin': {
    title: 'ProductTasks Admin',
    description: 'Admin tools for ProductTasks content and user management.',
    path: '/admin',
    keywords: ['admin', 'product tasks admin', 'site management'],
    image: siteConfig.ogImage,
  },
};
