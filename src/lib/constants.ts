export const COMPANY = {
  code: "TUTTYLAB",
  name: "CÔNG TY TNHH TUTTYLAB",
};

export const CONTRACT_TYPES = [
  "Hợp đồng dịch vụ", "Hợp đồng mua bán", "Hợp đồng thuê", "Hợp đồng lao động",
  "Hợp đồng hợp tác", "Hợp đồng nguyên tắc", "Khác",
];

// Trường thông tin riêng theo từng loại hợp đồng (lưu vào cột extra dạng JSON).
// Muốn thêm/bớt trường: sửa ở đây, không cần đổi database.
export type ExtraField = { key: string; label: string; kind?: "text" | "number" | "money" | "date" | "textarea"; placeholder?: string };
export const TYPE_FIELDS: Record<string, ExtraField[]> = {
  "Hợp đồng dịch vụ": [
    { key: "scope", label: "Phạm vi dịch vụ", kind: "textarea", placeholder: "Các hạng mục công việc chính" },
    { key: "acceptance", label: "Kỳ nghiệm thu", placeholder: "Hằng tháng / theo mốc / một lần" },
    { key: "paymentTerms", label: "Điều khoản thanh toán", placeholder: "VD: 15 ngày sau BB nghiệm thu + hoá đơn" },
    { key: "sla", label: "Cam kết chất lượng (SLA)" },
  ],
  "Hợp đồng mua bán": [
    { key: "goods", label: "Hàng hoá", kind: "textarea" },
    { key: "deliveryPlace", label: "Địa điểm giao hàng" },
    { key: "deliveryDate", label: "Ngày giao hàng", kind: "date" },
    { key: "warranty", label: "Bảo hành", placeholder: "VD: 36 tháng" },
    { key: "paymentTerms", label: "Điều khoản thanh toán" },
  ],
  "Hợp đồng thuê": [
    { key: "asset", label: "Tài sản thuê", placeholder: "VD: Văn phòng tầng 6, 180m²" },
    { key: "area", label: "Diện tích (m²)", kind: "number" },
    { key: "monthlyRent", label: "Tiền thuê / tháng", kind: "money" },
    { key: "deposit", label: "Tiền đặt cọc", kind: "money" },
    { key: "paymentCycle", label: "Kỳ thanh toán", placeholder: "Tháng / quý / năm" },
  ],
  "Hợp đồng lao động": [
    { key: "employee", label: "Người lao động" },
    { key: "position", label: "Vị trí / chức danh" },
    { key: "salary", label: "Lương cơ bản / tháng", kind: "money" },
    { key: "probation", label: "Thời gian thử việc", placeholder: "VD: 2 tháng" },
    { key: "workplace", label: "Địa điểm làm việc" },
  ],
  "Hợp đồng hợp tác": [
    { key: "purpose", label: "Mục đích hợp tác", kind: "textarea" },
    { key: "contribution", label: "Phần góp của các bên" },
    { key: "profitShare", label: "Tỷ lệ phân chia lợi nhuận", placeholder: "VD: 60/40" },
  ],
  "Hợp đồng nguyên tắc": [
    { key: "scope", label: "Phạm vi giao dịch", kind: "textarea" },
    { key: "orderMethod", label: "Cách đặt hàng / đơn hàng", placeholder: "VD: theo PO từng đợt" },
    { key: "reconcile", label: "Kỳ đối soát", placeholder: "Hằng tuần / hằng tháng" },
  ],
  "Khác": [],
};

export const DIRECTIONS = ["Bán ra (khách hàng)", "Mua vào (nhà cung cấp)", "Nội bộ"];
export const DOC_TYPES = ["Hợp đồng gốc", "Phụ lục", "Biên bản nghiệm thu", "Biên bản thanh lý", "Hóa đơn", "Khác"];
export const EXPIRING_DAYS = 30;

export type StatusKey = "ACTIVE" | "SOON" | "EXPIRED" | "DONE" | "CANCEL";
export const STATUS_LABEL: Record<StatusKey, string> = {
  ACTIVE: "Đang hiệu lực", SOON: "Sắp hết hạn", EXPIRED: "Hết hạn", DONE: "Đã thanh lý", CANCEL: "Huỷ",
};
export const STATUS_CLASS: Record<StatusKey, string> = {
  ACTIVE: "bg-green-100 text-green-800", SOON: "bg-amber-100 text-amber-800", EXPIRED: "bg-red-100 text-red-800",
  DONE: "bg-blue-100 text-blue-800", CANCEL: "bg-zinc-200 text-zinc-700",
};
export function computeStatus(status: string, endDate?: string | Date | null): StatusKey {
  if (status === "DONE" || status === "CANCEL") return status;
  if (endDate) {
    const end = new Date(endDate); end.setHours(23, 59, 59, 999);
    const days = (end.getTime() - Date.now()) / 864e5;
    if (days < 0) return "EXPIRED";
    if (days <= EXPIRING_DAYS) return "SOON";
  }
  return "ACTIVE";
}
export const ROLE_LABEL: Record<string, string> = { admin: "Quản trị", editor: "Nhập liệu", viewer: "Chỉ xem" };
