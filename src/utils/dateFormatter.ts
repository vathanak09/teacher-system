export const formatDateToDMY = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';
  // Convert standard YYYY-MM-DD or parseable dates
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    // Attempt custom parsing if it's already DD-MM-YYYY or DD/MM/YYYY
    const parts = dateStr.includes('-') ? dateStr.split('-') : dateStr.split('/');
    if (parts.length === 3) {
      const year = parts.find(p => p.length === 4);
      if (parts[0] === year) return `${parts[2]}-${parts[1]}-${parts[0]}`;
      return `${parts[0]}-${parts[1]}-${parts[2]}`; // likely already DD-MM-YYYY
    }
    return dateStr; // fallback to original
  }
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};
