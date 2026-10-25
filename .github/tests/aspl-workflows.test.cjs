// AS-PL customization: keep the fork's only publishing path tied to its canonical branch.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const directory = path.resolve(__dirname, '../workflows');

test('dispatcher sends the exact aspl push SHA to the existing monorepo builder', () => {
  const source = fs.readFileSync(path.join(directory, 'aspl-build.yml'), 'utf8');
  assert.match(source, /branches: \[aspl\]/);
  assert.match(source, /github\.repository == 'as-pl\/Rocket.Chat' && github\.ref == 'refs\/heads\/aspl'/);
  assert.match(source, /SOURCE_SHA: \$\{\{ github\.sha \}\}/);
  assert.match(source, /inputs\[source_sha\]=\$SOURCE_SHA/);
  assert.match(source, /-f ref=webpage-backend/);
  assert.doesNotMatch(source, /as8\.5\.1/);
  assert.ok(source.indexOf('node --test') < source.indexOf('Request candidate build'));
  assert.doesNotMatch(source, /continue-on-error|if: always\(\)/);
});

// AS-PL customization: changing the default branch must not activate upstream releases or issue bots.
for (const file of fs.readdirSync(directory).filter(file => /\.ya?ml$/.test(file) && file !== 'aspl-build.yml')) {
  test(`${file} excludes AS-PL from every upstream automation job`, () => {
    const source = fs.readFileSync(path.join(directory, file), 'utf8').split('\njobs:\n')[1];
    const jobs = source.split(/(?=^  [\w-]+:\s*$)/m).filter(block => block.trim());
    assert.ok(jobs.length > 0);
    for (const job of jobs) {
      assert.match(job, /^    if: github\.repository == 'RocketChat\/Rocket.Chat'(?: && \(.+\))?$/m, job.split('\n')[0]);
    }
  });
}
