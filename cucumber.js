module.exports = {
  default: {
    paths: ['src/cucumber/**/feature/**/*.feature'],
    requireModule: ['tsx'],
    require: ['src/cucumber/support/**/*.ts', 'src/cucumber/**/steps/**/*.ts'],
    format: ['progress-bar', 'html:reports/cucumber/report.html', './src/cucumber/support/tta-formatter.ts'],
    publishQuiet: true,
  },
};

