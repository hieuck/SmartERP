import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import useLocale from './useLocale';
import enUS from 'antd/locale/en_US';
import viVN from 'antd/locale/vi_VN';

const { changeLanguageMock, tMock, useTranslationMock } = vi.hoisted(() => ({
  changeLanguageMock: vi.fn().mockResolvedValue(undefined),
  tMock: vi.fn((key: string) => key),
  useTranslationMock: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: useTranslationMock,
}));

describe('useLocale', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useTranslationMock.mockReturnValue({
      i18n: {
        language: 'en',
        changeLanguage: changeLanguageMock,
      },
      t: tMock,
    });
  });

  it('returns the english locale by default', () => {
    const { result } = renderHook(() => useLocale());

    expect(result.current.currentLanguage).toBe('en');
    expect(result.current.antdLocale).toBe(enUS);
    expect(result.current.t('common:hello')).toBe('common:hello');
  });

  it('switches to the vietnamese locale when i18n is set to vi', () => {
    useTranslationMock.mockReturnValue({
      i18n: {
        language: 'vi',
        changeLanguage: changeLanguageMock,
      },
      t: tMock,
    });

    const { result } = renderHook(() => useLocale());

    expect(result.current.currentLanguage).toBe('vi');
    expect(result.current.antdLocale).toBe(viVN);
  });

  it('persists the selected language after changeLanguage resolves', async () => {
    const setItemMock = vi.mocked(global.localStorage.setItem);
    const { result } = renderHook(() => useLocale());

    await act(async () => {
      await result.current.changeLanguage('vi');
    });

    expect(changeLanguageMock).toHaveBeenCalledWith('vi');
    expect(setItemMock).toHaveBeenCalledWith('language', 'vi');
  });
});
