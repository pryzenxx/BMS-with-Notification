import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// Export to PDF
export const exportToPDF = (data, columns, title = "Residents") => {
  const doc = new jsPDF();
  doc.text(title, 14, 16);
  autoTable(doc, {
    head: [columns],
    body: data.map(row => columns.map(col => row[col])),
    startY: 20,
  });
  doc.save(`${title}.pdf`);
};

// Export to Excel/CSV
export const exportToExcel = (data, columns, filename = "Residents") => {
  const sheetData = [
    columns,
    ...data.map(row => columns.map(col => row[col])),
  ];
  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Residents");

  const blob = XLSX.write(workbook, {
    bookType: filename.endsWith(".csv") ? "csv" : "xlsx",
    type: "array",
  });
  saveAs(new Blob([blob]), filename);
};
