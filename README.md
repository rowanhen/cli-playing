# Release Automation Toolkit

A comprehensive TypeScript release automation toolkit that handles semantic versioning, conventional commits, changelog generation, NPM publishing, and GitHub releases.

## Features

- 🔄 **Semantic Versioning**: Automatic version bumping based on conventional commits
- 📝 **Conventional Commits**: Parse and analyze commit messages following conventional commit standards
- 📋 **Changelog Generation**: Automatic CHANGELOG.md generation with categorized changes
- 📦 **NPM Publishing**: Automated NPM package publishing with proper tagging
- 🏷️ **Git Tagging**: Automatic git tag creation with release notes
- 🚀 **GitHub Releases**: Automated GitHub release creation with formatted release notes
- 🌿 **Branch Support**: Support for main branch releases and feature branch prereleases
- 🔍 **Dry Run Mode**: Preview what would be released without making changes
- 🛠️ **Programmatic API**: Use as a library in your own tools
- 📱 **CLI Interface**: Command-line tool for easy integration

## Installation

### As a CLI Tool (Global)

```bash
npm install -g @your-org/release-automation
```

### As a Library (Local)

```bash
npm install @your-org/release-automation
```

## CLI Usage

### Basic Commands

```bash
# Run full release process
release-automation

# Preview what would be released (dry run)
release-automation --dry-run

# Just analyze commits
release-automation analyze

# Release with specific options
release-automation --skip-npm --skip-github
```

### CLI Options

- `--dry-run`: Show what would be done without making changes
- `--skip-npm`: Skip NPM publishing
- `--skip-github`: Skip GitHub release creation
- `--skip-changelog`: Skip changelog generation

## Programmatic Usage

### Basic Example

```typescript
import { ReleaseAutomation } from "@your-org/release-automation";

const automation = new ReleaseAutomation();

// Run full release
const result = await automation.release({
  dryRun: true,
  skipNpm: false,
  skipGithub: false,
});

console.log("Released version:", result.analysis.version);
```

### Advanced Example

```typescript
import {
  ReleaseAutomation,
  analyzeCommits,
  bumpVersion,
  formatChangelogEntry,
} from "@your-org/release-automation";

// Use individual functions
const commits = getCommitsSinceLastTag();
const analysis = analyzeCommits(commits);
const newVersion = bumpVersion("1.0.0", analysis.bump, null);

// Use the class for full automation
const automation = new ReleaseAutomation({
  // Custom configuration
  types: {
    feat: { bump: "minor", section: "Features" },
    fix: { bump: "patch", section: "Bug Fixes" },
    // ... more types
  },
});

// Analyze what would be released
const analysis = await automation.analyzeCommits();
console.log("Would release:", analysis.version);
console.log("Changes:", analysis.changes);

// Run individual steps
if (!analysis.error) {
  await automation.bumpVersion(analysis, false);
  await automation.generateChangelog(analysis, false);
  await automation.commitChanges(analysis, false);
  await automation.createTag(analysis, false);
  await automation.publishNpm(analysis, false);
  await automation.createGithubRelease(analysis, false);
}
```

## Configuration

### Environment Variables

- `GITHUB_TOKEN`: Required for GitHub releases
- `GITHUB_REPOSITORY`: Required for GitHub releases (format: `owner/repo`)
- `NODE_AUTH_TOKEN` or `NPM_TOKEN`: Required for NPM publishing

### Custom Configuration

```typescript
const automation = new ReleaseAutomation({
  types: {
    feat: { bump: "minor", section: "Features" },
    fix: { bump: "patch", section: "Bug Fixes" },
    docs: { bump: "patch", section: "Documentation" },
    // Hidden types (trigger releases but don't appear in changelog)
    chore: { bump: "patch", hidden: true },
  },
  branches: {
    main: "main",
    prereleasePattern: /^(feature|fix|chore)\//,
    prereleasePrefix: "beta",
  },
  breakingKeywords: ["BREAKING CHANGE", "BREAKING-CHANGE"],
});
```

## Conventional Commits

This tool follows the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Supported Types

- `feat`: New features (minor version bump)
- `fix`: Bug fixes (patch version bump)
- `docs`: Documentation changes (patch version bump)
- `style`: Code style changes (patch version bump)
- `refactor`: Code refactoring (patch version bump)
- `perf`: Performance improvements (patch version bump)
- `test`: Test changes (patch version bump)
- `chore`: Maintenance tasks (patch version bump, hidden from changelog)

### Breaking Changes

Breaking changes trigger a major version bump and can be indicated by:

1. Adding `!` after the type: `feat!: remove deprecated API`
2. Adding `BREAKING CHANGE:` in the commit body

## GitHub Workflows

### Basic Workflow

```yaml
name: Release

on:
  workflow_dispatch:

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: "18"
          registry-url: "https://registry.npmjs.org"

      - run: npm ci

      - name: Release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
          GITHUB_REPOSITORY: ${{ github.repository }}
        run: npx @your-org/release-automation
```

### Dry Run Workflow

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
          node-version: "18"

      - run: npm ci

      - name: Preview Release
        run: npx @your-org/release-automation --dry-run
```

## API Reference

### ReleaseAutomation Class

#### Methods

- `analyzeCommits()`: Analyze commits and determine release type
- `bumpVersion(analysis, dryRun)`: Update package.json version
- `generateChangelog(analysis, dryRun)`: Generate/update CHANGELOG.md
- `commitChanges(analysis, dryRun)`: Commit release changes
- `createTag(analysis, dryRun)`: Create git tag
- `publishNpm(analysis, dryRun)`: Publish to NPM
- `createGithubRelease(analysis, dryRun)`: Create GitHub release
- `release(options)`: Run complete release process

#### Options

```typescript
interface ReleaseOptions {
  dryRun?: boolean;
  skipNpm?: boolean;
  skipGithub?: boolean;
  skipChangelog?: boolean;
  config?: Partial<Config>;
}
```

### Utility Functions

- `analyzeCommits(commits)`: Analyze commit messages
- `bumpVersion(version, bump, prerelease)`: Calculate new version
- `formatChangelogEntry(version, changes)`: Format changelog entry
- `formatReleaseNotes(changes)`: Format GitHub release notes
- `getCommitsSinceLastTag()`: Get commits since last tag
- `getCurrentBranch()`: Get current git branch
- `parseCommit(commit)`: Parse conventional commit message

## License

ISC
