import { expect, test } from '@playwright/test';

test('dashboard reports the live backend status', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Gateway Dashboard' })).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('Online');
  await page.getByRole('button', { name: 'Check again' }).click();
  await expect(page.getByRole('status')).toHaveText('Online');
});

test('failed health checks can be retried', async ({ page }) => {
  await page.route('**/api/health', (route) => route.fulfill({ status: 503, body: 'Unavailable' }));
  await page.goto('/');
  await expect(page.getByRole('status')).toHaveText('Unavailable');
  await page.unroute('**/api/health');
  await page.getByRole('button', { name: 'Check again' }).click();
  await expect(page.getByRole('status')).toHaveText('Online');
});

test('invalid health data is not reported as online', async ({ page }) => {
  await page.route('**/api/health', (route) => route.fulfill({ json: { status: 'ok', service: 'unexpected-service' } }));
  await page.goto('/');
  await expect(page.getByRole('status')).toHaveText('Unavailable');
});

test('dashboard fits a narrow mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await expect(page.getByRole('status')).toHaveText('Online');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
