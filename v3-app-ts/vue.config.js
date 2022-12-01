const { defineConfig } = require('@vue/cli-service');
const fs = require('fs');
const path = require('path');
const AutoImport = require('unplugin-auto-import/webpack');
const Components = require('unplugin-vue-components/webpack');
const { ElementPlusResolver } = require('unplugin-vue-components/resolvers');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    https: {
      key: fs.readFileSync(path.join(__dirname, './localhost+3-key.pem')),
      cert: fs.readFileSync(path.join(__dirname, './localhost+3.pem')),
    },
    host: '0.0.0.0',
    port: 8088,
    open: false,
  },
  configureWebpack: {
    plugins: [
      AutoImport({
        resolvers: [ElementPlusResolver()],
      }),
      Components({
        resolvers: [ElementPlusResolver()],
      }),
      new NodePolyfillPlugin(),
    ],
  },
  // chainWebpack(config) {
  //   config.resolve.fallback = { util: require.resolve('util/') };
  // },
});
