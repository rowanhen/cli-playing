# Type Safety

Simple Versioning provides excellent TypeScript support with compile-time validation and type inference.

## Type-Safe Configuration

The configuration system ensures that only valid commit types and section names can be used:

```typescript
import type {
  Config,
  CommitTypeConfig,
} from "@super-secret-test-org/simple-versioning";

const COMMIT_TYPES = {
  feat: { bump: "minor", section: "Features" },
  fix: { bump: "patch", section: "Bug Fixes" },
  docs: { bump: "patch", section: "Documentation" },
} as const satisfies Record<string, CommitTypeConfig>;

export const config: Config<typeof COMMIT_TYPES> = {
  types: COMMIT_TYPES,
  hiddenScopes: {
    feat: ["internal"], // ✅ Valid - "feat" exists in COMMIT_TYPES
    // invalid: ["scope"],  // ❌ TypeScript error - "invalid" doesn't exist
  },
  markdown: {
    sections: {
      Features: "🚀 Features", // ✅ Valid - "Features" is defined in feat type
      // "Invalid": "❌",             // ❌ TypeScript error - not a valid section
    },
  },
};
```

## Type Inference

Extract types from your configuration for use throughout your codebase:

```typescript
import type {
  ExtractCommitTypes,
  ExtractSectionNames,
} from "@super-secret-test-org/simple-versioning";

// Extract commit types from your config
type MyCommitTypes = ExtractCommitTypes<typeof config>;
// Result: "feat" | "fix" | "docs"

// Extract section names from your config
type MySectionNames = ExtractSectionNames<(typeof config)["types"]>;
// Result: "Features" | "Bug Fixes" | "Documentation"
```

## Helper Functions

Use type-safe helper functions to validate commit types and get valid options:

```typescript
import {
  isValidCommitType,
  getValidCommitTypes,
  getValidSectionNames,
} from "@super-secret-test-org/simple-versioning";

// Type guard function
function processCommit(type: string) {
  if (isValidCommitType(type)) {
    // TypeScript knows this is a valid commit type
    console.log(`Processing ${type} commit`);
  }
}

// Get all valid commit types
const commitTypes = getValidCommitTypes();
// Returns: ["feat", "fix", "docs", "style", "refactor", "perf", "test", "chore"]

// Get all section names
const sections = getValidSectionNames();
// Returns: ["Features", "Bug Fixes", "Documentation", ...]
```

## Compile-Time Validation

TypeScript catches configuration errors at compile time:

### Invalid Commit Types

```typescript
// ❌ TypeScript Error
hiddenScopes: {
  invalid: ["scope"],  // Error: "invalid" is not a valid commit type
}
```

### Invalid Section Names

```typescript
// ❌ TypeScript Error
markdown: {
  sections: {
    "Invalid Section": "❌",  // Error: not a valid section name
  },
}
```

### Type Mismatches

```typescript
// ❌ TypeScript Error
const COMMIT_TYPES = {
  feat: {
    bump: "invalid", // Error: must be "major" | "minor" | "patch"
    section: "Features",
  },
};
```

## IntelliSense Support

Get full autocomplete support in your IDE:

- **Commit types**: Autocomplete when configuring `hiddenScopes`
- **Section names**: Autocomplete when configuring `markdown.sections`
- **Configuration options**: Full IntelliSense for all config properties
- **Function parameters**: Type hints for all function calls

## Advanced Type Usage

### Custom Type Guards

```typescript
import type { ExtractCommitTypes } from "@super-secret-test-org/simple-versioning";
import { config } from "./release.config.js";

type ValidCommitType = ExtractCommitTypes<typeof config>;

function isFeatureCommit(type: ValidCommitType): type is "feat" {
  return type === "feat";
}

function isBugFixCommit(type: ValidCommitType): type is "fix" {
  return type === "fix";
}
```

### Type-Safe Utilities

```typescript
import type {
  Config,
  CommitTypeConfig,
} from "@super-secret-test-org/simple-versioning";

// Create a utility to get bump type for a commit type
function getBumpType<T extends Record<string, CommitTypeConfig>>(
  config: Config<T>,
  commitType: keyof T
): "major" | "minor" | "patch" {
  return config.types[commitType].bump;
}

// Usage with full type safety
const bumpType = getBumpType(config, "feat"); // Returns "minor"
```

## Benefits

1. **Compile-time safety**: Catch configuration errors before runtime
2. **IntelliSense support**: Full autocomplete in your IDE
3. **Refactoring safety**: Rename commit types and sections with confidence
4. **Documentation**: Types serve as living documentation
5. **Consistency**: Ensure consistent usage across your codebase
