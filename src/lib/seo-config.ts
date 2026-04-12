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
    title: 'Login to ProductTasks — Continue Your PM Interview Prep',
    description:
      'Log in to ProductTasks to continue your PM interview preparation and access AI mock interview feedback, saved progress, and question practice.',
    path: '/signin',
    keywords: ['login', 'product management login', 'PM interview prep'],
    image: siteConfig.ogImage,
  },
  '/signup': {
    title: 'Sign Up Free — Start Practicing PM Interviews Today | ProductTasks',
    description:
      'Create your free ProductTasks account and start practicing PM interview questions with AI-powered feedback, real-world scenarios, and progress tracking.',
    path: '/signup',
    keywords: ['sign up', 'product management signup', 'PM interview preparation'],
    image: siteConfig.ogImage,
  },
  '/dashboard': {
    title: 'Your Dashboard — ProductTasks PM Interview Prep',
    description:
      'Your ProductTasks dashboard for tracking PM interview practice, mock interview results, learning progress, and productivity resources.',
    path: '/dashboard',
    keywords: ['dashboard', 'PM interview dashboard', 'product management practice'],
    image: siteConfig.ogImage,
  },
  '/admin': {
    title: 'ProductTasks Admin — Manage Content and Questions',
    description: 'Admin tools for ProductTasks content, topics, lessons, and interview question management.',
    path: '/admin',
    keywords: ['admin', 'product tasks admin', 'site management'],
    image: siteConfig.ogImage,
  },
  '/about': {
    title: 'About ProductTasks — AI PM Interview Prep Platform',
    description: 'Learn about ProductTasks, the AI-powered platform helping product managers prepare for interviews with 600+ questions and instant feedback.',
    path: '/about',
    keywords: ['about ProductTasks', 'PM interview prep platform', 'AI interview preparation'],
    image: siteConfig.ogImage,
  },
  '/privacy': {
    title: 'Privacy Policy — ProductTasks',
    description: 'ProductTasks privacy policy. Learn how we collect, use, and protect your data.',
    path: '/privacy',
    keywords: ['privacy policy', 'data protection', 'ProductTasks privacy'],
    image: siteConfig.ogImage,
  },
  '/terms': {
    title: 'Terms of Service — ProductTasks',
    description: 'ProductTasks terms of service. Review the terms governing your use of our PM interview prep platform.',
    path: '/terms',
    keywords: ['terms of service', 'ProductTasks terms', 'user agreement'],
    image: siteConfig.ogImage,
  },
};
