# Changelog

All notable changes to this project will be documented in this file.

## [1.4.2] - 2025-05-28

### 🧹 Chores

- cleaning up repo config.ts file to not include helpers ([b9df2fa](https://github.com/rowanhen/simple-versioning/commit/b9df2facbfdcb43b3998e2c35bb8ac6c08af4581))

## [1.4.1] - 2025-05-28

### 🐛 Bug Fixes

- update package-lock.json version during release process - Add npm install --package-lock-only after updating package.json version - Ensures package-lock.json version stays in sync with package.json - Includes fallback to npm install --no-save for older npm versions - Fixes issue where package-lock.json version was outdated in release commits ([dbb458d](https://github.com/rowanhen/simple-versioning/commit/dbb458df2ccd64d1ce15bf8d59d2a0a7877c33a6))

## [1.4.0] - 2025-05-28

### 🐛 Bug Fixes

- dry-run workflow to use correct npmrc ([cbd3e6a](https://github.com/rowanhen/simple-versioning/commit/cbd3e6af547e79f17d3d28f8906963aeff09c482))
- update vitest config to find test files in src/tests directory ([f9dc96c](https://github.com/rowanhen/simple-versioning/commit/f9dc96c15d228250b001ecc5138b6cf6446c09fd))

### Chores

- 1.3.3 [skip ci] (release) ([3c265bd](https://github.com/rowanhen/simple-versioning/commit/3c265bda739f72c447b050252f2fe1b8fce86c56))
- 1.3.2 [skip ci] (release) ([85f61c5](https://github.com/rowanhen/simple-versioning/commit/85f61c565cace803fd5ce68fa03582b75ee2ff70))
- 1.3.1 [skip ci] (release) ([6ddb90a](https://github.com/rowanhen/simple-versioning/commit/6ddb90a5cd543e1762dbf67065818ae696fb159a))

### 🚀 Features

- clearer README and documentation, adding test files ([6fa2ea6](https://github.com/rowanhen/simple-versioning/commit/6fa2ea692989010fb853f25884a8dd2801e3b875))

## [1.3.0] - 2025-05-27

### Features

- breaking up file
- modularise everthing

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
