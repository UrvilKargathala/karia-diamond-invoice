"use client";

import { useState, useEffect } from "react";
import { Save, Building2, Landmark, Hash } from "lucide-react";
import { useToast } from "@/components/toast";
import { SettingsSkeleton } from "@/components/skeleton";
import {
  KARIA_INDIA,
  KARIA_DIAMONDS_INC,
  GST_RATES,
  HSN_CODES,
} from "@/lib/constants";
import type { CompanyInfo } from "@/lib/types";

function CompanySection({
  title,
  icon: Icon,
  data,
  onChange,
  fields,
}: {
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  data: CompanyInfo;
  onChange: (d: CompanyInfo) => void;
  fields: { key: keyof CompanyInfo; label: string; wide?: boolean }[];
}) {
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <Icon size={18} className="text-blue-600" />
        <h2 className="font-semibold">{title}</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((f) => (
          <div key={f.key} className={f.wide ? "md:col-span-2" : ""}>
            <label className="form-label">{f.label}</label>
            {f.key === "address" ? (
              <textarea
                className="form-input"
                rows={2}
                value={data[f.key] || ""}
                onChange={(e) => onChange({ ...data, [f.key]: e.target.value })}
              />
            ) : (
              <input
                type="text"
                className="form-input"
                value={data[f.key] || ""}
                onChange={(e) => onChange({ ...data, [f.key]: e.target.value })}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [seller, setSeller] = useState<CompanyInfo>({ ...KARIA_INDIA });
  const [consignee, setConsignee] = useState<CompanyInfo>({ ...KARIA_DIAMONDS_INC });
  const [gst, setGst] = useState({ ...GST_RATES });
  const [hsn, setHsn] = useState([...HSN_CODES]);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(t);
  }, []);

  const handleSave = () => {
    toast("Settings are currently read-only defaults. Editable storage coming soon.", "info");
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Company details, bank info & tax defaults
          </p>
        </div>
        <button onClick={handleSave} className="btn btn-primary">
          <Save size={14} /> Save Changes
        </button>
      </div>

      {loading ? <SettingsSkeleton /> : (
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
        {/* Domestic Seller */}
        <CompanySection
          title="Domestic Seller (Karia India LLP)"
          icon={Building2}
          data={seller}
          onChange={setSeller}
          fields={[
            { key: "name", label: "Company Name" },
            { key: "gstin", label: "GSTIN" },
            { key: "address", label: "Address", wide: true },
            { key: "stateCode", label: "State Code" },
            { key: "stateName", label: "State Name" },
            { key: "pan", label: "PAN" },
            { key: "mobile", label: "Mobile" },
            { key: "email", label: "Email" },
            { key: "bankName", label: "Bank Name" },
            { key: "accountNo", label: "Account No." },
            { key: "ifscCode", label: "IFSC Code" },
            { key: "branchName", label: "Branch Name" },
          ]}
        />

        <div className="space-y-4">
        {/* Default Consignee */}
        <CompanySection
          title="Default Export Consignee"
          icon={Building2}
          data={consignee}
          onChange={setConsignee}
          fields={[
            { key: "name", label: "Company Name" },
            { key: "address", label: "Address", wide: true },
            { key: "mobile", label: "Contact No." },
            { key: "email", label: "Email" },
          ]}
        />

        {/* GST Rates */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Hash size={18} className="text-blue-600" />
            <h2 className="font-semibold">GST Tax Rates</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium mb-3">Rough Diamond</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="form-label">CGST %</label>
                  <input
                    type="number"
                    step="0.001"
                    className="form-input"
                    value={gst.rough.cgst}
                    onChange={(e) =>
                      setGst({ ...gst, rough: { ...gst.rough, cgst: +e.target.value } })
                    }
                  />
                </div>
                <div>
                  <label className="form-label">SGST %</label>
                  <input
                    type="number"
                    step="0.001"
                    className="form-input"
                    value={gst.rough.sgst}
                    onChange={(e) =>
                      setGst({ ...gst, rough: { ...gst.rough, sgst: +e.target.value } })
                    }
                  />
                </div>
                <div>
                  <label className="form-label">IGST %</label>
                  <input
                    type="number"
                    step="0.001"
                    className="form-input"
                    value={gst.rough.igst}
                    onChange={(e) =>
                      setGst({ ...gst, rough: { ...gst.rough, igst: +e.target.value } })
                    }
                  />
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-3">Polished Diamond</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="form-label">CGST %</label>
                  <input
                    type="number"
                    step="0.001"
                    className="form-input"
                    value={gst.polished.cgst}
                    onChange={(e) =>
                      setGst({ ...gst, polished: { ...gst.polished, cgst: +e.target.value } })
                    }
                  />
                </div>
                <div>
                  <label className="form-label">SGST %</label>
                  <input
                    type="number"
                    step="0.001"
                    className="form-input"
                    value={gst.polished.sgst}
                    onChange={(e) =>
                      setGst({ ...gst, polished: { ...gst.polished, sgst: +e.target.value } })
                    }
                  />
                </div>
                <div>
                  <label className="form-label">IGST %</label>
                  <input
                    type="number"
                    step="0.001"
                    className="form-input"
                    value={gst.polished.igst}
                    onChange={(e) =>
                      setGst({ ...gst, polished: { ...gst.polished, igst: +e.target.value } })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        </div>

        {/* HSN Codes */}
        <div className="card xl:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Landmark size={18} className="text-blue-600" />
            <h2 className="font-semibold">HSN Codes</h2>
          </div>
          <div className="space-y-3">
            {hsn.map((h, i) => (
              <div key={i} className="flex gap-3 items-center">
                <input
                  type="text"
                  className="form-input w-32"
                  value={h.code}
                  onChange={(e) => {
                    const updated = [...hsn];
                    updated[i] = { ...h, code: e.target.value };
                    setHsn(updated);
                  }}
                />
                <input
                  type="text"
                  className="form-input flex-1"
                  value={h.description}
                  onChange={(e) => {
                    const updated = [...hsn];
                    updated[i] = { ...h, description: e.target.value };
                    setHsn(updated);
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
