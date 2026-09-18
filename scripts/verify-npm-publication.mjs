import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import process from 'node:process';
import { setTimeout } from 'node:timers/promises';

const manifest = JSON.parse(await readFile('package.json', 'utf8'));
const tarball = await readFile(process.env.RELEASE_TARBALL);
const integrity = `sha512-${createHash('sha512').update(tarball).digest('base64')}`;
const url = `https://registry.npmjs.org/${encodeURIComponent(manifest.name)}/${manifest.version}`;

// Registry metadata may lag behind an accepted publish. Wait a bounded interval without
// treating npm error JSON as proof of publication or republishing the same version.
let verified = false;
for (let attempt = 1; attempt <= 24; attempt += 1) {
  const response = await globalThis.fetch(url, { signal: globalThis.AbortSignal.timeout(10_000) });
  if (response.ok) {
    const published = await response.json();
    if (published.name !== manifest.name || published.version !== manifest.version) {
      throw new Error('Registry returned the wrong package or version');
    }
    if (published.dist?.integrity !== integrity) {
      throw new Error('Published tarball integrity does not match the reviewed artifact');
    }
    const attestation = published.dist?.attestations;
    if (
      typeof attestation?.url === 'string' &&
      attestation.url.startsWith('https://registry.npmjs.org/-/npm/v1/attestations/') &&
      attestation.provenance?.predicateType === 'https://slsa.dev/provenance/v1'
    ) {
      verified = true;
      break;
    }
  } else if (response.status !== 404 && response.status < 500) {
    throw new Error(`Registry verification failed with HTTP ${response.status}`);
  }
  if (attempt < 24) await setTimeout(10_000);
}
if (!verified)
  throw new Error('Registry publication/provenance was not visible within the deadline');
process.stdout.write(
  `Verified ${manifest.name}@${manifest.version}: exact tarball and provenance.\n`
);
