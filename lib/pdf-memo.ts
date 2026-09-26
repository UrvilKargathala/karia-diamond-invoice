import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { LOGO_DATA_URL } from "./logo";
import type { ConsignmentMemo } from "./types";
import { KARIA_INDIA, BRILLIANT_LABGROWN } from "./constants";
import { formatDate } from "./utils";

export function generateMemoPdf(memo: ConsignmentMemo): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const w = doc.internal.pageSize.getWidth();
  const m = 10;
  const seller = memo.type === "export" ? BRILLIANT_LABGROWN : KARIA_INDIA;
  const cur = memo.type === "domestic" ? "INR" : memo.currency;

  doc.addImage(LOGO_DATA_URL, "JPEG", m + 1, m + 0.5, 12, 12);
  doc.setFont("helvetica", "bold").setFontSize(14);
  doc.text("CONSIGNMENT MEMO", w / 2, m + 6, { align: "center" });
  doc.setFontSize(7).setFont("helvetica", "normal");
  doc.text("Goods sent on approval - not a sale", w / 2, m + 10, { align: "center" });
  doc.rect(m, m + 13, w - m * 2, 0.01);

  let y = m + 19;
  const block = (title: string, name: string, addr: string, x: number, extra?: string) => {
    doc.setFontSize(8).setFont("helvetica", "bold").text(title, x, y);
    doc.text(name, x, y + 4);
    doc.setFont("helvetica", "normal");
    let ly = y + 8;
    [...addr.split("\n"), ...(extra ? [extra] : [])].forEach((l) => {
      doc.text(l, x, ly);
      ly += 3.5;
    });
  };
  block("From", seller.name, seller.address, m, seller.gstin && `GSTIN: ${seller.gstin}`);
  block("To", memo.buyer.name, memo.buyer.address, w / 2 + 5, memo.buyer.gstin && `GSTIN: ${memo.buyer.gstin}`);
  doc.setFont("helvetica", "bold");
  doc.text(`Memo No: ${memo.memoNo}`, w - m, m + 19, { align: "right" });
  doc.text(`Date: ${formatDate(memo.date)}`, w - m, m + 23, { align: "right" });

  autoTable(doc, {
    startY: y + 28,
    margin: { left: m, right: m },
    theme: "grid",
    styles: { fontSize: 8, textColor: 0, lineColor: 0, lineWidth: 0.2 },
    headStyles: { fillColor: [255, 255, 255], textColor: 0, fontStyle: "bold" },
    head: [["#", "Description", "HSN", "Qty", "Rate", "Amount"]],
    body: memo.items.map((i) => [
      i.slNo,
      i.description,
      i.hsnCode,
      `${i.quantity} ${i.unit}`,
      i.rate.toLocaleString(),
      i.amount.toLocaleString(),
    ]),
    foot: [["", "", "", "", "Total", `${cur} ${memo.totalAmount.toLocaleString()}`]],
    footStyles: { fillColor: [255, 255, 255], textColor: 0, fontStyle: "bold" },
    columnStyles: { 3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right" } },
  });

  const fy = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  doc.setFontSize(7).setFont("helvetica", "normal");
  doc.text("Goods remain the property of the consignor until sold. To be returned if not approved.", m, fy);
  doc.text("Buyer's Signature", m, fy + 25);
  doc.text(`For ${seller.name}`, w - m, fy + 25, { align: "right" });
  return doc;
}
