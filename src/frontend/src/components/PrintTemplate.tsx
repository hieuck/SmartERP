import dayjs from 'dayjs';

interface PrintableLineItem {
  product?: {
    name?: string;
    unit?: string;
  };
  productName?: string;
  unit?: string;
  quantity?: number;
  unitPrice?: number;
  totalAmount?: number;
}

interface PrintableAddress {
  street?: string;
  city?: string;
}

interface PrintableCustomer {
  name?: string;
  phone?: string;
  taxCode?: string;
}

interface PrintableDocument {
  code?: string;
  receiptDate?: string | Date;
  issueDate?: string | Date;
  orderDate?: string | Date;
  totalAmount?: number;
  notes?: string;
  items?: PrintableLineItem[];
  customer?: PrintableCustomer;
  shippingAddress?: string | PrintableAddress;
}

// Print Document for Stock Receipt/Issue
export const printDocument = (type: 'receipt' | 'issue', data: PrintableDocument) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Vui lòng cho phép popup để in phiếu');
    return;
  }

  const isReceipt = type === 'receipt';
  const title = isReceipt ? 'PHIẾU NHẬP KHO' : 'PHIẾU XUẤT KHO';
  const dateField = isReceipt ? 'receiptDate' : 'issueDate';

  const company = {
    name: 'CÔNG TY TNHH TƯỜNG THẠCH CAO',
    address: '123 Đường ABC, Quận XYZ, TP.HCM',
    phone: '(028) 1234 5678',
    taxCode: '0123456789',
  };

  const itemsHtml =
    data.items
      ?.map(
        (item: PrintableLineItem, index: number) =>
          `<tr>
      <td style="border: 1px solid #000; padding: 8px; text-align: center">${index + 1}</td>
      <td style="border: 1px solid #000; padding: 8px">${item.product?.name || item.productName || '-'}</td>
      <td style="border: 1px solid #000; padding: 8px; text-align: center">${item.product?.unit || item.unit || '-'}</td>
      <td style="border: 1px solid #000; padding: 8px; text-align: right">${(item.quantity || 0).toLocaleString('vi-VN')}</td>
      <td style="border: 1px solid #000; padding: 8px; text-align: right">${Math.round(item.unitPrice || 0).toLocaleString('vi-VN')}</td>
      <td style="border: 1px solid #000; padding: 8px; text-align: right">${Math.round((item.quantity || 0) * (item.unitPrice || 0)).toLocaleString('vi-VN')}</td>
    </tr>`,
      )
      .join('') || '';

  const content = `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${title} - ${data.code}</title>
        <style>
          @media print {
            @page { size: A4; margin: 0; }
            body { margin: 0; padding: 0; }
          }
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
        </style>
      </head>
      <body>
        <div style="padding: 20mm; font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.6; max-width: 210mm; margin: 0 auto; background-color: white">
          <div style="text-align: center; margin-bottom: 30px">
            <h2 style="margin: 0 0 5px 0; font-size: 16pt; font-weight: bold">${company.name}</h2>
            <p style="margin: 0; font-size: 10pt">Địa chỉ: ${company.address}</p>
            <p style="margin: 0; font-size: 10pt">Điện thoại: ${company.phone} - MST: ${company.taxCode}</p>
          </div>
          
          <div style="text-align: center; margin-bottom: 20px">
            <h1 style="margin: 0 0 10px 0; font-size: 18pt; font-weight: bold">${title}</h1>
            <p style="margin: 0; font-size: 11pt">Số: <strong>${data.code}</strong></p>
            <p style="margin: 5px 0 0 0; font-size: 10pt; font-style: italic">
              Ngày ${dayjs(data[dateField]).format('DD')} tháng ${dayjs(data[dateField]).format('MM')} năm ${dayjs(data[dateField]).format('YYYY')}
            </p>
          </div>
          
          ${data.notes ? `<div style="margin-bottom: 20px"><p style="margin: 5px 0"><strong>Ghi chú:</strong> ${data.notes}</p></div>` : ''}
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px">
            <thead>
              <tr style="background-color: #f0f0f0">
                <th style="border: 1px solid #000; padding: 8px; text-align: center; width: 40px">STT</th>
                <th style="border: 1px solid #000; padding: 8px; text-align: left">Tên sản phẩm</th>
                <th style="border: 1px solid #000; padding: 8px; text-align: center; width: 80px">Đơn vị</th>
                <th style="border: 1px solid #000; padding: 8px; text-align: right; width: 80px">Số lượng</th>
                <th style="border: 1px solid #000; padding: 8px; text-align: right; width: 120px">Đơn giá</th>
                <th style="border: 1px solid #000; padding: 8px; text-align: right; width: 120px">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
              <tr style="font-weight: bold">
                <td colspan="5" style="border: 1px solid #000; padding: 8px; text-align: right">Tổng cộng:</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: right">${Math.round(data.totalAmount || 0).toLocaleString('vi-VN')} đ</td>
              </tr>
            </tbody>
          </table>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-top: 40px; text-align: center">
            <div>
              <p style="margin: 0 0 60px 0; font-weight: bold">Người lập phiếu</p>
              <p style="margin: 0; font-style: italic">(Ký, họ tên)</p>
            </div>
            <div>
              <p style="margin: 0 0 60px 0; font-weight: bold">Thủ kho</p>
              <p style="margin: 0; font-style: italic">(Ký, họ tên)</p>
            </div>
            <div>
              <p style="margin: 0 0 60px 0; font-weight: bold">Giám đốc</p>
              <p style="margin: 0; font-style: italic">(Ký, đóng dấu)</p>
            </div>
          </div>
          
          <div style="margin-top: 30px; font-size: 9pt; font-style: italic; text-align: center; color: #666">
            <p style="margin: 0">In lúc: ${dayjs().format('DD/MM/YYYY HH:mm:ss')}</p>
          </div>
        </div>
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() { window.close(); };
          };
        </script>
      </body>
    </html>`;

  printWindow.document.write(content);
  printWindow.document.close();
};

// Print Sales Order
export const printSalesOrder = (order: PrintableDocument) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Vui lòng cho phép popup để in đơn hàng');
    return;
  }

  const company = {
    name: 'CÔNG TY TNHH TƯỜNG THẠCH CAO',
    address: '123 Đường ABC, Quận XYZ, TP.HCM',
    phone: '(028) 1234 5678',
    taxCode: '0123456789',
  };

  const itemsHtml =
    order.items
      ?.map(
        (item: PrintableLineItem, index: number) =>
          `<tr>
      <td style="border: 1px solid #000; padding: 8px; text-align: center">${index + 1}</td>
      <td style="border: 1px solid #000; padding: 8px">${item.product?.name || '-'}</td>
      <td style="border: 1px solid #000; padding: 8px; text-align: center">${item.product?.unit || '-'}</td>
      <td style="border: 1px solid #000; padding: 8px; text-align: right">${(item.quantity || 0).toLocaleString('vi-VN')}</td>
      <td style="border: 1px solid #000; padding: 8px; text-align: right">${Math.round(item.unitPrice || 0).toLocaleString('vi-VN')}</td>
      <td style="border: 1px solid #000; padding: 8px; text-align: right">${Math.round(item.totalAmount || 0).toLocaleString('vi-VN')}</td>
    </tr>`,
      )
      .join('') || '';

  const shippingAddress =
    typeof order.shippingAddress === 'string'
      ? order.shippingAddress
      : order.shippingAddress
        ? `${order.shippingAddress.street}, ${order.shippingAddress.city}`
        : '-';

  const content = `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Đơn Hàng Bán - ${order.code}</title>
        <style>
          @media print {
            @page { size: A4; margin: 0; }
            body { margin: 0; padding: 0; }
          }
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
        </style>
      </head>
      <body>
        <div style="padding: 20mm; font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.6; max-width: 210mm; margin: 0 auto; background-color: white">
          <div style="text-align: center; margin-bottom: 30px">
            <h2 style="margin: 0 0 5px 0; font-size: 16pt; font-weight: bold">${company.name}</h2>
            <p style="margin: 0; font-size: 10pt">Địa chỉ: ${company.address}</p>
            <p style="margin: 0; font-size: 10pt">Điện thoại: ${company.phone} - MST: ${company.taxCode}</p>
          </div>
          
          <div style="text-align: center; margin-bottom: 20px">
            <h1 style="margin: 0 0 10px 0; font-size: 18pt; font-weight: bold">ĐƠN HÀNG BÁN</h1>
            <p style="margin: 0; font-size: 11pt">Số: <strong>${order.code}</strong></p>
            <p style="margin: 5px 0 0 0; font-size: 10pt; font-style: italic">
              Ngày ${dayjs(order.orderDate).format('DD')} tháng ${dayjs(order.orderDate).format('MM')} năm ${dayjs(order.orderDate).format('YYYY')}
            </p>
          </div>
          
          <div style="margin-bottom: 20px">
            ${order.customer ? `<p style="margin: 5px 0"><strong>Khách hàng:</strong> ${order.customer.name}</p>` : ''}
            ${order.customer?.phone ? `<p style="margin: 5px 0"><strong>Điện thoại:</strong> ${order.customer.phone}</p>` : ''}
            ${shippingAddress !== '-' ? `<p style="margin: 5px 0"><strong>Địa chỉ giao hàng:</strong> ${shippingAddress}</p>` : ''}
            ${order.notes ? `<p style="margin: 5px 0"><strong>Ghi chú:</strong> ${order.notes}</p>` : ''}
          </div>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px">
            <thead>
              <tr style="background-color: #f0f0f0">
                <th style="border: 1px solid #000; padding: 8px; text-align: center; width: 40px">STT</th>
                <th style="border: 1px solid #000; padding: 8px; text-align: left">Tên sản phẩm</th>
                <th style="border: 1px solid #000; padding: 8px; text-align: center; width: 80px">Đơn vị</th>
                <th style="border: 1px solid #000; padding: 8px; text-align: right; width: 80px">Số lượng</th>
                <th style="border: 1px solid #000; padding: 8px; text-align: right; width: 120px">Đơn giá</th>
                <th style="border: 1px solid #000; padding: 8px; text-align: right; width: 120px">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
              <tr style="font-weight: bold">
                <td colspan="5" style="border: 1px solid #000; padding: 8px; text-align: right">Tổng cộng:</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: right">${Math.round(order.totalAmount || 0).toLocaleString('vi-VN')} đ</td>
              </tr>
            </tbody>
          </table>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-top: 40px; text-align: center">
            <div>
              <p style="margin: 0 0 60px 0; font-weight: bold">Người lập đơn</p>
              <p style="margin: 0; font-style: italic">(Ký, họ tên)</p>
            </div>
            <div>
              <p style="margin: 0 0 60px 0; font-weight: bold">Khách hàng</p>
              <p style="margin: 0; font-style: italic">(Ký, họ tên)</p>
            </div>
            <div>
              <p style="margin: 0 0 60px 0; font-weight: bold">Giám đốc</p>
              <p style="margin: 0; font-style: italic">(Ký, đóng dấu)</p>
            </div>
          </div>
          
          <div style="margin-top: 30px; font-size: 9pt; font-style: italic; text-align: center; color: #666">
            <p style="margin: 0">In lúc: ${dayjs().format('DD/MM/YYYY HH:mm:ss')}</p>
          </div>
        </div>
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() { window.close(); };
          };
        </script>
      </body>
    </html>`;

  printWindow.document.write(content);
  printWindow.document.close();
};

// Print Invoice
export const printInvoice = (order: PrintableDocument) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Vui lòng cho phép popup để in hóa đơn');
    return;
  }

  const company = {
    name: 'CÔNG TY TNHH TƯỜNG THẠCH CAO',
    address: '123 Đường ABC, Quận XYZ, TP.HCM',
    phone: '(028) 1234 5678',
    taxCode: '0123456789',
  };

  const itemsHtml =
    order.items
      ?.map(
        (item: PrintableLineItem, index: number) =>
          `<tr>
      <td style="border: 1px solid #000; padding: 8px; text-align: center">${index + 1}</td>
      <td style="border: 1px solid #000; padding: 8px">${item.product?.name || '-'}</td>
      <td style="border: 1px solid #000; padding: 8px; text-align: center">${item.product?.unit || '-'}</td>
      <td style="border: 1px solid #000; padding: 8px; text-align: right">${(item.quantity || 0).toLocaleString('vi-VN')}</td>
      <td style="border: 1px solid #000; padding: 8px; text-align: right">${Math.round(item.unitPrice || 0).toLocaleString('vi-VN')}</td>
      <td style="border: 1px solid #000; padding: 8px; text-align: right">${Math.round(item.totalAmount || 0).toLocaleString('vi-VN')}</td>
    </tr>`,
      )
      .join('') || '';

  const shippingAddress =
    typeof order.shippingAddress === 'string'
      ? order.shippingAddress
      : order.shippingAddress
        ? `${order.shippingAddress.street}, ${order.shippingAddress.city}`
        : '-';

  const numberWords = numberToVietnameseWords(Math.round(order.totalAmount || 0));

  const content = `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Hóa Đơn - ${order.code}</title>
        <style>
          @media print {
            @page { size: A4; margin: 0; }
            body { margin: 0; padding: 0; }
          }
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
        </style>
      </head>
      <body>
        <div style="padding: 20mm; font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.6; max-width: 210mm; margin: 0 auto; background-color: white">
          <div style="text-align: center; margin-bottom: 30px">
            <h2 style="margin: 0 0 5px 0; font-size: 16pt; font-weight: bold">${company.name}</h2>
            <p style="margin: 0; font-size: 10pt">Địa chỉ: ${company.address}</p>
            <p style="margin: 0; font-size: 10pt">Điện thoại: ${company.phone} - MST: ${company.taxCode}</p>
          </div>
          
          <div style="text-align: center; margin-bottom: 20px">
            <h1 style="margin: 0 0 10px 0; font-size: 18pt; font-weight: bold">HÓA ĐƠN BÁN HÀNG</h1>
            <p style="margin: 0; font-size: 11pt">Số: <strong>${order.code}</strong></p>
            <p style="margin: 5px 0 0 0; font-size: 10pt; font-style: italic">
              Ngày ${dayjs(order.orderDate).format('DD')} tháng ${dayjs(order.orderDate).format('MM')} năm ${dayjs(order.orderDate).format('YYYY')}
            </p>
          </div>
          
          <div style="margin-bottom: 20px">
            ${order.customer ? `<p style="margin: 5px 0"><strong>Khách hàng:</strong> ${order.customer.name}</p>` : ''}
            ${order.customer?.phone ? `<p style="margin: 5px 0"><strong>Điện thoại:</strong> ${order.customer.phone}</p>` : ''}
            ${order.customer?.taxCode ? `<p style="margin: 5px 0"><strong>MST:</strong> ${order.customer.taxCode}</p>` : ''}
            ${shippingAddress !== '-' ? `<p style="margin: 5px 0"><strong>Địa chỉ:</strong> ${shippingAddress}</p>` : ''}
          </div>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px">
            <thead>
              <tr style="background-color: #f0f0f0">
                <th style="border: 1px solid #000; padding: 8px; text-align: center; width: 40px">STT</th>
                <th style="border: 1px solid #000; padding: 8px; text-align: left">Tên hàng hóa, dịch vụ</th>
                <th style="border: 1px solid #000; padding: 8px; text-align: center; width: 80px">Đơn vị tính</th>
                <th style="border: 1px solid #000; padding: 8px; text-align: right; width: 80px">Số lượng</th>
                <th style="border: 1px solid #000; padding: 8px; text-align: right; width: 120px">Đơn giá</th>
                <th style="border: 1px solid #000; padding: 8px; text-align: right; width: 120px">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
              <tr style="font-weight: bold">
                <td colspan="5" style="border: 1px solid #000; padding: 8px; text-align: right">Cộng tiền hàng:</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: right">${Math.round(order.totalAmount || 0).toLocaleString('vi-VN')} đ</td>
              </tr>
              <tr style="font-weight: bold">
                <td colspan="5" style="border: 1px solid #000; padding: 8px; text-align: right">Thuế GTGT (0%):</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: right">0 đ</td>
              </tr>
              <tr style="font-weight: bold; font-size: 14pt">
                <td colspan="5" style="border: 1px solid #000; padding: 8px; text-align: right">Tổng tiền thanh toán:</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: right">${Math.round(order.totalAmount || 0).toLocaleString('vi-VN')} đ</td>
              </tr>
            </tbody>
          </table>
          
          <div style="margin-bottom: 20px">
            <p style="margin: 5px 0"><strong>Số tiền viết bằng chữ:</strong> <em>${numberWords}</em></p>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-top: 40px; text-align: center">
            <div>
              <p style="margin: 0 0 60px 0; font-weight: bold">Người mua hàng</p>
              <p style="margin: 0; font-style: italic">(Ký, họ tên)</p>
            </div>
            <div>
              <p style="margin: 0 0 60px 0; font-weight: bold">Người bán hàng</p>
              <p style="margin: 0; font-style: italic">(Ký, họ tên)</p>
            </div>
            <div>
              <p style="margin: 0 0 60px 0; font-weight: bold">Thủ trưởng đơn vị</p>
              <p style="margin: 0; font-style: italic">(Ký, đóng dấu)</p>
            </div>
          </div>
          
          <div style="margin-top: 30px; font-size: 9pt; font-style: italic; text-align: center; color: #666">
            <p style="margin: 0">In lúc: ${dayjs().format('DD/MM/YYYY HH:mm:ss')}</p>
          </div>
        </div>
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() { window.close(); };
          };
        </script>
      </body>
    </html>`;

  printWindow.document.write(content);
  printWindow.document.close();
};

// Helper function to convert number to Vietnamese words
function numberToVietnameseWords(num: number): string {
  if (num === 0) return 'Không đồng';

  // For larger numbers, use simplified format
  if (num >= 1000000000) return Math.round(num / 1000000000).toLocaleString('vi-VN') + ' tỷ đồng';
  if (num >= 1000000) return Math.round(num / 1000000).toLocaleString('vi-VN') + ' triệu đồng';
  if (num >= 1000) return Math.round(num / 1000).toLocaleString('vi-VN') + ' nghìn đồng';

  return num.toLocaleString('vi-VN') + ' đồng';
}
