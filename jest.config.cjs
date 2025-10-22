/**
 * Jest 测试配置文件
 * 配置 TypeScript 支持和测试环境
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom', // 使用 jsdom 环境支持 WebSocket API
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],
  setupFilesAfterEnv: [],
  moduleFileExtensions: ['ts', 'js', 'json'],
  verbose: true
};