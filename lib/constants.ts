import type { CompanyInfo } from "./types";

// Default seller for domestic invoices
export const KARIA_INDIA: CompanyInfo = {
  name: "Karia India LLP",
  address:
    "H and S-316, Sdb Dream City, Near Khajod Chowkdi\nNH - 53, Khajod Surat",
  gstin: "24ABFFK7991L1ZO",
  stateCode: "24",
  stateName: "Gujarat",
  mobile: "9925503052",
  email: "info@kariatech.com",
  pan: "ABFFK7991L",
  bankName: "ICICI Bank Katargam Branch",
  accountNo: "183605005209",
  ifscCode: "ICIC0001836",
  branchName: "Katargam",
};

// Default exporter for export invoices
export const BRILLIANT_LABGROWN: CompanyInfo = {
  name: "Brilliant Labgrown Private Limited",
  address:
    "45, Savani Society, Kohinoor Road, Varachha,\nSurat Gujarat, India 395007",
  gstin: "24AANCB1279N1Z8",
  stateCode: "24",
  stateName: "Gujarat",
  mobile: "+91-8000496750",
  email: "accounts@brilliantlgd.com",
  iecNo: "AANCB1279N",
  bankName: "ICICI Bank",
  accountNo: "005205013314",
  ifscCode: "ICIC0000052",
  swiftCode: "ICICINBBCTS",
  adCode: "6390060",
  branchName:
    "HG1-HG2, Platinum Plaza, Opp VT Choksi Law College, Athwalines, Surat -395007, India",
};

// Default consignee for export invoices
export const KARIA_DIAMONDS_INC: CompanyInfo = {
  name: "Karia Diamonds Inc",
  address:
    "91 Willard Grant Road, Sudbury,\nMassachusetts 01776, USA",
  mobile: "+1 (617) 586 9993",
  email: "dhrumil@kariadiamonds.com",
};

export const GST_RATES = {
  rough: { cgst: 0.125, sgst: 0.125, igst: 0.25 },
  polished: { cgst: 0.75, sgst: 0.75, igst: 1.5 },
};

export const HSN_CODES = [
  { code: "71049110", description: "Rough Diamond / Lab Grown Diamond" },
  { code: "71023100", description: "Non-industrial diamonds, unworked" },
  { code: "71042010", description: "Piezo-electric quartz" },
];

// Default legal declarations block printed on export invoices; editable per invoice.
export const DEFAULT_EXPORT_DECLARATIONS = `We intend to claim benefit under RoDTEP scheme as applicable:
The diamonds herein invoiced have been purchased from legitimate sources not involved in funding conflict and in compliance with United Nations resolutions.

The seller hereby guarantees that these diamonds are conflict free, based on personal knowledge and/or written guarantees provided by the supplier of these diamonds.

Declaration: We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct. To the best of our knowledge and/or written
assurance from our supplier, we state that "Diamonds herein invoiced not obtained in violation of applicable national laws and/or sanctions by the US Department of treasury office of
Foreign Assets Control (OFAC)."
"Not subject to restrictions of Reg.EU 833/2014"`;
