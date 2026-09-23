import { createFileRoute } from '@tanstack/react-router';
import { ShopHomeScreen } from '@/web/features/shop/shop-home-screen';

export const Route = createFileRoute('/')({
  component: ShopHomeScreen,
});
