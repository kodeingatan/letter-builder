# CI/CD Setup

## GitHub Actions

### Basic Setup
```yaml
# .github/workflows/playwright.yml
name: Playwright Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test
      - uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

### With Nuxt Build
```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npx playwright test
```

## Optimize CI

### Install Only Needed Browser
```yaml
- run: npx playwright install chromium --with-deps
```

### Use Sharding
```yaml
strategy:
  matrix:
    shard: [1, 2, 3]
steps:
  - run: npx playwright test --shard=${{ matrix.shard }}/3
```

### Cache Dependencies
```yaml
- uses: actions/cache@v4
  with:
    path: |
      ~/.npm
      node_modules
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
```

## Other CI Platforms

### GitLab CI
```yaml
test:
  image: mcr.microsoft.com/playwright:v1.52.0-noble
  script:
    - npm ci
    - npx playwright test
  artifacts:
    when: always
    paths:
      - playwright-report/
```

### CircleCI
```yaml
jobs:
  test:
    docker:
      - image: mcr.microsoft.com/playwright:v1.52.0-noble
    steps:
      - checkout
      - run: npm ci
      - run: npx playwright test
```

## Best Practices

- Run tests on every push/PR
- Use Linux on CI (cheaper)
- Enable traces on first retry
- Upload HTML reports as artifacts
- Use matrix strategy for parallelism
- Cache node_modules
