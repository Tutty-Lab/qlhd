// Sinh dữ liệu mẫu cho CÔNG TY TNHH TUTTYLAB: 8 hợp đồng, mỗi loại có điều khoản & trường riêng,
// kèm PDF tiếng Việt (hợp đồng, phụ lục, BB nghiệm thu, thanh lý, hoá đơn).
// Chạy: npx tsx --env-file=.env prisma/seed-samples.ts          (bỏ qua hợp đồng đã có)
//       npx tsx --env-file=.env prisma/seed-samples.ts --reset  (xoá dữ liệu mẫu cũ rồi tạo lại)
import { PrismaClient } from "@prisma/client";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { saveObject, deleteObject } from "../src/lib/storage";

const prisma = new PrismaClient();
const FONT_DIR = process.env.FONT_DIR || "C:/Windows/Fonts";
const BY = "Dữ liệu mẫu";

const day = (offset: number) => { const n = new Date(); return new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate() + offset)); };
const vn = (d: Date) => `ngày ${String(d.getUTCDate()).padStart(2, "0")} tháng ${String(d.getUTCMonth() + 1).padStart(2, "0")} năm ${d.getUTCFullYear()}`;
const money = (v: number) => new Intl.NumberFormat("vi-VN").format(v);

const US = { name: "CÔNG TY TNHH TUTTYLAB", tax: "0110223344", addr: "Số 18 Tôn Thất Thuyết, P. Cầu Giấy, TP. Hà Nội", rep: "Nguyễn Minh Tuấn", role: "Giám đốc" };

type Item = { name: string; unit: string; qty: number; price: number };
type Party = { name: string; tax: string; addr: string; rep: string; role: string };
type Sample = {
  contractNo: string; title: string; type: string; direction: string; partner: Party;
  sign: number; start: number; end: number; vat: number; owner: string; tags: string; note?: string;
  status?: "ACTIVE" | "DONE" | "CANCEL"; items: Item[]; extra: Record<string, string>;
  appendix?: string; acceptances?: number; liquidation?: boolean; invoice?: boolean;
};

const SAMPLES: Sample[] = [
  {
    contractNo: "001/2026/HĐDV/TTL-SAOVIET", title: "Dịch vụ quảng cáo Facebook & Google năm 2026", type: "Hợp đồng dịch vụ", direction: "Mua vào (nhà cung cấp)",
    partner: { name: "Công ty Cổ phần Truyền thông Sao Việt", tax: "0108765432", addr: "Số 25 Láng Hạ, P. Láng Hạ, TP. Hà Nội", rep: "Nguyễn Văn Hùng", role: "Giám đốc" },
    sign: -320, start: -318, end: 45, vat: 8, owner: "Phòng Marketing", tags: "marketing, quảng cáo",
    items: [{ name: "Quản lý tài khoản quảng cáo Facebook", unit: "tháng", qty: 12, price: 15_000_000 }, { name: "Quản lý chiến dịch Google Ads", unit: "tháng", qty: 12, price: 10_000_000 }],
    extra: { scope: "Lập kế hoạch, triển khai và tối ưu quảng cáo Facebook, Google hằng tháng; báo cáo hiệu quả.", acceptance: "Hằng quý", paymentTerms: "15 ngày sau BB nghiệm thu + hoá đơn GTGT", sla: "CPA ≤ 120.000đ; báo cáo trước ngày 05 hằng tháng" },
    appendix: "Bổ sung dịch vụ quay dựng 04 video ngắn/tháng từ tháng 6, đơn giá 6.000.000 đồng/tháng", acceptances: 3, invoice: true,
  },
  {
    contractNo: "002/2026/HĐT/TTL-ZEN", title: "Thuê văn phòng tầng 6 toà Zen Tower", type: "Hợp đồng thuê", direction: "Mua vào (nhà cung cấp)",
    partner: { name: "Công ty TNHH Quản lý Bất động sản Zen", tax: "0105551234", addr: "12 Khuất Duy Tiến, P. Thanh Xuân, TP. Hà Nội", rep: "Trần Thị Mai", role: "Giám đốc" },
    sign: -300, start: -290, end: 20, vat: 10, owner: "Hành chính", tags: "văn phòng, thuê",
    note: "Sắp hết hạn – cần đàm phán gia hạn trước 30 ngày",
    items: [{ name: "Tiền thuê văn phòng 180m²", unit: "tháng", qty: 12, price: 54_000_000 }, { name: "Phí dịch vụ toà nhà", unit: "tháng", qty: 12, price: 7_200_000 }],
    extra: { asset: "Sàn văn phòng tầng 6, toà Zen Tower, 12 Khuất Duy Tiến", area: "180", monthlyRent: "54000000", deposit: "162000000", paymentCycle: "Theo quý, trước ngày 05 tháng đầu quý" },
  },
  {
    contractNo: "015/2026/HĐDV/TTL-MINHAN", title: "Dịch vụ vận hành fanpage và sản xuất nội dung", type: "Hợp đồng dịch vụ", direction: "Bán ra (khách hàng)",
    partner: { name: "Công ty TNHH Thực phẩm Minh An", tax: "0312345678", addr: "88 Nguyễn Thị Minh Khai, P. Bến Thành, TP. Hồ Chí Minh", rep: "Lê Quốc Bảo", role: "Giám đốc" },
    sign: -150, start: -145, end: 215, vat: 8, owner: "Sale - Marketing", tags: "khách hàng, nội dung",
    items: [{ name: "Vận hành fanpage (20 bài/tháng)", unit: "tháng", qty: 12, price: 18_000_000 }, { name: "Chụp ảnh sản phẩm", unit: "buổi", qty: 6, price: 8_000_000 }],
    extra: { scope: "Xây dựng kế hoạch nội dung, thiết kế, viết bài và đăng tải 20 bài/tháng; 6 buổi chụp ảnh sản phẩm/năm.", acceptance: "Hằng tháng", paymentTerms: "Thanh toán 100% giá trị tháng trong 10 ngày sau nghiệm thu", sla: "Đăng đúng lịch ≥ 95%; phản hồi bình luận trong 2 giờ làm việc" },
    acceptances: 4, invoice: true,
  },
  {
    contractNo: "008/2026/HĐMB/TTL-THIENLONG", title: "Mua bán thiết bị máy tính văn phòng", type: "Hợp đồng mua bán", direction: "Mua vào (nhà cung cấp)",
    partner: { name: "Công ty Cổ phần Thiết bị Thiên Long", tax: "0101112223", addr: "102 Thái Hà, P. Đống Đa, TP. Hà Nội", rep: "Phạm Đức Anh", role: "Giám đốc" },
    sign: -200, start: -200, end: -140, vat: 10, owner: "Hành chính", tags: "thiết bị, IT", status: "DONE",
    items: [{ name: "Laptop Dell Latitude 5450", unit: "chiếc", qty: 10, price: 24_500_000 }, { name: "Màn hình Dell 24 inch", unit: "chiếc", qty: 10, price: 3_900_000 }],
    extra: { goods: "10 laptop Dell Latitude 5450 (i5, 16GB, 512GB SSD); 10 màn hình Dell 24 inch P2425H", deliveryPlace: "Văn phòng TUTTYLAB, 18 Tôn Thất Thuyết, Cầu Giấy", deliveryDate: "", warranty: "36 tháng chính hãng", paymentTerms: "30% tạm ứng khi ký, 70% sau khi giao hàng và nghiệm thu" },
    acceptances: 1, liquidation: true, invoice: true,
  },
  {
    contractNo: "012/2026/HĐNT/TTL-GHN", title: "Hợp đồng nguyên tắc dịch vụ giao hàng chặng cuối", type: "Hợp đồng nguyên tắc", direction: "Mua vào (nhà cung cấp)",
    partner: { name: "Công ty Cổ phần Giao Hàng Nhanh", tax: "0311907295", addr: "405/15 Xô Viết Nghệ Tĩnh, P. Thạnh Mỹ Tây, TP. Hồ Chí Minh", rep: "Võ Minh Tuấn", role: "Giám đốc chi nhánh" },
    sign: -400, start: -400, end: -35, vat: 8, owner: "Vận hành", tags: "vận chuyển, logistics", note: "Đã hết hạn – chưa ký gia hạn",
    items: [{ name: "Cước giao hàng nội thành (ước tính)", unit: "đơn", qty: 6000, price: 22_000 }],
    extra: { scope: "Giao nhận hàng hoá toàn quốc theo đơn của TUTTYLAB; thu hộ COD.", orderMethod: "Tạo đơn qua API / trang quản lý của GHN", reconcile: "Đối soát COD hằng tuần, cước hằng tháng" },
    acceptances: 2,
  },
  {
    contractNo: "020/2026/HĐDV/TTL-HALONG", title: "Tổ chức sự kiện ra mắt sản phẩm", type: "Hợp đồng dịch vụ", direction: "Bán ra (khách hàng)",
    partner: { name: "Công ty TNHH Du lịch Hạ Long Xanh", tax: "5701234567", addr: "Đường Hạ Long, P. Bãi Cháy, Tỉnh Quảng Ninh", rep: "Đỗ Thị Hương", role: "Giám đốc" },
    sign: -60, start: -55, end: 10, vat: 8, owner: "Sale - Marketing", tags: "sự kiện, khách hàng",
    items: [{ name: "Thiết kế & dàn dựng sân khấu", unit: "gói", qty: 1, price: 85_000_000 }, { name: "MC, ca sĩ, nhân sự vận hành", unit: "gói", qty: 1, price: 42_000_000 }, { name: "Truyền thông trước sự kiện", unit: "gói", qty: 1, price: 30_000_000 }],
    extra: { scope: "Kịch bản, concept, thi công sân khấu, nhân sự và truyền thông cho sự kiện 300 khách.", acceptance: "Một lần sau sự kiện", paymentTerms: "50% tạm ứng, 50% sau nghiệm thu" },
    appendix: "Điều chỉnh ngày tổ chức sang tuần kế tiếp và bổ sung 50 khách mời, giá trị tăng thêm 15.000.000 đồng", acceptances: 1,
  },
  {
    contractNo: "021/2026/HĐHT/TTL-BAUTROIXANH", title: "Hợp tác phân phối sản phẩm khu vực miền Trung", type: "Hợp đồng hợp tác", direction: "Nội bộ",
    partner: { name: "Công ty TNHH Thương mại Bầu Trời Xanh", tax: "0401987654", addr: "56 Nguyễn Văn Linh, P. Hải Châu, TP. Đà Nẵng", rep: "Ngô Văn Thành", role: "Giám đốc" },
    sign: -20, start: -15, end: 715, vat: 0, owner: "Ban Giám đốc", tags: "hợp tác, phân phối",
    items: [{ name: "Doanh số cam kết năm đầu", unit: "năm", qty: 1, price: 2_400_000_000 }],
    extra: { purpose: "Cùng phát triển kênh phân phối sản phẩm TUTTYLAB tại 5 tỉnh miền Trung.", contribution: "TUTTYLAB: sản phẩm, thương hiệu, marketing. Bầu Trời Xanh: kho bãi, đội sale, mạng lưới đại lý.", profitShare: "60/40 (TUTTYLAB/Bầu Trời Xanh)" },
  },
  {
    contractNo: "HĐLĐ-007/2026/TTL", title: "Hợp đồng lao động – Chuyên viên kế toán", type: "Hợp đồng lao động", direction: "Nội bộ",
    partner: { name: "Bùi Thị Lan", tax: "001190012345", addr: "Số 7 ngõ 15 Trần Duy Hưng, P. Yên Hoà, TP. Hà Nội", rep: "Bùi Thị Lan", role: "Người lao động" },
    sign: -90, start: -85, end: 280, vat: 0, owner: "Hành chính - Nhân sự", tags: "nhân sự, kế toán",
    items: [{ name: "Lương cơ bản", unit: "tháng", qty: 12, price: 14_000_000 }],
    extra: { employee: "Bùi Thị Lan", position: "Chuyên viên kế toán", salary: "14000000", probation: "2 tháng (85% lương)", workplace: "Văn phòng TUTTYLAB, 18 Tôn Thất Thuyết, Cầu Giấy" },
  },
];

// ---------- PDF helpers ----------
let regular: Uint8Array, bold: Uint8Array;
async function newDoc() {
  const pdf = await PDFDocument.create(); pdf.registerFontkit(fontkit);
  return { pdf, f: await pdf.embedFont(regular, { subset: true }), b: await pdf.embedFont(bold, { subset: true }) };
}
class Writer {
  page!: PDFPage; y = 0;
  constructor(public pdf: PDFDocument, public f: PDFFont, public b: PDFFont) { this.add(); }
  add() { this.page = this.pdf.addPage([595, 842]); this.y = 790; }
  wrap(text: string, font: PDFFont, size: number, width: number) {
    const out: string[] = []; let line = "";
    for (const w of text.split(" ")) { const t = line ? line + " " + w : w; if (font.widthOfTextAtSize(t, size) > width && line) { out.push(line); line = w; } else line = t; }
    if (line) out.push(line); return out;
  }
  text(t: string, o: { size?: number; bold?: boolean; center?: boolean; indent?: number; gap?: number; italic?: boolean } = {}) {
    const size = o.size ?? 11, font = o.bold ? this.b : this.f, x = 60 + (o.indent ?? 0), w = 475 - (o.indent ?? 0);
    for (const l of this.wrap(t, font, size, w)) {
      if (this.y < 70) this.add();
      const lx = o.center ? (595 - font.widthOfTextAtSize(l, size)) / 2 : x;
      this.page.drawText(l, { x: lx, y: this.y, size, font, color: o.italic ? rgb(0.3, 0.3, 0.3) : rgb(0, 0, 0) });
      this.y -= size + 5;
    }
    this.y -= o.gap ?? 2;
  }
  article(title: string, lines: string[]) { this.text(title, { bold: true }); lines.forEach((l) => this.text(l)); this.y -= 4; }
  table(head: string[], rows: string[][], widths: number[]) {
    const draw = (cells: string[], isHead: boolean) => {
      const lines = cells.map((c, i) => this.wrap(c, isHead ? this.b : this.f, 9.5, widths[i] - 8));
      const h = Math.max(...lines.map((l) => l.length)) * 13 + 8;
      if (this.y - h < 70) this.add();
      let x = 60;
      cells.forEach((_, i) => {
        this.page.drawRectangle({ x, y: this.y - h, width: widths[i], height: h, borderColor: rgb(0, 0, 0), borderWidth: 0.6, color: isHead ? rgb(0.85, 0.88, 0.95) : undefined });
        lines[i].forEach((l, k) => this.page.drawText(l, { x: x + 4, y: this.y - 13 - k * 13, size: 9.5, font: isHead ? this.b : this.f }));
        x += widths[i];
      });
      this.y -= h;
    };
    draw(head, true); rows.forEach((r) => draw(r, false)); this.y -= 12;
  }
  signatures(left: string, right: string) {
    if (this.y < 160) this.add();
    this.y -= 10;
    for (const [x, t] of [[100, left], [360, right]] as const) {
      this.page.drawText(t, { x, y: this.y, size: 11, font: this.b });
      this.page.drawText("(Ký, ghi rõ họ tên" + (t.includes("LAO ĐỘNG") ? ")" : ", đóng dấu)"), { x: x - 10, y: this.y - 15, size: 9, font: this.f, color: rgb(0.35, 0.35, 0.35) });
    }
    this.y -= 100;
  }
}
const header = (w: Writer, d: Date) => {
  w.text("CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM", { bold: true, center: true, size: 12 });
  w.text("Độc lập – Tự do – Hạnh phúc", { bold: true, center: true, size: 11.5 });
  w.text("———————", { center: true, gap: 6 });
  w.text(`Hà Nội, ${vn(d)}`, { center: true, italic: true, gap: 10 });
};
// Bên A / Bên B theo chiều hợp đồng
const sides = (s: Sample): [Party, Party] => (s.direction.startsWith("Bán") ? [s.partner, US] : [US, s.partner]);
function parties(w: Writer, s: Sample, labels = ["BÊN A", "BÊN B"]) {
  sides(s).forEach((p, i) => {
    const person = s.type === "Hợp đồng lao động" && i === 1;
    w.text(`${labels[i]}: ${person ? "Ông/Bà " + p.name : p.name.toUpperCase()}`, { bold: true });
    w.text(`${person ? "Thường trú" : "Địa chỉ"}: ${p.addr}`, { indent: 12 });
    w.text(`${person ? "Số CCCD" : "Mã số thuế"}: ${p.tax}`, { indent: 12 });
    if (!person) w.text(`Đại diện: Ông/Bà ${p.rep} – Chức vụ: ${p.role}`, { indent: 12 });
    w.y -= 4;
  });
}
const sumOf = (s: Sample) => s.items.reduce((t, i) => t + i.qty * i.price, 0);
const itemRows = (items: Item[], ratio = 1) => items.map((it, i) => {
  const q = Math.round(it.qty * ratio * 100) / 100;
  return [String(i + 1), it.name, it.unit, String(q), money(it.price), money(Math.round(q * it.price))];
});
const W = [30, 190, 45, 45, 80, 85];
const valueBlock = (w: Writer, s: Sample, title: string) => {
  w.text(title, { bold: true });
  w.table(["STT", "Hạng mục", "ĐVT", "SL", "Đơn giá", "Thành tiền"], itemRows(s.items), W);
  const total = sumOf(s), vat = Math.round(total * s.vat / 100);
  w.text(`Tổng giá trị trước thuế: ${money(total)} đồng`);
  if (s.vat) w.text(`Thuế GTGT (${s.vat}%): ${money(vat)} đồng`);
  w.text(`Tổng giá trị${s.vat ? " sau thuế" : ""}: ${money(total + vat)} đồng`, { bold: true, gap: 6 });
};
const period = (s: Sample) => `Từ ${vn(day(s.start))} đến ${vn(day(s.end))}.`;
const general = ["Hợp đồng có hiệu lực từ ngày ký. Mọi sửa đổi, bổ sung phải lập thành phụ lục bằng văn bản và là bộ phận không tách rời của hợp đồng.",
  "Tranh chấp được giải quyết qua thương lượng; nếu không thành, một bên có quyền khởi kiện tại Toà án nhân dân có thẩm quyền.",
  "Hợp đồng lập thành 02 bản có giá trị pháp lý như nhau, mỗi bên giữ 01 bản."];

// Điều khoản riêng theo từng loại hợp đồng
function body(w: Writer, s: Sample) {
  const x = s.extra;
  switch (s.type) {
    case "Hợp đồng thuê":
      w.article("ĐIỀU 1. TÀI SẢN THUÊ", [`Bên A đồng ý cho Bên B thuê: ${x.asset}, diện tích ${x.area} m², mục đích sử dụng làm văn phòng làm việc.`]);
      w.article("ĐIỀU 2. THỜI HẠN THUÊ", [period(s), "Bên B được ưu tiên gia hạn nếu thông báo bằng văn bản trước 60 ngày khi hết hạn."]);
      valueBlock(w, s, "ĐIỀU 3. GIÁ THUÊ VÀ CHI PHÍ");
      w.article("ĐIỀU 4. ĐẶT CỌC VÀ THANH TOÁN", [`Tiền đặt cọc: ${money(Number(x.deposit))} đồng (tương đương 03 tháng tiền thuê), hoàn trả khi kết thúc hợp đồng sau khi trừ các khoản còn nợ.`, `Kỳ thanh toán: ${x.paymentCycle}.`, "Điện, nước, internet tính theo đồng hồ thực tế, thanh toán hằng tháng."]);
      w.article("ĐIỀU 5. QUYỀN VÀ NGHĨA VỤ", ["5.1. Bên A bàn giao mặt bằng đúng hiện trạng, bảo đảm quyền sử dụng ổn định cho Bên B trong thời hạn thuê.", "5.2. Bên B sử dụng đúng mục đích, không tự ý cải tạo kết cấu, không cho thuê lại khi chưa có đồng ý của Bên A."]);
      w.article("ĐIỀU 6. CHẤM DỨT HỢP ĐỒNG", ["Bên đơn phương chấm dứt hợp đồng trái thoả thuận phải báo trước 30 ngày và chịu phạt một khoản bằng tiền đặt cọc."]);
      w.article("ĐIỀU 7. ĐIỀU KHOẢN CHUNG", general);
      break;
    case "Hợp đồng mua bán":
      w.article("ĐIỀU 1. HÀNG HOÁ", [`Bên B bán cho Bên A: ${x.goods}. Hàng mới 100%, đúng chủng loại, có CO/CQ.`]);
      valueBlock(w, s, "ĐIỀU 2. SỐ LƯỢNG, ĐƠN GIÁ");
      w.article("ĐIỀU 3. GIAO NHẬN", [`Địa điểm giao hàng: ${x.deliveryPlace}.`, "Thời gian giao hàng: trong 10 ngày kể từ ngày ký. Hai bên ký biên bản giao nhận khi bàn giao."]);
      w.article("ĐIỀU 4. BẢO HÀNH", [`Thời gian bảo hành: ${x.warranty}. Bên B xử lý lỗi trong 48 giờ kể từ khi nhận thông báo.`]);
      w.article("ĐIỀU 5. THANH TOÁN", [x.paymentTerms + ". Thanh toán bằng chuyển khoản."]);
      w.article("ĐIỀU 6. PHẠT VI PHẠM", ["Giao hàng chậm: phạt 0,1%/ngày trên giá trị hàng giao chậm, tối đa 8% giá trị hợp đồng."]);
      w.article("ĐIỀU 7. ĐIỀU KHOẢN CHUNG", general);
      break;
    case "Hợp đồng lao động":
      w.article("ĐIỀU 1. CÔNG VIỆC VÀ ĐỊA ĐIỂM", [`Chức danh: ${x.position}.`, `Địa điểm làm việc: ${x.workplace}.`, "Công việc: thực hiện theo mô tả công việc kèm theo và phân công của quản lý trực tiếp."]);
      w.article("ĐIỀU 2. THỜI HẠN HỢP ĐỒNG", [`Loại hợp đồng: xác định thời hạn 12 tháng. ${period(s)}`, `Thời gian thử việc: ${x.probation}.`]);
      w.article("ĐIỀU 3. THỜI GIỜ LÀM VIỆC", ["8 giờ/ngày, từ thứ Hai đến thứ Sáu và sáng thứ Bảy. Nghỉ lễ, Tết, phép năm theo Bộ luật Lao động."]);
      w.article("ĐIỀU 4. TIỀN LƯƠNG VÀ PHÚC LỢI", [`Lương cơ bản: ${money(Number(x.salary))} đồng/tháng, trả vào ngày 10 hằng tháng qua chuyển khoản.`, "Phụ cấp ăn trưa 730.000 đồng/tháng; thưởng theo kết quả kinh doanh và đánh giá năng lực.", "Đóng BHXH, BHYT, BHTN theo quy định của pháp luật."]);
      w.article("ĐIỀU 5. QUYỀN VÀ NGHĨA VỤ", ["5.1. Người lao động chấp hành nội quy, bảo mật thông tin tài chính, kế toán của công ty.", "5.2. Người sử dụng lao động bảo đảm việc làm, trả lương đầy đủ, đúng hạn và các chế độ theo luật."]);
      w.article("ĐIỀU 6. ĐIỀU KHOẢN THI HÀNH", ["Hợp đồng được lập căn cứ Bộ luật Lao động số 45/2019/QH14. Những vấn đề chưa quy định áp dụng theo nội quy lao động và pháp luật hiện hành."]);
      break;
    case "Hợp đồng hợp tác":
      w.article("ĐIỀU 1. MỤC ĐÍCH HỢP TÁC", [x.purpose]);
      w.article("ĐIỀU 2. ĐÓNG GÓP CỦA CÁC BÊN", [x.contribution]);
      valueBlock(w, s, "ĐIỀU 3. CHỈ TIÊU KINH DOANH");
      w.article("ĐIỀU 4. PHÂN CHIA LỢI NHUẬN", [`Lợi nhuận sau chi phí được chia theo tỷ lệ ${x.profitShare}, quyết toán theo quý.`, "Rủi ro, thua lỗ chia theo tỷ lệ tương ứng."]);
      w.article("ĐIỀU 5. BAN ĐIỀU HÀNH", ["Mỗi bên cử 01 đại diện tham gia ban điều hành; họp đánh giá định kỳ hằng quý."]);
      w.article("ĐIỀU 6. THỜI HẠN", [period(s)]);
      w.article("ĐIỀU 7. ĐIỀU KHOẢN CHUNG", general);
      break;
    case "Hợp đồng nguyên tắc":
      w.article("ĐIỀU 1. PHẠM VI", [x.scope, "Hợp đồng này là cơ sở cho các đơn hàng cụ thể phát sinh giữa hai bên."]);
      w.article("ĐIỀU 2. ĐẶT HÀNG", [`Phương thức: ${x.orderMethod}. Mỗi đơn hàng có giá trị như một hợp đồng thành phần.`]);
      valueBlock(w, s, "ĐIỀU 3. BẢNG GIÁ VÀ GIÁ TRỊ ƯỚC TÍNH");
      w.article("ĐIỀU 4. ĐỐI SOÁT VÀ THANH TOÁN", [`Kỳ đối soát: ${x.reconcile}.`, "Thanh toán trong 07 ngày làm việc sau khi hai bên ký biên bản đối soát."]);
      w.article("ĐIỀU 5. BỒI THƯỜNG", ["Hàng hư hỏng, thất lạc được bồi thường theo giá trị khai báo, tối đa 4 lần cước dịch vụ nếu không khai giá."]);
      w.article("ĐIỀU 6. THỜI HẠN", [period(s), "Tự động gia hạn 12 tháng nếu không bên nào có ý kiến trước 30 ngày."]);
      w.article("ĐIỀU 7. ĐIỀU KHOẢN CHUNG", general);
      break;
    default: // Hợp đồng dịch vụ
      w.article("ĐIỀU 1. NỘI DUNG DỊCH VỤ", [`${s.title}. Phạm vi: ${x.scope}`]);
      valueBlock(w, s, "ĐIỀU 2. GIÁ TRỊ HỢP ĐỒNG");
      w.article("ĐIỀU 3. THỜI HẠN THỰC HIỆN", [period(s)]);
      w.article("ĐIỀU 4. NGHIỆM THU VÀ THANH TOÁN", [`Kỳ nghiệm thu: ${x.acceptance}. Hai bên lập biên bản nghiệm thu cho từng kỳ.`, `Thanh toán: ${x.paymentTerms}.`]);
      if (x.sla) w.article("ĐIỀU 5. CAM KẾT CHẤT LƯỢNG", [x.sla + ". Không đạt cam kết 02 kỳ liên tiếp, bên sử dụng dịch vụ có quyền chấm dứt hợp đồng."]);
      w.article(x.sla ? "ĐIỀU 6. PHẠT VI PHẠM" : "ĐIỀU 5. PHẠT VI PHẠM", ["Bên vi phạm chịu phạt 8% giá trị phần nghĩa vụ bị vi phạm và bồi thường thiệt hại thực tế."]);
      w.article(x.sla ? "ĐIỀU 7. ĐIỀU KHOẢN CHUNG" : "ĐIỀU 6. ĐIỀU KHOẢN CHUNG", general);
  }
}

async function contractPdf(s: Sample) {
  const { pdf, f, b } = await newDoc(); const w = new Writer(pdf, f, b);
  header(w, day(s.sign));
  w.text(s.type.toUpperCase(), { bold: true, center: true, size: 15 });
  w.text(`Số: ${s.contractNo}`, { center: true, gap: 6 });
  const bases = s.type === "Hợp đồng lao động" ? ["– Căn cứ Bộ luật Lao động số 45/2019/QH14 ngày 20/11/2019;"]
    : ["– Căn cứ Bộ luật Dân sự số 91/2015/QH13 ngày 24/11/2015;", "– Căn cứ Luật Thương mại số 36/2005/QH11 ngày 14/6/2005;"];
  [...bases, "– Căn cứ nhu cầu và khả năng của hai bên."].forEach((l) => w.text(l, { italic: true }));
  w.y -= 6;
  w.text(`Hôm nay, ${vn(day(s.sign))}, chúng tôi gồm:`, { gap: 6 });
  parties(w, s, s.type === "Hợp đồng lao động" ? ["NGƯỜI SỬ DỤNG LAO ĐỘNG", "NGƯỜI LAO ĐỘNG"] : undefined);
  w.text("Hai bên thống nhất ký kết hợp đồng với các điều khoản sau:", { gap: 6 });
  body(w, s);
  w.y -= 6;
  if (s.type === "Hợp đồng lao động") w.signatures("NGƯỜI LAO ĐỘNG", "NGƯỜI SỬ DỤNG LĐ");
  else w.signatures("ĐẠI DIỆN BÊN A", "ĐẠI DIỆN BÊN B");
  return pdf.save();
}
async function appendixPdf(s: Sample) {
  const { pdf, f, b } = await newDoc(); const w = new Writer(pdf, f, b);
  header(w, day(s.sign + 30));
  w.text("PHỤ LỤC HỢP ĐỒNG SỐ 01", { bold: true, center: true, size: 15 });
  w.text(`Kèm theo hợp đồng số: ${s.contractNo}`, { center: true, gap: 10 });
  parties(w, s);
  w.text("Hai bên thống nhất sửa đổi, bổ sung hợp đồng như sau:", { bold: true });
  w.text("1. " + s.appendix + ".", { indent: 12 });
  w.text("2. Các điều khoản khác của hợp đồng giữ nguyên hiệu lực.", { indent: 12 });
  w.text("3. Phụ lục này là bộ phận không tách rời của hợp đồng, có hiệu lực kể từ ngày ký.", { indent: 12, gap: 10 });
  w.signatures("ĐẠI DIỆN BÊN A", "ĐẠI DIỆN BÊN B");
  return pdf.save();
}
async function acceptancePdf(s: Sample, n: number, total: number) {
  const { pdf, f, b } = await newDoc(); const w = new Writer(pdf, f, b);
  const d = day(s.start + Math.round((Math.min(s.end, -5) - s.start) * n / total));
  header(w, d);
  w.text(s.type === "Hợp đồng nguyên tắc" ? "BIÊN BẢN ĐỐI SOÁT – NGHIỆM THU" : "BIÊN BẢN NGHIỆM THU", { bold: true, center: true, size: 15 });
  w.text(`Đợt ${n}/${total} – Số: BBNT-${s.contractNo.split("/")[0]}-${String(n).padStart(2, "0")}`, { center: true });
  w.text(`Căn cứ hợp đồng số ${s.contractNo} ký ${vn(day(s.sign))}`, { center: true, italic: true, gap: 10 });
  w.text("I. THÀNH PHẦN THAM GIA", { bold: true });
  parties(w, s);
  w.text("II. NỘI DUNG NGHIỆM THU", { bold: true });
  w.text(s.type === "Hợp đồng mua bán" ? "Hai bên kiểm đếm số lượng, chủng loại, tình trạng hàng hoá đã giao như sau:" : "Hai bên tiến hành nghiệm thu khối lượng công việc đã hoàn thành trong đợt như sau:");
  const ratio = 1 / total;
  w.table(["STT", "Hạng mục", "ĐVT", "SL", "Đơn giá", "Thành tiền"], itemRows(s.items, ratio), W);
  const val = Math.round(sumOf(s) * ratio), vat = Math.round(val * s.vat / 100);
  w.text(`Giá trị nghiệm thu đợt ${n} (trước thuế): ${money(val)} đồng`);
  w.text(`Thuế GTGT (${s.vat}%): ${money(vat)} đồng – Tổng cộng: ${money(val + vat)} đồng`, { bold: true, gap: 6 });
  w.text("III. ĐÁNH GIÁ", { bold: true });
  w.text(s.type === "Hợp đồng mua bán" ? "Hàng hoá đúng chủng loại, đủ số lượng, mới 100%, hoạt động bình thường, đủ phụ kiện và phiếu bảo hành."
    : s.extra.sla ? `Đạt cam kết chất lượng: ${s.extra.sla}.` : "Công việc thực hiện đúng phạm vi, đạt yêu cầu chất lượng và tiến độ theo hợp đồng.", { gap: 6 });
  w.text("IV. KẾT LUẬN", { bold: true });
  w.text(`Bên A đồng ý nghiệm thu và chấp thuận thanh toán đợt ${n} cho Bên B với giá trị nêu trên. Biên bản lập thành 02 bản, mỗi bên giữ 01 bản.`, { gap: 10 });
  w.signatures("ĐẠI DIỆN BÊN A", "ĐẠI DIỆN BÊN B");
  return { bytes: await pdf.save(), date: d };
}
async function liquidationPdf(s: Sample) {
  const { pdf, f, b } = await newDoc(); const w = new Writer(pdf, f, b);
  header(w, day(s.end + 3));
  w.text("BIÊN BẢN THANH LÝ HỢP ĐỒNG", { bold: true, center: true, size: 15 });
  w.text(`Hợp đồng số: ${s.contractNo}`, { center: true, gap: 10 });
  parties(w, s);
  const total = sumOf(s), vat = Math.round(total * s.vat / 100);
  w.text("Hai bên thống nhất thanh lý hợp đồng với nội dung sau:", { bold: true });
  w.text(`1. Bên B đã hoàn thành toàn bộ nghĩa vụ theo hợp đồng. Tổng giá trị thực hiện: ${money(total + vat)} đồng (đã gồm VAT).`, { indent: 12 });
  w.text(`2. Bên A đã thanh toán: ${money(total + vat)} đồng. Số tiền còn phải thanh toán: 0 đồng.`, { indent: 12 });
  w.text("3. Kể từ ngày ký biên bản này, hợp đồng chấm dứt hiệu lực; hai bên không còn nghĩa vụ nào với nhau, trừ nghĩa vụ bảo hành (nếu có).", { indent: 12, gap: 10 });
  w.signatures("ĐẠI DIỆN BÊN A", "ĐẠI DIỆN BÊN B");
  return pdf.save();
}
async function invoicePdf(s: Sample) {
  const { pdf, f, b } = await newDoc(); const w = new Writer(pdf, f, b);
  w.text("HOÁ ĐƠN GIÁ TRỊ GIA TĂNG (BẢN THỂ HIỆN – MẪU)", { bold: true, center: true, size: 14 });
  w.text(`Ký hiệu: 1C26TTL – Số: ${String(1000 + Math.floor(Math.random() * 8999))}`, { center: true, gap: 10 });
  w.text("Tài liệu mẫu dùng để thử phần mềm, không có giá trị pháp lý.", { center: true, italic: true, gap: 10 });
  const [buyer, seller] = sides(s);
  w.text(`Đơn vị bán: ${seller.name} – MST: ${seller.tax}`, { bold: true });
  w.text(`Địa chỉ: ${seller.addr}`, { gap: 6 });
  w.text(`Đơn vị mua: ${buyer.name} – MST: ${buyer.tax}`, { bold: true });
  w.text(`Địa chỉ: ${buyer.addr}`, { gap: 8 });
  w.table(["STT", "Hàng hoá, dịch vụ", "ĐVT", "SL", "Đơn giá", "Thành tiền"], itemRows(s.items, 0.25), W);
  const val = Math.round(sumOf(s) * 0.25), vat = Math.round(val * s.vat / 100);
  w.text(`Cộng tiền hàng: ${money(val)} – Thuế GTGT ${s.vat}%: ${money(vat)} – Tổng thanh toán: ${money(val + vat)} đồng`, { bold: true });
  return pdf.save();
}

async function store(contractId: string, bytes: Uint8Array, name: string, docType: string, createdAt: Date) {
  const safe = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").replace(/[^\w.\-]+/g, "_");
  const stored = `${contractId.slice(-8)}_${crypto.randomBytes(5).toString("hex")}_${safe}`;
  const url = await saveObject(stored, bytes, "application/pdf");
  await prisma.contractFile.create({ data: { contractId, name, stored: url, mime: "application/pdf", size: bytes.length, docType, uploadedBy: BY, createdAt } });
}

async function reset() {
  const old = await prisma.contract.findMany({ where: { createdBy: BY }, include: { files: true } });
  for (const c of old) for (const f of c.files) await deleteObject(f.stored);
  const r = await prisma.contract.deleteMany({ where: { createdBy: BY } });
  console.log(`Đã xoá ${r.count} hợp đồng mẫu cũ.`);
}

async function main() {
  regular = await fs.readFile(path.join(FONT_DIR, "arial.ttf"));
  bold = await fs.readFile(path.join(FONT_DIR, "arialbd.ttf"));
  if (process.argv.includes("--reset")) await reset();
  let made = 0;
  for (const s of SAMPLES) {
    if (await prisma.contract.findUnique({ where: { company_contractNo: { company: "TUTTYLAB", contractNo: s.contractNo } } })) continue;
    const short = s.contractNo.match(/\d{3}/)?.[0] ?? s.contractNo;
    const extra = Object.fromEntries(Object.entries(s.extra).filter(([, v]) => v));
    if (s.type === "Hợp đồng mua bán") extra.deliveryDate = day(s.start + 10).toISOString().slice(0, 10);
    const c = await prisma.contract.create({ data: {
      company: "TUTTYLAB", contractNo: s.contractNo, title: s.title, type: s.type, direction: s.direction,
      partner: s.partner.name, partnerTax: s.partner.tax, partnerRep: s.partner.rep, partnerAddress: s.partner.addr,
      signDate: day(s.sign), startDate: day(s.start), endDate: day(s.end), value: sumOf(s), vat: s.vat,
      owner: s.owner, tags: s.tags, note: s.note ?? null, extra: JSON.stringify(extra), status: s.status ?? "ACTIVE",
      createdBy: BY, createdAt: day(s.sign), history: { create: [{ action: "Tạo hợp đồng", by: BY, at: day(s.sign) }] },
    } });
    await store(c.id, await contractPdf(s), `HĐ ${short} - ${s.partner.name}.pdf`, "Hợp đồng gốc", day(s.sign));
    if (s.appendix) await store(c.id, await appendixPdf(s), `Phụ lục 01 - HĐ ${short}.pdf`, "Phụ lục", day(s.sign + 30));
    for (let n = 1; n <= (s.acceptances || 0); n++) {
      const { bytes, date } = await acceptancePdf(s, n, s.acceptances!);
      await store(c.id, bytes, `BBNT đợt ${n} - HĐ ${short}.pdf`, "Biên bản nghiệm thu", date);
    }
    if (s.invoice) await store(c.id, await invoicePdf(s), `Hoá đơn mẫu - HĐ ${short}.pdf`, "Hóa đơn", day(s.start + 30));
    if (s.liquidation) await store(c.id, await liquidationPdf(s), `BB thanh lý - HĐ ${short}.pdf`, "Biên bản thanh lý", day(s.end + 3));
    if (s.status && s.status !== "ACTIVE")
      await prisma.history.create({ data: { contractId: c.id, action: "Đổi trạng thái: " + (s.status === "DONE" ? "Đã thanh lý" : "Huỷ"), note: s.note ?? null, by: BY } });
    made++;
    console.log("✓", s.type.padEnd(20), s.contractNo);
  }
  console.log(`Đã tạo ${made} hợp đồng mẫu.`);
}
main().finally(() => prisma.$disconnect());
