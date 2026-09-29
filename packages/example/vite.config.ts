import { defineConfig } from "vite";
import rsc from "@vitejs/plugin-rsc";

export default defineConfig({
  plugins: [
    rsc({
      entries: {
        rsc: "./entry.rsc.tsx",
        ssr: "./entry.ssr.tsx",
        client: "./entry.client.tsx",
      },
    }),
  ],
  server: {
    fs: {
      allow: [".."],
    },
  },
});
