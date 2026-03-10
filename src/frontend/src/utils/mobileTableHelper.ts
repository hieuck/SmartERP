/**
 * Mobile Table Helper Utilities
 * Các hàm tiện ích để tối ưu table columns cho mobile
 */

import type { ColumnsType } from 'antd/es/table';

/**
 * Tối ưu width của columns cho mobile
 * @param columns - Columns gốc
 * @param isMobile - Flag mobile
 * @param mobileWidthRatio - Tỷ lệ giảm width trên mobile (default: 0.7)
 */
export function optimizeColumnsForMobile<T>(
  columns: ColumnsType<T>,
  isMobile: boolean,
  mobileWidthRatio: number = 0.7,
): ColumnsType<T> {
  if (!isMobile) return columns;

  return columns.map((col) => {
    const newCol = { ...col };

    // Giảm width
    if (typeof newCol.width === 'number') {
      newCol.width = Math.floor(newCol.width * mobileWidthRatio);
    }

    // Loại bỏ fixed
    if ('fixed' in newCol) {
      newCol.fixed = false;
    }

    return newCol;
  });
}

/**
 * Loại bỏ fixed từ cột actions
 */
export function removeFixedFromActions<T>(
  columns: ColumnsType<T>,
  isMobile: boolean,
): ColumnsType<T> {
  if (!isMobile) return columns;

  return columns.map((col) => {
    if (col.key === 'action' || col.key === 'actions') {
      return {
        ...col,
        fixed: false,
        width: typeof col.width === 'number' ? Math.min(col.width, 60) : 60,
      };
    }
    return col;
  });
}

/**
 * Ẩn các cột không quan trọng trên mobile
 */
export function hideNonEssentialColumns<T>(
  columns: ColumnsType<T>,
  isMobile: boolean,
  essentialKeys: string[],
): ColumnsType<T> {
  if (!isMobile) return columns;

  return columns.filter((col) => {
    if (!col.key) return true;
    return essentialKeys.includes(col.key as string);
  });
}

/**
 * Wrapper styles cho mobile
 */
export const mobileStyles = {
  fontSize: (isMobile: boolean) => (isMobile ? 12 : 14),
  tagSize: (isMobile: boolean) => (isMobile ? 11 : 12),
  buttonSize: (isMobile: boolean) => (isMobile ? 'small' : 'middle') as 'small' | 'middle',
  padding: (isMobile: boolean) => (isMobile ? '4px 8px' : '8px 16px'),
};

/**
 * Tạo responsive column config
 */
export function createResponsiveColumn<T>(config: {
  title: string;
  dataIndex?: string | string[];
  key: string;
  desktopWidth: number;
  mobileWidth?: number;
  render?: (value: unknown, record: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  ellipsis?: boolean;
  isMobile: boolean;
}) {
  const { title, dataIndex, key, desktopWidth, mobileWidth, render, align, ellipsis, isMobile } =
    config;

  return {
    title,
    dataIndex,
    key,
    width: isMobile ? mobileWidth || Math.floor(desktopWidth * 0.7) : desktopWidth,
    align,
    ellipsis,
    render,
  };
}
