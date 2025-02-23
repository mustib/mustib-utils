// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
  site: 'https://mustib.github.io/',
  base: '/mustib-utils',
  integrations: [
    starlight({
      title: 'mustib utils',
      social: {
        github: 'https://github.com/mustib/mustib-utils',
      },
      expressiveCode: {
        defaultProps: { wrap: true },
      },
      sidebar: [
        {
          slug: 'start-guide/getting-started',
        },
        {
          label: 'Utilities',
          autogenerate: { directory: 'v2/utilities' },
        },
      ],
    }),
  ],
});
