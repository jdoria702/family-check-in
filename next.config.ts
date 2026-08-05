import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  /*Standalone -> .next/standalone/ (after npm run build)
    Creates a minimal server.js
    Folder contains required server files
    Only the necessary node_modules packages
  */
  output: "standalone"
};

export default nextConfig;
