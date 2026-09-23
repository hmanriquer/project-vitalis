import { createFileRoute } from '@tanstack/react-router';
import { AdminHomeScreen } from '@/web/features/admin/admin-home-screen';

export const Route = createFileRoute('/admin/')({
  component: AdminHomeScreen,
});
