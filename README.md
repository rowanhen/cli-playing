# Creating Scoped NPM Packages for @mrshmllw

This guide walks through the process of creating and publishing a new scoped NPM package under the @mrshmllw organization.

## Prerequisites

1. Node.js and npm installed on your machine
2. Access to the @mrshmllw organization on npm
3. npm account logged in locally (`npm login`)

## Steps to Create a New Package

### 1. Create a New Directory

```bash
mkdir @mrshmllw/your-package-name
cd @mrshmllw/your-package-name
```

### 2. Initialize the Package

```bash
npm init --scope=@mrshmllw
```

This will create a `package.json` file. Make sure to:

- Provide a clear package description
- Set the version (start with 1.0.0)
- Add appropriate keywords
- Set the license (e.g., MIT)

### 3. Configure package.json

Your `package.json` should look similar to this:

```json
{
  "name": "@mrshmllw/your-package-name",
  "version": "1.0.0",
  "description": "Your package description",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "prepublishOnly": "npm run build"
  },
  "publishConfig": {
    "access": "restricted"
  },
  "keywords": [],
  "author": "",
  "license": "MIT"
}
```

### 4. Set Up TypeScript (Recommended)

First, install TypeScript and the recommended tsconfig base:

```bash
npm install --save-dev typescript @types/node @total-typescript/tsconfig
```

Create a `tsconfig.json`. Since we're creating a library with a bundler, we'll use the appropriate base configuration:

```json
{
  "extends": "@total-typescript/tsconfig/bundler/dom/library",
  "compilerOptions": {
    "outDir": "dist"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

The configuration above is optimized for:

- Building a library (rather than an app)
- Using an external bundler
- Code that runs in the DOM

If your package doesn't run in the DOM (e.g., Node.js only), use this instead:

```json
{
  "extends": "@total-typescript/tsconfig/bundler/no-dom/library",
  "compilerOptions": {
    "outDir": "dist"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

This configuration includes best practices like:

- Strict type checking
- Modern JavaScript features
- Proper module resolution
- Source map generation
- Declaration file generation
- And more sensible defaults

For more details on the configuration options, visit:

- [TSConfig Cheat Sheet](https://www.totaltypescript.com/tsconfig-cheat-sheet)
- [@total-typescript/tsconfig](https://github.com/total-typescript/tsconfig)

### 5. Create Your Package Content

Create a `src` directory and add your package code:

```bash
mkdir src
touch src/index.ts
```

### 6. Build and Test

```bash
npm run build
npm test
```

### 7. Publishing

Before publishing:

1. Ensure you're logged in to npm:

   ```bash
   npm login
   ```

2. Check you have access to the @mrshmllw organization:

   ```bash
   npm org ls @mrshmllw
   ```

3. Publish the package:
   ```bash
   npm publish
   ```

### 8. Versioning and Updates

To update your package:

1. Make your changes
2. Update the version:
   ```bash
   npm version patch  # for bug fixes
   npm version minor  # for new features
   npm version major  # for breaking changes
   ```
3. Publish:
   ```bash
   npm publish
   ```

## Best Practices

1. **Documentation**: Always include:

   - Clear installation instructions
   - Usage examples
   - API documentation
   - Contributing guidelines

2. **Testing**: Implement comprehensive tests

3. **Semantic Versioning**: Follow semver principles:

   - MAJOR version for incompatible API changes
   - MINOR version for backwards-compatible features
   - PATCH version for backwards-compatible bug fixes

4. **Git Integration**:
   ```bash
   git init
   echo "node_modules/\ndist/" > .gitignore
   git add .
   git commit -m "Initial commit"
   ```

## Example Usage

```typescript
import { someFunction } from "@mrshmllw/your-package-name";

// Use your package
someFunction();
```
