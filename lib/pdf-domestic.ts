import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { DomesticInvoiceData } from "./types";
import { numberToWords, formatDate, roundOff } from "./utils";

async function generateQrDataUrl(text: string): Promise<string> {
  const QRCode = (await import("qrcode")).default;
  return QRCode.toDataURL(text, { width: 200, margin: 1 });
}

export async function generateDomesticPdf(data: DomesticInvoiceData): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const drawLine = (y1: number) => {
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.line(margin, y1, pageWidth - margin, y1);
  };

  const drawRect = (x: number, y1: number, w: number, h: number) => {
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.rect(x, y1, w, h);
  };

  // ─── QR Code ───
  const subtotalForQr = data.items.reduce((sum, item) => sum + item.amount, 0);
  const qrData = JSON.stringify({
    seller: data.seller.name,
    gstin: data.seller.gstin,
    invoiceNo: data.invoiceNo,
    date: data.date,
    buyer: data.buyer.name,
    buyerGstin: data.buyer.gstin,
    totalAmount: subtotalForQr,
    items: data.items.length,
  });
  const qrDataUrl = await generateQrDataUrl(qrData);

  // ─── Title + QR row ───
  const qrSize = 22;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Tax Invoice", pageWidth / 2, y + 6, { align: "center" });

  // e-Invoice label + QR code (top right, within title row)
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("e-Invoice", pageWidth - margin - qrSize / 2, y + 2, { align: "center" });
  doc.addImage(qrDataUrl, "PNG", pageWidth - margin - qrSize - 1, y + 3, qrSize, qrSize);

  y += qrSize + 5;
  drawLine(y);

  // ─── Seller & Invoice Details Header ───
  const headerTop = y;
  const leftColWidth = contentWidth * 0.55;
  const rightColWidth = contentWidth * 0.45;

  // Seller details (left)
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(data.seller.name, margin + 2, y + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  const sellerLines = data.seller.address.split("\n");
  let sy = y + 9;
  sellerLines.forEach((line) => {
    doc.text(line, margin + 2, sy);
    sy += 3.5;
  });
  doc.text(`GSTIN/UIN : ${data.seller.gstin || ""}`, margin + 2, sy);
  sy += 3.5;
  doc.text(
    `State Name : ${data.seller.stateName}, Code : ${data.seller.stateCode}`,
    margin + 2,
    sy
  );
  sy += 3.5;
  doc.text(`Mobile no: ${data.seller.mobile || ""}`, margin + 2, sy);
  sy += 3.5;
  doc.text(`E-Mail : ${data.seller.email || ""}`, margin + 2, sy);

  // Right side - invoice details
  const rx = margin + leftColWidth;
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");

  const fields = [
    ["Invoice No.", data.invoiceNo],
    ["Dated", formatDate(data.date)],
    ["Delivery Note", data.deliveryNote || ""],
    ["Mode/Terms of Payment", data.paymentTerms],
    ["Reference No. & Date.", data.referenceNo || ""],
    ["Other References", ""],
    ["Buyer's Order No.", data.buyerOrderNo || ""],
    ["Dated", ""],
  ];

  let ry = headerTop + 4;
  fields.forEach(([label, value]) => {
    doc.setFont("helvetica", "normal");
    doc.text(label, rx + 2, ry);
    doc.setFont("helvetica", "bold");
    doc.text(value, rx + 42, ry);
    ry += 4;
  });

  y = Math.max(sy + 3, ry + 1);
  drawLine(y);

  // Vertical line between seller and invoice details
  doc.line(rx, headerTop, rx, y);

  // ─── Consignee (Ship to) ───
  const consigneeTop = y;
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.text("Consignee (Ship to)", margin + 2, y + 4);
  doc.setFont("helvetica", "normal");
  const buyer = data.consignee || data.buyer;
  doc.setFont("helvetica", "bold");
  doc.text(buyer.name, margin + 2, y + 8);
  doc.setFont("helvetica", "normal");
  const buyerLines = buyer.address.split("\n");
  let by = y + 12;
  buyerLines.forEach((line) => {
    doc.text(line, margin + 2, by);
    by += 3.5;
  });
  doc.text(`GSTIN/UIN : ${buyer.gstin || ""}`, margin + 2, by);
  by += 3.5;
  doc.text(
    `State Name : ${buyer.stateName}, Code : ${buyer.stateCode}`,
    margin + 2,
    by
  );

  // Right side dispatch details
  const dispatchFields = [
    ["Dispatch Doc No.", data.dispatchDocNo || data.invoiceNo],
    ["Delivery Note Date", ""],
    ["Dispatched through", data.dispatchedThrough],
    ["Destination", data.destination],
    ["Terms of Delivery", ""],
  ];

  ry = consigneeTop + 4;
  dispatchFields.forEach(([label, value]) => {
    doc.setFont("helvetica", "normal");
    doc.text(label, rx + 2, ry);
    doc.setFont("helvetica", "bold");
    doc.text(value, rx + 42, ry);
    ry += 4;
  });

  y = Math.max(by + 4, ry + 2);
  drawLine(y);
  doc.line(rx, consigneeTop, rx, y);

  // ─── Buyer (Bill to) ───
  const buyerTop = y;
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.text("Buyer (Bill to)", margin + 2, y + 4);
  doc.setFont("helvetica", "normal");
  doc.setFont("helvetica", "bold");
  doc.text(data.buyer.name, margin + 2, y + 8);
  doc.setFont("helvetica", "normal");
  const billLines = data.buyer.address.split("\n");
  let bly = y + 12;
  billLines.forEach((line) => {
    doc.text(line, margin + 2, bly);
    bly += 3.5;
  });
  doc.text(`GSTIN/UIN : ${data.buyer.gstin || ""}`, margin + 2, bly);
  bly += 3.5;
  doc.text(
    `State Name : ${data.buyer.stateName}, Code : ${data.buyer.stateCode}`,
    margin + 2,
    bly
  );

  y = bly + 5;
  drawLine(y);

  // ─── Items Table ───
  const subtotal = data.items.reduce((sum, item) => sum + item.amount, 0);
  const totalQty = data.items.reduce((sum, item) => sum + item.quantity, 0);

  const cgstAmount = +(subtotal * (data.cgstRate / 100)).toFixed(2);
  const sgstAmount = +(subtotal * (data.sgstRate / 100)).toFixed(2);
  const igstAmount = data.isInterState
    ? +(subtotal * (data.igstRate / 100)).toFixed(2)
    : 0;

  const taxTotal = data.isInterState
    ? igstAmount
    : cgstAmount + sgstAmount;
  const preRound = subtotal + taxTotal;
  const { rounded: grandTotal, roundOffValue } = roundOff(preRound);

  const tableBody = data.items.map((item) => [
    item.slNo.toString(),
    item.description,
    item.hsnCode,
    `${item.quantity} ${item.unit}`,
    item.rate.toLocaleString("en-IN", { minimumFractionDigits: 2 }),
    item.unit,
    item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 }),
  ]);

  // Add empty rows to fill space
  while (tableBody.length < 8) {
    tableBody.push(["", "", "", "", "", "", ""]);
  }

  // Add tax rows
  if (data.isInterState) {
    tableBody.push(["", "", "", "", "IGST", "", igstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })]);
  } else {
    tableBody.push(["", "", "", "", "CGST", "", cgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })]);
    tableBody.push(["", "", "", "", "SGST", "", sgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })]);
  }

  if (roundOffValue !== 0) {
    const sign = roundOffValue > 0 ? "" : "(-)";
    tableBody.push([
      "",
      "Less :",
      "",
      "",
      "Round Off",
      "",
      `${sign}${Math.abs(roundOffValue).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
    ]);
  }

  autoTable(doc, {
    startY: y,
    head: [
      [
        "Sl\nNo.",
        "Description of Goods",
        "HSN/SAC",
        "Quantity",
        "Rate",
        "per",
        "Amount",
      ],
    ],
    body: tableBody,
    theme: "grid",
    styles: { fontSize: 7.5, cellPadding: 1.5, lineColor: [0, 0, 0], lineWidth: 0.3 },
    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: "bold", halign: "center" },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 55 },
      2: { cellWidth: 20, halign: "center" },
      3: { cellWidth: 20, halign: "center" },
      4: { cellWidth: 25, halign: "right" },
      5: { cellWidth: 15, halign: "center" },
      6: { cellWidth: contentWidth - 145, halign: "right" },
    },
    margin: { left: margin, right: margin },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY;

  // ─── Total Row ───
  drawRect(margin, y, contentWidth, 8);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Total", margin + 65, y + 5);
  doc.text(`${totalQty} ${data.items[0]?.unit || "Pcs"}`, margin + 100, y + 5, {
    align: "center",
  });
  doc.text(
    grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 }),
    pageWidth - margin - 3,
    y + 5,
    { align: "right" }
  );
  y += 8;

  // ─── Amount in Words ───
  drawRect(margin, y, contentWidth, 7);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.text("Amount Chargeable (in words)", margin + 2, y + 3);
  doc.text("E. & O.E", pageWidth - margin - 2, y + 3, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.text(numberToWords(grandTotal, "INR"), margin + 2, y + 6);
  y += 7;

  // ─── Tax Breakdown Table ───
  const taxTableData = data.items.reduce(
    (acc, item) => {
      const key = item.hsnCode;
      if (!acc[key]) {
        acc[key] = { hsn: key, taxableValue: 0 };
      }
      acc[key].taxableValue += item.amount;
      return acc;
    },
    {} as Record<string, { hsn: string; taxableValue: number }>
  );

  const taxRows = Object.values(taxTableData).map((row) => {
    const cgst = +(row.taxableValue * (data.cgstRate / 100)).toFixed(2);
    const sgst = +(row.taxableValue * (data.sgstRate / 100)).toFixed(2);
    const total = cgst + sgst;
    const fmt = (n: number) => n.toLocaleString("en-IN", { minimumFractionDigits: 2 });
    return [
      row.hsn,
      fmt(row.taxableValue),
      `${data.cgstRate}%`,
      fmt(cgst),
      `${data.sgstRate}%`,
      fmt(sgst),
      fmt(total),
    ];
  });

  const fmtIN = (n: number) => n.toLocaleString("en-IN", { minimumFractionDigits: 2 });
  const totalTaxRow = [
    "Total",
    fmtIN(subtotal),
    "",
    fmtIN(cgstAmount),
    "",
    fmtIN(sgstAmount),
    fmtIN(cgstAmount + sgstAmount),
  ];

  autoTable(doc, {
    startY: y,
    head: [
      [
        "HSN/SAC",
        "Taxable\nValue",
        { content: "CGST", colSpan: 2 },
        "",
        { content: "SGST/UTGST", colSpan: 2 },
        "",
        "Total\nTax Amount",
      ],
      ["", "", "Rate", "Amount", "Rate", "Amount", ""],
    ],
    body: [...taxRows, totalTaxRow],
    theme: "grid",
    styles: { fontSize: 7, cellPadding: 1.5, lineColor: [0, 0, 0], lineWidth: 0.3 },
    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: "bold", halign: "center" },
    columnStyles: {
      0: { halign: "left" },
      1: { halign: "right" },
      2: { halign: "center" },
      3: { halign: "right" },
      4: { halign: "center" },
      5: { halign: "right" },
      6: { halign: "right" },
    },
    margin: { left: margin, right: margin },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY;

  // ─── Tax in Words ───
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Tax Amount (in words) : ${numberToWords(taxTotal, "INR")}`,
    margin + 2,
    y + 4
  );
  y += 7;

  // ─── Bank Details & Declaration ───
  drawLine(y);
  const bankTop = y;

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.text(`Company's PAN`, margin + 2, y + 5);
  doc.setFont("helvetica", "bold");
  doc.text(`: ${data.seller.pan || ""}`, margin + 35, y + 5);

  doc.setFont("helvetica", "bold");
  doc.text("Company's Bank Details", margin + 90, y + 4);
  doc.setFont("helvetica", "normal");
  doc.text(`Bank Name`, margin + 90, y + 8);
  doc.text(`: ${data.seller.bankName || ""}`, margin + 115, y + 8);
  doc.text(`A/c No.`, margin + 90, y + 12);
  doc.setFont("helvetica", "bold");
  doc.text(`: ${data.seller.accountNo || ""}`, margin + 115, y + 12);
  doc.setFont("helvetica", "normal");
  doc.text(`Branch & IFS Code`, margin + 90, y + 16);
  doc.text(
    `: ${data.seller.branchName || ""} & ${data.seller.ifscCode || ""}`,
    margin + 115,
    y + 16
  );

  y = bankTop + 20;
  drawLine(y);

  // ─── Declaration ───
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("Declaration", margin + 2, y + 4);
  doc.setFont("helvetica", "normal");
  doc.text(
    "We declare that this invoice shows the actual price of",
    margin + 2,
    y + 8
  );
  doc.text(
    "the goods described and that all particulars are true and correct.",
    margin + 2,
    y + 12
  );

  doc.setFont("helvetica", "bold");
  doc.text(`for ${data.seller.name.toUpperCase()}`, pageWidth - margin - 2, y + 5, {
    align: "right",
  });
  doc.setFont("helvetica", "normal");
  doc.text("Authorised Signatory", pageWidth - margin - 2, y + 20, {
    align: "right",
  });

  y += 25;

  // ─── Footer ───
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.text(
    "This is a Computer Generated Invoice",
    pageWidth / 2,
    y + 3,
    { align: "center" }
  );

  return doc;
}
