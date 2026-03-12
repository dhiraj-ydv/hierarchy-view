import esbuild from "esbuild";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import builtins from "builtin-modules";

const production = process.argv[2] === "production";
const copySqlWasm = {
  name: "copy-sql-wasm",
  /** @param {esbuild.PluginBuild} build */
  setup(build) {
    build.onEnd(async () => {
      const source = path.resolve("node_modules/sql.js/dist/sql-wasm.wasm");
      const target = path.resolve("sql-wasm.wasm");
      await fs.copyFile(source, target);
    });
  },
};

const context = await esbuild.context({
  banner: {
    js: "/* eslint-disable */",
  },
  bundle: true,
  entryPoints: ["main.ts"],
  external: [
    "obsidian",
    "electron",
    "@codemirror/autocomplete",
    "@codemirror/collab",
    "@codemirror/commands",
    "@codemirror/language",
    "@codemirror/lint",
    "@codemirror/search",
    "@codemirror/state",
    "@codemirror/view",
    "@lezer/common",
    "@lezer/highlight",
    "@lezer/lr",
    ...builtins,
  ],
  format: "cjs",
  target: "es2020",
  logLevel: "info",
  sourcemap: production ? false : "inline",
  treeShaking: true,
  outfile: "main.js",
  plugins: [copySqlWasm],
});

if (production) {
  await context.rebuild();
  await context.dispose();
} else {
  await context.watch();
}
