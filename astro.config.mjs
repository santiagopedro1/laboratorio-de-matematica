// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

import starlightSidebarSwipe from 'starlight-sidebar-swipe';
import starlightThemeGalaxy from 'starlight-theme-galaxy';

import svelte from '@astrojs/svelte';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'Laboratório de Matemática',
			// social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/withastro/starlight' }],
			locales: {
				root: {
					label: 'Português (BR)',
					lang: 'pt-BR'
				}
			},
			expressiveCode: {
				useStarlightDarkModeSwitch: false
			},
			sidebar: [
				{
					label: 'Início',
					items: [{ label: 'Introdução', slug: 'index' }]
				},
				{
					label: 'Dados',
					items: [{ autogenerate: { directory: 'dados' } }]
				}
			],
			markdown: {
				headingLinks: false
			},
			plugins: [starlightSidebarSwipe()],
			customCss: ['./src/styles/global.css']
		}),
		svelte()
	],

	vite: {
		plugins: [tailwindcss()]
	}
});
