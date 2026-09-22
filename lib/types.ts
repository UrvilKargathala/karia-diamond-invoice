// ─── Shared types for Karia Diamond Invoice Generator ───

export type InvoiceType = "domestic" | "export";

export interface CompanyInfo {
  name: string;
  address: string;
  gstin?: string;
  stateCode?: string;
  stateName?: string;
  mobile?: string;
  email?: string;
  pan?: string;
  iecNo?: string;
  bankName?: string;
  accountNo?: string;
  ifscCode?: string;
  branchName?: string;
  swiftCode?: string;
  adCode?: string;
}

// ─── Domestic Invoice ───

export interface DomesticLineItem {
  slNo: number;
  description: string;
  hsnCode: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
}

export interface DomesticInvoiceData {
  invoiceNo: string;
  date: string;
  deliveryNote?: string;
  paymentTerms: string;
  referenceNo?: string;
  buyerOrderNo?: string;
  dispatchDocNo?: string;
  dispatchedThrough: string;
  destination: string;
  seller: CompanyInfo;
  buyer: CompanyInfo;
  consignee?: CompanyInfo;
  items: DomesticLineItem[];
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  isInterState: boolean;
}

// ─── Export Invoice ───

export interface ExportLineItem {
  slNo: number;
  typeShapeColourClarity: string;
  hsnCode: string;
  carats: number;
  ratePerCarat: number;
  amount: number;
}

export interface PackingListItem {
  no: number;
  shape: string;
  stoneId: string;
  type: string;
  desc: string;
  size: string;
  pcs: number;
  weight: number;
  pricePerCt: number;
  amount: number;
}

export interface ShippingDetails {
  preCarriageBy: string;
  placeOfReceipt: string;
  vesselFlightNo: string;
  portOfLoading: string;
  portOfDischarge: string;
  finalDestination: string;
  countryOfOrigin: string;
  countryOfFinalDestination: string;
  marksAndNos: string;
  noAndKindOfPkgs: string;
}

export interface ExportInvoiceData {
  invoiceNo: string;
  date: string;
  exporterRef: string;
  exporter: CompanyInfo;
  consignee: CompanyInfo;
  buyerOtherThanConsignee?: string;
  shipping: ShippingDetails;
  paymentTerms: string;
  items: ExportLineItem[];
  packingList: PackingListItem[];
  shippingCharges: number;
  cvdCode?: string;
  lutArnNo?: string;
  lutArnDate?: string;
  currency?: string;
}

// ─── Stored Invoice ───

interface StoredInvoiceBase {
  id: string;
  invoiceNo: string;
  date: string;
  buyerName: string;
  totalAmount: number;
  currency: string;
  createdAt: string;
}

// Discriminated on `type` so checking it narrows `data`
export type StoredInvoice =
  | (StoredInvoiceBase & { type: "domestic"; data: DomesticInvoiceData })
  | (StoredInvoiceBase & { type: "export"; data: ExportInvoiceData });
