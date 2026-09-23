import { QueryClientProvider } from '@tanstack/react-query';
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { queryClient } from '@/web/lib/query-client';
import { routeTree } from '@/web/routeTree.gen';

function renderAt(path: string) {
  const history = createMemoryHistory({ initialEntries: [path] });
  const router = createRouter({ routeTree, history });
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe('TanStack Router shells', () => {
  it('renders the public shop home at /', async () => {
    const screen = await renderAt('/');
    await expect.element(screen.getByTestId('shop-home')).toBeInTheDocument();
  });

  it('renders the admin home at /admin', async () => {
    const screen = await renderAt('/admin');
    await expect.element(screen.getByTestId('admin-layout')).toBeInTheDocument();
    await expect.element(screen.getByTestId('admin-home')).toBeInTheDocument();
  });
});
