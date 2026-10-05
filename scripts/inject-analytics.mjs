import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// The root layout renders the snippet into prerendered pages. GitHub Pages
// serves build/404.html as a client shell that does not include that head,
// so copy the same tag onto every other built HTML file.

const snippet =
	readFileSync('build/index.html', 'utf8').match(
		/<script\b[^>]*data-loopr-analytics[^>]*>\s*<\/script>/
	)?.[0] ?? '';

if (!snippet) {
	console.log('analytics: off');
	process.exit(0);
}

function htmlFiles(dir, out = []) {
	for (const name of readdirSync(dir)) {
		const path = join(dir, name);
		if (statSync(path).isDirectory()) htmlFiles(path, out);
		else if (name.endsWith('.html')) out.push(path);
	}
	return out;
}

let updated = 0;
for (const path of htmlFiles('build')) {
	const html = readFileSync(path, 'utf8');
	if (html.includes(snippet) || !html.includes('</head>')) continue;
	writeFileSync(path, html.replace('</head>', `\t\t${snippet}\n\t</head>`));
	updated += 1;
}

console.log(`analytics: injected into ${updated} html file(s)`);
