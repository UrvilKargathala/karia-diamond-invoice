"use client";

import { useRef } from "react";
import { ImagePlus, X } from "lucide-react";
import { LOGO_DATA_URL } from "@/lib/logo";

const MAX = 400; // px; keeps the stored invoice small

async function toDataUrl(file: File): Promise<string> {
  const src = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error("bad image"));
      i.src = src;
    });
    const k = Math.min(1, MAX / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * k);
    c.height = Math.round(img.height * k);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(src);
  }
}

export function LogoField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="sm:col-span-2 lg:col-span-3">
      <label className="form-label">Invoice Logo</label>
      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={value || LOGO_DATA_URL} alt="Logo" className="w-16 h-16 object-contain rounded-lg border bg-white" />
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn btn-outline text-xs" onClick={() => input.current?.click()}>
            <ImagePlus size={14} /> {value ? "Change logo" : "Upload logo"}
          </button>
          {value && (
            <button type="button" className="btn btn-outline text-xs" onClick={() => onChange("")}>
              <X size={14} /> Use default
            </button>
          )}
          <span className="text-xs text-gray-400">{value ? "Custom logo" : "Default Karia logo"} · PNG or JPG</span>
        </div>
        <input
          ref={input}
          type="file"
          accept="image/png,image/jpeg"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) onChange(await toDataUrl(f).catch(() => ""));
          }}
        />
      </div>
    </div>
  );
}
