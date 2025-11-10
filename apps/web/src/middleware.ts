import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // A list of all locales that are supported
  locales: ['en', 'ar'],
  
  // Used when no locale matches
  defaultLocale: 'en',
  
  // Always show locale in URL
  localePrefix: 'always'
});

export const config = {
  // Match all routes except static files and API routes
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
