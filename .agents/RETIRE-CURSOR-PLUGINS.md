# Retire overlapping Cursor plugins

Project skills in `.agents/skills/` are the single source of truth. User-level Cursor plugins that ship the same skills can shadow or duplicate them.

In **Cursor → Settings → Plugins**, disable these plugins for work on **project-vitalis**:

1. **Superpowers**
2. **Cloudflare**
3. **Resend**
4. **shadcn/ui**

After disabling, reload the window or start a new agent session so only repo skills load.

Keep other plugins (GitHub, Linear, PostHog, Playwright, Mobbin) if you use their MCP tools; they do not duplicate the vendored skill packs above.
