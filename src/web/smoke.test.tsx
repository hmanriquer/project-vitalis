import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

describe('browser test harness', () => {
  it('renders a trivial element', async () => {
    const screen = await render(<p data-testid="smoke">hola</p>);
    await expect.element(screen.getByTestId('smoke')).toHaveTextContent('hola');
  });
});
