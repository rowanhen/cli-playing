// Shared TypeScript interfaces for release scripts

export interface CommitTypeConfig {
  bump: "major" | "minor" | "patch";
  section?: string;
  hidden?: boolean;
}

// Extract section names from commit type configs for better type safety
export type ExtractSectionNames<T extends Record<string, CommitTypeConfig>> = {
  [K in keyof T]: T[K]["section"] extends string ? T[K]["section"] : never;
}[keyof T];

// Extract commit type names from config
export type ExtractCommitTypes<T extends Config> = keyof T["types"];

export interface MarkdownConfig<TSections extends string = string> {
  changelog: {
    versionHeader: string; // Template: "## [{version}] - {date}"
    sectionHeader: string; // Template: "### {section}"
    listItem: string; // Template: "- {item}"
    dateFormat: string; // ISO format or custom
  };
  releaseNotes: {
    sectionHeader: string; // Template: "### {section}"
    listItem: string; // Template: "- {item}"
  };
  // Constrain sections to only valid section names from commit types
  sections: Partial<Record<TSections | "Breaking Changes", string>>;
}

// Improved Config interface with better type relationships
export interface Config<
  TTypes extends Record<string, CommitTypeConfig> = Record<
    string,
    CommitTypeConfig
  >
> {
  types: TTypes;
  // Constrain hiddenScopes keys to only valid commit types
  hiddenScopes: Partial<Record<keyof TTypes, string[]>>;
  breakingKeywords: string[];
  branches: {
    main: string;
    prereleasePattern: RegExp;
    prereleasePrefix: string;
  };
  // Constrain markdown sections to only valid section names from types
  markdown?: MarkdownConfig<ExtractSectionNames<TTypes>>;
}

// Helper type to validate that all section names in markdown.sections
// correspond to actual sections defined in commit types
export type ValidateConfig<T extends Config> = T extends Config<infer TTypes>
  ? T["markdown"] extends MarkdownConfig<infer TSections>
    ? TSections extends ExtractSectionNames<TTypes> | "Breaking Changes"
      ? T
      : never
    : T
  : never;

export interface ParsedCommit {
  type: string;
  scope?: string;
  description: string;
  breaking: boolean;
  body: string;
  hash?: string; // Commit hash
  prNumber?: string; // PR number if available
}

export interface CommitAnalysisResult {
  bump: "major" | "minor" | "patch";
  changes: Record<string, string[]>;
  hasOnlyHiddenChanges: boolean;
}

export interface AnalysisResult {
  error?: string;
  bump: "major" | "minor" | "patch";
  version: string;
  currentVersion: string;
  hasChanges: boolean;
  isPrerelease?: boolean;
  changes: Record<string, string[]>;
  hasOnlyHiddenChanges?: boolean;
  // Additional fields for detailed dry-run output
  packageName?: string;
  branch?: string;
  commitCount?: number;
  commitSubjects?: string[];
  prereleaseTag?: string | null;
  // Commit metadata for linking
  commitMeta?: Record<string, { hash?: string; prNumber?: string }>;
}

export interface PackageJson {
  name: string;
  version: string;
  [key: string]: any;
}

export interface PackInfo {
  files?: { length: number };
  size?: number;
}

export interface GitHubRelease {
  html_url: string;
  id: number;
}

export interface ReleaseOptions {
  dryRun?: boolean;
  skipNpm?: boolean;
  skipGithub?: boolean;
  skipChangelog?: boolean;
  config?: Partial<Config>;
}

export interface ReleaseStepResult {
  success: boolean;
  dryRun?: boolean;
  skipped?: boolean;
  reason?: string;
  error?: string;
  // Version-related fields
  oldVersion?: string;
  newVersion?: string;
  version?: string;
  // Changelog fields
  sections?: string[];
  changelogEntry?: string;
  changelogPreview?: string;
  // Commit fields
  message?: string;
  files?: string[];
  // Tag fields
  tag?: string;
  tagMessage?: string;
  gitCommand?: string;
  isPrerelease?: boolean;
  wouldCreate?: boolean;
  alreadyExists?: boolean;
  // NPM fields
  packageName?: string;
  fullPackageName?: string;
  registry?: string;
  description?: string;
  publishCommand?: string;
  // GitHub fields
  name?: string;
  prerelease?: boolean;
  releaseNotes?: string;
  repository?: string;
  url?: string;
  // Generic fields
  [key: string]: any;
}
