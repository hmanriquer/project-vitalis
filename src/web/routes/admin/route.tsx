import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/admin')({
  component: () => (
    <div data-testid="admin-layout">
      <Outlet />
    </div>
  ),
});
