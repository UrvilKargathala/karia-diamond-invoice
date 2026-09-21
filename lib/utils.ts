export function formatCurrency(amount: number, currency: "INR" | "USD" = "INR"): string {
  if (currency === "USD") {
    return `US$ ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `₹ ${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function numberToWords(num: number, currency: "INR" | "USD" = "INR"): string {
  if (num === 0) return currency === "INR" ? "INR Zero Only" : "Zero US Dollars Only";

  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function convertLessThanThousand(n: number): string {
    if (n === 0) return "";
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + convertLessThanThousand(n % 100) : "");
  }

  const wholePart = Math.floor(num);
  const decimalPart = Math.round((num - wholePart) * 100);

  // Indian numbering system for INR
  let words = "";
  if (currency === "INR") {
    const crore = Math.floor(wholePart / 10000000);
    const lakh = Math.floor((wholePart % 10000000) / 100000);
    const thousand = Math.floor((wholePart % 100000) / 1000);
    const remainder = wholePart % 1000;

    if (crore) words += convertLessThanThousand(crore) + " Crore ";
    if (lakh) words += convertLessThanThousand(lakh) + " Lakh ";
    if (thousand) words += convertLessThanThousand(thousand) + " Thousand ";
    if (remainder) words += convertLessThanThousand(remainder);

    words = words.trim();
    if (decimalPart > 0) {
      words += " and " + convertLessThanThousand(decimalPart) + " paise";
    }
    return `INR ${words} Only`;
  } else {
    const million = Math.floor(wholePart / 1000000);
    const thousand = Math.floor((wholePart % 1000000) / 1000);
    const remainder = wholePart % 1000;

    if (million) words += convertLessThanThousand(million) + " Million ";
    if (thousand) words += convertLessThanThousand(thousand) + " Thousand ";
    if (remainder) words += convertLessThanThousand(remainder);

    words = words.trim();
    if (decimalPart > 0) {
      words += " and " + convertLessThanThousand(decimalPart) + " Cents";
    }
    return words + " US Dollars Only";
  }
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" });
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function roundOff(amount: number): { rounded: number; roundOffValue: number } {
  const rounded = Math.round(amount);
  const roundOffValue = +(rounded - amount).toFixed(2);
  return { rounded, roundOffValue };
}
