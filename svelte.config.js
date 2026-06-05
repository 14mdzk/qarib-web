import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	kit: {
		adapter: adapter(),
		/**
		 * CSP managed here so SvelteKit can nonce its own inline bootstrap script
		 * (the serialized server-load payload). Without this, `script-src 'self'`
		 * in hooks.server.ts blocks that inline script in every environment,
		 * preventing hydration. See ADR 0014.
		 */
		csp: {
			mode: 'auto',
			directives: {
				'default-src': ["'self'"],
				'script-src': ["'self'"],
				'style-src': ["'self'", "'unsafe-inline'"],
				'img-src': ["'self'", 'data:'],
				'font-src': ["'self'", 'data:'],
				'connect-src': ["'self'"],
				'frame-ancestors': ["'none'"],
				'base-uri': ["'self'"],
				'form-action': ["'self'"],
				'object-src': ["'none'"]
			}
		},
		alias: {
			$core: 'src/lib/core',
			'$core/*': 'src/lib/core/*',
			$shared: 'src/lib/shared',
			'$shared/*': 'src/lib/shared/*',
			$domains: 'src/lib/domains',
			'$domains/*': 'src/lib/domains/*',
			$server: 'src/lib/server',
			'$server/*': 'src/lib/server/*',
			$generated: 'src/lib/generated',
			'$generated/*': 'src/lib/generated/*',
			$routes: 'src/routes',
			'$routes/*': 'src/routes/*',
			$messages: 'src/lib/generated/paraglide/messages.js',
			'$messages/*': 'src/lib/generated/paraglide/*'
		}
	},
	vite: {
		ssr: {
			noExternal: ['lucide-svelte', '@lucide/svelte']
		}
	}
};

export default config;
