import ExcelJS from "exceljs";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { CurrencyTotals, Transaction } from "./db";
import { formatCurrency, roleLabel } from "./utils";

interface ExportStats {
  usd: CurrencyTotals;
  fc: CurrencyTotals;
  transactionCount: number;
}

const HEADER_COLOR = "1E3A5F";
const HEADER_FONT = { bold: true, color: { argb: "FFFFFFFF" } };

function formatDateExport(dateStr: string): string {
  const date = new Date(dateStr + (dateStr.includes("T") ? "" : "T00:00:00"));
  return new Intl.DateTimeFormat("fr-FR").format(date);
}

function txTypeLabel(type: string): string {
  return type === "entree" ? "Entrée" : "Sortie";
}

function styleHeaderRow(row: ExcelJS.Row, colCount: number) {
  for (let i = 1; i <= colCount; i++) {
    const cell = row.getCell(i);
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF" + HEADER_COLOR },
    };
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    };
  }
  row.height = 22;
}

export async function generateExcelBuffer(
  stats: ExportStats,
  transactions: Transaction[]
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Rapport", {
    views: [{ showGridLines: true }],
  });

  ws.columns = [
    { width: 14 },
    { width: 12 },
    { width: 18 },
    { width: 36 },
    { width: 24 },
    { width: 28 },
  ];

  const generatedAt = new Intl.DateTimeFormat("fr-FR").format(new Date());

  ws.mergeCells("A1:F1");
  const titleCell = ws.getCell("A1");
  titleCell.value = "Judo Caisse — Rapport financier";
  titleCell.font = { bold: true, size: 16 };
  titleCell.alignment = { horizontal: "left" };

  ws.mergeCells("A2:F2");
  const dateCell = ws.getCell("A2");
  dateCell.value = `Généré le ${generatedAt}`;
  dateCell.font = { size: 10, color: { argb: "FF646464" } };

  ws.getCell("A4").value = "Résumé";
  ws.getCell("A4").font = { bold: true, size: 12 };

  const summaryHeader = ws.addRow(["Indicateur", "USD ($)", "FC"]);
  styleHeaderRow(summaryHeader, 3);

  ws.addRow([
    "Solde actuel",
    formatCurrency(stats.usd.solde, "USD"),
    formatCurrency(stats.fc.solde, "FC"),
  ]);
  ws.addRow([
    "Total entrées",
    formatCurrency(stats.usd.entrees, "USD"),
    formatCurrency(stats.fc.entrees, "FC"),
  ]);
  ws.addRow([
    "Total sorties",
    formatCurrency(stats.usd.sorties, "USD"),
    formatCurrency(stats.fc.sorties, "FC"),
  ]);
  ws.addRow(["Opérations", stats.transactionCount, ""]);

  ws.addRow([]);

  const txTitleRow = ws.rowCount + 1;
  ws.getCell(`A${txTitleRow}`).value = "Historique des opérations";
  ws.getCell(`A${txTitleRow}`).font = { bold: true, size: 12 };

  ws.addRow([]);

  const txHeader = ws.addRow([
    "Date",
    "Type",
    "Montant",
    "Description",
    "Catégorie",
    "Saisi par",
  ]);
  styleHeaderRow(txHeader, 6);

  if (transactions.length === 0) {
    ws.addRow(["—", "—", "—", "Aucune opération", "—", "—"]);
  } else {
    for (const tx of transactions) {
      const currency = tx.currency ?? "USD";
      ws.addRow([
        formatDateExport(tx.date),
        txTypeLabel(tx.type),
        (tx.type === "entree" ? "+" : "−") + formatCurrency(tx.amount, currency),
        tx.description,
        tx.category_name ?? "—",
        `${tx.created_by_name ?? ""} (${tx.created_by_role ? roleLabel(tx.created_by_role) : ""})`,
      ]);
    }
  }

  for (let r = summaryHeader.number + 1; r <= summaryHeader.number + 4; r++) {
    const row = ws.getRow(r);
    for (let c = 1; c <= 3; c++) {
      row.getCell(c).border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };
    }
  }

  const txStart = txHeader.number + 1;
  const txEnd = ws.rowCount;
  for (let r = txStart; r <= txEnd; r++) {
    const row = ws.getRow(r);
    const fill = (r - txStart) % 2 === 0 ? "FFF8FAFC" : "FFFFFFFF";
    for (let c = 1; c <= 6; c++) {
      const cell = row.getCell(c);
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF" + fill },
      };
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };
    }
  }

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export function generatePdfBuffer(
  stats: ExportStats,
  transactions: Transaction[]
): Buffer {
  const doc = new jsPDF({ orientation: "landscape" });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(18);
  doc.text("Judo Caisse — Rapport financier", 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Généré le ${new Intl.DateTimeFormat("fr-FR").format(new Date())}`, 14, 26);
  doc.setTextColor(0);

  doc.setFontSize(12);
  doc.text("Résumé", 14, 36);
  autoTable(doc, {
    startY: 40,
    head: [["Indicateur", "USD ($)", "FC"]],
    body: [
      [
        "Solde actuel",
        formatCurrency(stats.usd.solde, "USD"),
        formatCurrency(stats.fc.solde, "FC"),
      ],
      [
        "Total entrées",
        formatCurrency(stats.usd.entrees, "USD"),
        formatCurrency(stats.fc.entrees, "FC"),
      ],
      [
        "Total sorties",
        formatCurrency(stats.usd.sorties, "USD"),
        formatCurrency(stats.fc.sorties, "FC"),
      ],
      ["Opérations", String(stats.transactionCount), ""],
    ],
    theme: "grid",
    headStyles: { fillColor: [30, 58, 95] },
    margin: { left: 14, right: 14 },
    tableWidth: pageWidth / 2,
  });

  const txStartY =
    (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;

  doc.text("Historique des opérations", 14, txStartY);
  autoTable(doc, {
    startY: txStartY + 4,
    head: [["Date", "Type", "Montant", "Description", "Catégorie", "Saisi par"]],
    body:
      transactions.length > 0
        ? transactions.map((tx) => {
            const currency = tx.currency ?? "USD";
            return [
              formatDateExport(tx.date),
              txTypeLabel(tx.type),
              (tx.type === "entree" ? "+" : "−") + formatCurrency(tx.amount, currency),
              tx.description,
              tx.category_name ?? "—",
              `${tx.created_by_name} (${tx.created_by_role ? roleLabel(tx.created_by_role) : ""})`,
            ];
          })
        : [["—", "—", "—", "Aucune opération", "—", "—"]],
    theme: "striped",
    headStyles: { fillColor: [30, 58, 95] },
    margin: { left: 14, right: 14 },
    styles: { fontSize: 8, cellPadding: 2 },
  });

  return Buffer.from(doc.output("arraybuffer"));
}
