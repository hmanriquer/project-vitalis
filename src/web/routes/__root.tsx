import { createRootRoute, Outlet } from '@tanstack/react-router';

export const Route = createRootRoute({
  component: () => (
    <div className="min-h-dvh bg-background text-foreground font-sans">
      <Outlet />
    </div>
  ),
});
