import path from "path";

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      allow: [path.resolve(__dirname, "..")],
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        "datagraph-processor": "src/audio-worklet/datagraph-audio-worklet-processor.ts",
      },
    },
  },
});
