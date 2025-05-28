# Simple Versioning

A TypeScript-first semantic versioning and release automation tool with automatic changelog generation and GitHub integration.

## Features

- 🚀 **Automatic semantic versioning** based on conventional commits
- 📝 **Changelog generation** with automatic PR and commit links
- 🔗 **GitHub integration** for releases and repository detection
- 📦 **NPM publishing** with authentication and registry support
- 🎯 **Type-safe configuration** with compile-time validation
- 🌿 **Branch-based prereleases** for feature development

## Quick Start

### 1. Install

```bash
npm install @super-secret-test-org/simple-versioning
```

### 2. Create Configuration

Create `release.config.ts` in your project root:

```typescript
import type {
  Config,
  CommitTypeConfig,
} from "@super-secret-test-org/simple-versioning";

const COMMIT_TYPES = {
  feat: { bump: "minor", section: "Features" },
  fix: { bump: "patch", section: "Bug Fixes" },
  docs: { bump: "patch", section: "Documentation" },
  chore: { bump: "patch", section: "Chores" },
} as const satisfies Record<string, CommitTypeConfig>;

export const config: Config<typeof COMMIT_TYPES> = {
  types: COMMIT_TYPES,
  hiddenScopes: {},
  breakingKeywords: ["BREAKING CHANGE"],
  branches: {
    main: "main",
    prereleasePattern: /^(feature|fix|chore)\//,
    prereleasePrefix: "beta",
  },
};
```

### 3. Run Release

```bash
# Dry run to see what would happen
npx simple-versioning --dry-run

# Full release
npx simple-versioning
```

## Environment Variables

Set these for full functionality:

- `GITHUB_TOKEN`: For GitHub releases
- `NPM_TOKEN`: For NPM publishing

## Programmatic Usage

```typescript
import {
  analyzeCommitsForRelease,
  generateChangelog,
  createGithubRelease,
  publishNpm,
} from "@super-secret-test-org/simple-versioning";

const analysis = await analyzeCommitsForRelease();
if (analysis.hasChanges) {
  await generateChangelog(analysis);
  await createGithubRelease(analysis);
  await publishNpm(analysis);
}
```

## Documentation

- [📖 Configuration Guide](./docs/configuration.md) - Detailed configuration options
- [🔗 Type Safety](./docs/type-safety.md) - TypeScript features and type inference
- [🔗 Automatic Links](./docs/automatic-links.md) - How PR and commit linking works
- [⚙️ GitHub Actions](./docs/github-actions.md) - CI/CD integration examples
- [🛠️ API Reference](./docs/api-reference.md) - Complete function documentation
- [🐛 Troubleshooting](./docs/troubleshooting.md) - Common issues and solutions

## Examples

- [Basic Configuration](./docs/examples/basic-config.ts) - Simple setup
- [Advanced Configuration](./docs/examples/advanced-config.ts) - All features
- [Programmatic Usage](./docs/examples/programmatic-usage.ts) - Custom release script

## License

MIT License - see LICENSE file for details.
