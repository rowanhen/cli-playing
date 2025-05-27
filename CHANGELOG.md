# Changelog

All notable changes to this project will be documented in this file.

## [1.2.2] - 2025-05-27

### Chores

- 1.2.1 [skip ci]

## [1.2.1] - 2025-05-27

### Refactors

- undoing NODE_AUTH_TOKEN changes and opting for .npmrc being created in workflow

### Chores

- 1.2.0 [skip ci]

## [1.2.0] - 2025-05-27

### Chores

- remove hardcoded registry
- remove whoami check
- removing unneeded checks
- rename NODE_AUTH_TOKEN to NPM_TOKEN
- renaming repo and package
- updating repo urls

### Bug Fixes

- possible publish fix
- adding early auth check and adding skip auth in dry-run
- remove full changelog preview to avoid confusion
- preventing duplicate CHANGELOG bug
- adding build step to workflow as we are using our own CLI for the workflow
- renaming NODE_AUTH_TOKEN to NPM_TOKEN and deleting scripts folder
- update npm scripts to use CLI instead of removed scripts folder

### Features

- enhance CLI with detailed dry-run output - Add step-by-step logging for all release phases - Show detailed information for each step - Fix property name mismatches between CLI and automation methods - Provide comprehensive dry-run visibility like original scripts
- update to Node.js 20 LTS and use .nvmrc consistently - Add .nvmrc file with Node.js 20 (latest LTS) - Update all GitHub workflows to use node-version-file instead of hardcoded versions - Update package.json engines to require Node.js >=20.0.0 - Replace GitHub App token with simpler GH_TOKEN approach - Update documentation examples to use .nvmrc and GH_TOKEN - Ensure consistent Node.js version across development and CI/CD
- improve package structure and publishing setup - Remove dist/ from git tracking (added to .gitignore) - Add comprehensive .npmignore to control published files - Add workflow example for other projects - Update documentation with complete API reference - Ensure only compiled dist/ files are published to NPM
- add programmatic API and CLI for release automation

## [1.1.0] - 2025-05-27

### Documentation

- update README with package description

### Features

- initial TypeScript release automation setup
