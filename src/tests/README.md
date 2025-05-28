# Tests

This directory contains unit tests for the `@funcs` modules in the simple-versioning package.

## Test Structure

- **No Mocks**: Tests are designed to work without mocking external dependencies where possible
- **Dry Run Focus**: Most tests use dry-run mode to avoid side effects
- **Real Environment**: Tests work with the actual package.json and git environment

## Test Files

- `version-manager.test.ts` - Tests for version bumping functionality
- `npm-publisher.test.ts` - Tests for NPM publishing logic
- `changelog-generator.test.ts` - Tests for changelog generation
- `git-operations.test.ts` - Tests for git commit and tagging operations
- `github-release.test.ts` - Tests for GitHub release creation
- `release-orchestrator.test.ts` - Tests for the main orchestrator class
- `repository-utils.test.ts` - Tests for repository information utilities

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test

# Run tests with coverage
npm run test:coverage

# Run tests once
npm run test:run
```

## Test Philosophy

These tests focus on:

- **Logic validation**: Ensuring functions return correct data structures
- **Error handling**: Testing error conditions and edge cases
- **Configuration**: Testing different options and parameters
- **Integration**: Testing how components work together in dry-run mode

The tests avoid:

- **File system operations**: Using dry-run mode to prevent actual file changes
- **Network calls**: Using skip flags to avoid external API calls
- **Git operations**: Using dry-run mode to prevent actual git commands
- **Heavy mocking**: Preferring real function calls with safe parameters
