import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkflowApproval } from './WorkflowApproval';

const { successMock } = vi.hoisted(() => ({
  successMock: vi.fn(),
}));

vi.mock('@ant-design/icons', () => ({
  CheckOutlined: () => <span>icon-check</span>,
  CloseOutlined: () => <span>icon-close</span>,
  EyeOutlined: () => <span>icon-eye</span>,
}));

vi.mock('antd', () => ({
  Button: ({
    children,
    onClick,
    icon,
  }: {
    children?: React.ReactNode;
    onClick?: () => void;
    icon?: React.ReactNode;
  }) => <button onClick={onClick}>{children ?? icon ?? 'button'}</button>,
  Input: {
    TextArea: ({
      value,
      onChange,
      placeholder,
    }: {
      value?: string;
      onChange?: (event: { target: { value: string } }) => void;
      placeholder?: string;
    }) => (
      <textarea
        aria-label={String(placeholder ?? 'textarea')}
        value={value}
        onChange={(event) => onChange?.({ target: { value: event.target.value } })}
      />
    ),
  },
  Modal: ({
    children,
    title,
    open,
  }: {
    children?: React.ReactNode;
    title?: React.ReactNode;
    open?: boolean;
  }) => (open ? <div><div>{title}</div><div>{children}</div></div> : null),
  Space: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Table: ({
    columns,
    dataSource = [],
  }: {
    columns: Array<{
      title?: React.ReactNode;
      dataIndex?: string;
      render?: (_value: unknown, record: Record<string, unknown>) => React.ReactNode;
    }>;
    dataSource?: Array<Record<string, unknown>>;
  }) => (
    <div>
      {dataSource.map((record) => (
        <div key={String(record.id)}>
          {columns.map((column, index) => (
            <div key={`${String(record.id)}-${index}`}>
              {column.render
                ? column.render(column.dataIndex ? record[column.dataIndex] : undefined, record)
                : column.dataIndex
                  ? String(record[column.dataIndex])
                  : null}
            </div>
          ))}
        </div>
      ))}
    </div>
  ),
  Tag: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  message: {
    success: successMock,
  },
}));

describe('WorkflowApproval', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('opens the detail modal for a selected request', () => {
    render(<WorkflowApproval />);

    fireEvent.click(screen.getAllByRole('button', { name: 'icon-eye' })[0]);

    expect(screen.getByText(/Chi tiáº¿t yÃªu cáº§u|Chi tiết yêu cầu/)).toBeInTheDocument();
    expect(screen.getAllByText(/ĐH-001|ÄH-001/).length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/Nháº­p ghi chÃº|Nhập ghi chú/)).toBeInTheDocument();
  });

  it('approves a pending request and updates the rendered status', () => {
    render(<WorkflowApproval />);

    fireEvent.click(screen.getAllByRole('button', { name: /Duyá»‡t|Duyệt/ })[0]);

    expect(successMock).toHaveBeenCalledWith(expect.stringMatching(/ĐÃ£ phÃª duyá»‡t|Đã phê duyệt/));
    expect(screen.getByText(/ÄÃ£ duyá»‡t|Đã duyệt/)).toBeInTheDocument();
  });

  it('rejects a pending request and updates the rendered status', () => {
    render(<WorkflowApproval />);

    fireEvent.click(screen.getAllByRole('button', { name: /Tá»« chá»‘i|Từ chối/ })[0]);

    expect(successMock).toHaveBeenCalledWith(expect.stringMatching(/ÄÃ£ tá»« chá»‘i|Đã từ chối/));
    expect(screen.getAllByText(/Tá»« chá»‘i|Từ chối/).length).toBeGreaterThan(0);
  });
});
