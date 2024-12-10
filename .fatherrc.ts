import { defineConfig } from 'father';

export default (type, name, extendConfig = {}) => {
  const commonConfig = {
    esm: {
      output: 'esm',
    },
    cjs: {
      output: 'lib',
    },
    umd: {
      name,
      output: 'dist',
    },
    ...extendConfig,
  };
  if (type === 'ts') {
    return defineConfig({
      umd: {
        name,
        output: 'dist',
      },
      ...extendConfig,
    });
  }
  if (type === 'react') {
    return defineConfig({
      ...commonConfig,
      umd: {
        name,
        output: 'dist',
        externals: {
          antd: 'antd',
          react: 'react',
          'react-dom': 'ReactDom',
        },
      },
    });
  }
  return defineConfig(commonConfig);
};
