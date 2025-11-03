module.exports = {
  extends: ['../.eslintrc.js'],
  rules: {
    // Playground 使用路径别名和 Vite,禁用所有 import 解析规则
    'import/no-extraneous-dependencies': 'off',
    'import/no-unresolved': 'off',
    'import/extensions': 'off',
    'import/no-absolute-path': 'off',
    'import/no-cycle': 'off',
    'import/namespace': 'off',
    'import/default': 'off',
    'import/no-named-as-default': 'off',
    'import/no-named-as-default-member': 'off',
    'import/no-duplicates': 'off',
    'import/no-self-import': 'off',
    'import/no-useless-path-segments': 'off',
    'import/order': 'off',
    // React 17+ 不需要显式引入 React
    'react/jsx-uses-react': 'off',
    'react/react-in-jsx-scope': 'off',
  },
};
