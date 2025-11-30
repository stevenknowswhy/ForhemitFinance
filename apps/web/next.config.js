/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  // Enable React strict mode
  reactStrictMode: true,
  
  // Environment variables that should be available on the client
  env: {
    // NEXT_PUBLIC_* variables are automatically exposed
  },
  
  // Webpack configuration for Convex imports and tests directory
  webpack: (config, { defaultLoaders }) => {
    // Follow symlinks to resolve Convex files
    config.resolve.symlinks = true;
    
    // Allow imports from tests directory (outside app directory)
    config.resolve.alias = {
      ...config.resolve.alias,
      '@tests': path.resolve(__dirname, '../../tests'),
    };
    
    // Process TypeScript files from tests directory
    config.module.rules.push({
      test: /\.(ts|tsx)$/,
      include: [path.resolve(__dirname, '../../tests')],
      use: [defaultLoaders.babel],
    });
    
    return config;
  },
};

module.exports = nextConfig;

