import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  server: {
    fs: {
      allow: [
        path.resolve(__dirname, ".."),
      ],
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        "datagraph-processor": "src/datagraph-processor.ts",
      },
    },
  },
});
