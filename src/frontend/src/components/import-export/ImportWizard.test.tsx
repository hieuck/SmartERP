import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { App } from 'antd';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ImportWizard from './ImportWizard';

const { downloadBlobMock, downloadTemplateMock, messageMock } = vi.hoisted(() => ({
  downloadBlobMock: vi.fn(),
  downloadTemplateMock: vi.fn(),
  messageMock: {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock('@/services/import-export/importExportService', () => ({
  __esModule: true,
  default: {
    downloadBlob: downloadBlobMock,
    downloadTemplate: downloadTemplateMock,
    importData: vi.fn(),
    validateImport: vi.fn(),
  },
}));

vi.mock('antd', () => {
  const AppComponent = Object.assign(
    ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    {
      useApp: () => ({ message: messageMock }),
    },
  );

  const Button = ({
    children,
    disabled,
    onClick,
  }: {
    children?: React.ReactNode;
    disabled?: boolean;
    onClick?: () => void;
  }) => (
    <button disabled={disabled} onClick={() => !disabled && onClick?.()}>
      {children}
    </button>
  );

  return {
    Alert: ({ message, description }: { message?: React.ReactNode; description?: React.ReactNode }) => (
      <div>
        <div>{message}</div>
        <div>{description}</div>
      </div>
    ),
    App: AppComponent,
    Button,
    Divider: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    Modal: ({
      children,
      footer,
      open,
      title,
    }: {
      children?: React.ReactNode;
      footer?: React.ReactNode;
      open?: boolean;
      title?: React.ReactNode;
    }) =>
      open ? (
        <div>
          <h1>{title}</h1>
          <div>{children}</div>
          <div>{footer}</div>
        </div>
      ) : null,
    Progress: ({ percent }: { percent?: number }) => <div>{percent}</div>,
    Result: ({
      children,
      subTitle,
      title,
      extra,
    }: {
      children?: React.ReactNode;
      subTitle?: React.ReactNode;
      title?: React.ReactNode;
      extra?: React.ReactNode;
    }) => (
      <div>
        <div>{title}</div>
        <div>{subTitle}</div>
        <div>{extra}</div>
        {children}
      </div>
    ),
    Space: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    Steps: ({ items }: { items?: Array<{ title: React.ReactNode }> }) => (
      <div>{items?.map((item) => <span key={String(item.title)}>{item.title}</span>)}</div>
    ),
    Table: () => <div>table</div>,
    Typography: {
      Paragraph: ({ children }: { children?: React.ReactNode }) => <p>{children}</p>,
      Text: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
      Title: ({ children }: { children?: React.ReactNode }) => <h2>{children}</h2>,
    },
    Upload: {
      Dragger: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    },
  };
});

vi.mock('@ant-design/icons', () => ({
  CheckCircleOutlined: () => <span>icon-check</span>,
  DownloadOutlined: () => <span>icon-download</span>,
  FileExcelOutlined: () => <span>icon-file</span>,
  UploadOutlined: () => <span>icon-upload</span>,
}));

describe('ImportWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the upload step with import guidance', () => {
    render(
      <App>
        <ImportWizard onClose={vi.fn()} type="products" visible />
      </App>,
    );

    expect(screen.getByText('Import Products')).toBeInTheDocument();
    expect(screen.getByText('Import Instructions')).toBeInTheDocument();
    expect(screen.getByText('Download Template')).toBeInTheDocument();
    expect(screen.getByText('Validate & Continue')).toBeDisabled();
  });

  it('downloads the template and shows success feedback', async () => {
    downloadTemplateMock.mockResolvedValue(new Blob(['template']));

    render(
      <App>
        <ImportWizard onClose={vi.fn()} type="products" visible />
      </App>,
    );

    fireEvent.click(screen.getByText('Download Template'));

    await waitFor(() => {
      expect(downloadTemplateMock).toHaveBeenCalledWith('products');
    });

    expect(downloadBlobMock).toHaveBeenCalledWith(expect.any(Blob), 'template_products.xlsx');
    expect(messageMock.success).toHaveBeenCalledWith('Template downloaded successfully');
  });

  it('shows error feedback when template download fails', async () => {
    downloadTemplateMock.mockRejectedValue(new Error('network'));

    render(
      <App>
        <ImportWizard onClose={vi.fn()} type="customers" visible />
      </App>,
    );

    fireEvent.click(screen.getByText('Download Template'));

    await waitFor(() => {
      expect(messageMock.error).toHaveBeenCalledWith('Failed to download template');
    });
  });
});
