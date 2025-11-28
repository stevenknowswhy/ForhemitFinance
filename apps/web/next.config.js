/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  // Enable React strict mode
  reactStrictMode: true,
  
  // Environment variables that should be available on the client
  env: {
    // NEXT_PUBLIC_* variables are automatically exposed
  },
  
  // Webpack configuration for Convex imports
  webpack: (config) => {
    // Follow symlinks to resolve Convex files
    config.resolve.symlinks = true;
    
    return config;
  },
};

module.exports = nextConfig;

