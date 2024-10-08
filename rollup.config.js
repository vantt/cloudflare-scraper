import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';


export default [
  
  {
    input: 'src/index.js',
    output: [
      { file: 'dist/index.js', format: 'es', exports: 'named', sourcemap: true },
      { file: 'dist/index.min.js', format: 'es', exports: 'named', sourcemap: true, plugins: [terser()] },
    ],
    plugins: [
      resolve(),
      babel({
        babelHelpers: 'runtime',
        exclude: 'node_modules/**',
        plugins: ['@babel/plugin-transform-runtime'],
      }),
    ],
  },
];
