import * as esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  target: "node18",
  outfile: "dist/bundle.js",
  external: [],
  format: "cjs",
  sourcemap: true,
  minify: false,
});
