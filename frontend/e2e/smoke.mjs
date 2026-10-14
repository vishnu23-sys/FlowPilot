// End-to-end smoke test. Needs the backend on :5000, the frontend on :5173 and the demo account
// (cd backend && python seed_demo.py). Run: npm run e2e
import assert from 'node:assert/strict'
import { chromium } from 'playwright'

const BASE = process.env.E2E_BASE || 'http://localhost:5173'
const EMAIL = 'demo@flowpilot.test'
const PASSWORD = 'Demo!pass1'
const marker = `E2E coffee ${Date.now()}`

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('pageerror', (e) => errors.push(e.message))

/** Polls until fn() returns the expected value (UI updates are animated and async). */
const eventually = async (fn, expected, timeout = 4000) => {
  const start = Date.now()
  let last
  while (Date.now() - start < timeout) {
    last = await fn()
    if (last === expected) return
    await new Promise((r) => setTimeout(r, 100))
  }
  assert.equal(last, expected)
}

const step = async (name, fn) => {
  process.stdout.write(`- ${name} … `)
  await fn()
  console.log('ok')
}

try {
  await step('logs in and lands on the dashboard', async () => {
    await page.goto(`${BASE}/login`)
    await page.evaluate(() => localStorage.clear())
    await page.getByLabel('Email').fill(EMAIL)
    await page.getByLabel('Password').fill(PASSWORD)
    await page.getByRole('button', { name: 'Log in' }).click()
    await page.waitForURL('**/dashboard')
    await page.getByText('Spent this month').waitFor()
  })

  await step('N opens quick-add and saves an expense', async () => {
    await page.locator('body').click({ position: { x: 700, y: 120 } })
    await page.keyboard.press('n')
    await page.getByRole('dialog', { name: 'New expense' }).waitFor()
    await page.getByLabel('Amount').fill('123')
    await page.getByRole('radio', { name: 'Food' }).click()
    await page.getByLabel('Description').fill(marker)
    await page.getByRole('button', { name: 'Add expense' }).click()
    await page.getByRole('dialog', { name: 'New expense' }).waitFor({ state: 'detached' })
  })

  await step('the new expense shows on the Expenses page', async () => {
    await page.keyboard.press('g')
    await page.keyboard.press('e')
    await page.waitForURL('**/expenses')
    await page.getByRole('button', { name: new RegExp(`Edit ${marker}`) }).waitFor()
  })

  await step('search filters the list and syncs to the URL', async () => {
    await page.getByLabel('Search expenses').fill(marker)
    await page.waitForURL(/q=E2E/)
    await eventually(() => page.getByRole('button', { name: /^Edit / }).count(), 1)
  })

  await step('delete with undo restores the row', async () => {
    await page.getByRole('button', { name: new RegExp(`Edit ${marker}`) }).click()
    await page.getByRole('dialog', { name: 'Edit expense' }).waitFor()
    await page.getByRole('button', { name: 'Delete' }).click()
    await page.getByRole('button', { name: new RegExp(`Edit ${marker}`) }).waitFor({ state: 'detached' })
    await page.getByRole('button', { name: 'Undo' }).click()
    await page.getByRole('button', { name: new RegExp(`Edit ${marker}`) }).waitFor()
  })

  await step('delete for real after the undo window', async () => {
    await page.getByRole('button', { name: new RegExp(`Edit ${marker}`) }).click()
    await page.getByRole('button', { name: 'Delete' }).click()
    await page.waitForTimeout(5600)
    await page.reload()
    await page.getByLabel('Search expenses').waitFor()
    await eventually(() => page.getByRole('button', { name: new RegExp(`Edit ${marker}`) }).count(), 0)
  })

  await step('theme toggle switches and persists', async () => {
    const before = await page.evaluate(() => document.documentElement.dataset.theme)
    await page.getByRole('button', { name: /Switch to (light|dark) theme/ }).click()
    await page.waitForFunction((b) => document.documentElement.dataset.theme !== b, before)
    await page.reload()
    const after = await page.evaluate(() => document.documentElement.dataset.theme)
    assert.notEqual(after, before)
  })

  await step('sidebar collapses to a rail and stays collapsed after reload', async () => {
    await page.getByRole('button', { name: 'Collapse sidebar' }).click()
    await page.getByRole('button', { name: 'Expand sidebar' }).waitFor()
    await page.reload()
    await page.getByRole('button', { name: 'Expand sidebar' }).waitFor()
    await page.getByRole('button', { name: 'Expand sidebar' }).click()
  })

  await step('Ctrl K palette navigates', async () => {
    await page.keyboard.press('Control+k')
    await page.getByPlaceholder('Search pages, actions or expenses').fill('budgets')
    await page.locator('[cmdk-item][data-selected="true"]', { hasText: 'Budgets' }).waitFor()
    await page.keyboard.press('Enter')
    await page.waitForURL('**/budgets')
  })

  await step('no uncaught page errors', async () => {
    assert.deepEqual(errors, [])
  })
  console.log('\nSmoke test passed')
} catch (err) {
  console.log('FAILED')
  await page.screenshot({ path: 'e2e/failure.png', fullPage: true })
  console.error(err)
  process.exitCode = 1
} finally {
  await browser.close()
}
