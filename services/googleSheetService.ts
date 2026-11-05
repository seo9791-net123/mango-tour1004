
import { Product } from '../types';

/**
 * 구글 시트 데이터를 가져오는 서비스
 * Spreadsheet ID: 1uNgl7yiBS1UsLIWUmRI8M3Qin-wNmKmq8EqFio7YlJ0
 */

export interface SheetRow {
  [key: string]: string;
}

export const VND_TO_USD_RATE = 25000;

const COURSE_IMAGES: Record<string, string> = {
  '탄손넛': 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=800',
  '송베': 'https://images.unsplash.com/photo-1592919505780-30395071b483?q=80&w=800',
  '롱탄': 'https://images.unsplash.com/photo-1628753232870-6da09a967c9c?q=80&w=800',
  '투득': 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?q=80&w=800',
  '정산': 'https://images.unsplash.com/photo-1522204523234-8729aa6e3d5f?q=80&w=800',
  '트윈도브스': 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?q=80&w=800',
  '다이남': 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?q=80&w=800',
  '동나이': 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=800',
  '하모니': 'https://images.unsplash.com/photo-1592919505780-30395071b483?q=80&w=800',
  '웨스트': 'https://images.unsplash.com/photo-1628753232870-6da09a967c9c?q=80&w=800',
  '로얄': 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?q=80&w=800',
  '블러프': 'https://images.unsplash.com/photo-1540541338287-41700207dee6?q=80&w=800',
  '파라다이스': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800',
  '씨링크': 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=800',
  '노바월드': 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=800',
  '달랏': 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?q=80&w=800',
  '투엔람': 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=800',
  '1200': 'https://images.unsplash.com/photo-1628753232870-6da09a967c9c?q=80&w=800',
};

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
        const val = cell ? (cell.v !== null ? String(cell.v) : '') : '';
        rowData[cols[i] || `col_${i}`] = val;
        rowData[`col_${i}`] = val; // Also store positional index for safety
      });
      return rowData;
    });
    
    return rows;
  } catch (error) {
    console.error("Error fetching Google Sheet data:", error);
    return [];
  }
};

/**
 * 구글 시트 데이터를 파싱하여 주중/주말 단가 및 정보를 담은 Product 배열로 변환
 */
export const fetchParsedSheetProducts = async (sheetId: string = '1uNgl7yiBS1UsLIWUmRI8M3Qin-wNmKmq8EqFio7YlJ0'): Promise<Product[]> => {
  try {
    const rows = await fetchGoogleSheetData(sheetId);
    if (!rows || rows.length === 0) return [];

    return rows.map((row, index) => {
      // Name
      const rawName = row['상품명'] || row['col_3'] || row['name'] || `상품 ${index + 1}`;
      const title = String(rawName).trim();

      // Location
      const location = String(row['지역'] || row['col_1'] || '호치민').trim();

      // Category
      const category = String(row['카테고리'] || row['col_2'] || '골프').trim();

      // Prices: 18H Weekday / Weekend
      const rawWeekdayVND = Number(String(row['18홀 주중'] || row['col_4'] || '0').replace(/[^0-9]/g, '')) || 0;
      let rawWeekendVND = Number(String(row['18홀 주말'] || row['col_5'] || '0').replace(/[^0-9]/g, '')) || 0;

      // If weekend price is missing, default to 1.35x weekday price
      if (rawWeekendVND === 0 && rawWeekdayVND > 0) {
        rawWeekendVND = Math.round(rawWeekdayVND * 1.35);
      }

      // 27H Weekday / Weekend
      const raw27WeekdayVND = Number(String(row['27홀 주중'] || row['col_6'] || '0').replace(/[^0-9]/g, '')) || 0;
      const raw27WeekendVND = Number(String(row['27홀 주말'] || row['col_7'] || '0').replace(/[^0-9]/g, '')) || 0;

      // Convert VND to USD (round to whole USD)
      const priceWeekdayUSD = rawWeekdayVND > 1000 ? Math.round(rawWeekdayVND / VND_TO_USD_RATE) : (rawWeekdayVND || 100);
      const priceWeekendUSD = rawWeekendVND > 1000 ? Math.round(rawWeekendVND / VND_TO_USD_RATE) : (rawWeekendVND || Math.round(priceWeekdayUSD * 1.35));

      const price27WeekdayUSD = raw27WeekdayVND > 1000 ? Math.round(raw27WeekdayVND / VND_TO_USD_RATE) : undefined;
      const price27WeekendUSD = raw27WeekendVND > 1000 ? Math.round(raw27WeekendVND / VND_TO_USD_RATE) : undefined;

      // Description & Notes
      const description = String(row['상세 설명'] || row['col_10'] || `${title} 18홀 라운딩`).trim();
      const notes = String(row['상세설명 비고'] || row['col_11'] || '카트비/캐디피 포함, 캐디 팁 별도').trim();
      const unit = String(row['단위'] || row['col_8'] || '1인').trim();

      // Image selection
      let image = String(row['사진(URL)'] || row['col_12'] || '').trim();
      if (!image || !image.startsWith('http')) {
        const foundKey = Object.keys(COURSE_IMAGES).find(key => title.includes(key));
        image = foundKey ? COURSE_IMAGES[foundKey] : 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=800';
      }

      const id = String(row['GolfProducts (골프 상품) 상품ID (Key)'] || row['col_0'] || `gs-product-${Date.now()}-${index}`).trim();

      return {
        id,
        title,
        description,
        notes,
        unit,
        image,
        price: priceWeekdayUSD,
        weekendPrice: priceWeekendUSD,
        holes27Price: price27WeekdayUSD,
        holes27WeekendPrice: price27WeekendUSD,
        priceVND: rawWeekdayVND,
        weekendPriceVND: rawWeekendVND,
        location,
        duration: '18홀 / 1회 라운딩',
        type: 'golf',
        category: category || '골프',
        itinerary: []
      };
    });
  } catch (error) {
    console.error("Error parsing Google Sheet products:", error);
    return [];
  }
};

