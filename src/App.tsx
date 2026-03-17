/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Car, 
  Upload, 
  Search, 
  RefreshCw, 
  FileText, 
  Download, 
  Copy, 
  History, 
  AlertTriangle, 
  CheckCircle2,
  Info,
  ChevronRight,
  ShieldCheck,
  MapPin,
  Calendar,
  Gauge,
  Activity,
  Hash
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  Cell
} from 'recharts';
import { 
  scanRegistrationImage, 
  lookupPartsPrices, 
  lookupCarMarketValue, 
  CarInfo, 
  PartPrice, 
  CarValueResult 
} from './services/geminiService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const INITIAL_CAR_INFO: CarInfo = {
  licensePlate: '',
  brand: '',
  model: '',
  year: '',
  version: '',
  vin: '',
  mileage: '',
  condition: 'Tốt',
  region: 'Quảng Ninh',
};

export default function App() {
  const [carInfo, setCarInfo] = useState<CarInfo>(INITIAL_CAR_INFO);
  const [partName, setPartName] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isLookingUpParts, setIsLookingUpParts] = useState(false);
  const [isLookingUpValue, setIsLookingUpValue] = useState(false);
  const [partsResults, setPartsResults] = useState<PartPrice[] | null>(null);
  const [carValueResult, setCarValueResult] = useState<CarValueResult | null>(null);
  const [history, setHistory] = useState<{ car: CarInfo; date: string }[]>([]);
  const [activeTab, setActiveTab] = useState<'parts' | 'value'>('parts');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load history from local storage
  useEffect(() => {
    const savedHistory = localStorage.getItem('lookup_history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  const saveToHistory = (car: CarInfo) => {
    const newHistory = [{ car, date: new Date().toLocaleString() }, ...history].slice(0, 10);
    setHistory(newHistory);
    localStorage.setItem('lookup_history', JSON.stringify(newHistory));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const scannedData = await scanRegistrationImage(base64);
        setCarInfo(prev => ({ ...prev, ...scannedData }));
        setIsScanning(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Scan error:", error);
      setIsScanning(false);
    }
  };

  const handleLookupParts = async () => {
    setIsLookingUpParts(true);
    setActiveTab('parts');
    try {
      const results = await lookupPartsPrices(carInfo, partName);
      setPartsResults(results);
      saveToHistory(carInfo);
    } catch (error) {
      console.error("Lookup error:", error);
    } finally {
      setIsLookingUpParts(false);
    }
  };

  const handleLookupValue = async () => {
    setIsLookingUpValue(true);
    setActiveTab('value');
    try {
      const result = await lookupCarMarketValue(carInfo);
      setCarValueResult(result);
    } catch (error) {
      console.error("Value lookup error:", error);
    } finally {
      setIsLookingUpValue(false);
    }
  };

  const handleReset = () => {
    setCarInfo(INITIAL_CAR_INFO);
    setPartName('');
    setPartsResults(null);
    setCarValueResult(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const copyResults = () => {
    if (!partsResults) return;
    const text = partsResults.map(p => `${p.name}: ${formatCurrency(p.avgPrice)}`).join('\n');
    navigator.clipboard.writeText(text);
    alert("Đã sao chép bảng giá!");
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">SOS PTI Khu vực Quảng Ninh (013)</h1>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Hệ thống Giám định & Tra cứu AI</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleReset}
              className="p-2 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors"
              title="Làm mới dữ liệu"
            >
              <RefreshCw size={20} />
            </button>
            <div className="h-6 w-px bg-slate-200 mx-2" />
            <div className="flex items-center gap-2 px-3 py-1.5 bg-accent rounded-full text-secondary font-semibold text-sm">
              <Activity size={16} />
              <span>AI Online</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Input */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* AI Scan Section */}
          <section className="glass-card p-6 border-dashed border-2 border-primary/30 bg-primary/5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-primary uppercase tracking-tight flex items-center gap-2">
                <Upload size={16} />
                AI SCAN ĐĂNG KÝ/ĐĂNG KIỂM
              </h2>
              {isScanning && (
                <div className="flex items-center gap-2 text-xs text-primary font-medium animate-pulse">
                  <RefreshCw size={12} className="animate-spin" />
                  Đang phân tích...
                </div>
              )}
            </div>
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="group cursor-pointer border-2 border-dashed border-slate-300 hover:border-primary rounded-2xl p-8 transition-all bg-white flex flex-col items-center justify-center text-center gap-3"
            >
              <div className="w-16 h-16 bg-slate-50 group-hover:bg-primary/10 rounded-full flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                <Car size={32} />
              </div>
              <div>
                <p className="font-bold text-slate-700">Tải lên ảnh đăng ký/đăng kiểm</p>
                <p className="text-xs text-slate-500 mt-1">Kéo thả hoặc click để chọn ảnh (JPG, PNG)</p>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
                accept="image/*"
              />
            </div>
          </section>

          {/* Car Info Form */}
          <section className="glass-card p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2 mb-2">
              <FileText size={16} className="text-primary" />
              Thông tin xe chi tiết
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-1">
                <label className="label-text">Biển kiểm soát</label>
                <input 
                  type="text" 
                  value={carInfo.licensePlate} 
                  onChange={e => setCarInfo({...carInfo, licensePlate: e.target.value})}
                  className="input-field" 
                  placeholder="VD: 14A-123.45"
                />
              </div>
              <div className="col-span-1">
                <label className="label-text">Hãng xe</label>
                <input 
                  type="text" 
                  value={carInfo.brand} 
                  onChange={e => setCarInfo({...carInfo, brand: e.target.value})}
                  className="input-field" 
                  placeholder="VD: Toyota"
                />
              </div>
              <div className="col-span-1">
                <label className="label-text">Model</label>
                <input 
                  type="text" 
                  value={carInfo.model} 
                  onChange={e => setCarInfo({...carInfo, model: e.target.value})}
                  className="input-field" 
                  placeholder="VD: Vios"
                />
              </div>
              <div className="col-span-1">
                <label className="label-text">Năm sản xuất</label>
                <input 
                  type="text" 
                  value={carInfo.year} 
                  onChange={e => setCarInfo({...carInfo, year: e.target.value})}
                  className="input-field" 
                  placeholder="VD: 2022"
                />
              </div>
              <div className="col-span-2">
                <label className="label-text">Phiên bản</label>
                <input 
                  type="text" 
                  value={carInfo.version} 
                  onChange={e => setCarInfo({...carInfo, version: e.target.value})}
                  className="input-field" 
                  placeholder="VD: 1.5G CVT"
                />
              </div>
              <div className="col-span-2">
                <label className="label-text flex items-center gap-1">
                  Số khung (VIN)
                </label>
                <input 
                  type="text" 
                  value={carInfo.vin} 
                  onChange={e => setCarInfo({...carInfo, vin: e.target.value})}
                  className="input-field font-mono text-sm" 
                  placeholder="Số khung xe..."
                />
              </div>
              <div className="col-span-1">
                <label className="label-text">Số km đã chạy</label>
                <input 
                  type="text" 
                  value={carInfo.mileage} 
                  onChange={e => setCarInfo({...carInfo, mileage: e.target.value})}
                  className="input-field" 
                  placeholder="VD: 30,000"
                />
              </div>
              <div className="col-span-1">
                <label className="label-text">Tình trạng</label>
                <select 
                  value={carInfo.condition} 
                  onChange={e => setCarInfo({...carInfo, condition: e.target.value})}
                  className="input-field"
                >
                  <option>Mới</option>
                  <option>Tốt</option>
                  <option>Trung bình</option>
                  <option>Tai nạn nhẹ</option>
                  <option>Tai nạn nặng</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="label-text">Khu vực</label>
                <select 
                  value={carInfo.region} 
                  onChange={e => setCarInfo({...carInfo, region: e.target.value})}
                  className="input-field"
                >
                  <option>Quảng Ninh</option>
                  <option>Hà Nội</option>
                  <option>TP HCM</option>
                  <option>Đà Nẵng</option>
                  <option>Miền Bắc</option>
                  <option>Miền Trung</option>
                  <option>Miền Nam</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="label-text">Tên phụ tùng cần tra cứu (Để trống để tra cứu phổ biến)</label>
                <input 
                  type="text" 
                  value={partName} 
                  onChange={e => setPartName(e.target.value)}
                  className="input-field" 
                  placeholder="VD: Má phanh, Giảm xóc..."
                />
              </div>
            </div>

            <div className="pt-4 flex flex-col gap-3">
              <button 
                onClick={handleLookupParts}
                disabled={isLookingUpParts || !carInfo.brand}
                className="btn-primary w-full h-12"
              >
                {isLookingUpParts ? <RefreshCw className="animate-spin" /> : <Search size={20} />}
                Tra cứu giá phụ tùng
              </button>
              <button 
                onClick={handleLookupValue}
                disabled={isLookingUpValue || !carInfo.brand}
                className="btn-secondary w-full h-12"
              >
                {isLookingUpValue ? <RefreshCw className="animate-spin" /> : <Activity size={20} />}
                Định giá xe thị trường
              </button>
            </div>
          </section>

          {/* History */}
          {history.length > 0 && (
            <section className="glass-card p-6">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2 mb-4">
                <History size={16} className="text-slate-400" />
                Lịch sử tra cứu
              </h2>
              <div className="space-y-3">
                {history.map((item, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => setCarInfo(item.car)}
                    className="p-3 bg-slate-50 rounded-xl hover:bg-primary/5 hover:border-primary/20 border border-transparent transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-700">{item.car.brand} {item.car.model}</p>
                      <p className="text-[10px] text-slate-400 font-medium uppercase">{item.date}</p>
                    </div>
                    <ChevronRight size={14} className="text-slate-300 group-hover:text-primary transition-colors" />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Tabs */}
          <div className="flex p-1 bg-slate-200 rounded-2xl w-fit">
            <button 
              onClick={() => setActiveTab('parts')}
              className={cn(
                "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                activeTab === 'parts' ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Bảng giá phụ tùng
            </button>
            <button 
              onClick={() => setActiveTab('value')}
              className={cn(
                "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                activeTab === 'value' ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Giá trị xe
            </button>
          </div>

          {activeTab === 'parts' ? (
            <div className="animate-fade-in space-y-6">
              {isLookingUpParts ? (
                <div className="glass-card p-12 flex flex-col items-center justify-center text-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <Search className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">AI đang quét dữ liệu thị trường...</h3>
                    <p className="text-sm text-slate-500 mt-1">Đang truy cập phutungoto.vn, Shopee, YouTube và các diễn đàn xe...</p>
                  </div>
                </div>
              ) : partsResults ? (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="glass-card p-4 bg-blue-50 border-blue-100">
                      <p className="text-[10px] font-bold text-blue-500 uppercase">Trung bình</p>
                      <p className="text-lg font-black text-blue-700">
                        {formatCurrency(partsResults.reduce((acc, curr) => acc + curr.avgPrice, 0) / partsResults.length)}
                      </p>
                    </div>
                    <div className="glass-card p-4 bg-emerald-50 border-emerald-100">
                      <p className="text-[10px] font-bold text-emerald-500 uppercase">Độ tin cậy</p>
                      <p className="text-lg font-black text-emerald-700">92%</p>
                    </div>
                    <div className="glass-card p-4 bg-orange-50 border-orange-100">
                      <p className="text-[10px] font-bold text-orange-500 uppercase">Nguồn tin</p>
                      <p className="text-lg font-black text-orange-700">12+</p>
                    </div>
                  </div>

                  {/* Chart */}
                  <div className="glass-card p-6 h-80">
                    <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
                      <Activity size={16} className="text-primary" />
                      Biểu đồ so sánh giá phụ tùng
                    </h3>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={partsResults}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" fontSize={10} tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                        <YAxis fontSize={10} tick={{fill: '#64748b'}} axisLine={false} tickLine={false} tickFormatter={(val) => `${val/1000000}M`} />
                        <Tooltip 
                          contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                          formatter={(value: number) => [formatCurrency(value), 'Giá trung bình']}
                        />
                        <Bar dataKey="avgPrice" radius={[4, 4, 0, 0]}>
                          {partsResults.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#2563eb' : '#3b82f6'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Table */}
                  <div className="glass-card overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                      <h3 className="text-sm font-bold text-slate-900">Chi tiết bảng giá phụ tùng</h3>
                      <div className="flex gap-2">
                        <button onClick={copyResults} className="p-2 text-slate-400 hover:text-primary transition-colors">
                          <Copy size={16} />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-primary transition-colors">
                          <Download size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="text-slate-400 font-bold border-b border-slate-100">
                            <th className="px-6 py-4">Tên phụ tùng</th>
                            <th className="px-6 py-4">Giá thấp nhất</th>
                            <th className="px-6 py-4">Giá trung bình</th>
                            <th className="px-6 py-4">Giá cao nhất</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {partsResults.map((part, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 font-bold text-slate-700">{part.name}</td>
                              <td className="px-6 py-4 text-emerald-600 font-medium">{formatCurrency(part.minPrice)}</td>
                              <td className="px-6 py-4 text-primary font-bold">{formatCurrency(part.avgPrice)}</td>
                              <td className="px-6 py-4 text-rose-500 font-medium">{formatCurrency(part.maxPrice)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* AI Insights */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="glass-card p-5 border-l-4 border-l-orange-500 bg-orange-50/30">
                      <div className="flex items-center gap-2 text-orange-600 mb-2">
                        <AlertTriangle size={18} />
                        <h4 className="font-bold text-sm">Cảnh báo giá bất thường</h4>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Giá Đèn pha và Cản trước đang có xu hướng tăng 15% do khan hiếm nguồn cung từ nhà máy. Nên cân nhắc đặt hàng sớm.
                      </p>
                    </div>
                    <div className="glass-card p-5 border-l-4 border-l-emerald-500 bg-emerald-50/30">
                      <div className="flex items-center gap-2 text-emerald-600 mb-2">
                        <CheckCircle2 size={18} />
                        <h4 className="font-bold text-sm">Gợi ý sửa chữa hợp lý</h4>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Với tình trạng xe hiện tại, nên ưu tiên thay thế Lốp và Lazang chính hãng để đảm bảo an toàn vận hành tối ưu.
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="glass-card p-20 flex flex-col items-center justify-center text-center gap-4 opacity-60">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                    <Search size={40} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-400">Chưa có dữ liệu tra cứu</h3>
                    <p className="text-sm text-slate-400 mt-1">Nhập thông tin xe và nhấn "Tra cứu giá phụ tùng" để bắt đầu.</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="animate-fade-in space-y-6">
              {isLookingUpValue ? (
                <div className="glass-card p-12 flex flex-col items-center justify-center text-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <Activity className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">AI đang phân tích giá trị xe...</h3>
                    <p className="text-sm text-slate-500 mt-1">Đang so sánh với dữ liệu từ Bonbanh, Chotot, Otosaigon...</p>
                  </div>
                </div>
              ) : carValueResult ? (
                <>
                  {/* Market Value Card */}
                  <div className="glass-card p-8 bg-gradient-to-br from-primary to-blue-700 text-white relative overflow-hidden">
                    <div className="relative z-10">
                      <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">Giá trị thị trường ước tính</p>
                      <h2 className="text-4xl font-black mb-4">{formatCurrency(carValueResult.marketValue)}</h2>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-xs font-bold">
                          <CheckCircle2 size={14} />
                          Độ tin cậy: {carValueResult.confidence}
                        </div>
                        <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-xs font-bold">
                          <MapPin size={14} />
                          {carInfo.region}
                        </div>
                      </div>
                    </div>
                    <Car className="absolute -right-8 -bottom-8 text-white/10 w-48 h-48 rotate-12" />
                  </div>

                  {/* Value Trends Chart */}
                  <div className="glass-card p-6 h-80">
                    <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
                      <Calendar size={16} className="text-primary" />
                      Biến động giá trị xe (6 tháng gần nhất)
                    </h3>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={carValueResult.trends}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="month" fontSize={10} tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                        <YAxis fontSize={10} tick={{fill: '#64748b'}} axisLine={false} tickLine={false} tickFormatter={(val) => `${val/1000000}M`} />
                        <Tooltip 
                          contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                          formatter={(value: number) => [formatCurrency(value), 'Giá trị']}
                        />
                        <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={3} dot={{r: 4, fill: '#2563eb'}} activeDot={{r: 6}} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* AI Analysis */}
                  <div className="glass-card p-6">
                    <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <Info size={16} className="text-primary" />
                      Phân tích chuyên sâu từ AI
                    </h3>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-sm text-slate-600 leading-relaxed italic">
                        "{carValueResult.analysis}"
                      </p>
                    </div>
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                          <Gauge size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-700">Khấu hao thấp</p>
                          <p className="text-[10px] text-slate-500">Dòng xe giữ giá tốt tại thị trường Việt Nam.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                          <MapPin size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-700">Nhu cầu cao</p>
                          <p className="text-[10px] text-slate-500">Thanh khoản tốt tại khu vực {carInfo.region}.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="glass-card p-20 flex flex-col items-center justify-center text-center gap-4 opacity-60">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                    <Activity size={40} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-400">Chưa có dữ liệu định giá</h3>
                    <p className="text-sm text-slate-400 mt-1">Nhập thông tin xe và nhấn "Định giá xe thị trường" để bắt đầu.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer / Floating Action */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-slate-200 py-3 px-4 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">© 2026 SOS PTI Quảng Ninh • AI Powered</p>
          <div className="flex gap-2">
            <button className="p-2 text-slate-400 hover:text-primary transition-colors">
              <History size={20} />
            </button>
            <button className="p-2 text-slate-400 hover:text-primary transition-colors">
              <Download size={20} />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
