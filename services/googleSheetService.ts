
/**
 * 구글 시트 데이터를 가져오는 서비스
 * Spreadsheet ID: 1uNgl7yiBS1UsLIWUmRI8M3Qin-wNmKmq8EqFio7YlJ0
 */

export interface SheetRow {
  [key: string]: string;
}

export const fetchGoogleSheetData = async (sheetId: string = '1uNgl7yiBS1UsLIWUmRI8M3Qin-wNmKmq8EqFio7YlJ0'): Promise<SheetRow[]> => {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`;
    const response = await fetch(url);
    const text = await response.text();
    
    // Google Sheets JSON response has a prefix that needs to be removed
    const jsonString = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
    const data = JSON.parse(jsonString);
    
    const cols = data.table.cols.map((col: any) => col.label || 'column');
    const rows = data.table.rows.map((row: any) => {
      const rowData: SheetRow = {};
      row.c.forEach((cell: any, i: number) => {
        rowData[cols[i] || `col_${i}`] = cell ? (cell.v !== null ? String(cell.v) : '') : '';
      });
      return rowData;
    });
    
    return rows;
  } catch (error) {
    console.error("Error fetching Google Sheet data:", error);
    return [];
  }
};
