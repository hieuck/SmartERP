import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VersionHistory } from './VersionHistory';

const { confirmMock } = vi.hoisted(() => ({
  confirmMock: vi.fn(),
}));

vi.mock('@ant-design/icons', () => ({
  DownloadOutlined: () => <span>icon-download</span>,
  RollbackOutlined: () => <span>icon-rollback</span>,
}));

vi.mock('antd', () => {
  const TimelineItem = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;

  return {
    Button: ({
      children,
      onClick,
    }: {
      children?: React.ReactNode;
      onClick?: () => void;
    }) => <button onClick={onClick}>{children ?? 'button'}</button>,
    Modal: Object.assign(
      ({
        title,
        open,
        onCancel,
        children,
      }: {
        title?: React.ReactNode;
        open?: boolean;
        onCancel?: () => void;
        children?: React.ReactNode;
      }) =>
        open ? (
          <div>
            <div>{title}</div>
            <button onClick={onCancel}>close-modal</button>
            <div>{children}</div>
          </div>
        ) : null,
      {
        confirm: confirmMock,
      },
    ),
    Space: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Tag: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
    Timeline: Object.assign(
      ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
      {
        Item: TimelineItem,
      },
    ),
  };
});

describe('VersionHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders version history content when visible', () => {
    render(<VersionHistory documentId="DOC-001" visible onClose={vi.fn()} />);

    expect(screen.getByText('Lịch sử phiên bản - DOC-001')).toBeInTheDocument();
    expect(screen.getByText(/v2.*Hiện tại/)).toBeInTheDocument();
    expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Tải xuống' }).length).toBe(2);
  });

  it('hides the modal when visible is false and forwards close actions', () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <VersionHistory documentId="DOC-001" visible={false} onClose={onClose} />,
    );

    expect(screen.queryByText(/DOC-001/)).not.toBeInTheDocument();

    rerender(<VersionHistory documentId="DOC-001" visible onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'close-modal' }));

    expect(onClose).toHaveBeenCalled();
  });

  it('opens a rollback confirmation for non-current versions only', () => {
    render(<VersionHistory documentId="DOC-001" visible onClose={vi.fn()} />);

    expect(screen.getAllByRole('button', { name: 'Khôi phục' }).length).toBe(1);
    fireEvent.click(screen.getByRole('button', { name: 'Khôi phục' }));

    expect(confirmMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Xác nhận khôi phục',
        content: expect.stringContaining('phiên bản 1'),
        onOk: expect.any(Function),
      }),
    );
  });
});
