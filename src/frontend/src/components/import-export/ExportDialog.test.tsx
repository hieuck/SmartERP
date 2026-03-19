import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { App } from 'antd';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ExportDialog from './ExportDialog';

const {
  downloadBlobMock,
  exportCustomersMock,
  exportProductsMock,
  exportSuppliersMock,
  loggerErrorMock,
  messageMock,
} = vi.hoisted(() => ({
  downloadBlobMock: vi.fn(),
  exportCustomersMock: vi.fn(),
  exportProductsMock: vi.fn(),
  exportSuppliersMock: vi.fn(),
  loggerErrorMock: vi.fn(),
  messageMock: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('@/services/import-export/importExportService', () => ({
  __esModule: true,
  default: {
    downloadBlob: downloadBlobMock,
    exportCustomers: exportCustomersMock,
    exportProducts: exportProductsMock,
    exportSuppliers: exportSuppliersMock,
  },
}));

vi.mock('@/lib/logger/logger.service', () => ({
  logger: {
    error: loggerErrorMock,
  },
}));

vi.mock('antd', () => {
  const attachOnSelect = (
    node: React.ReactNode,
    handler: (value: string) => void,
  ): React.ReactNode =>
    React.Children.map(node, (child) => {
      if (!React.isValidElement(child)) {
        return child;
      }

      const nextProps: Record<string, unknown> = {};

      if ('value' in child.props) {
        nextProps.onSelect = () => handler(String(child.props.value));
      }

      if ('children' in child.props) {
        nextProps.children = attachOnSelect(child.props.children, handler);
      }

      return React.cloneElement(child, nextProps);
    });

  const AppComponent = Object.assign(
    ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    {
      useApp: () => ({ message: messageMock }),
    },
  );

  const Button = ({
    children,
    onClick,
  }: {
    children?: React.ReactNode;
    onClick?: () => void;
  }) => <button onClick={onClick}>{children}</button>;

  const RadioGroup = ({
    children,
    onChange,
    value,
  }: {
    children?: React.ReactNode;
    onChange?: (event: { target: { value: string } }) => void;
    value?: string;
  }) => (
    <div data-value={value}>
      {attachOnSelect(children, (nextValue) => onChange?.({ target: { value: nextValue } }))}
    </div>
  );

  const Radio = ({
    children,
    onSelect,
    value,
  }: {
    children?: React.ReactNode;
    onSelect?: (value: string) => void;
    value?: string;
  }) => <button onClick={() => onSelect?.(String(value))}>{children}</button>;

  return {
    App: AppComponent,
    Button,
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
    Radio: Object.assign(Radio, {
      Group: RadioGroup,
    }),
    Space: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    Typography: {
      Text: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
    },
    theme: {
      useToken: () => ({ token: { colorPrimary: '#1677ff' } }),
    },
  };
});

vi.mock('@ant-design/icons', () => ({
  DownloadOutlined: () => <span>icon-download</span>,
  FileExcelOutlined: () => <span>icon-excel</span>,
  FileTextOutlined: () => <span>icon-text</span>,
}));

describe('ExportDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders export details for the selected entity type', () => {
    render(
      <App>
        <ExportDialog onClose={vi.fn()} type="products" visible />
      </App>,
    );

    expect(screen.getByText('Export Products')).toBeInTheDocument();
    expect(screen.getByText('Select Export Format:')).toBeInTheDocument();
    expect(
      screen.getByText('The export will include all products data with their complete information.'),
    ).toBeInTheDocument();
  });

  it('exports products in Excel format by default and closes the dialog', async () => {
    const onClose = vi.fn();
    exportProductsMock.mockResolvedValue(new Blob(['products']));

    render(
      <App>
        <ExportDialog onClose={onClose} type="products" visible />
      </App>,
    );

    fireEvent.click(screen.getByText('Export'));

    await waitFor(() => {
      expect(exportProductsMock).toHaveBeenCalledWith('excel');
    });

    expect(downloadBlobMock).toHaveBeenCalledWith(expect.any(Blob), 'products.xlsx');
    expect(messageMock.success).toHaveBeenCalledWith('Export completed successfully');
    expect(onClose).toHaveBeenCalled();
  });

  it('exports suppliers in CSV format when the user switches the option', async () => {
    exportSuppliersMock.mockResolvedValue(new Blob(['suppliers']));

    render(
      <App>
        <ExportDialog onClose={vi.fn()} type="suppliers" visible />
      </App>,
    );

    fireEvent.click(screen.getByText('CSV (.csv)'));
    fireEvent.click(screen.getByText('Export'));

    await waitFor(() => {
      expect(exportSuppliersMock).toHaveBeenCalledWith('csv');
    });

    expect(downloadBlobMock).toHaveBeenCalledWith(expect.any(Blob), 'suppliers.csv');
  });

  it('logs and reports a user-facing error when export fails', async () => {
    const error = new Error('boom');
    exportCustomersMock.mockRejectedValue(error);

    render(
      <App>
        <ExportDialog onClose={vi.fn()} type="customers" visible />
      </App>,
    );

    fireEvent.click(screen.getByText('Export'));

    await waitFor(() => {
      expect(messageMock.error).toHaveBeenCalledWith('Failed to export data');
    });

    expect(loggerErrorMock).toHaveBeenCalledWith('ExportDialog', 'Export error', error);
  });
});
