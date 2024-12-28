// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      title: 'mustib utils',
      social: {
        github: 'https://github.com/mustib/mustib-utils',
      },
      sidebar: [
        {
          slug: 'start-guide/getting-started',
        },
        {
          label: 'Utilities',
          autogenerate: { directory: 'v1/utilities' },
        },
      ],
    }),
  ],
});
