// Sinh file Thỏa thuận bảo mật thông tin (.docx) cho một hợp đồng.
import { AlignmentType, BorderStyle, Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from "docx";
import { COMPANY } from "./constants";

export type NdaInput = {
  number: string;          // số thỏa thuận
  contractNo: string;      // số HĐ gốc
  purpose: string;         // mục đích trao đổi thông tin
  partner: string; partnerTax?: string | null; partnerRep?: string | null; partnerAddress?: string | null;
  years: number;           // thời hạn bảo mật sau khi HĐ chấm dứt
  penalty?: number | null; // phạt vi phạm (VNĐ), tuỳ chọn
};

const DOTS = "....................................................";
const FONT = "Times New Roman";
const money = (v: number) => new Intl.NumberFormat("vi-VN").format(v);
type Align = (typeof AlignmentType)[keyof typeof AlignmentType];

const t = (text: string, o: { bold?: boolean; italics?: boolean; size?: number } = {}) =>
  new TextRun({ text, font: FONT, size: o.size ?? 26, bold: o.bold, italics: o.italics });
const p = (runs: TextRun[] | string, o: { align?: Align; after?: number } = {}) =>
  new Paragraph({ children: typeof runs === "string" ? [t(runs)] : runs, alignment: o.align ?? AlignmentType.JUSTIFIED, spacing: { after: o.after ?? 80, line: 300 } });
const h = (text: string) => p([t(text, { bold: true })], { after: 60 });
const center = (text: string, bold = false, after = 0) => p([t(text, { bold })], { align: AlignmentType.CENTER, after });

const NONE = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const NB = { top: NONE, bottom: NONE, left: NONE, right: NONE, insideHorizontal: NONE, insideVertical: NONE };
const info = (rows: [string, string][]) => new Table({
  width: { size: 100, type: WidthType.PERCENTAGE }, borders: NB,
  rows: rows.map(([k, v]) => new TableRow({ children: [
    new TableCell({ width: { size: 28, type: WidthType.PERCENTAGE }, borders: NB, children: [p(k, { after: 20 })] }),
    new TableCell({ width: { size: 72, type: WidthType.PERCENTAGE }, borders: NB, children: [p(": " + v, { after: 20 })] }),
  ] })),
});

export async function buildNda(d: NdaInput): Promise<Buffer> {
  const year = new Date().getFullYear();
  const yy = `${String(d.years).padStart(2, "0")} (${d.years})`;
  const clauses: [string, string[]][] = [
    ["Điều 1. Thông tin bảo mật", [
      `1.1. "Thông tin bảo mật" là mọi thông tin, tài liệu, dữ liệu dưới bất kỳ hình thức nào (văn bản, điện tử, hình ảnh, lời nói, mã nguồn, thiết kế, tài khoản truy cập...) mà một Bên ("Bên tiết lộ") cung cấp hoặc để Bên kia ("Bên nhận") tiếp cận trong quá trình thực hiện Hợp đồng số ${d.contractNo}, phục vụ mục đích: ${d.purpose}.`,
      "1.2. Thông tin bảo mật bao gồm nhưng không giới hạn: thông tin kinh doanh, khách hàng, đối tác, giá cả, tài chính, kế hoạch sản phẩm, bí mật kinh doanh, quy trình nghiệp vụ, mã nguồn, cơ sở dữ liệu, thiết kế, tài liệu kỹ thuật, tài khoản, mật khẩu, khoá truy cập và dữ liệu cá nhân.",
      "1.3. Không được coi là Thông tin bảo mật nếu Bên nhận chứng minh được thông tin đó: (a) đã được công bố công khai không do lỗi của Bên nhận; (b) Bên nhận đã có một cách hợp pháp trước khi được tiết lộ; (c) được bên thứ ba có quyền cung cấp hợp pháp mà không kèm nghĩa vụ bảo mật; (d) do Bên nhận tự phát triển độc lập mà không sử dụng Thông tin bảo mật.",
    ]],
    ["Điều 2. Nghĩa vụ của Bên nhận", [
      "2.1. Chỉ sử dụng Thông tin bảo mật cho mục đích nêu tại Điều 1; không sao chép, khai thác, công bố hoặc chuyển giao cho bên thứ ba khi chưa có sự đồng ý bằng văn bản của Bên tiết lộ.",
      "2.2. Áp dụng các biện pháp bảo vệ cần thiết, không thấp hơn mức độ bảo vệ thông tin của chính mình; chỉ cho phép nhân sự thực sự cần biết tiếp cận và bảo đảm những người này tuân thủ nghĩa vụ tương đương Thỏa thuận này.",
      "2.3. Không lưu trữ Thông tin bảo mật trên thiết bị, tài khoản hoặc dịch vụ cá nhân khi chưa được Bên tiết lộ chấp thuận; không chia sẻ tài khoản, mật khẩu được cấp.",
      "2.4. Thông báo ngay cho Bên tiết lộ khi phát hiện Thông tin bảo mật bị lộ, mất hoặc bị sử dụng trái phép và phối hợp khắc phục.",
      "2.5. Trường hợp phải cung cấp thông tin theo yêu cầu của cơ quan nhà nước có thẩm quyền, Bên nhận thông báo trước cho Bên tiết lộ (nếu pháp luật cho phép) và chỉ cung cấp trong phạm vi bắt buộc.",
    ]],
    ["Điều 3. Dữ liệu cá nhân", [
      "Việc xử lý dữ liệu cá nhân (nếu có) phải tuân thủ quy định pháp luật về bảo vệ dữ liệu cá nhân; Bên nhận chỉ xử lý dữ liệu trong phạm vi được giao và không chuyển dữ liệu cho bên thứ ba.",
    ]],
    ["Điều 4. Hoàn trả và huỷ thông tin", [
      "Khi Hợp đồng chấm dứt hoặc theo yêu cầu của Bên tiết lộ, trong vòng 05 (năm) ngày làm việc Bên nhận phải hoàn trả hoặc huỷ toàn bộ Thông tin bảo mật và các bản sao, thu hồi quyền truy cập, và xác nhận bằng văn bản hoặc email việc đã hoàn trả, huỷ.",
    ]],
    ["Điều 5. Quyền sở hữu", [
      "Thông tin bảo mật vẫn thuộc quyền sở hữu của Bên tiết lộ. Thỏa thuận này không chuyển giao bất kỳ quyền sở hữu trí tuệ hay quyền sử dụng nào ngoài mục đích nêu tại Điều 1.",
    ]],
    ["Điều 6. Thời hạn bảo mật", [
      `Thỏa thuận có hiệu lực từ ngày ký. Nghĩa vụ bảo mật có hiệu lực trong suốt thời gian thực hiện Hợp đồng và ${yy} năm kể từ khi Hợp đồng chấm dứt; riêng bí mật kinh doanh, mã nguồn và dữ liệu cá nhân được bảo mật cho đến khi trở thành thông tin công khai một cách hợp pháp.`,
    ]],
    ["Điều 7. Vi phạm và bồi thường", [
      d.penalty
        ? `7.1. Bên vi phạm nghĩa vụ bảo mật phải chịu phạt vi phạm ${money(d.penalty)} đồng cho mỗi lần vi phạm và bồi thường toàn bộ thiệt hại thực tế phát sinh cho Bên bị vi phạm.`
        : "7.1. Bên vi phạm nghĩa vụ bảo mật phải bồi thường toàn bộ thiệt hại thực tế phát sinh cho Bên bị vi phạm theo quy định của pháp luật.",
      "7.2. Bên bị vi phạm có quyền yêu cầu chấm dứt ngay hành vi vi phạm, đơn phương chấm dứt Hợp đồng và yêu cầu cơ quan có thẩm quyền xử lý theo quy định pháp luật.",
    ]],
    ["Điều 8. Giải quyết tranh chấp", [
      "Tranh chấp phát sinh được giải quyết trước hết bằng thương lượng. Nếu không thương lượng được trong vòng 30 ngày, một trong các Bên có quyền đưa tranh chấp ra Toà án nhân dân có thẩm quyền tại TP. Hồ Chí Minh.",
    ]],
    ["Điều 9. Điều khoản chung", [
      `9.1. Thỏa thuận này là một phần không tách rời của Hợp đồng số ${d.contractNo}. Mọi sửa đổi, bổ sung phải được hai Bên xác nhận bằng văn bản.`,
      "9.2. Thỏa thuận được lập thành 02 (hai) bản có giá trị pháp lý như nhau, mỗi Bên giữ 01 (một) bản.",
    ]],
  ];

  const signName = ((d.partnerRep || "").split(/\s[–-]\s/)[0] || d.partner).toUpperCase();
  const sign = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE }, borders: NB,
    rows: [new TableRow({ children: [
      new TableCell({ borders: NB, children: [center("ĐẠI DIỆN BÊN A", true), p([t("(Ký, ghi rõ họ tên, đóng dấu)", { italics: true })], { align: AlignmentType.CENTER, after: 1400 }), center(COMPANY.rep, true)] }),
      new TableCell({ borders: NB, children: [center("ĐẠI DIỆN BÊN B", true), p([t("(Ký, ghi rõ họ tên)", { italics: true })], { align: AlignmentType.CENTER, after: 1400 }), center(signName, true)] }),
    ] })],
  });

  const doc = new Document({
    styles: { default: { document: { run: { font: FONT, size: 26 } } } },
    sections: [{
      properties: { page: { margin: { top: 1134, bottom: 1134, left: 1701, right: 1134 } } },
      children: [
        center("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", true), center("Độc lập - Tự do - Hạnh phúc", true), center("---o0o---", false, 200),
        p([t("THỎA THUẬN BẢO MẬT THÔNG TIN", { bold: true, size: 30 })], { align: AlignmentType.CENTER, after: 40 }),
        p([t(`(Kèm theo Hợp đồng số ${d.contractNo})`, { italics: true })], { align: AlignmentType.CENTER, after: 40 }),
        center(`Số: ${d.number}`, false, 160),
        p([t("- Căn cứ Bộ luật Dân sự số 91/2015/QH13 ngày 24/11/2015;", { italics: true })], { after: 20 }),
        p([t("- Căn cứ Luật Sở hữu trí tuệ số 50/2005/QH11 và các văn bản sửa đổi, bổ sung;", { italics: true })], { after: 20 }),
        p([t(`- Căn cứ Hợp đồng số ${d.contractNo} giữa hai Bên.`, { italics: true })], { after: 120 }),
        p(`Hôm nay, ngày ...... tháng ...... năm ${year}, chúng tôi gồm:`),
        h(`BÊN A: ${COMPANY.name}`),
        info([["Địa chỉ", COMPANY.address], ["Mã số thuế", COMPANY.taxCode], ["Điện thoại", COMPANY.phone], ["Đại diện", `${COMPANY.rep} – ${COMPANY.repTitle}`]]),
        h(`BÊN B: ${d.partner.toUpperCase()}`),
        info([["Địa chỉ", d.partnerAddress || DOTS], ["Mã số thuế / CCCD", d.partnerTax || DOTS], ["Đại diện", d.partnerRep || DOTS], ["Điện thoại / Email", DOTS]]),
        p("Hai Bên thống nhất ký kết Thỏa thuận bảo mật thông tin với các điều khoản sau:", { after: 120 }),
        ...clauses.flatMap(([title, items]) => [h(title), ...items.map((x) => p(x))]),
        p("", { after: 200 }),
        sign,
      ],
    }],
  });
  return Packer.toBuffer(doc);
}
