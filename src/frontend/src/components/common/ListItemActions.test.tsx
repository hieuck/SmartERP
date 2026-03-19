import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ListItemActions from './ListItemActions';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('antd', async () => {
  const actual = await vi.importActual<typeof import('antd')>('antd');
  return {
    ...actual,
    Dropdown: ({
      children,
      menu,
    }: {
      children: React.ReactNode;
      menu?: { items?: Array<{ key: string; label: string; onClick?: () => void }> };
    }) => (
      <div>
        {children}
        {menu?.items?.map((item) => (
          <button key={item.key} onClick={item.onClick}>
            {item.label}
          </button>
        ))}
      </div>
    ),
    Popconfirm: ({
      children,
      onConfirm,
    }: {
      children: React.ReactNode;
      onConfirm?: () => void;
    }) => <div onClick={onConfirm}>{children}</div>,
  };
});

describe('ListItemActions', () => {
  const record = { id: '1', name: 'Camera' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders desktop edit and delete actions', () => {
    const handleEdit = vi.fn();
    const handleDelete = vi.fn();

    render(
      <ListItemActions
        record={record}
        onEdit={handleEdit}
        onDelete={handleDelete}
        deleteConfirmTitle="Delete camera?"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /actions\.edit/i }));
    fireEvent.click(screen.getByRole('button', { name: /actions\.delete/i }));

    expect(handleEdit).toHaveBeenCalledWith(record);
    expect(handleDelete).toHaveBeenCalledWith(record);
  });

  it('renders mobile dropdown actions and confirms delete through window.confirm', () => {
    const handleEdit = vi.fn();
    const handleDelete = vi.fn();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <ListItemActions
        record={record}
        onEdit={handleEdit}
        onDelete={handleDelete}
        deleteConfirmTitle="Delete camera?"
        isMobile
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'actions.edit' }));
    fireEvent.click(screen.getByRole('button', { name: 'actions.delete' }));

    expect(handleEdit).toHaveBeenCalledWith(record);
    expect(window.confirm).toHaveBeenCalledWith('Delete camera?');
    expect(handleDelete).toHaveBeenCalledWith(record);
  });
});
