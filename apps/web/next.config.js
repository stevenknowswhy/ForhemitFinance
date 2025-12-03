/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  // Enable React strict mode
  reactStrictMode: true,
  
  // Environment variables that should be available on the client
  env: {
    // NEXT_PUBLIC_* variables are automatically exposed
  },
  
  // Webpack configuration for Convex imports, tests directory, and modules directory
  webpack: (config, { defaultLoaders }) => {
    // Follow symlinks to resolve Convex files
    config.resolve.symlinks = true;
    
    // Allow imports from tests and modules directories (outside app directory)
    config.resolve.alias = {
      ...config.resolve.alias,
      '@tests': path.resolve(__dirname, '../../tests'),
      '@modules': path.resolve(__dirname, '../../modules'),
      '@convex': path.resolve(__dirname, '../../convex'),
    };
    
    // Process TypeScript files from tests and modules directories
    config.module.rules.push({
      test: /\.(ts|tsx)$/,
      include: [
        path.resolve(__dirname, '../../tests'),
        path.resolve(__dirname, '../../modules'),
      ],
      use: [defaultLoaders.babel],
    });
    
    return config;
  },
};

module.exports = nextConfig;

