import adapter from "@sveltejs/adapter-static";
import { sveltekit } from "@sveltejs/kit/vite";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";
const repository = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "hearth";
const pagesBase: "" | `/${string}` =
  process.env.GITHUB_PAGES === "true" && !repository.endsWith(".github.io")
    ? `/${repository}`
    : "";

export default defineConfig({
  plugins: [
    sveltekit({
      preprocess: vitePreprocess(),
      paths: { base: pagesBase },
      adapter: adapter({
        pages: "build",
        assets: "build",
        fallback: "200.html",
      }),
    }),
  ],
});
