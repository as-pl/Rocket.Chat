import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

// AS-PL customization: local release builds must reject incompatible Deno before it can change the lockfile or populate the production cache.
test('rejects a mismatched Deno version outside CI before caching dependencies', () => {
	const directory = mkdtempSync(path.join(tmpdir(), 'apps-deno-version-'));
	const marker = path.join(directory, 'install-started');
	try {
		writeFileSync(
			path.join(directory, 'deno'),
			`#!/usr/bin/env node
if (process.argv[2] === '--version') {
  console.log('deno 2.0.0 (stable, release, x86_64-unknown-linux-gnu)');
} else {
  require('node:fs').writeFileSync(${JSON.stringify(marker)}, 'started');
}
`,
			{ mode: 0o755 },
		);
		const result = spawnSync(process.execPath, [path.resolve(__dirname, '../../scripts/deno-cache.js')], {
			env: { ...process.env, CI: '', PATH: `${directory}${path.delimiter}${process.env.PATH}` },
			encoding: 'utf8',
		});
		assert.equal(result.status, 1, result.stderr);
		assert.match(result.stderr, /Incorrect Deno version/);
		assert.equal(existsSync(marker), false, 'An incompatible runtime must not install dependencies');
	} finally {
		rmSync(directory, { recursive: true, force: true });
	}
});
