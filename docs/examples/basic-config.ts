import type {
  CommitTypeConfig,
  Config,
} from "@super-secret-test-org/simple-versioning";

// Define your commit types - this becomes the single source of truth
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
