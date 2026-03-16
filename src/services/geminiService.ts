import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface CarInfo {
  licensePlate: string;
  brand: string;
  model: string;
  year: string;
  version: string;
  vin: string;
  mileage: string;
  condition: string;
  region: string;
}

export interface PartPrice {
  name: string;
  minPrice: number;
  avgPrice: number;
  maxPrice: number;
  sources: string[];
}

export interface CarValueResult {
  marketValue: number;
  confidence: string;
  analysis: string;
  trends: { month: string; value: number }[];
}

export const scanRegistrationImage = async (base64Image: string): Promise<CarInfo> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          { text: "Hãy quét ảnh đăng kiểm xe ô tô này và trích xuất các thông tin sau dưới dạng JSON: Biển kiểm soát (licensePlate), Hãng xe (brand), Model (model), Năm sản xuất (year), Phiên bản (version), Số khung/VIN (vin), Số km đã chạy (mileage - nếu có, nếu không để trống), Tình trạng xe (condition - mặc định 'Tốt'), Khu vực (region - mặc định 'Quảng Ninh'). Trả về JSON thuần túy." },
          { inlineData: { mimeType: "image/jpeg", data: base64Image.split(",")[1] || base64Image } }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          licensePlate: { type: Type.STRING },
          brand: { type: Type.STRING },
          model: { type: Type.STRING },
          year: { type: Type.STRING },
          version: { type: Type.STRING },
          vin: { type: Type.STRING },
          mileage: { type: Type.STRING },
          condition: { type: Type.STRING },
          region: { type: Type.STRING },
        }
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

export const lookupPartsPrices = async (car: CarInfo, customPartName?: string): Promise<PartPrice[]> => {
  const partsToLookup = customPartName 
    ? customPartName 
    : "Đèn pha, Cản trước, Cản sau, Gương chiếu hậu, Kính chắn gió, Tai xe, Lốp, Lazang, Đèn hậu, Nắp capo, Cánh cửa";

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Tra cứu giá phụ tùng cho xe: ${car.brand} ${car.model} ${car.year} ${car.version}. 
    Khu vực: ${car.region}. Tình trạng xe: ${car.condition}.
    Hãy liệt kê giá cho các phụ tùng: ${partsToLookup}.
    Trả về danh sách JSON gồm: name, minPrice, avgPrice, maxPrice, sources (mảng các tên website/nguồn tham khảo tại Việt Nam).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            minPrice: { type: Type.NUMBER },
            avgPrice: { type: Type.NUMBER },
            maxPrice: { type: Type.NUMBER },
            sources: { type: Type.ARRAY, items: { type: Type.STRING } },
          }
        }
      }
    }
  });

  return JSON.parse(response.text || "[]");
};

export const lookupCarMarketValue = async (car: CarInfo): Promise<CarValueResult> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Định giá xe ô tô thị trường tại Việt Nam cho: ${car.brand} ${car.model} ${car.year} ${car.version}.
    Số km: ${car.mileage}, Tình trạng: ${car.condition}, Khu vực: ${car.region}.
    Trả về JSON gồm: marketValue (số tiền VNĐ), confidence (độ tin cậy %), analysis (phân tích ngắn gọn), trends (mảng 6 tháng gần nhất với month và value).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          marketValue: { type: Type.NUMBER },
          confidence: { type: Type.STRING },
          analysis: { type: Type.STRING },
          trends: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                month: { type: Type.STRING },
                value: { type: Type.NUMBER }
              }
            }
          }
        }
      }
    }
  });

  return JSON.parse(response.text || "{}");
};
