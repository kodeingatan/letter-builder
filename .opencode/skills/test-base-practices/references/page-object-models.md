# Page Object Models

## Concept

Page Object Models encapsulate page structure into reusable classes. Reduces duplication, improves maintainability.

## Basic Example

### LoginPage.ts
```ts
import { type Page, type Locator } from '@playwright/test'

export class LoginPage {
  readonly page: Page
  readonly usernameInput: Locator
  readonly passwordInput: Locator
  readonly submitButton: Locator
  readonly errorMessage: Locator

  constructor(page: Page) {
    this.page = page
    this.usernameInput = page.getByLabel('Username')
    this.passwordInput = page.getByLabel('Password')
    this.submitButton = page.getByRole('button', { name: 'Sign in' })
    this.errorMessage = page.getByRole('alert')
  }

  async goto() {
    await this.page.goto('/login')
  }

  async login(username: string, password: string) {
    await this.usernameInput.fill(username)
    await this.passwordInput.fill(password)
    await this.submitButton.click()
  }
}
```

### Usage in Test
```ts
import { test, expect } from '@playwright/test'
import { LoginPage } from './LoginPage'

test('login', async ({ page }) => {
  const loginPage = new LoginPage(page)
  await loginPage.goto()
  await loginPage.login('admin', 'password')
  await expect(page).toHaveURL('/dashboard')
})
```

## With Fixtures

### Fixtures.ts
```ts
import { test as base } from '@playwright/test'
import { LoginPage } from './LoginPage'

type Fixtures = {
  loginPage: LoginPage
}

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page))
  },
})

export { expect } from '@playwright/test'
```

### Usage
```ts
import { test, expect } from './fixtures'

test('login', async ({ loginPage }) => {
  await loginPage.goto()
  await loginPage.login('admin', 'password')
  await expect(loginPage.page).toHaveURL('/dashboard')
})
```

## Nested Pages

```ts
export class DashboardPage {
  readonly page: Page
  readonly sidebar: Sidebar
  readonly header: Header

  constructor(page: Page) {
    this.page = page
    this.sidebar = new Sidebar(page)
    this.header = new Header(page)
  }
}

export class Sidebar {
  readonly page: Page
  readonly usersLink: Locator
  readonly settingsLink: Locator

  constructor(page: Page) {
    this.page = page
    this.usersLink = page.getByRole('link', { name: 'Users' })
    this.settingsLink = page.getByRole('link', { name: 'Settings' })
  }

  async goToUsers() {
    await this.usersLink.click()
  }
}
```

## Best Practices

- One class per page or major component
- Locator as class properties, not in methods
- Methods represent user actions
- Return page/locator for chaining
- Use fixtures for dependency injection
