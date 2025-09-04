**Extension Debugging**
- Goal: Run the Extension Host using compiled JS in `dist/` with TS source maps.
- Launch: `.vscode/launch.json` → `type: extensionHost`, `preLaunchTask: pnpm: watch`, `outFiles: dist/**/*.js`.
- Task: `.vscode/tasks.json` → shell task `pnpm run watch` with `$tsc-watch` matcher.
- Build: `pnpm run build` runs `tsc && tsc-alias && node src/scripts/fix-import-extensions.cjs`.
- Watch: `pnpm run watch` now also runs `chokidar` to post-fix ESM imports with missing `.js` extensions under `dist/**/*.js`.
- First-time setup: `pnpm install` (installs `chokidar-cli`), then F5 → "Run Extension".
- Why Markdown debug error appears: starting debug without a launch config makes VS Code try to debug the active language (Markdown). Use the "Run Extension" configuration instead.
