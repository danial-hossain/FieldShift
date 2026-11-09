import reactHooks from 'eslint-plugin-react-hooks';

export default [
  {
    files: ['src/**/*.{js,jsx}'],
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },
];
