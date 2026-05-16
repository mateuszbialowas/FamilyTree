import { defineConfig, type HeadConfig } from 'vitepress'

const SITE = 'https://mateuszbialowas.github.io/FamilyTree'
const OG_IMAGE = `${SITE}/screenshots/hero.png`
const APP_STORE_ID = '6760984404'
const APP_STORE_SLUG = 'drzewo-genealogiczne'
const appStoreUrl = (country: string) =>
  `https://apps.apple.com/${country}/app/${APP_STORE_SLUG}/id${APP_STORE_ID}`

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'FamilyTree',
  alternateName: 'Drzewo genealogiczne',
  applicationCategory: 'LifestyleApplication',
  applicationSubCategory: 'Genealogy',
  operatingSystem: 'iOS',
  offers: { '@type': 'Offer', price: '5.99', priceCurrency: 'USD', category: 'OneTimePayment' },
  url: `${SITE}/`,
  downloadUrl: appStoreUrl('us'),
  installUrl: appStoreUrl('us'),
  image: OG_IMAGE,
  description:
    'Offline iPhone app to build your family tree privately. No account, no cloud, no subscription — one-time purchase. Beautiful, hand-drawn-style genealogy.',
  author: { '@type': 'Person', name: 'Mateusz Białowąs' },
}

function localeHead(opts: { title: string; description: string; ogLocale: string; url: string }): HeadConfig[] {
  return [
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: 'FamilyTree' }],
    ['meta', { property: 'og:title', content: opts.title }],
    ['meta', { property: 'og:description', content: opts.description }],
    ['meta', { property: 'og:url', content: opts.url }],
    ['meta', { property: 'og:image', content: OG_IMAGE }],
    ['meta', { property: 'og:locale', content: opts.ogLocale }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: opts.title }],
    ['meta', { name: 'twitter:description', content: opts.description }],
    ['meta', { name: 'twitter:image', content: OG_IMAGE }],
  ]
}

export default defineConfig({
  title: 'FamilyTree — Private Offline iPhone Family Tree App',
  description:
    'Offline iPhone app to build your family tree privately. No account, no cloud, no subscription — one-time purchase. Beautiful, hand-drawn-style genealogy for iOS.',
  base: '/FamilyTree/',

  sitemap: { hostname: `${SITE}/` },

  head: [
    ['link', { rel: 'icon', type: 'image/png', href: '/FamilyTree/icon.png' }],
    ['link', { rel: 'alternate', hreflang: 'en', href: `${SITE}/` }],
    ['link', { rel: 'alternate', hreflang: 'pl', href: `${SITE}/pl/` }],
    ['link', { rel: 'alternate', hreflang: 'de', href: `${SITE}/de/` }],
    ['link', { rel: 'alternate', hreflang: 'nl', href: `${SITE}/nl/` }],
    ['link', { rel: 'alternate', hreflang: 'no', href: `${SITE}/no/` }],
    ['link', { rel: 'alternate', hreflang: 'sv', href: `${SITE}/sv/` }],
    ['link', { rel: 'alternate', hreflang: 'da', href: `${SITE}/da/` }],
    ['link', { rel: 'alternate', hreflang: 'x-default', href: `${SITE}/` }],
    ['meta', { name: 'keywords', content: 'family tree app, genealogy app, iPhone family tree, offline family tree, private genealogy, no subscription family tree, family tree maker, ancestor app, iOS' }],
    ['script', { type: 'application/ld+json' }, JSON.stringify(jsonLd)],
  ],

  locales: {
    root: {
      label: 'English',
      lang: 'en',
      title: 'FamilyTree — Private Offline iPhone Family Tree App',
      description:
        'Offline iPhone app to build your family tree privately. No account, no cloud, no subscription — one-time purchase. Beautiful, hand-drawn-style genealogy for iOS.',
      head: localeHead({
        title: 'FamilyTree — Private Offline iPhone Family Tree App',
        description:
          'Offline iPhone app to build your family tree privately. No account, no cloud, no subscription — one-time purchase. Beautiful, hand-drawn-style genealogy for iOS.',
        ogLocale: 'en_US',
        url: `${SITE}/`,
      }),
      themeConfig: {
        siteTitle: 'Family Tree',
        nav: [
          { text: 'Guide', link: '/guide/getting-started' },
          { text: 'Pricing', link: '/pricing' },
          { text: 'Privacy Policy', link: '/privacy-policy' },
          { text: 'Download on App Store', link: appStoreUrl('us') },
        ],
        sidebar: [
          {
            text: 'Guide',
            items: [
              { text: 'Getting Started', link: '/guide/getting-started' },
              { text: 'Features', link: '/guide/features' },
              { text: 'Architecture', link: '/guide/architecture' },
              { text: 'Contributing', link: '/guide/contributing' },
            ],
          },
        ],
      },
    },
    pl: {
      label: 'Polski',
      lang: 'pl',
      title: 'FamilyTree — Drzewo genealogiczne na iPhone (offline, prywatnie)',
      description:
        'FamilyTree — aplikacja na iPhone do tworzenia drzewa genealogicznego. Działa offline, bez konta i chmury, bez subskrypcji — jednorazowy zakup. Pięknie zaprojektowana genealogia na iOS.',
      head: [
        ...localeHead({
          title: 'FamilyTree — Drzewo genealogiczne na iPhone (offline, prywatnie)',
          description:
            'FamilyTree — aplikacja na iPhone do tworzenia drzewa genealogicznego. Działa offline, bez konta i chmury, bez subskrypcji — jednorazowy zakup. Pięknie zaprojektowana genealogia na iOS.',
          ogLocale: 'pl_PL',
          url: `${SITE}/pl/`,
        }),
        ['meta', { name: 'keywords', content: 'drzewo genealogiczne aplikacja, aplikacja genealogiczna iPhone, drzewo genealogiczne mobilne, drzewo genealogiczne offline, drzewo genealogiczne bez subskrypcji, genealogia, przodkowie, iOS, iPhone' }],
      ],
      themeConfig: {
        siteTitle: 'Drzewo genealogiczne',
        nav: [
          { text: 'Przewodnik', link: '/pl/guide/getting-started' },
          { text: 'Cennik', link: '/pl/cennik' },
          { text: 'Polityka Prywatności', link: '/pl/privacy-policy' },
          { text: 'Pobierz w App Store', link: appStoreUrl('pl') },
        ],
        sidebar: [
          {
            text: 'Przewodnik',
            items: [
              { text: 'Rozpoczęcie pracy', link: '/pl/guide/getting-started' },
              { text: 'Funkcje', link: '/pl/guide/features' },
              { text: 'Architektura', link: '/pl/guide/architecture' },
              { text: 'Współpraca', link: '/pl/guide/contributing' },
            ],
          },
        ],
      },
    },
    de: {
      label: 'Deutsch',
      lang: 'de',
      title: 'FamilyTree — Private Stammbaum-App für iPhone (offline)',
      description:
        'FamilyTree — iPhone-App für deinen Stammbaum. Offline, ohne Konto, ohne Cloud, ohne Abo — einmaliger Kauf. Wunderschön gestaltet, nur für iOS.',
      head: [
        ...localeHead({
          title: 'FamilyTree — Private Stammbaum-App für iPhone (offline)',
          description:
            'FamilyTree — iPhone-App für deinen Stammbaum. Offline, ohne Konto, ohne Cloud, ohne Abo — einmaliger Kauf. Wunderschön gestaltet, nur für iOS.',
          ogLocale: 'de_DE',
          url: `${SITE}/de/`,
        }),
        ['meta', { name: 'keywords', content: 'Stammbaum App, Genealogie App, Ahnenforschung App, Stammbaum erstellen, Stammbaum offline, Stammbaum ohne Abo, Stammbaum ohne Anmeldung, iPhone, iOS' }],
      ],
      themeConfig: {
        siteTitle: 'Stammbaum',
        nav: [
          { text: 'Handbuch', link: '/de/guide/getting-started' },
          { text: 'Preis', link: '/de/preis' },
          { text: 'Datenschutz', link: '/de/privacy-policy' },
          { text: 'Im App Store laden', link: appStoreUrl('de') },
        ],
        sidebar: [
          {
            text: 'Handbuch',
            items: [
              { text: 'Erste Schritte', link: '/de/guide/getting-started' },
              { text: 'Funktionen', link: '/de/guide/features' },
              { text: 'Architektur', link: '/de/guide/architecture' },
              { text: 'Mitwirken', link: '/de/guide/contributing' },
            ],
          },
        ],
      },
    },
    nl: {
      label: 'Nederlands',
      lang: 'nl',
      title: 'FamilyTree — Privé stamboom-app voor iPhone (offline)',
      description:
        'FamilyTree — iPhone-app voor je stamboom. Offline, zonder account, zonder cloud, zonder abonnement — eenmalige aankoop. Prachtig vormgegeven voor iOS.',
      head: [
        ...localeHead({
          title: 'FamilyTree — Privé stamboom-app voor iPhone (offline)',
          description:
            'FamilyTree — iPhone-app voor je stamboom. Offline, zonder account, zonder cloud, zonder abonnement — eenmalige aankoop. Prachtig vormgegeven voor iOS.',
          ogLocale: 'nl_NL',
          url: `${SITE}/nl/`,
        }),
        ['meta', { name: 'keywords', content: 'stamboom app, genealogie app, stamboom maken, stamboom offline, stamboom zonder abonnement, stamboom zonder account, voorouders, iPhone, iOS' }],
      ],
      themeConfig: {
        siteTitle: 'Stamboom',
        nav: [
          { text: 'Handleiding', link: '/nl/guide/getting-started' },
          { text: 'Prijs', link: '/nl/prijs' },
          { text: 'Privacybeleid', link: '/nl/privacy-policy' },
          { text: 'Download in de App Store', link: appStoreUrl('nl') },
        ],
        sidebar: [
          {
            text: 'Handleiding',
            items: [
              { text: 'Aan de slag', link: '/nl/guide/getting-started' },
              { text: 'Functies', link: '/nl/guide/features' },
              { text: 'Architectuur', link: '/nl/guide/architecture' },
              { text: 'Bijdragen', link: '/nl/guide/contributing' },
            ],
          },
        ],
      },
    },
    no: {
      label: 'Norsk',
      lang: 'no',
      title: 'FamilyTree — Privat slektstre-app for iPhone (offline)',
      description:
        'FamilyTree — iPhone-app for slektstreet ditt. Offline, uten konto, uten sky, uten abonnement — engangskjøp. Vakkert design for iOS.',
      head: [
        ...localeHead({
          title: 'FamilyTree — Privat slektstre-app for iPhone (offline)',
          description:
            'FamilyTree — iPhone-app for slektstreet ditt. Offline, uten konto, uten sky, uten abonnement — engangskjøp. Vakkert design for iOS.',
          ogLocale: 'nb_NO',
          url: `${SITE}/no/`,
        }),
        ['meta', { name: 'keywords', content: 'slektstre app, slektsforskning app, slektstre offline, slektstre uten abonnement, slektstre uten konto, forfedre, familietre, iPhone, iOS' }],
      ],
      themeConfig: {
        siteTitle: 'Slektstre',
        nav: [
          { text: 'Veiledning', link: '/no/guide/getting-started' },
          { text: 'Pris', link: '/no/pris' },
          { text: 'Personvern', link: '/no/privacy-policy' },
          { text: 'Last ned i App Store', link: appStoreUrl('no') },
        ],
        sidebar: [
          {
            text: 'Veiledning',
            items: [
              { text: 'Kom i gang', link: '/no/guide/getting-started' },
              { text: 'Funksjoner', link: '/no/guide/features' },
              { text: 'Arkitektur', link: '/no/guide/architecture' },
              { text: 'Bidra', link: '/no/guide/contributing' },
            ],
          },
        ],
      },
    },
    sv: {
      label: 'Svenska',
      lang: 'sv',
      title: 'FamilyTree — Privat släktträd-app för iPhone (offline)',
      description:
        'FamilyTree — iPhone-app för ditt släktträd. Offline, utan konto, utan moln, utan prenumeration — engångsköp. Vackert designad för iOS.',
      head: [
        ...localeHead({
          title: 'FamilyTree — Privat släktträd-app för iPhone (offline)',
          description:
            'FamilyTree — iPhone-app för ditt släktträd. Offline, utan konto, utan moln, utan prenumeration — engångsköp. Vackert designad för iOS.',
          ogLocale: 'sv_SE',
          url: `${SITE}/sv/`,
        }),
        ['meta', { name: 'keywords', content: 'släktträd app, släktforskning app, släktträd offline, släktträd utan prenumeration, släktträd utan konto, förfäder, familjeträd, iPhone, iOS' }],
      ],
      themeConfig: {
        siteTitle: 'Släktträd',
        nav: [
          { text: 'Guide', link: '/sv/guide/getting-started' },
          { text: 'Pris', link: '/sv/pris' },
          { text: 'Integritetspolicy', link: '/sv/privacy-policy' },
          { text: 'Ladda ned i App Store', link: appStoreUrl('se') },
        ],
        sidebar: [
          {
            text: 'Guide',
            items: [
              { text: 'Kom igång', link: '/sv/guide/getting-started' },
              { text: 'Funktioner', link: '/sv/guide/features' },
              { text: 'Arkitektur', link: '/sv/guide/architecture' },
              { text: 'Bidra', link: '/sv/guide/contributing' },
            ],
          },
        ],
      },
    },
    da: {
      label: 'Dansk',
      lang: 'da',
      title: 'FamilyTree — Privat stamtræ-app til iPhone (offline)',
      description:
        'FamilyTree — iPhone-app til dit stamtræ. Offline, uden konto, uden sky, uden abonnement — engangskøb. Smukt designet til iOS.',
      head: [
        ...localeHead({
          title: 'FamilyTree — Privat stamtræ-app til iPhone (offline)',
          description:
            'FamilyTree — iPhone-app til dit stamtræ. Offline, uden konto, uden sky, uden abonnement — engangskøb. Smukt designet til iOS.',
          ogLocale: 'da_DK',
          url: `${SITE}/da/`,
        }),
        ['meta', { name: 'keywords', content: 'stamtræ app, slægtsforskning app, stamtræ offline, stamtræ uden abonnement, stamtræ uden konto, forfædre, familietræ, iPhone, iOS' }],
      ],
      themeConfig: {
        siteTitle: 'Stamtræ',
        nav: [
          { text: 'Vejledning', link: '/da/guide/getting-started' },
          { text: 'Pris', link: '/da/pris' },
          { text: 'Privatlivspolitik', link: '/da/privacy-policy' },
          { text: 'Hent i App Store', link: appStoreUrl('dk') },
        ],
        sidebar: [
          {
            text: 'Vejledning',
            items: [
              { text: 'Kom godt i gang', link: '/da/guide/getting-started' },
              { text: 'Funktioner', link: '/da/guide/features' },
              { text: 'Arkitektur', link: '/da/guide/architecture' },
              { text: 'Bidrag', link: '/da/guide/contributing' },
            ],
          },
        ],
      },
    },
  },

  themeConfig: {
    socialLinks: [
      { icon: 'github', link: 'https://github.com/mateuszbialowas/FamilyTree' },
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: '© 2026 Mateusz Białowąs',
    },
  },
})
