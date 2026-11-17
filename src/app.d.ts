// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	interface ImportMetaEnv {
		readonly PUBLIC_SITE_ORIGIN?: string;
		readonly PUBLIC_ANALYTICS_PROVIDER?: string;
		readonly PUBLIC_GOATCOUNTER_ENDPOINT?: string;
		readonly PUBLIC_PLAUSIBLE_DOMAIN?: string;
		readonly PUBLIC_PLAUSIBLE_SCRIPT?: string;
		readonly PUBLIC_CF_BEACON_TOKEN?: string;
	}
}

export {};
