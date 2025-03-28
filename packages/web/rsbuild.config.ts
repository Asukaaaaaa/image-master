import { defineConfig } from '@rsbuild/core';
import { pluginBabel } from '@rsbuild/plugin-babel';
import { pluginSolid } from '@rsbuild/plugin-solid';
import postcssPluginTailwindcss from '@tailwindcss/postcss';

export default defineConfig({
  server: {
    port: 1420,
  },
  plugins: [
    pluginBabel({
      include: /\.(?:jsx|tsx)$/,
    }),
    pluginSolid(),
  ],
  tools: {
    postcss(config, ctx) {
      ctx.addPlugins(postcssPluginTailwindcss());
    },
  },
});
