import * as Print from 'expo-print';
import * as QRCode from 'qrcode';

export type PrintableLabel = {
  name: string;
  code: string;
  kind: 'ITEM' | 'RECIPIENTE';
  location?: string;
  container?: string;
};

function escapeHTML(value: string) {
  const replacements: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return value.replace(/[&<>"']/g, character => replacements[character] || character);
}

export async function printInventoryLabel(label: PrintableLabel) {
  const qrCode = await QRCode.toString(label.code, { type: 'svg', errorCorrectionLevel: 'M', margin: 1, width: 180 });
  const name = escapeHTML(label.name);
  const code = escapeHTML(label.code);
  const location = escapeHTML([label.location, label.container].filter(Boolean).join(' · ') || 'Sem local');
  const html = `<!doctype html><html lang="pt-BR"><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>
    @page { size: A4; margin: 12mm; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; font-family: Arial, sans-serif; color: #17221a; }
    .label { width: 84mm; min-height: 39mm; padding: 4mm; border: 1px dashed #727a73; display: flex; flex-direction: column; gap: 2mm; break-inside: avoid; }
    .brand { display: flex; align-items: center; gap: 2mm; color: #46644b; font-size: 9pt; font-weight: 700; }
    .mark { display: grid; place-items: center; width: 5mm; height: 5mm; border-radius: 1mm; background: #3f6b4d; color: white; }
    .kind { margin-left: auto; color: #778178; font-size: 7pt; letter-spacing: 1px; }
    .name { font-size: 11pt; font-weight: 700; }
    .location { color: #687268; font-size: 8pt; }
    .code-row { display: flex; align-items: center; justify-content: space-between; margin-top: auto; }
    .qr { width: 12mm; height: 12mm; }
    .code { font-family: monospace; font-size: 9pt; letter-spacing: 1px; }
  </style></head><body><article class="label"><div class="brand"><span class="mark">a.</span><span>achei</span><span class="kind">${label.kind}</span></div><strong class="name">${name}</strong><small class="location">${location}</small><div class="code-row"><span class="qr">${qrCode}</span><span class="code">${code}</span></div></article></body></html>`;
  await Print.printAsync({ html });
}
