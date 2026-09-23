import { createApp } from '@/worker/app';

const app = createApp();

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return app.fetch(request, env, ctx);
  },
  scheduled(_event: ScheduledEvent, _env: Env, _ctx: ExecutionContext) {
    // VITALIS-8: expiry reconciliation cron
  },
};
