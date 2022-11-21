import { defineConfig } from 'father';

export default (type, name) => {
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
  };

  if (type === 'ts') {
    return defineConfig({
      umd: {
        name,
        output: 'dist',
      },
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
