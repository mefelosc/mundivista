import { countries } from '#lib/data/countries';

export const prerender = true;

export function entries() {
	return countries.map((country) => ({ code: country.code }));
}

export function load({ params }: { params: { code: string } }) {
	return { code: params.code };
}
