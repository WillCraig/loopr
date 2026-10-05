import { env } from '$env/dynamic/public';
import {
	analyticsSnippet,
	pageHead,
	resolveAnalytics,
	type Analytics,
	type PageHead
} from '$lib/site';

function analyticsEnv() {
	return {
		provider: env.PUBLIC_ANALYTICS_PROVIDER,
		goatcounter: env.PUBLIC_GOATCOUNTER_ENDPOINT,
		plausibleDomain: env.PUBLIC_PLAUSIBLE_DOMAIN,
		plausibleScript: env.PUBLIC_PLAUSIBLE_SCRIPT,
		cloudflareToken: env.PUBLIC_CF_BEACON_TOKEN
	};
}

export function currentAnalytics(): Analytics | null {
	return resolveAnalytics(analyticsEnv());
}

export function currentAnalyticsSnippet(): string {
	return analyticsSnippet(currentAnalytics());
}

export function currentHead(runtimeBase: string | undefined): PageHead {
	return pageHead(env.PUBLIC_SITE_ORIGIN, runtimeBase);
}
