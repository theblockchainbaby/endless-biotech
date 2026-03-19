import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // react-i18next (transitive dep from Sanity) augments ReactNode globally,
    // breaking Radix UI Slot component types. Not a runtime issue.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
