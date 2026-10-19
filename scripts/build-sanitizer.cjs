const path = require('node:path');
const { buildSync } = require('esbuild');

buildSync({
  entryPoints: [require.resolve('sanitize-html')],
  outfile: path.resolve(__dirname, '../vendor/sanitize-html.cjs'),
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node24',
});
