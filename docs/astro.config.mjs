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
      lastUpdated: true,
      credits: true,
      description:
        'A lightweight npm library that provides a collection of commonly used utilities for both web applications and backend services.',
      editLink: {
        baseUrl: 'https://github.com/mustib/mustib-utils/edit/main/docs',
      },
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
        {
          label: 'Constants',
          autogenerate: { directory: 'v2/constants' },
        },
      ],
    }),
  ],
});
