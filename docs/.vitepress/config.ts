import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'FamilyTree',
  description: 'A beautiful mobile genealogy app for creating and managing family trees',
  base: '/FamilyTree/',

  head: [
    ['link', { rel: 'icon', type: 'image/png', href: '/FamilyTree/icon.png' }],
  ],

  locales: {
    root: {
      label: 'English',
      lang: 'en',
      themeConfig: {
        nav: [
          { text: 'Guide', link: '/guide/getting-started' },
          { text: 'Privacy Policy', link: '/privacy-policy' },
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
      themeConfig: {
        nav: [
          { text: 'Przewodnik', link: '/pl/guide/getting-started' },
          { text: 'Polityka Prywatności', link: '/pl/privacy-policy' },
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
      themeConfig: {
        nav: [
          { text: 'Handbuch', link: '/de/guide/getting-started' },
          { text: 'Datenschutz', link: '/de/privacy-policy' },
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
    he: {
      label: 'עברית',
      lang: 'he',
      dir: 'rtl',
      themeConfig: {
        nav: [
          { text: 'מדריך', link: '/he/guide/getting-started' },
          { text: 'מדיניות פרטיות', link: '/he/privacy-policy' },
        ],
        sidebar: [
          {
            text: 'מדריך',
            items: [
              { text: 'תחילת העבודה', link: '/he/guide/getting-started' },
              { text: 'תכונות', link: '/he/guide/features' },
              { text: 'ארכיטקטורה', link: '/he/guide/architecture' },
              { text: 'תרומה לפרויקט', link: '/he/guide/contributing' },
            ],
          },
        ],
      },
    },
    nl: {
      label: 'Nederlands',
      lang: 'nl',
      themeConfig: {
        nav: [
          { text: 'Handleiding', link: '/nl/guide/getting-started' },
          { text: 'Privacybeleid', link: '/nl/privacy-policy' },
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
      themeConfig: {
        nav: [
          { text: 'Veiledning', link: '/no/guide/getting-started' },
          { text: 'Personvern', link: '/no/privacy-policy' },
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
      themeConfig: {
        nav: [
          { text: 'Guide', link: '/sv/guide/getting-started' },
          { text: 'Integritetspolicy', link: '/sv/privacy-policy' },
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
      themeConfig: {
        nav: [
          { text: 'Vejledning', link: '/da/guide/getting-started' },
          { text: 'Privatlivspolitik', link: '/da/privacy-policy' },
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
