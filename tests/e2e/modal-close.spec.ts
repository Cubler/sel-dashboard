import { test, expect } from '@playwright/test'

test.describe('SymbolDetailModal close', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/')
    // Log in
    await page.getByLabel('Server URL').fill('http://localhost:3000')
    await page.getByLabel('Username').fill('testuser')
    await page.getByLabel('Password').fill('testpass')
    await page.getByRole('button', { name: 'Connect to Server' }).click()
    // Wait for the symbol table to appear
    await page.waitForURL('**/dashboard')
    await page.getByText('AnalogDeadband').waitFor()
  })

  test('closes via X button', async ({ page }) => {
    await page.getByText('AnalogDeadband').click()
    await expect(page.getByRole('dialog')).toBeVisible()

    await page.getByRole('button', { name: 'Close' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('closes via backdrop click', async ({ page }) => {
    await page.getByText('AnalogDeadband').click()
    await expect(page.getByRole('dialog')).toBeVisible()

    // Click outside the dialog panel (top-left corner of the overlay)
    await page.mouse.click(5, 5)
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('closes via Escape key', async ({ page }) => {
    await page.getByText('AnalogDeadband').click()
    await expect(page.getByRole('dialog')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })
})
