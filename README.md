# TypeScript Release Automation

A comprehensive TypeScript package for automating semantic releases with conventional commits, changelog generation, and NPM publishing.

## Features

- 🚀 **Semantic Versioning**: Automatic version bumping based on conventional commits
- 📝 **Changelog Generation**: Beautiful, categorized changelogs with commit links
- 📦 **NPM Publishing**: Automated package publishing with prerelease support
- 🏷️ **Git Tagging**: Automatic tag creation and GitHub releases
- 🔧 **TypeScript First**: Full TypeScript support with comprehensive type definitions
- 🎯 **CLI & Programmatic**: Use as a CLI tool or integrate programmatically
- 🌿 **Branch Support**: Configurable branch restrictions and prerelease handling
- 🔍 **Dry Run Mode**: Test releases without making changes

## Installation

```bash
# Install globally for CLI usage
npm install -g @super-secret-test-org/creating-npm-packages

# Or install as a dependency
npm install @super-secret-test-org/creating-npm-packages
```

## Quick Start

### CLI Usage

```bash
# Run a full release
npx @super-secret-test-org/creating-npm-packages

# Analyze commits without releasing
npx @super-secret-test-org/creating-npm-packages analyze

# Dry run (no changes made)
npx @super-secret-test-org/creating-npm-packages --dry-run

# Skip GitHub release
npx @super-secret-test-org/creating-npm-packages --skip-github

# Skip NPM publishing
npx @super-secret-test-org/creating-npm-packages --skip-npm
```

### Programmatic Usage

```typescript
import { ReleaseAutomation } from "@super-secret-test-org/creating-npm-packages";

const automation = new ReleaseAutomation();

// Analyze commits
const analysis = await automation.analyzeCommits();
console.log(`Next version: ${analysis.version}`);

// Run full release
if (analysis.hasChanges) {
  const result = await automation.release();
  console.log(`Released version ${result.analysis.version}`);
}
```

## Configuration

### Default Configuration

The package uses sensible defaults based on conventional commits:

```typescript
{
  types: {
    feat: { bump: "minor", section: "Features" },
    fix: { bump: "patch", section: "Bug Fixes" },
    docs: { bump: "patch", section: "Documentation" },
    style: { bump: "patch", section: "Styles" },
    refactor: { bump: "patch", section: "Code Refactoring" },
    perf: { bump: "patch", section: "Performance Improvements" },
    test: { bump: "patch", section: "Tests" },
    build: { bump: "patch", section: "Build System" },
    ci: { bump: "patch", section: "Continuous Integration" },
    chore: { bump: "patch", section: "Chores" },
    revert: { bump: "patch", section: "Reverts" }
  },
  branches: {
    main: { prerelease: false },
    master: { prerelease: false },
    develop: { prerelease: "beta" },
    beta: { prerelease: "beta" },
    alpha: { prerelease: "alpha" }
  },
  breakingChangeKeywords: ["BREAKING CHANGE", "BREAKING CHANGES"]
}
```

### Custom Configuration

```typescript
import { ReleaseAutomation } from "@super-secret-test-org/creating-npm-packages";

const automation = new ReleaseAutomation({
  types: {
    feat: { bump: "minor", section: "🚀 Features" },
    fix: { bump: "patch", section: "🐛 Bug Fixes" },
    breaking: { bump: "major", section: "💥 Breaking Changes" },
  },
  branches: {
    main: { prerelease: false },
    staging: { prerelease: "rc" },
  },
});
```

## API Reference

### ReleaseAutomation Class

#### Constructor

```typescript
new ReleaseAutomation(config?: Partial<ReleaseConfig>)
```

#### Methods

##### `analyzeCommits(): Promise<CommitAnalysis>`

Analyzes commits since the last tag and determines version bump.

```typescript
const analysis = await automation.analyzeCommits();
// Returns: { version, bump, hasChanges, changes, commits, ... }
```

##### `release(options?: ReleaseOptions): Promise<ReleaseResult>`

Runs the complete release process.

```typescript
const result = await automation.release({
  dryRun: false,
  skipNpm: false,
  skipGithub: false,
});
```

### Types

#### CommitAnalysis

```typescript
interface CommitAnalysis {
  version: string; // Next version number
  bump: BumpType; // major | minor | patch | prerelease
  hasChanges: boolean; // Whether there are releasable changes
  changes: ChangesByType; // Categorized changes
  commits: ParsedCommit[]; // All commits since last tag
  currentVersion: string; // Current package version
  packageName: string; // Package name from package.json
  branch: string; // Current git branch
  isPrerelease: boolean; // Whether this is a prerelease
  prereleaseTag?: string; // Prerelease tag (alpha, beta, etc.)
}
```

#### ReleaseOptions

```typescript
interface ReleaseOptions {
  dryRun?: boolean; // Don't make actual changes
  skipNpm?: boolean; // Skip NPM publishing
  skipGithub?: boolean; // Skip GitHub release creation
}
```

## GitHub Actions Integration

### Basic Workflow

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
          registry-url: "https://registry.npmjs.org"

      - run: npm ci

      - name: Configure Git
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"

      - name: Release
        env:
          GITHUB_TOKEN: ${{ secrets.GH_TOKEN }}
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
          GITHUB_REPOSITORY: ${{ github.repository }}
        run: npx @super-secret-test-org/creating-npm-packages
```

### Preview on Pull Requests

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
          npx @super-secret-test-org/creating-npm-packages analyze >> $GITHUB_STEP_SUMMARY
```

## Environment Variables

| Variable            | Description                        | Required            |
| ------------------- | ---------------------------------- | ------------------- |
| `GITHUB_TOKEN`      | GitHub token for creating releases | For GitHub releases |
| `NODE_AUTH_TOKEN`   | NPM token for publishing           | For NPM publishing  |
| `GITHUB_REPOSITORY` | Repository in format `owner/repo`  | For GitHub releases |

**Required Secrets:**

- `GH_TOKEN`: Personal Access Token with `repo` and `write:packages` permissions
- `NPM_TOKEN`: NPM authentication token for publishing

## Conventional Commits

This package follows the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Examples

```bash
# Feature (minor bump)
git commit -m "feat: add user authentication"

# Bug fix (patch bump)
git commit -m "fix: resolve login redirect issue"

# Breaking change (major bump)
git commit -m "feat!: redesign user API"
# or
git commit -m "feat: redesign user API

BREAKING CHANGE: The user API has been completely redesigned"

# Documentation (patch bump)
git commit -m "docs: update installation guide"
```

## Troubleshooting

### Common Issues

1. **"No commits found"**: Ensure you have commits since the last tag
2. **"Branch not allowed"**: Check your branch configuration
3. **"No GitHub token"**: Set the `GITHUB_TOKEN` environment variable
4. **"NPM publish failed"**: Verify `NPM_TOKEN` and package name

### Debug Mode

Set `DEBUG=1` for verbose logging:

```bash
DEBUG=1 npx @super-secret-test-org/creating-npm-packages
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/new-feature`
3. Make your changes
4. Add tests if applicable
5. Commit using conventional commits
6. Push and create a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for release history.
