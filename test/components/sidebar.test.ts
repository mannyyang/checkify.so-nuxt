import { describe, it, expect } from 'vitest';
import { SIDEBAR_WIDTH, SIDEBAR_WIDTH_MOBILE, SIDEBAR_WIDTH_ICON } from '~/components/ui/sidebar/utils';

describe('Sidebar Constants', () => {
  it('should have correct desktop sidebar width', () => {
    expect(SIDEBAR_WIDTH).toBe('20rem');
  });

  it('should have correct mobile sidebar width', () => {
    expect(SIDEBAR_WIDTH_MOBILE).toBe('20rem');
  });

  it('should have correct icon-only sidebar width', () => {
    expect(SIDEBAR_WIDTH_ICON).toBe('3rem');
  });

  it('should have sufficient width for button text', () => {
    // 20rem = 320px, which should be enough for "Sync to Notion Database" button
    const widthInPixels = parseFloat(SIDEBAR_WIDTH) * 16; // 1rem = 16px typically
    expect(widthInPixels).toBeGreaterThanOrEqual(320);
  });
});
