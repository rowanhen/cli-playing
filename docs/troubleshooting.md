# Troubleshooting

Common issues and solutions when using Simple Versioning.

## Installation Issues

### NPM Package Not Found

**Problem:** `npm install @super-secret-test-org/simple-versioning` fails with "package not found"

**Solutions:**

1. Check if you have access to the organization's packages
2. Ensure you're authenticated with NPM: `npm login`
3. Verify the package name is correct
4. Check if the package is published: `npm view @super-secret-test-org/simple-versioning`

### Permission Denied

**Problem:** Permission errors during installation

**Solutions:**

1. Use `sudo` (not recommended): `sudo npm install`
2. Fix NPM permissions: `npm config set prefix ~/.npm-global`
3. Use a Node version manager like `nvm`

## Configuration Issues

### TypeScript Errors in Config

**Problem:** TypeScript compilation errors in `release.config.ts`

**Common Errors:**

```typescript
// ❌ Invalid commit type
const config = {
  types: {
    feat: { bump: "minor", section: "Features" },
    fix: { bump: "patch", section: "Bug Fixes" },
    invalid: { bump: "invalid", section: "Invalid" }, // Error: invalid bump type
  },
};

// ✅ Correct
const config = {
  types: {
    feat: { bump: "minor", section: "Features" },
    fix: { bump: "patch", section: "Bug Fixes" },
    docs: { bump: "patch", section: "Documentation" },
  },
};
```

**Solutions:**

1. Ensure bump types are `"major"`, `"minor"`, or `"patch"`
2. Check that all required properties are present
3. Use the provided TypeScript types for validation

### Config File Not Found

**Problem:** "Configuration file not found" error

**Solutions:**

1. Create `release.config.ts` in your project root
2. Ensure the file exports a default config object
3. Check file permissions and accessibility

## Git Issues

### No Git Repository

**Problem:** "Not a git repository" error

**Solutions:**

1. Initialize git: `git init`
2. Ensure you're in the correct directory
3. Check if `.git` folder exists

### No Commits Found

**Problem:** "No commits found since last tag" or similar

**Solutions:**

1. Make some commits: `git commit -m "feat: initial commit"`
2. Check if you have any tags: `git tag -l`
3. Ensure commits follow conventional commit format

### No Remote Repository

**Problem:** Automatic links not working, repository detection fails

**Solutions:**

1. Add a remote: `git remote add origin https://github.com/user/repo.git`
2. Set `GITHUB_REPOSITORY` environment variable: `export GITHUB_REPOSITORY=user/repo`
3. Check remote URL: `git remote -v`

## Release Issues

### No Changes Detected

**Problem:** "No changes detected" when you expect a release

**Possible Causes:**

1. All commits are hidden types (e.g., `docs`, `test`)
2. No conventional commits since last tag
3. All changes are in hidden scopes

**Solutions:**

1. Check your commit messages follow conventional format:
   ```bash
   git log --oneline
   ```
2. Review hidden types in your config
3. Make a feature commit: `git commit -m "feat: add new feature"`

### Version Bump Issues

**Problem:** Wrong version bump (major instead of minor, etc.)

**Solutions:**

1. Check commit types in your config
2. Look for breaking change indicators:
   - `BREAKING CHANGE:` in commit body
   - `!` after type: `feat!: breaking change`
3. Review `breakingKeywords` in config

### Authentication Failures

**Problem:** GitHub or NPM authentication errors

**GitHub Issues:**

```bash
# Check token
echo $GITHUB_TOKEN

# Test authentication
gh auth status

# Set token
export GITHUB_TOKEN=your_token_here
```

**NPM Issues:**

```bash
# Check authentication
npm whoami

# Login
npm login

# Check registry
npm config get registry
```

## Build Issues

### TypeScript Compilation Errors

**Problem:** Build fails with TypeScript errors

**Solutions:**

1. Check TypeScript version compatibility
2. Ensure all dependencies are installed: `npm install`
3. Clear build cache: `rm -rf dist && npm run build`
4. Check `tsconfig.json` configuration

### Missing Dependencies

**Problem:** Runtime errors about missing modules

**Solutions:**

1. Install missing dependencies: `npm install`
2. Check `package.json` for correct dependencies
3. Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`

## GitHub Actions Issues

### Workflow Not Triggering

**Problem:** GitHub Actions workflow doesn't run

**Solutions:**

1. Check workflow file location: `.github/workflows/release.yml`
2. Verify YAML syntax
3. Check branch triggers match your setup
4. Ensure workflow is enabled in repository settings

### Permission Errors in Actions

**Problem:** "Permission denied" or "Resource not accessible" errors

**Solutions:**

1. Check `GITHUB_TOKEN` permissions in workflow
2. Ensure token has required scopes:
   - `contents: write` for releases
   - `packages: write` for packages
3. Use Personal Access Token if needed

### Secrets Not Available

**Problem:** Environment variables/secrets are undefined

**Solutions:**

1. Add secrets in repository settings
2. Check secret names match workflow file
3. Verify organization-level secrets if applicable

## Performance Issues

### Slow Commit Analysis

**Problem:** Release process takes too long

**Solutions:**

1. Limit commit history: use shallow clones in CI
2. Optimize git operations
3. Check for large repository issues

### Memory Issues

**Problem:** Out of memory errors during build/release

**Solutions:**

1. Increase Node.js memory: `node --max-old-space-size=4096`
2. Check for memory leaks in custom scripts
3. Use streaming for large operations

## Debug Mode

Enable debug logging to troubleshoot issues:

```bash
# Enable debug mode
export DEBUG=simple-versioning:*

# Run with verbose output
npm run release -- --verbose
```

## Getting Help

If you're still experiencing issues:

1. **Check the logs:** Look for detailed error messages
2. **Verify configuration:** Ensure your config matches the examples
3. **Test in isolation:** Try with a minimal configuration
4. **Check dependencies:** Ensure all required tools are installed
5. **Review documentation:** Check the other docs for specific features

## Common Error Messages

### "No package.json found"

- Ensure you're in the correct directory
- Check if `package.json` exists and is readable

### "Invalid version format"

- Check current version in `package.json`
- Ensure version follows semver format (e.g., "1.2.3")

### "Branch not allowed for release"

- Check `branches.allowed` in your configuration
- Ensure you're on the correct branch

### "No GitHub token found"

- Set `GITHUB_TOKEN` environment variable
- Check token permissions and expiration

### "NPM authentication failed"

- Run `npm login` to authenticate
- Check `NPM_TOKEN` environment variable
- Verify registry configuration
