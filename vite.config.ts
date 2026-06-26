import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  nitro: {
    preset: process.env.NITRO_PRESET ?? "cloudflare",
    rollupConfig: {
      external: [
        /^@tanstack\/react-router/,
        /^@tanstack\/react-query/,
        /^@tanstack\/react-start/,
        /^@radix-ui\/.*/,
        /^framer-motion/,
        "sonner",
        // react र react-dom हटाइयो — bundle हुनुपर्छ
      ],
    },
  },
});
