export function escapeCsvCell(
  value: string | number | null | undefined
): string {
  if (value == null) {
    return "";
  }

  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

export function rowsToCsv(
  headers: string[],
  rows: (string | number | null | undefined)[][]
): string {
  const lines = [
    headers.map(escapeCsvCell).join(","),
    ...rows.map((row) => row.map(escapeCsvCell).join(",")),
  ];
  return lines.join("\n");
}

export function joinCsvSections(
  sections: { title: string; csv: string }[]
): string {
  return sections.map(({ title, csv }) => `# ${title}\n${csv}`).join("\n\n");
}

export function buildExportFilename(
  view: string,
  timeframeLabel?: string
): string {
  const date = new Date().toISOString().slice(0, 10);
  const slug = timeframeLabel
    ? `-${timeframeLabel
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")}`
    : "";
  return `actual-reports-${view}${slug}-${date}.csv`;
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
