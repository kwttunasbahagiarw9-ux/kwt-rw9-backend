const escapeCsv = (value = '') => {
  const safe = String(value ?? '');
  if (/[",\n\r]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
};

export const toCsv = (rows, headers) => {
  const headerLine = headers.map((header) => escapeCsv(header.label)).join(',');
  const dataLines = rows.map((row) =>
    headers.map((header) => escapeCsv(header.value(row))).join(',')
  );

  return [headerLine, ...dataLines].join('\n');
};
