# Fix Package Manager Issues

## Current Problems

1. **pnpm 8.0.0** - Incompatible with Node.js 25.x
2. **npm** - Error: "Cannot read properties of null (reading 'matches')"

## Solution Steps

### Step 1: Fix npm First

```bash
# Clear npm cache completely
npm cache clean --force

# Remove npm config that might be corrupted
rm ~/.npmrc  # if it exists

# Verify npm works
npm --version
```

### Step 2: Fix pnpm with Corepack

```bash
# Disable corepack temporarily
corepack disable

# Remove any pnpm binaries
which pnpm
# Remove the path shown (usually /opt/homebrew/bin/pnpm or similar)

# Re-enable corepack
corepack enable

# Force install latest pnpm
corepack install -g pnpm@latest

# Or use a specific version
corepack install -g pnpm@10.23.0

# Verify
pnpm --version
```

### Step 3: Alternative - Use Yarn

If npm/pnpm still don't work:

```bash
# Install yarn
npm install -g yarn

# Use yarn instead
cd packages/shadcn-mcp-server
yarn install
yarn build

cd ../../apps/web
yarn install
yarn dev
```

### Step 4: Nuclear Option - Reinstall Node.js

If nothing works, the issue might be with Node.js 25.2.1 itself:

```bash
# Consider downgrading to Node.js 20.x LTS
# Using nvm (if installed):
nvm install 20
nvm use 20

# Or download from nodejs.org
```

## Quick Test

After fixing, test with:

```bash
# Test npm
npm install -g cowsay
cowsay "npm works!"

# Test pnpm
pnpm --version  # Should show 9.x or 10.x
```

## Workaround: Manual Installation

If package managers are completely broken, you can manually download packages, but this is not recommended. Better to fix the package managers first.

## Check System Issues

```bash
# Check network connectivity
ping registry.npmjs.org

# Check DNS
nslookup registry.npmjs.org

# Check for proxy settings
echo $HTTP_PROXY
echo $HTTPS_PROXY
echo $http_proxy
echo $https_proxy
```

## Most Likely Fix

The npm error suggests a corrupted cache or config. Try:

```bash
# Complete npm reset
npm cache clean --force
rm -rf ~/.npm
rm ~/.npmrc 2>/dev/null

# Then try again
npm install
```

