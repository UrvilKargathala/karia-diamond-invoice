import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { ExportInvoiceData } from "./types";
import { numberToWords, formatDate } from "./utils";

export function generateExportPdf(data: ExportInvoiceData): jsPDF {
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

  // ─── Title ───
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("TAX INVOICE", pageWidth / 2, y + 6, { align: "center" });
  y += 8;
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.text(
    "SUPPLY MENT FOR EXPORT UNDER BOND OR LETTER OF UNDERTAKING WITHOUT PAYMENT OF INTEGRATED TAX",
    pageWidth / 2,
    y + 3,
    { align: "center" }
  );
  y += 5;
  drawLine(y);

  // ─── Exporter & Invoice Details ───
  const headerTop = y;
  const leftCol = contentWidth * 0.5;
  const rx = margin + leftCol;

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.text("Exporter", margin + 2, y + 4);
  doc.setFont("helvetica", "normal");
  doc.setFont("helvetica", "bold");
  doc.text(data.exporter.name, margin + 2, y + 8);
  doc.setFont("helvetica", "normal");
  const expLines = data.exporter.address.split("\n");
  let ey = y + 12;
  expLines.forEach((line) => {
    doc.text(line, margin + 2, ey);
    ey += 3.5;
  });
  if (data.exporter.mobile) {
    doc.text(`Mobile no: ${data.exporter.mobile}`, margin + 2, ey);
    ey += 3.5;
  }
  if (data.exporter.email) {
    doc.text(`Email: ${data.exporter.email}`, margin + 2, ey);
    ey += 3.5;
  }

  // Right side
  doc.setFont("helvetica", "normal");
  doc.text("Invoice No. & Date", rx + 2, headerTop + 4);
  doc.setFont("helvetica", "bold");
  doc.text(
    `${data.invoiceNo} DT. ${formatDate(data.date)}`,
    rx + 2,
    headerTop + 8
  );
  doc.setFont("helvetica", "normal");
  doc.text("Exporter's Ref.", rx + contentWidth * 0.3, headerTop + 4);
  doc.setFont("helvetica", "bold");
  doc.text(
    `I.E.C. NO. ${data.exporter.iecNo || ""}`,
    rx + contentWidth * 0.3,
    headerTop + 8
  );

  doc.setFont("helvetica", "normal");
  doc.text("Buyers (if other than consignee)", rx + 2, headerTop + 14);
  doc.text("M/S.", rx + 2, headerTop + 18);
  doc.text(data.buyerOtherThanConsignee || "NA", rx + contentWidth * 0.15, headerTop + 18);

  y = Math.max(ey + 2, headerTop + 22);
  drawLine(y);
  doc.line(rx, headerTop, rx, y);

  // ─── Consignee ───
  const consTop = y;
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.text("Consignee", margin + 2, y + 4);
  doc.setFont("helvetica", "normal");
  doc.setFont("helvetica", "bold");
  doc.text(data.consignee.name, margin + 2, y + 8);
  doc.setFont("helvetica", "normal");
  const consLines = data.consignee.address.split("\n");
  let cy = y + 12;
  consLines.forEach((line) => {
    doc.text(line, margin + 2, cy);
    cy += 3.5;
  });
  if (data.consignee.mobile) {
    doc.text(`Contact no.: ${data.consignee.mobile}`, margin + 2, cy);
    cy += 3.5;
  }
  if (data.consignee.email) {
    doc.text(`Email: ${data.consignee.email}`, margin + 2, cy);
    cy += 3.5;
  }

  y = cy + 2;
  drawLine(y);

  // ─── Shipping Details ───
  const shipTop = y;
  const ship = data.shipping;
  const midX = margin + contentWidth * 0.4;

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("DIRECT PARCEL", margin + 30, y + 4);

  const leftFields = [
    ["Pre-Carriage By", ship.preCarriageBy],
    ["Vessels/Flight No.", ship.vesselFlightNo],
    ["Port of Loading", ship.portOfLoading],
    ["Port of Discharge", ship.portOfDischarge],
  ];

  const rightFields = [
    ["Place Of Receipt By Pre-Carriage", ship.placeOfReceipt],
    ["", ""],
    ["", ""],
    ["Final Destination", ship.finalDestination],
  ];

  let sly = shipTop + 8;
  leftFields.forEach(([label, value], i) => {
    doc.setFont("helvetica", "normal");
    doc.text(label, margin + 5, sly);
    doc.setFont("helvetica", "bold");
    doc.text(value, margin + 40, sly);
    if (rightFields[i][0]) {
      doc.setFont("helvetica", "normal");
      doc.text(rightFields[i][0], midX + 2, sly);
      doc.setFont("helvetica", "bold");
      doc.text(rightFields[i][1], midX + 45, sly);
    }
    sly += 4;
  });

  // Marks and Nos
  sly += 2;
  doc.setFont("helvetica", "normal");
  doc.text("Marks & Nos.", margin + 5, sly);
  doc.setFont("helvetica", "bold");
  doc.text(ship.marksAndNos || "", margin + 40, sly);
  sly += 4;

  // Country of origin and destination
  doc.setFont("helvetica", "normal");
  doc.text("Country Of Origin Of Goods", margin + 2, sly);
  doc.setFont("helvetica", "bold");
  doc.text(ship.countryOfOrigin, margin + 50, sly);
  doc.setFont("helvetica", "normal");
  doc.text("Country Of Final Destination", midX + 2, sly);
  doc.setFont("helvetica", "bold");
  doc.text(ship.countryOfFinalDestination, midX + 45, sly);
  sly += 4;

  // Payment terms
  doc.setFont("helvetica", "normal");
  doc.text("Terms of Delivery and Payment :", margin + 2, sly);
  doc.setFont("helvetica", "bold");
  doc.text(data.paymentTerms, margin + 55, sly);
  sly += 4;

  // Bank details
  doc.setFont("helvetica", "normal");
  doc.text(`A/c Name: ${data.exporter.name}`, margin + 2, sly);
  sly += 3.5;
  doc.text(`AD Code: ${data.exporter.adCode || ""}`, margin + 2, sly);
  sly += 3.5;
  doc.text(`Our Banker : ${data.exporter.bankName || ""}`, margin + 2, sly);
  sly += 3.5;
  const bankAddr = data.exporter.branchName || "";
  doc.text(bankAddr, margin + 2, sly);
  sly += 3.5;
  doc.text(
    `A/C NO.: ${data.exporter.accountNo || ""}    Swift : ${data.exporter.swiftCode || ""}    IFSC : ${data.exporter.ifscCode || ""}`,
    margin + 2,
    sly
  );
  sly += 4;

  // No & kind of pkgs
  doc.text("No. & kind of Pkgs.", margin + 2, sly);
  doc.setFont("helvetica", "bold");
  doc.text(ship.noAndKindOfPkgs, margin + 35, sly);

  y = sly + 4;
  drawLine(y);

  // ─── Items Table ───
  const itemsBody = data.items.map((item, i) => [
    (i + 1).toString(),
    `TYPE / SHAPE / COLOUR & CLARITY\n${item.typeShapeColourClarity}`,
    item.hsnCode,
    item.carats.toLocaleString("en-US", { minimumFractionDigits: 2 }),
    item.ratePerCarat.toLocaleString("en-US", { minimumFractionDigits: 2 }),
    item.amount.toLocaleString("en-US", { minimumFractionDigits: 2 }),
  ]);

  const goodsTotal = data.items.reduce((s, i) => s + i.amount, 0);
  const totalCarats = data.items.reduce((s, i) => s + i.carats, 0);

  autoTable(doc, {
    startY: y,
    head: [
      [
        "Sr No.",
        "Description of Goods\nH.S. CODE:- 71049110",
        "",
        "Cts",
        "Rate\nUS$",
        "Amount\nUS$",
      ],
    ],
    body: itemsBody,
    theme: "grid",
    styles: {
      fontSize: 7,
      cellPadding: 1.5,
      lineColor: [0, 0, 0],
      lineWidth: 0.3,
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      halign: "center",
    },
    columnStyles: {
      0: { cellWidth: 12, halign: "center" },
      1: { cellWidth: 75 },
      2: { cellWidth: 0 },
      3: { cellWidth: 20, halign: "right" },
      4: { cellWidth: 25, halign: "right" },
      5: { cellWidth: contentWidth - 132, halign: "right" },
    },
    margin: { left: margin, right: margin },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY;

  // ─── Shipping Charges & CIF ───
  const summaryData = [
    ["", "", "", "", "SHIPPING CHARGES", data.shippingCharges.toLocaleString("en-US", { minimumFractionDigits: 2 })],
    [
      "",
      "",
      "",
      "",
      "CIF US$",
      (goodsTotal + data.shippingCharges).toLocaleString("en-US", { minimumFractionDigits: 2 }),
    ],
  ];

  autoTable(doc, {
    startY: y,
    body: summaryData,
    theme: "grid",
    styles: {
      fontSize: 7.5,
      cellPadding: 1.5,
      lineColor: [0, 0, 0],
      lineWidth: 0.3,
      fontStyle: "bold",
    },
    columnStyles: {
      4: { halign: "right" },
      5: { halign: "right" },
    },
    margin: { left: margin, right: margin },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY;

  // ─── Amount in Words ───
  const cifTotal = goodsTotal + data.shippingCharges;
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.text(
    `Amount Chargeable (in words) : ${numberToWords(cifTotal, "USD").toUpperCase()}.`,
    margin + 2,
    y + 5
  );
  doc.text("TOTAL CIF US DOLLARS.", margin + 2, y + 9);
  y += 12;

  // ─── Declarations ───
  drawLine(y);
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");

  const declarations = [
    "We intend to claim benefit under RoDTEP scheme as applicable:",
    "The diamonds herein invoiced have been purchased from legitimate sources not involved in funding conflict and in compliance with United Nations resolutions.",
    "",
    "The seller hereby guarantees that these diamonds are conflict free, based on personal knowledge and /or written guarantees provided by the supplier of these diamonds.",
    "",
    "Declaration:We declare that this invoice shows the actul price of the goods described and that all partculars are ture and correct. To the best of our knowledge and/or written",
    "assurance from our supplier, we state that \"Diamonds herein invoiced not obtained in violation of applicable national laws and/or sanctions by the US Department of treasury office of",
    "Foreign Assets Control(OFAC).",
    '"Not subject to restrictions of Reg.EU 833/2014"',
  ];

  let dy = y + 4;
  declarations.forEach((line) => {
    doc.text(line, margin + 2, dy);
    dy += 3.2;
  });

  dy += 2;
  doc.setFont("helvetica", "bold");
  doc.text("SUPPLMENT FOR EXPORT UNDER BOND OR LUT WITHOUT PAYMENT OF IGST", margin + 2, dy);
  dy += 3.5;
  doc.setFont("helvetica", "normal");
  doc.text(
    `LUT/ARN NO.${data.lutArnNo || ""} DT:${data.lutArnDate || ""}`,
    margin + 2,
    dy
  );

  // Signature
  doc.setFont("helvetica", "bold");
  doc.text(`Signature & Date ${formatDate(data.date)}`, pageWidth - margin - 40, dy);

  dy += 6;
  doc.setFont("helvetica", "normal");
  doc.text("Declaration:", margin + 2, dy);
  dy += 3.5;
  doc.text(
    "We declare that this invoice shows the actual price of the goods",
    margin + 2,
    dy
  );
  dy += 3.5;
  doc.text("described and that all particulars are true and correct", margin + 2, dy);

  // ─── Page 2: Packing List ───
  if (data.packingList.length > 0) {
    doc.addPage();
    y = margin;

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("PACKING LIST", pageWidth / 2, y + 6, { align: "center" });
    y += 10;

    // Invoice No and Date
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`INVOICE NO: ${data.invoiceNo}`, margin + 2, y + 4);
    doc.text(`DATE: ${formatDate(data.date)}`, pageWidth - margin - 2, y + 4, {
      align: "right",
    });
    y += 6;

    // Exporter and Consignee
    drawLine(y);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.text("EXPORTER", margin + 5, y + 4);
    doc.text("CONSINGEE", pageWidth / 2 + 5, y + 4);

    doc.setFont("helvetica", "normal");
    doc.text(data.exporter.name, margin + 5, y + 8);
    const expAddrLines = data.exporter.address.split("\n");
    let pey = y + 12;
    expAddrLines.forEach((l) => {
      doc.text(l, margin + 5, pey);
      pey += 3.5;
    });

    doc.text(data.consignee.name, pageWidth / 2 + 5, y + 8);
    const consAddrLines = data.consignee.address.split("\n");
    let pcy = y + 12;
    consAddrLines.forEach((l) => {
      doc.text(l, pageWidth / 2 + 5, pcy);
      pcy += 3.5;
    });
    if (data.consignee.mobile) {
      doc.text(`Contact no.: ${data.consignee.mobile}`, pageWidth / 2 + 5, pcy);
      pcy += 3.5;
    }
    if (data.consignee.email) {
      doc.text(`Email: ${data.consignee.email}`, pageWidth / 2 + 5, pcy);
    }

    y = Math.max(pey, pcy) + 4;
    drawLine(y);

    // Packing list table
    const plBody = data.packingList.map((item) => [
      item.no.toString(),
      item.shape,
      item.stoneId,
      item.type,
      item.desc,
      item.size,
      item.pcs.toString(),
      item.weight.toLocaleString("en-US", { minimumFractionDigits: 2 }),
      item.pricePerCt.toLocaleString("en-US", { minimumFractionDigits: 2 }),
      item.amount.toLocaleString("en-US", { minimumFractionDigits: 2 }),
    ]);

    // Total row
    const plTotalWeight = data.packingList.reduce((s, i) => s + i.weight, 0);
    const plTotalAmount = data.packingList.reduce((s, i) => s + i.amount, 0);
    const plTotalPcs = data.packingList.reduce((s, i) => s + i.pcs, 0);

    plBody.push([
      "",
      "",
      "",
      "",
      "TOTAL",
      "",
      plTotalPcs.toString(),
      plTotalWeight.toLocaleString("en-US", { minimumFractionDigits: 2 }),
      "",
      plTotalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 }),
    ]);

    autoTable(doc, {
      startY: y,
      head: [
        [
          "No.",
          "Shape",
          "Stone ID",
          "Type",
          "Desc",
          "SIZE",
          "Pcs",
          "Weight",
          "Price/Ct",
          "Amount",
        ],
      ],
      body: plBody,
      theme: "grid",
      styles: {
        fontSize: 6.5,
        cellPadding: 1,
        lineColor: [0, 0, 0],
        lineWidth: 0.3,
      },
      headStyles: {
        fillColor: [220, 220, 220],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        halign: "center",
      },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: 20, halign: "center" },
        2: { cellWidth: 18 },
        3: { cellWidth: 14, halign: "center" },
        4: { cellWidth: 22, halign: "center" },
        5: { cellWidth: 25, halign: "center" },
        6: { cellWidth: 12, halign: "center" },
        7: { cellWidth: 18, halign: "right" },
        8: { cellWidth: 20, halign: "right" },
        9: { halign: "right" },
      },
      margin: { left: margin, right: margin },
    });
  }

  return doc;
}
