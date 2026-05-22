import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const fixturesDir = resolve(here, '..', 'fixtures');

/** Read a GPX fixture by basename (without extension). */
export function fixture(name: string): string {
	return readFileSync(resolve(fixturesDir, `${name}.gpx`), 'utf8');
}
