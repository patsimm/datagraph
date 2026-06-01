import fs from "fs";
import path from "path";

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function coiServiceWorkerPlugin() {
  return {
    name: "coi-service-worker",
    buildStart() {
      const src = path.resolve(
        __dirname,
        "node_modules/coi-serviceworker/coi-serviceworker.min.js"
      );
      const dest = path.resolve(__dirname, "public/coi-serviceworker.js");
      fs.mkdirSync(path.resolve(__dirname, "public"), { recursive: true });
      fs.copyFileSync(src, dest);
    },
  };
}

export default defineConfig(() => ({
  plugins: [react(), coiServiceWorkerPlugin()],
  server: {
    host: true,
    fs: {
      allow: [path.resolve(__dirname, "..")],
    },
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
}));
