import Papa from 'papaparse';

export interface Product {
  상품명: string;
  지역: string;
  일: string;
  가격: string;
  포함사항: string;
}

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1U_dxaQcuI7sGGCjTNJAxLgIEXmAatBve0q5lhi_rgFU/export?format=csv&gid=0';

export const fetchProductsFromSheet = async (): Promise<Product[]> => {
  try {
    const response = await fetch(SHEET_URL);
    const csvText = await response.text();
    
    return new Promise((resolve, reject) => {
      Papa.parse<Product>(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          resolve(results.data);
        },
        error: (error: Error) => {
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('Error fetching products from Google Sheet:', error);
    return [];
  }
};
