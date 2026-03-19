import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DocumentBrowser } from './DocumentBrowser';

const { messageSuccessMock } = vi.hoisted(() => ({
  messageSuccessMock: vi.fn(),
}));

vi.mock('@ant-design/icons', () => ({
  DeleteOutlined: () => <span>icon-delete</span>,
  DownloadOutlined: () => <span>icon-download</span>,
  EyeOutlined: () => <span>icon-eye</span>,
  HistoryOutlined: () => <span>icon-history</span>,
  UploadOutlined: () => <span>icon-upload</span>,
}));

vi.mock('antd', () => ({
  Button: ({
    children,
    icon,
    onClick,
    title,
  }: {
    children?: React.ReactNode;
    icon?: React.ReactNode;
    onClick?: () => void;
    title?: string;
  }) => (
    <button onClick={onClick} title={title}>
      {icon}
      {children ?? 'button'}
    </button>
  ),
  Space: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Table: ({
    columns,
    dataSource,
  }: {
    columns: Array<{
      title: React.ReactNode;
      dataIndex?: string;
      key?: string;
      render?: (value: unknown, record: Record<string, unknown>) => React.ReactNode;
    }>;
    dataSource: Array<Record<string, unknown>>;
  }) => (
    <table>
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={String(column.key ?? column.dataIndex ?? column.title)}>{column.title}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {dataSource.map((record) => (
          <tr key={String(record.id)}>
            {columns.map((column) => {
              const cellValue = column.dataIndex ? record[column.dataIndex] : undefined;
              return (
                <td key={String(column.key ?? column.dataIndex ?? column.title)}>
                  {column.render ? column.render(cellValue, record) : String(cellValue ?? '')}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  ),
  Tag: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  Upload: ({
    beforeUpload,
    children,
  }: {
    beforeUpload?: (file: { name: string; size: number }) => boolean;
    children: React.ReactNode;
  }) => (
    <div>
      {children}
      <button
        onClick={() =>
          beforeUpload?.({
            name: 'spec-sheet.docx',
            size: 3 * 1024 * 1024,
          })
        }
      >
        mock-upload
      </button>
    </div>
  ),
  message: {
    success: messageSuccessMock,
  },
}));

describe('DocumentBrowser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the seeded documents and version metadata', () => {
    render(<DocumentBrowser />);

    expect(screen.getByText('Hợp đồng mua bán.pdf')).toBeInTheDocument();
    expect(screen.getByText('Báo giá sản phẩm.xlsx')).toBeInTheDocument();
    expect(screen.getByText('PDF')).toBeInTheDocument();
    expect(screen.getByText('Excel')).toBeInTheDocument();
    expect(screen.getByText('v2')).toBeInTheDocument();
    expect(screen.getByText('v1')).toBeInTheDocument();
  });

  it('prepends a newly uploaded document and shows a success message', () => {
    render(<DocumentBrowser />);

    fireEvent.click(screen.getByRole('button', { name: 'mock-upload' }));

    const uploadedName = screen.getByText('spec-sheet.docx');
    const rows = uploadedName.closest('tbody')?.querySelectorAll('tr');

    expect(uploadedName).toBeInTheDocument();
    expect(screen.getAllByText('DOCX')[0]).toBeInTheDocument();
    expect(screen.getByText('3.00 MB')).toBeInTheDocument();
    expect(screen.getAllByText('v1').length).toBeGreaterThan(0);
    expect(rows?.[0]).toContainElement(uploadedName.closest('td'));
    expect(messageSuccessMock).toHaveBeenCalledWith(
      expect.stringMatching(/ÄÃ£ tÃ¡ÂºÂ£i lÃƒÂªn file thÃƒÂ nh cÃƒÂ´ng|Đã tải lên file thành công/),
    );
  });

  it('renders the document action shell for each row', () => {
    render(<DocumentBrowser />);

    expect(screen.getAllByText('icon-eye')).toHaveLength(2);
    expect(screen.getAllByText('icon-download')).toHaveLength(2);
    expect(screen.getAllByText('icon-history')).toHaveLength(2);
    expect(screen.getAllByText('icon-delete')).toHaveLength(2);
    expect(screen.getAllByTitle('Lịch sử phiên bản')).toHaveLength(2);
  });
});
