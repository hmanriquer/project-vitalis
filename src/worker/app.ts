import { Hono } from 'hono';
import { AppError, notFound, onError } from '@/worker/lib/errors';
import { createDefaultServices, type Services } from '@/worker/services';

export type AppEnv = {
  Bindings: Env;
  Variables: {
    services: Services;
  };
};

export function createApp(serviceOverrides: Partial<Services> = {}) {
  const app = new Hono<AppEnv>();

  app.use('*', async (c, next) => {
    c.set('services', createDefaultServices(serviceOverrides));
    await next();
  });

  app.onError(onError);

  app.notFound(() => {
    notFound();
  });

  app.get('/api/health', (c) => c.json({ status: 'ok' }));

  app.get('/api/_test/app-error', () => {
    throw new AppError('test_error', 'Error de prueba', 418);
  });

  app.get('/api/_test/clock', (c) => {
    const services = c.get('services');
    return c.json({ iso: services.clock.now().toISOString() });
  });

  return app;
}
