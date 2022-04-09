module.exports = {
  branches: [
    'stable',
    // just for test semantic-release
    { name: 'alpha', prerelease: true },
  ],
  extends: 'semantic-release-monorepo',
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/changelog',
    '@semantic-release/npm',
    [
      '@semantic-release/git',
      {
        message: 'chore(release): ${nextRelease.gitTag} [skip ci]',
      },
    ],
    '@semantic-release/github',
  ],
  preset: 'angular',
};
