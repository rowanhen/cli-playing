# API Reference

Complete reference for all functions and types in Simple Versioning.

## Quick Example

For a complete programmatic usage example, see [Programmatic Usage](./examples/programmatic-usage.ts).

## Core Functions

### `analyzeCommitsForRelease()`

Analyzes commits since the last tag and determines version bump.

```typescript
function analyzeCommitsForRelease(): Promise<AnalysisResult>;
```

**Returns:** `Promise<AnalysisResult>`

**Example:**

```typescript
const analysis = await analyzeCommitsForRelease();
if (analysis.error) {
  console.error("Analysis failed:", analysis.error);
} else if (analysis.hasChanges) {
  console.log(`Next version: ${analysis.version}`);
  console.log(`Bump type: ${analysis.bump}`);
}
```

### `generateChangelog()`

Generates changelog entry and updates CHANGELOG.md.

```typescript
function generateChangelog(
  analysis: AnalysisResult,
  dryRun?: boolean,
  markdownConfig?: MarkdownConfig
): Promise<ReleaseStepResult>;
```

**Parameters:**

- `analysis` - Analysis result from `analyzeCommitsForRelease()`
- `dryRun` - If true, don't write files (default: false)
- `markdownConfig` - Custom markdown formatting options

**Example:**

```typescript
const result = await generateChangelog(analysis, false, {
  changelog: {
    versionHeader: "## {version} - {date}",
    sectionHeader: "### {section}",
    listItem: "- {item}",
  },
});
```

### `createGithubRelease()`

Creates a GitHub release with formatted release notes.

```typescript
function createGithubRelease(
  analysis: AnalysisResult,
  dryRun?: boolean,
  skipAuth?: boolean,
  markdownConfig?: MarkdownConfig
): Promise<ReleaseStepResult>;
```

**Parameters:**

- `analysis` - Analysis result from `analyzeCommitsForRelease()`
- `dryRun` - If true, don't create actual release (default: false)
- `skipAuth` - If true, skip authentication check (default: false)
- `markdownConfig` - Custom markdown formatting options

**Example:**

```typescript
const result = await createGithubRelease(analysis, false, false, {
  releaseNotes: {
    sectionHeader: "### {section}",
    listItem: "- {item}",
  },
});
```

### `publishNpm()`

Publishes package to NPM registry.

```typescript
function publishNpm(
  analysis: AnalysisResult,
  dryRun?: boolean,
  skipAuth?: boolean
): Promise<ReleaseStepResult>;
```

**Parameters:**

- `analysis` - Analysis result from `analyzeCommitsForRelease()`
- `dryRun` - If true, don't publish (default: false)
- `skipAuth` - If true, skip authentication check (default: false)

**Example:**

```typescript
const result = await publishNpm(analysis);
if (result.success) {
  console.log("Published successfully!");
} else {
  console.error("Publish failed:", result.error);
}
```

### `bumpPackageVersion()`

Updates the version in package.json.

```typescript
function bumpPackageVersion(
  analysis: AnalysisResult,
  dryRun?: boolean
): Promise<ReleaseStepResult>;
```

**Parameters:**

- `analysis` - Analysis result from `analyzeCommitsForRelease()`
- `dryRun` - If true, don't write package.json (default: false)

## Utility Functions

### `parseCommit()`

Parses a conventional commit message.

```typescript
function parseCommit(message: string, hash?: string): ParsedCommit;
```

**Parameters:**

- `message` - Commit message to parse
- `hash` - Optional commit hash

**Returns:** `ParsedCommit`

**Example:**

```typescript
const parsed = parseCommit("feat(auth): add OAuth support (#123)", "abc123");
// Result: { type: "feat", scope: "auth", subject: "add OAuth support", ... }
```

### `analyzeCommits()`

Analyzes an array of commits based on configuration.

```typescript
function analyzeCommits(
  commits: CommitInfo[],
  config: Config,
  breakingKeywords?: string[]
): CommitAnalysisResult;
```

**Parameters:**

- `commits` - Array of commit information
- `config` - Configuration object
- `breakingKeywords` - Keywords that indicate breaking changes

**Example:**

```typescript
const commits = getCommitsWithHashesSinceLastTag();
const result = analyzeCommits(commits, CONFIG, CONFIG.breakingKeywords);
```

### `formatChangelogEntry()`

Formats a changelog entry with optional links.

```typescript
function formatChangelogEntry(
  version: string,
  changes: ChangesByType,
  markdownConfig?: MarkdownConfig,
  commitMeta?: CommitMetadata,
  repoInfo?: RepositoryInfo
): string;
```

**Parameters:**

- `version` - Version number
- `changes` - Categorized changes
- `markdownConfig` - Markdown formatting options
- `commitMeta` - Commit metadata for linking
- `repoInfo` - Repository information for links

### `formatReleaseNotes()`

Formats GitHub release notes with optional links.

```typescript
function formatReleaseNotes(
  changes: ChangesByType,
  markdownConfig?: MarkdownConfig,
  commitMeta?: CommitMetadata,
  repoInfo?: RepositoryInfo
): string;
```

### Git Utilities

#### `getCommitsWithHashesSinceLastTag()`

Gets commits since the last git tag with hashes.

```typescript
function getCommitsWithHashesSinceLastTag(): CommitInfo[];
```

#### `getCurrentBranch()`

Gets the current git branch name.

```typescript
function getCurrentBranch(): string;
```

#### `isBranchAllowed()`

Checks if a branch is allowed for releases.

```typescript
function isBranchAllowed(branch: string): boolean;
```

#### `getPrereleaseTag()`

Gets the prerelease tag for a branch.

```typescript
function getPrereleaseTag(branch: string): string | null;
```

### Package Utilities

#### `getPackageJson()`

Reads and parses package.json.

```typescript
function getPackageJson(): PackageJson;
```

#### `savePackageJson()`

Writes package.json to disk.

```typescript
function savePackageJson(pkg: PackageJson): void;
```

### Version Utilities

#### `bumpVersion()`

Calculates a new version based on bump type.

```typescript
function bumpVersion(
  currentVersion: string,
  bumpType: BumpType,
  prereleaseTag?: string
): string;
```

**Parameters:**

- `currentVersion` - Current version (e.g., "1.2.3")
- `bumpType` - Type of bump ("major", "minor", "patch")
- `prereleaseTag` - Optional prerelease tag (e.g., "beta")

**Example:**

```typescript
const newVersion = bumpVersion("1.2.3", "minor", "beta");
// Result: "1.3.0-beta.0"
```

### Repository Utilities

#### `getRepositoryInfo()`

Gets repository information from git remote.

```typescript
function getRepositoryInfo(): RepositoryInfo | null;
```

**Returns:** Repository information or null if not detected.

## Types

### `AnalysisResult`

Result of commit analysis.

```typescript
interface AnalysisResult {
  bump: BumpType;
  version: string;
  currentVersion: string;
  hasChanges: boolean;
  isPrerelease?: boolean;
  changes: ChangesByType;
  hasOnlyHiddenChanges?: boolean;
  packageName?: string;
  branch?: string;
  commitCount?: number;
  commitSubjects?: string[];
  prereleaseTag?: string;
  commitMeta?: CommitMetadata;
  error?: string;
}
```

### `ReleaseStepResult`

Result of a release step operation.

```typescript
interface ReleaseStepResult {
  success: boolean;
  dryRun?: boolean;
  error?: string;
  oldVersion?: string;
  newVersion?: string;
  url?: string;
}
```

### `ParsedCommit`

Parsed conventional commit.

```typescript
interface ParsedCommit {
  type: string;
  scope?: string;
  subject: string;
  body?: string;
  footer?: string;
  isBreaking: boolean;
  breakingChange?: string;
  prNumber?: number;
  hash?: string;
}
```

### `CommitInfo`

Commit information with hash.

```typescript
interface CommitInfo {
  message: string;
  hash: string;
}
```

### `Config`

Main configuration interface.

```typescript
interface Config<
  T extends Record<string, CommitTypeConfig> = Record<string, CommitTypeConfig>
> {
  types: T;
  hiddenScopes?: Partial<Record<keyof T, string[]>>;
  breakingKeywords?: string[];
  branches?: BranchConfig;
  markdown?: MarkdownConfig;
}
```

### `CommitTypeConfig`

Configuration for a commit type.

```typescript
interface CommitTypeConfig {
  bump: BumpType;
  section: string;
  hidden?: boolean;
}
```

### `BumpType`

Version bump types.

```typescript
type BumpType = "major" | "minor" | "patch";
```

## Error Handling

All async functions return results with error information:

```typescript
const result = await someFunction();
if (result.success) {
  // Success case
  console.log("Operation completed");
} else {
  // Error case
  console.error("Operation failed:", result.error);
}
```

For analysis functions, check the `error` property:

```typescript
const analysis = await analyzeCommitsForRelease();
if (analysis.error) {
  console.error("Analysis failed:", analysis.error);
  return;
}
// Continue with successful analysis
```
