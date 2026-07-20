# Changesets

This folder is managed by [changesets](https://github.com/changesets/changesets). It tracks
which packages should be released and at what version.

`react-foundry` is the only published package; the internal `@react-foundry/*` packages are
`private` and changesets ignores them.

To record a change for the next release:

```sh
pnpm changeset
```

Pick the bump (patch/minor/major) and write a one-line summary. That writes a markdown file
here. On merge to `main`, the release workflow opens a "Version Packages" PR that consumes
these files, bumps the version, and updates the changelog; merging that PR publishes.
