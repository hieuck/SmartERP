import { describe, expect, it } from 'vitest';
import {
  createResponsiveColumn,
  hideNonEssentialColumns,
  mobileStyles,
  optimizeColumnsForMobile,
  removeFixedFromActions,
} from './mobileTableHelper';

describe('mobileTableHelper', () => {
  it('optimizes widths and removes fixed columns on mobile only', () => {
    const columns = [
      { key: 'name', width: 200, fixed: 'left' as const },
      { key: 'status', width: 120 },
    ];

    expect(optimizeColumnsForMobile(columns, false)).toBe(columns);
    expect(optimizeColumnsForMobile(columns, true)).toEqual([
      { key: 'name', width: 140, fixed: false },
      { key: 'status', width: 84 },
    ]);
  });

  it('keeps only essential columns and normalizes action widths on mobile', () => {
    const columns = [
      { key: 'name', width: 180 },
      { key: 'status', width: 100 },
      { key: 'action', width: 120, fixed: 'right' as const },
    ];

    expect(hideNonEssentialColumns(columns, true, ['name', 'action'])).toEqual([
      { key: 'name', width: 180 },
      { key: 'action', width: 120, fixed: 'right' },
    ]);

    expect(removeFixedFromActions(columns, true)).toEqual([
      { key: 'name', width: 180 },
      { key: 'status', width: 100 },
      { key: 'action', width: 60, fixed: false },
    ]);
  });

  it('creates responsive columns and exposes mobile style helpers', () => {
    expect(
      createResponsiveColumn({
        title: 'Name',
        key: 'name',
        desktopWidth: 200,
        mobileWidth: 120,
        isMobile: true,
      }),
    ).toEqual({
      title: 'Name',
      dataIndex: undefined,
      key: 'name',
      width: 120,
      align: undefined,
      ellipsis: undefined,
      render: undefined,
    });

    expect(mobileStyles.fontSize(true)).toBe(12);
    expect(mobileStyles.tagSize(false)).toBe(12);
    expect(mobileStyles.buttonSize(true)).toBe('small');
    expect(mobileStyles.padding(false)).toBe('8px 16px');
  });
});
