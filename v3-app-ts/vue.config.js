const { defineConfig } = require('@vue/cli-service');
const fs = require('fs');
const path = require('path');
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
});
