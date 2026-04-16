type TranslationTree = {
  [key: string]: string | TranslationTree;
};

export const localeOverrides: Record<"vi" | "en", TranslationTree> = {
  en: {},
  vi: {
    approvals: {
      typeInvoiceAmend: "Sửa đổi hóa đơn",
    },
    invoices: {
      amendmentNoteActiveHint: "Bắt buộc để giải thích vì sao {{number}} đang được sửa đổi.",
      amendAction: "Sửa hóa đơn",
      amendSubmit: "Áp dụng sửa đổi",
      amendTitle: "Sửa {{number}}",
      statusCredited: "Đã ghi giảm",
      creditAction: "Lập credit note",
      creditSubmit: "Ghi credit note",
      creditTitle: "Ghi giảm {{number}}",
      creditNote: "Ghi chú ghi giảm",
      creditNoteLabel: "Ghi chú ghi giảm:",
      creditNoteHint: "Bắt buộc để giải thích vì sao {{number}} được ghi giảm sau khi đã thanh toán.",
      creditNoteGenericHint: "Bắt buộc có ghi chú nghiệp vụ cho credit note.",
      creditNotePlaceholder: "Hoàn tiền toàn bộ sau khi khách trả hàng.",
      creditedAtLabel: "Đã ghi giảm lúc:",
      creditMethodLabel: "Phương thức hoàn tiền:",
      collectionCredited: "Đã ghi giảm",
    },
    reports: {
      auditActionInvoiceAmended: "Sửa đổi hóa đơn",
      auditActionInvoiceCredited: "Ghi giảm hóa đơn",
      creditedInvoices: "Hóa đơn đã ghi giảm",
      creditedAmount: "Giá trị đã ghi giảm",
    },
    errors: {
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
    },
  },
};
