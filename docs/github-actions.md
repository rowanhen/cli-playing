# GitHub Actions Integration

Simple Versioning works seamlessly with GitHub Actions for automated releases.

## Basic Release Workflow

Create `.github/workflows/release.yml`:

```yaml
name: Release
on:
  push:
    branches: [main]

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
        with:
          token: ${{ secrets.GH_TOKEN }}
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version-file: ".nvmrc"

      - run: npm ci

      - name: Configure Git
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"

      - name: Release
        env:
          GITHUB_TOKEN: ${{ secrets.GH_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
          GITHUB_REPOSITORY: ${{ github.repository }}
        run: npx @super-secret-test-org/simple-versioning
```

## Required Secrets

Add these secrets to your repository settings:

### GH_TOKEN

Personal Access Token with permissions:

- `repo` - Full repository access
- `write:packages` - Package publishing (if using GitHub Packages)

### NPM_TOKEN

NPM authentication token for publishing packages.

## Release Preview on Pull Requests

Create `.github/workflows/release-preview.yml`:

```yaml
name: Release Preview
on:
  pull_request:

jobs:
  preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version-file: ".nvmrc"

      - run: npm ci

      - name: Preview Release
        run: |
          echo "## Release Preview" >> $GITHUB_STEP_SUMMARY
          npx @super-secret-test-org/simple-versioning --dry-run >> $GITHUB_STEP_SUMMARY
```

This shows what would be released if the PR were merged.

## Advanced Workflows

### Conditional Release

Only release if there are actual changes:

```yaml
- name: Check for changes
  id: changes
  run: |
    if npx @super-secret-test-org/simple-versioning --dry-run | grep -q "No changes to release"; then
      echo "has_changes=false" >> $GITHUB_OUTPUT
    else
      echo "has_changes=true" >> $GITHUB_OUTPUT
    fi

- name: Release
  if: steps.changes.outputs.has_changes == 'true'
  env:
    GITHUB_TOKEN: ${{ secrets.GH_TOKEN }}
    NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
  run: npx @super-secret-test-org/simple-versioning
```

### Multi-Step Release

Break down the release process into separate steps:

```yaml
- name: Analyze Commits
  id: analyze
  run: |
    npx @super-secret-test-org/simple-versioning --dry-run > analysis.txt
    cat analysis.txt

- name: Generate Changelog
  run: npx @super-secret-test-org/simple-versioning --skip-npm --skip-github --skip-tag

- name: Create GitHub Release
  env:
    GITHUB_TOKEN: ${{ secrets.GH_TOKEN }}
  run: npx @super-secret-test-org/simple-versioning --skip-npm --skip-changelog

- name: Publish to NPM
  env:
    NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
  run: npx @super-secret-test-org/simple-versioning --skip-github --skip-changelog --skip-tag
```

### Matrix Releases

Release to multiple registries:

```yaml
strategy:
  matrix:
    registry:
      - npm
      - github
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      # ... setup steps ...

      - name: Release to NPM
        if: matrix.registry == 'npm'
        env:
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
        run: npx @super-secret-test-org/simple-versioning --skip-github

      - name: Release to GitHub Packages
        if: matrix.registry == 'github'
        env:
          GITHUB_TOKEN: ${{ secrets.GH_TOKEN }}
          NPM_REGISTRY: "https://npm.pkg.github.com"
        run: npx @super-secret-test-org/simple-versioning --skip-npm
```

## Prerelease Workflow

Automatically create prereleases for feature branches:

```yaml
name: Prerelease
on:
  push:
    branches:
      - "feature/**"
      - "fix/**"
      - "chore/**"

jobs:
  prerelease:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
        with:
          token: ${{ secrets.GH_TOKEN }}
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version-file: ".nvmrc"

      - run: npm ci

      - name: Configure Git
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"

      - name: Prerelease
        env:
          GITHUB_TOKEN: ${{ secrets.GH_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
          GITHUB_REPOSITORY: ${{ github.repository }}
        run: npx @super-secret-test-org/simple-versioning
```

## Environment Variables

These environment variables are automatically available in GitHub Actions:

- `GITHUB_REPOSITORY` - Repository name (owner/repo)
- `GITHUB_REF` - Git reference that triggered the workflow
- `GITHUB_SHA` - Commit SHA that triggered the workflow

## Troubleshooting

### Permission Denied

Ensure your `GH_TOKEN` has the correct permissions:

```yaml
permissions:
  contents: write # Required for creating releases and tags
  packages: write # Required for GitHub Packages (optional)
```

### Fetch Depth

Always use `fetch-depth: 0` to get the full git history:

```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0 # Required for git tag detection
```

### Git Configuration

Configure git user for commits and tags:

```yaml
- name: Configure Git
  run: |
    git config user.name "github-actions[bot]"
    git config user.email "github-actions[bot]@users.noreply.github.com"
```

### NPM Authentication

For NPM publishing, ensure your token is valid:

```bash
# Test your token locally
echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > ~/.npmrc
npm whoami
```

## Security Best Practices

1. **Use secrets**: Never hardcode tokens in workflows
2. **Minimal permissions**: Only grant necessary permissions
3. **Separate tokens**: Use different tokens for different purposes
4. **Regular rotation**: Rotate tokens regularly
5. **Audit logs**: Monitor workflow runs and token usage
