# Maintainer release procedure

This file is for Xerify maintainers and is intentionally excluded from the npm package. A local
build is not a public release.

## Release candidate gates

```sh
npm ci
npm run check
npm run smoke:mcp
npm run smoke:install
npm run release:audit
```

Review the changelog, exact package version, generated tarball manifest, production license
inventory, SPDX SBOM, vulnerability audit, and secret-pattern scan. Live provider calls are not a
normal release gate; any such call requires explicit owner approval and a bounded, non-sensitive
evidence scope.

The unscoped package is `xerify-cli` starting with `0.3.1`; earlier releases used `xverify-cli`.
The executable remains `xerify`. The `0.3.1` release publishes the new package, verifies the registry
metadata against the exact tarball and its provenance, and only then adds a migration notice to the
old package. Existing versions are not unpublished. Keep historical release evidence unchanged.

The release workflow runs with `id-token: write` and publishes with `--provenance`. A new npm
package must exist before its Trusted Publisher can be configured. For bootstrap, the owner-controlled
granular token must permit creating/publishing `xerify-cli` and updating `xverify-cli` deprecation
metadata. Keep it in the GitHub `npm` environment secret `NPM_TOKEN`; it is exposed only as
`NODE_AUTH_TOKEN` to the publishing/deprecation steps. Never commit or paste credentials.

After the new package exists, configure its Trusted Publisher for repository `Verhex/xerify`,
workflow `release.yml`, environment `npm`, with publish permission. Once verified, remove the
bootstrap token mapping and the completed migration step, and revoke the temporary token.

## Publish

1. Ensure the worktree is clean and `CHANGELOG.md` contains the exact dated version.
2. Confirm the public package/version and MCP name are not conflicting.
3. Tag the reviewed commit as `v<package-version>` and push the tag.
4. The release workflow verifies the tag, reruns all non-billable gates, packs once, attests the
   tarball/SBOM, publishes that exact tarball when the version is absent from npm, and creates the
   GitHub release. For the owner-authenticated bootstrap only, publish the reviewed tarball first;
   the subsequent tag workflow detects the exact existing version and skips a duplicate npm write.
5. Verify from a clean external directory:

```sh
npm view xerify-cli@latest name version dist.integrity --json
npm install --global xerify-cli@latest
xerify --version
xerify --json health
xerify --json doctor
```

Publish the matching `server.json` with the official MCP publisher only after npm exposes the exact
version. The MCP Registry hosts metadata, not a second package. Package `mcpName`, `server.json`
name/version, npm package/version, and `mcp stdio` arguments must remain synchronized.
