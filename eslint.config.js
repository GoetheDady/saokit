/**
 * ESLint 配置文件 (v9.0+ 格式)
 * 用于代码质量检查和风格统一
 */
import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
  // 基础 JavaScript 推荐配置
  js.configs.recommended,
  
  // TypeScript 文件配置
  {
    files: ['src/**/*.ts', 'test/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module'
      },
      globals: {
        // Node.js 全局变量
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        
        // 浏览器全局变量
        window: 'readonly',
        document: 'readonly',
        WebSocket: 'readonly',
        Blob: 'readonly',
        
        // 定时器函数
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint
    },
    rules: {
      // 代码风格规则
      'indent': ['error', 2],
      'quotes': ['error', 'single'],
      'semi': ['error', 'always'],
      
      // TypeScript 特定规则
      '@typescript-eslint/no-unused-vars': ['error', { 
        'argsIgnorePattern': '^_',
        'varsIgnorePattern': '^_' 
      }],
      '@typescript-eslint/explicit-function-return-type': 'off', // 关闭强制返回类型
      '@typescript-eslint/no-explicit-any': 'warn',
      
      // 通用规则
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-unused-vars': 'off' // 使用 TypeScript 版本的规则
    }
  },
  
  // 忽略文件配置
  {
    ignores: [
      'dist/',
      'node_modules/',
      '*.config.js',
      '*.config.cjs',
      'rollup.config.js',
      'jest.config.cjs'
    ]
  }
];