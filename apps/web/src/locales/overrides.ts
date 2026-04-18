type TranslationTree = {
  [key: string]: string | TranslationTree;
};

export const localeOverrides: Record<"vi" | "en", TranslationTree> = {
  en: {},
  vi: {
    products: {
      imageUrl: "Đường dẫn ảnh",
      imageAttached: "Đã gắn ảnh",
      imageEmpty: "Chưa có ảnh sản phẩm",
      previewTitle: "Xem trước ảnh",
      previewHint: "Dùng URL HTTPS, đường dẫn gốc /..., hoặc data:image URL.",
      placeholderImageUrl: "/product-photo-demo.svg",
    },
    approvals: {
      typeInvoiceAmend: "Sửa đổi hóa đơn",
    },
    orders: {
      statusReturned: "Đã trả hàng",
    },
    invoices: {
      amendmentNoteActiveHint: "Bắt buộc để giải thích vì sao {{number}} đang được sửa đổi.",
      amendAction: "Sửa hóa đơn",
      amendSubmit: "Áp dụng sửa đổi",
      amendTitle: "Sửa {{number}}",
      statusCredited: "Đã ghi giảm",
      statusPartiallyCredited: "Đã ghi giảm một phần",
      creditAction: "Lập credit note",
      creditSubmit: "Ghi credit note",
      creditTitle: "Ghi giảm {{number}}",
      creditNote: "Ghi chú ghi giảm",
      creditNoteLabel: "Ghi chú ghi giảm:",
      creditNoteHint: "Bắt buộc để giải thích vì sao {{number}} được ghi giảm sau khi đã thanh toán.",
      creditNoteGenericHint: "Bắt buộc có ghi chú nghiệp vụ cho credit note.",
      creditNotePlaceholder: "Hoàn tiền toàn bộ sau khi khách trả hàng.",
      creditQuantity: "Số lượng ghi giảm",
      creditQuantityHint:
        "Chọn số lượng đã thanh toán cần hoàn lại từ {{number}}. Số lượng còn có thể ghi giảm: {{count}}.",
      creditQuantityGenericHint: "Chọn số lượng đã thanh toán cần hoàn lại.",
      creditedAtLabel: "Đã ghi giảm lúc:",
      creditMethodLabel: "Phương thức hoàn tiền:",
      creditedAmountLabel: "Giá trị đã ghi giảm:",
      creditedQuantityLabel: "Số lượng đã ghi giảm:",
      returnReceiptsLabel: "Phiếu nhận trả:",
      lastReturnReceiptLabel: "Nhận trả gần nhất:",
      collectionCredited: "Đã ghi giảm",
    },
    reports: {
      auditActionInvoiceAmended: "Sửa đổi hóa đơn",
      auditActionInvoiceCredited: "Ghi giảm hóa đơn",
      auditActionInvoiceReturnReceived: "Nhận hàng trả theo hóa đơn",
      auditActionOrderReturned: "Đơn hàng đã trả lại",
      creditedInvoices: "Hóa đơn đã ghi giảm",
      creditedAmount: "Giá trị đã ghi giảm",
    },
    tenants: {
      restorePreviewCountsNowValue:
        "{{customerCount}} khách hàng, {{supplierCount}} nhà cung cấp, {{productCount}} sản phẩm, {{inventoryLineCount}} dòng tồn kho, {{orderCount}} đơn hàng, {{purchaseOrderCount}} đơn mua, {{purchaseOrderReceiptCount}} phiếu nhận hàng, {{invoiceCount}} hóa đơn, {{invoicePaymentCount}} phiếu thanh toán, {{invoiceReturnReceiptCount}} phiếu nhận trả theo hóa đơn, {{collectionActivityCount}} hoạt động thu hồi, {{approvalCount}} phê duyệt, {{auditLogCount}} audit log, {{journalEntryCount}} bút toán, và {{accountBalanceCount}} số dư sổ cái.",
      restorePreviewCountsLaterValue:
        "{{approvalCount}} phê duyệt, {{auditLogCount}} audit log, {{journalEntryCount}} bút toán, và {{accountBalanceCount}} số dư sổ cái.",
      restoreLaterValue: "Phê duyệt, audit, và replay sổ cái.",
    },
    setup: {
      handoffSnapshotValue:
        "{{customers}} khách hàng, {{suppliers}} nhà cung cấp, {{products}} sản phẩm, {{invoices}} hóa đơn, {{invoicePayments}} phiếu thanh toán, {{purchaseOrderReceipts}} phiếu nhận hàng, {{invoiceReturnReceipts}} phiếu nhận trả theo hóa đơn",
      recoveryDrillBaselineCountsValue:
        "{{customers}} khách hàng, {{suppliers}} nhà cung cấp, {{products}} sản phẩm, {{inventoryLines}} dòng tồn kho, {{orders}} đơn hàng, {{purchaseOrders}} đơn mua, {{purchaseOrderReceipts}} phiếu nhận hàng, {{invoices}} hóa đơn, {{invoicePayments}} phiếu thanh toán, {{invoiceReturnReceipts}} phiếu nhận trả theo hóa đơn, {{approvalRequests}} phê duyệt, {{auditLogs}} audit log, {{journalEntries}} bút toán, và {{accountBalances}} số dư sổ cái",
      recoveryChecks: {
        "orders-restored": "Đơn hàng đã được replay",
        "purchase-orders-restored": "Đơn mua đã được replay",
        "purchase-order-receipts-restored": "Phiếu nhận hàng đã được replay",
        "invoices-restored": "Hóa đơn đã được replay",
        "invoice-payments-restored": "Phiếu thanh toán đã được replay",
        "invoice-return-receipts-restored": "Phiếu nhận trả theo hóa đơn đã được replay",
        "collections-restored": "Hoạt động thu hồi đã được replay",
        "approvals-restored": "Phê duyệt đã được replay",
        "audit-restored": "Audit trail đã được replay",
        "journal-restored": "Bút toán đã được replay",
      },
    },
    errors: {
      invalidProductImageUrl:
        "Đường dẫn ảnh sản phẩm phải là URL tuyệt đối, đường dẫn gốc /..., hoặc data:image URL.",
      invoiceAmendFailed: "Sửa đổi hóa đơn thất bại.",
      invoiceCreditFailed: "Ghi giảm hóa đơn thất bại.",
      invoiceAmendBlocked: "Hóa đơn này chỉ được sửa đổi khi còn đang hiệu lực.",
      invoiceAmendRevisionBlocked: "Hóa đơn này không thể sửa đổi vì đã có bản sửa đổi mới hơn.",
      invoiceAmendBlockedByPayments: "Không thể sửa đổi hóa đơn này vì đã có thanh toán phát sinh.",
      invoiceActiveAmendmentNoteRequired:
        "Cần có ghi chú nghiệp vụ khi sửa đổi một hóa đơn đang hiệu lực.",
      invoiceAlreadyCredited: "Hóa đơn này đã được ghi giảm.",
      invoiceCredited: "Hóa đơn này đã được ghi giảm.",
      invoiceCreditBlocked: "Hóa đơn này chỉ có thể ghi giảm sau khi đã được thanh toán đủ.",
      invoiceCreditNoteRequired: "Cần có ghi chú nghiệp vụ khi ghi giảm một hóa đơn đã thanh toán.",
      invalidInvoiceCreditNote: "Ghi chú ghi giảm không được vượt quá 240 ký tự.",
      invalidInvoiceCreditQuantity: "Số lượng ghi giảm phải là số nguyên dương.",
      invoiceCreditQuantityExceedsRemaining: "Số lượng ghi giảm vượt quá phần còn lại chưa được ghi giảm.",
      orderAlreadyReturned: "Đơn hàng này đã được trả lại.",
    },
  },
};
