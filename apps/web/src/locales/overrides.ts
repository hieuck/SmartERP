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
    },
    reports: {
      auditActionInvoiceAmended: "Sửa đổi hóa đơn",
    },
    errors: {
      invoiceAmendFailed: "Sửa đổi hóa đơn thất bại.",
      invoiceAmendBlocked: "Hóa đơn này chỉ được sửa đổi khi còn đang hiệu lực.",
      invoiceAmendRevisionBlocked: "Hóa đơn này không thể sửa đổi vì đã có bản sửa đổi mới hơn.",
      invoiceAmendBlockedByPayments: "Không thể sửa đổi hóa đơn này vì đã có thanh toán phát sinh.",
      invoiceActiveAmendmentNoteRequired:
        "Cần có ghi chú nghiệp vụ khi sửa đổi một hóa đơn đang hiệu lực.",
    },
  },
};
