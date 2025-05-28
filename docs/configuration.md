# Configuration Guide

This guide covers all configuration options for Simple Versioning.

## Quick Examples

For working examples, see:

- [Basic Configuration](./examples/basic-config.ts) - Simple setup
- [Advanced Configuration](./examples/advanced-config.ts) - All features

## Basic Configuration

Create a `release.config.ts` file in your project root:

```typescript
import type {
  Config,
  CommitTypeConfig,
} from "@super-secret-test-org/simple-versioning";

const COMMIT_TYPES = {
  feat: { bump: "minor", section: "Features" },
  fix: { bump: "patch", section: "Bug Fixes" },
  docs: { bump: "patch", section: "Documentation" },
  style: { bump: "patch", section: "Styles" },
  refactor: { bump: "patch", section: "Refactors" },
  perf: { bump: "patch", section: "Performance Improvements" },
  test: { bump: "patch", section: "Tests" },
  chore: { bump: "patch", section: "Chores" },
  // Hidden types - trigger releases but don't appear in changelog
  bump: { bump: "patch", hidden: true },
  dependabot: { bump: "patch", hidden: true },
} as const satisfies Record<string, CommitTypeConfig>;

export const config: Config<typeof COMMIT_TYPES> = {
  types: COMMIT_TYPES,
  hiddenScopes: {
    chore: ["npm-dep", "deps"],
    docs: ["readme"],
  },
  breakingKeywords: [
    "BREAKING CHANGE",
    "BREAKING-CHANGE",
    "BREAKING CHANGES",
    "BREAKING-CHANGES",
  ],
  branches: {
    main: "main",
    prereleasePattern: /^(feature|fix|chore)\//,
    prereleasePrefix: "beta",
  },
  markdown: {
    changelog: {
      versionHeader: "## [{version}] - {date}",
      sectionHeader: "### {section}",
      listItem: "- {item}",
      dateFormat: "YYYY-MM-DD",
    },
    releaseNotes: {
      sectionHeader: "### {section}",
      listItem: "- {item}",
    },
    sections: {
      Features: "🚀 Features",
      "Bug Fixes": "🐛 Bug Fixes",
      Documentation: "📚 Documentation",
      "Breaking Changes": "💥 BREAKING CHANGES",
    },
  },
};
```

## Configuration Options

### Commit Types

Define how different commit types affect versioning and appear in changelogs:

```typescript
const COMMIT_TYPES = {
  feat: {
    bump: "minor", // Version bump type
    section: "Features", // Changelog section name
  },
  fix: {
    bump: "patch",
    section: "Bug Fixes",
  },
  // Hidden commit types (trigger releases but don't appear in changelog)
  bump: {
    bump: "patch",
    hidden: true,
  },
} as const satisfies Record<string, CommitTypeConfig>;
```

**Bump Types:**

- `"major"` - Breaking changes (1.0.0 → 2.0.0)
- `"minor"` - New features (1.0.0 → 1.1.0)
- `"patch"` - Bug fixes (1.0.0 → 1.0.1)

**Hidden Types:**
Set `hidden: true` to trigger releases without appearing in changelogs. Useful for dependency updates or internal changes.

### Hidden Scopes

Hide specific scopes from appearing in changelogs:

```typescript
hiddenScopes: {
  chore: ["npm-dep", "deps"],     // Hide chore(npm-dep): and chore(deps):
  docs: ["readme"],               // Hide docs(readme):
  feat: ["internal"],             // Hide feat(internal):
}
```

### Breaking Change Keywords

Define what keywords in commit messages indicate breaking changes:

```typescript
breakingKeywords: [
  "BREAKING CHANGE",
  "BREAKING-CHANGE",
  "BREAKING CHANGES",
  "BREAKING-CHANGES",
];
```

### Branch Configuration

Control which branches can create releases and how prereleases work:

```typescript
branches: {
  main: "main",                                    // Main branch name
  prereleasePattern: /^(feature|fix|chore)\//,     // Prerelease branch pattern
  prereleasePrefix: "beta",                        // Prerelease version prefix
}
```

**Examples:**

- `main` branch: `1.2.3`
- `feature/auth` branch: `1.2.4-beta.0`
- `fix/login` branch: `1.2.4-beta.1`

### Markdown Formatting

Customize how changelogs and release notes are formatted:

```typescript
markdown: {
  changelog: {
    versionHeader: "## [{version}] - {date}",    // Version header format
    sectionHeader: "### {section}",              // Section header format
    listItem: "- {item}",                        // List item format
    dateFormat: "YYYY-MM-DD",                    // Date format
  },
  releaseNotes: {
    sectionHeader: "### {section}",              // GitHub release section header
    listItem: "- {item}",                        // GitHub release list item
  },
  sections: {
    Features: "🚀 Features",                     // Custom section names with emojis
    "Bug Fixes": "🐛 Bug Fixes",
    Documentation: "📚 Documentation",
    "Breaking Changes": "💥 BREAKING CHANGES",
  },
}
```

**Template Variables:**

- `{version}` - Version number (e.g., "1.2.3")
- `{date}` - Formatted date
- `{section}` - Section name
- `{item}` - Changelog item text

## Advanced Examples

### Custom Commit Types

```typescript
const COMMIT_TYPES = {
  feat: { bump: "minor", section: "Features" },
  fix: { bump: "patch", section: "Bug Fixes" },
  breaking: { bump: "major", section: "Breaking Changes" },
  security: { bump: "patch", section: "Security" },
  deps: { bump: "patch", hidden: true },
} as const satisfies Record<string, CommitTypeConfig>;
```

### Custom Markdown Templates

```typescript
markdown: {
  changelog: {
    versionHeader: "## {version} ({date})",      // Custom format
    sectionHeader: "**{section}**",              // Bold headers
    listItem: "→ {item}",                        // Custom bullets
    dateFormat: "MMM DD, YYYY",                  // Different date format
  },
  sections: {
    Features: "🚀 New Features",
    "Bug Fixes": "🐛 Bug Fixes",
    Security: "🔒 Security Updates",
    "Breaking Changes": "💥 BREAKING CHANGES",
  },
}
```

### Multiple Prerelease Branches

```typescript
branches: {
  main: "main",
  prereleasePattern: /^(feature|fix|chore|hotfix)\//,
  prereleasePrefix: "beta",
}
```

This allows:

- `feature/new-auth` → `1.2.3-beta.0`
- `fix/urgent-bug` → `1.2.3-beta.1`
- `hotfix/security` → `1.2.3-beta.2`

## Environment Variables

These environment variables affect configuration:

- `GITHUB_REPOSITORY` - Override repository detection (format: `owner/repo`)
- `GITHUB_TOKEN` - Required for GitHub releases
- `NPM_TOKEN` - Required for NPM publishing
- `NODE_AUTH_TOKEN` - Alternative to NPM_TOKEN

## Validation

The configuration is fully type-safe. TypeScript will catch errors like:

```typescript
// ❌ Error: "invalid" is not a valid commit type
hiddenScopes: {
  invalid: ["scope"],
}

// ❌ Error: "Invalid Section" is not a valid section name
markdown: {
  sections: {
    "Invalid Section": "❌",
  },
}
```
