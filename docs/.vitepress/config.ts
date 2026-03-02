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
