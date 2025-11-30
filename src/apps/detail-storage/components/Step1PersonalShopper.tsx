
import React, { useState, useCallback } from 'react';
import { extractProductInfoFromImages } from '../services/geminiService';

interface UploadedImage {
  file: File;
  previewUrl: string;
  base64: string;
  mimeType: string;
}

interface ProductDetailInfo {
  lineName: string;
  productName: string;
  color: string;
  upperMaterial: string;
  liningMaterial: string;
  soleMaterial: string;
  insoleMaterial: string;
  outsoleHeight: string;
  insoleHeight: string;
  sizeSpec: string;
  origin: string;
  intro: string;
  style: string;
  tech: string;
  techLabel?: string;
  techTitle?: string;
  techDesc?: string;
  // New fields
  estimatedWidth?: string;
  estimatedLength?: string;
  estimatedHeight?: string;
  careGuide?: string;
}

interface Step1PersonalShopperProps {
  onImagesChange?: (images: UploadedImage[]) => void;
  onDataChange?: (data: ProductDetailInfo) => void;
  onStartBackgroundProcessing?: () => Promise<void>;
  initialData?: ProductDetailInfo | null;
  initialImages?: UploadedImage[];
  onAddCustomText?: (text: string) => void;
  onNext?: () => void;
  onAddToPreview?: (content: string, type: 'section' | 'image') => void;
}

const FileDropzone: React.FC<{
  onImagesSelected: (images: UploadedImage[]) => void;
  maxFiles?: number;
  currentImages: UploadedImage[];
  onRemoveImage: (index: number) => void;
}> = ({ onImagesSelected, maxFiles = 10, currentImages, onRemoveImage }) => {
  const [isDragging, setIsDragging] = useState(false);

  const processFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const newImages: UploadedImage[] = [];
    const remainingSlots = maxFiles - currentImages.length;
    const count = Math.min(files.length, remainingSlots);
    if (count <= 0) return;

    let processedCount = 0;
    Array.from(files).slice(0, count).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64String = (e.target?.result as string).split(',')[1];
        newImages.push({
          file,
          previewUrl: URL.createObjectURL(file),
          base64: base64String,
          mimeType: file.type
        });
        processedCount++;
        if (processedCount === count) {
          onImagesSelected(newImages);
        }
      };
      reader.readAsDataURL(file);
    });
  }, [maxFiles, currentImages.length, onImagesSelected]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  }, [processFiles]);

  return (
    <div className="space-y-3">
      {currentImages.length < maxFiles && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          className={`border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer relative ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
        >
          <input
            type="file"
            multiple
            accept="image/*"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={(e) => { processFiles(e.target.files); e.target.value = ''; }}
          />
          <div className="flex flex-col items-center text-center pointer-events-none">
            <svg className="w-10 h-10 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm font-medium text-gray-700">이미지를 드롭하거나 클릭하여 업로드</p>
            <p className="text-xs text-gray-500 mt-1">최대 {maxFiles}개</p>
          </div>
        </div>
      )}

      {currentImages.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {currentImages.map((img, idx) => (
            <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
              <img src={img.previewUrl} alt="preview" className="w-full h-full object-cover" />
              <button
                onClick={() => onRemoveImage(idx)}
                className="absolute top-2 right-2 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Step1PersonalShopper: React.FC<Step1PersonalShopperProps> = ({
  onImagesChange, onDataChange, onStartBackgroundProcessing, initialData, initialImages, onAddCustomText, onAddToPreview
}) => {
  const initialInfo: ProductDetailInfo = {
    lineName: '', productName: '', color: '', upperMaterial: '', liningMaterial: '',
    soleMaterial: '', insoleMaterial: '', outsoleHeight: '', insoleHeight: '',
    sizeSpec: '230-280mm', origin: 'Made in Korea', intro: '', style: '', tech: '',
    techLabel: 'TECHNOLOGY', techTitle: 'Premium Material',
    techDesc: '고급 소재를 사용하여 편안한 착화감을 제공합니다.',
    estimatedWidth: '', estimatedLength: '', estimatedHeight: '', careGuide: ''
  };

  const [info, setInfo] = useState<ProductDetailInfo>(initialData || initialInfo);
  const [images, setImages] = useState<UploadedImage[]>(initialImages || []);
  const [analyzing, setAnalyzing] = useState(false);
  const [customText, setCustomText] = useState('');

  React.useEffect(() => { if (onImagesChange) onImagesChange(images); }, [images, onImagesChange]);
  React.useEffect(() => { if (onDataChange) onDataChange(info); }, [info, onDataChange]);

  const handleAutoFill = async () => {
    if (images.length === 0) {
      alert("먼저 제품 이미지를 업로드해주세요.");
      return;
    }

    setAnalyzing(true);
    try {
      const result = await extractProductInfoFromImages(images.map(img => ({ base64: img.base64, mimeType: img.mimeType })), `
럭셔리 브랜드 카피라이터 및 제품 분석가로서 제품 이미지를 분석하여 JSON으로 응답:
{
  "lineName": "라인명", "productName": "제품명", "category": "카테고리",
    "color": "컬러", "upper": "갑피 소재", "lining": "안감", "sole": "밑창", "insole": "깔창",
      "outsoleHeightCm": "아웃솔 높이", "insoleHeightCm": "인솔 높이", "totalHeightCm": "총 높이",
        "intro": "핵심 가치", "style": "스타일링", "tech": "소재 특징",
          "estimatedWidth": "발볼 너비 (예: 10cm)",
            "estimatedLength": "총 길이 (예: 27cm)",
              "estimatedHeight": "총 높이 (예: 12cm)",
                "careGuide": "소재에 따른 상세 관리 방법 (가죽/합성피혁/스웨이드 등 소재 특성에 맞춰 3줄 이상 작성)"
}
`);

      // 소재 타입 감지 (가죽 vs 합성피혁)
      const materialLower = (result.upper + result.lining + result.sole).toLowerCase();
      const isLeather = materialLower.includes('가죽') || materialLower.includes('leather') || materialLower.includes('천연');
      const isSynthetic = materialLower.includes('합성') || materialLower.includes('인조') || materialLower.includes('pu') || materialLower.includes('synthetic');

      let materialType = isLeather ? '천연가죽' : (isSynthetic ? '합성피혁' : '기타');

      const newInfo = {
        ...info,
        lineName: result.lineName,
        productName: result.productName,
        color: result.color,
        upperMaterial: result.upper,
        liningMaterial: result.lining,
        soleMaterial: result.sole,
        insoleMaterial: result.insole,
        outsoleHeight: result.outsoleHeightCm,
        insoleHeight: result.insoleHeightCm,
        intro: result.intro,
        style: result.style,
        tech: result.tech,
        // 소재 타입에 따른 자동 설정
        techLabel: materialType === '천연가죽' ? 'PREMIUM LEATHER' : 'ADVANCED MATERIAL',
        techTitle: materialType === '천연가죽' ? 'Natural Leather' : 'Synthetic Premium',
        techDesc: materialType === '천연가죽'
          ? '최고급 천연 가죽을 사용하여 통기성과 내구성이 뛰어납니다.'
          : '고급 합성 소재로 가볍고 관리가 용이합니다.',
        estimatedWidth: result.estimatedWidth,
        estimatedLength: result.estimatedLength,
        estimatedHeight: result.estimatedHeight,
        careGuide: result.careGuide
      };

      setInfo(newInfo);

      // 프리뷰에 자동 추가
      if (onAddToPreview) {
        // 1. 제품 정보 섹션
        const infoHtml = `
  < div style = "padding: 40px 20px; text-align: center; font-family: 'Inter', sans-serif;" >
  <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">${result.productName}</h2>
  <p style="font-size: 14px; color: #666; margin-bottom: 30px;">${result.lineName} | ${result.color}</p>
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; max-width: 400px; margin: 0 auto; text-align: left; font-size: 13px;">
    <div><strong>UPPER</strong> ${result.upper}</div>
    <div><strong>LINING</strong> ${result.lining}</div>
    <div><strong>SOLE</strong> ${result.sole}</div>
    <div><strong>HEEL</strong> ${result.outsoleHeightCm}</div>
  </div>
</div > `;
        onAddToPreview(infoHtml, 'section');

        // 2. 인트로 섹션
        if (result.intro) {
          const introHtml = `
  < div style = "padding: 60px 20px; text-align: center; background-color: #f9f9f9;" >
  <h3 style="font-size: 18px; font-weight: bold; margin-bottom: 20px;">DESIGN PHILOSOPHY</h3>
  <p style="font-size: 15px; line-height: 1.8; color: #444; max-width: 600px; margin: 0 auto;">
    ${result.intro}
  </p>
</div > `;
          onAddToPreview(introHtml, 'section');
        }

        // 3. 테크 섹션
        if (newInfo.techTitle) {
          const techHtml = `
  < div style = "padding: 50px 20px; text-align: center;" >
  <span style="display: inline-block; padding: 5px 10px; border: 1px solid #000; font-size: 10px; font-weight: bold; margin-bottom: 20px;">${newInfo.techLabel}</span>
  <h3 style="font-size: 20px; font-weight: bold; margin-bottom: 15px;">${newInfo.techTitle}</h3>
  <p style="font-size: 14px; color: #666; max-width: 500px; margin: 0 auto;">${newInfo.techDesc}</p>
</div > `;
          onAddToPreview(techHtml, 'section');
        }

        // 4. 사이즈 정보 섹션 (New)
        if (result.estimatedWidth || result.estimatedLength || result.estimatedHeight) {
          const sizeHtml = `
  < div style = "padding: 40px 20px; background-color: #fff; border-top: 1px solid #eee;" >
  <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 20px; text-align: center;">SIZE INFORMATION (Estimated)</h3>
  <div style="display: flex; justify-content: center; gap: 30px; text-align: center;">
    ${result.estimatedLength ? `<div><div style="font-size: 12px; color: #888;">Length</div><div style="font-weight: bold;">${result.estimatedLength}</div></div>` : ''}
    ${result.estimatedWidth ? `<div><div style="font-size: 12px; color: #888;">Width</div><div style="font-weight: bold;">${result.estimatedWidth}</div></div>` : ''}
    ${result.estimatedHeight ? `<div><div style="font-size: 12px; color: #888;">Height</div><div style="font-weight: bold;">${result.estimatedHeight}</div></div>` : ''}
  </div>
  <p style="font-size: 11px; color: #999; text-align: center; margin-top: 15px;">* AI 분석에 의한 추정치로 실제 제품과 차이가 있을 수 있습니다.</p>
</div > `;
          onAddToPreview(sizeHtml, 'section');
        }

        // 5. 소재 관리 가이드 섹션 (New)
        if (result.careGuide) {
          const careHtml = `
  < div style = "padding: 40px 20px; background-color: #f5f5f5;" >
  <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 15px;">MATERIAL CARE GUIDE</h3>
  <div style="font-size: 13px; line-height: 1.6; color: #555; white-space: pre-line;">
    ${result.careGuide}
  </div>
</div > `;
          onAddToPreview(careHtml, 'section');
        }
      }

      alert(
        `✅ AI 분석 완료!\n\n` +
        `📦 제품명: ${result.productName} \n` +
        `📏 사이즈 추정: ${result.estimatedLength || '-'} / ${result.estimatedWidth || '-'}\n` +
        `🧼 관리법: ${result.careGuide ? '생성됨' : '-'}\n\n` +
        `프리뷰에 모든 섹션이 추가되었습니다.`
      );
    } catch (err) {
      console.error(err);
      alert("AI 분석 중 오류가 발생했습니다: " + (err as Error).message);
    }
    finally { setAnalyzing(false); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInfo({ ...info, [e.target.name]: e.target.value });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Product Info</h3>
          <p className="text-xs text-gray-500 mt-0.5">이미지를 업로드하면 AI가 자동으로 분석합니다</p>
        </div>
        <button onClick={handleAutoFill} disabled={analyzing || images.length === 0}
          className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {analyzing ? '분석 중...' : 'AI 자동 입력'}
        </button>
      </div>

      <FileDropzone currentImages={images} maxFiles={10}
        onImagesSelected={(newImgs) => setImages(prev => [...prev, ...newImgs])}
        onRemoveImage={(idx) => setImages(prev => prev.filter((_, i) => i !== idx))} />

      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <input name="lineName" value={info.lineName} onChange={handleChange} placeholder="라인명" className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent" />
          <input name="productName" value={info.productName} onChange={handleChange} placeholder="제품명 *" className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent" />
          <input name="color" value={info.color} onChange={handleChange} placeholder="컬러" className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent" />
          <input name="upperMaterial" value={info.upperMaterial} onChange={handleChange} placeholder="갑피 소재" className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent" />
          <input name="liningMaterial" value={info.liningMaterial} onChange={handleChange} placeholder="안감" className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent" />
          <input name="soleMaterial" value={info.soleMaterial} onChange={handleChange} placeholder="밑창" className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent" />
          <input name="insoleMaterial" value={info.insoleMaterial} onChange={handleChange} placeholder="깔창" className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent" />
          <input name="outsoleHeight" value={info.outsoleHeight} onChange={handleChange} placeholder="아웃솔 높이(cm)" className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent" />
          <input name="insoleHeight" value={info.insoleHeight} onChange={handleChange} placeholder="인솔 높이(cm)" className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent" />
          <input name="sizeSpec" value={info.sizeSpec} onChange={handleChange} placeholder="사이즈 범위" className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent" />
          <input name="origin" value={info.origin} onChange={handleChange} placeholder="원산지" className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent col-span-2" />
        </div>
        <textarea name="intro" value={info.intro} onChange={handleChange} placeholder="제품 소개 (핵심 가치)" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent resize-none" rows={2} />
        <textarea name="style" value={info.style} onChange={handleChange} placeholder="스타일 설명" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent resize-none" rows={2} />
        <textarea name="tech" value={info.tech} onChange={handleChange} placeholder="기술/소재 특징" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent resize-none" rows={2} />
      </div>

      <div className="space-y-2 pt-2 border-t">
        <h4 className="text-sm font-semibold text-gray-900">사이즈 정보 (AI 추정)</h4>
        <div className="grid grid-cols-3 gap-2">
          <input name="estimatedLength" value={info.estimatedLength || ''} onChange={handleChange} placeholder="길이 (예: 27cm)" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          <input name="estimatedWidth" value={info.estimatedWidth || ''} onChange={handleChange} placeholder="발볼 (예: 10cm)" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          <input name="estimatedHeight" value={info.estimatedHeight || ''} onChange={handleChange} placeholder="높이 (예: 12cm)" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t">
        <h4 className="text-sm font-semibold text-gray-900">소재 관리 가이드</h4>
        <textarea name="careGuide" value={info.careGuide || ''} onChange={handleChange} placeholder="소재별 관리 방법이 자동 입력됩니다." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none h-24" />
      </div>

      <div className="space-y-2 pt-2 border-t">
        <h4 className="text-sm font-semibold text-gray-900">기술 배지</h4>
        <input name="techLabel" value={info.techLabel || ''} onChange={handleChange} placeholder="라벨 (예: TECHNOLOGY)" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent" />
        <input name="techTitle" value={info.techTitle || ''} onChange={handleChange} placeholder="제목 (예: CarbonLite)" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent" />
        <textarea name="techDesc" value={info.techDesc || ''} onChange={handleChange} placeholder="설명" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent resize-none" rows={2} />
      </div>

      {onAddCustomText && (
        <div className="space-y-2 pt-2 border-t">
          <h4 className="text-sm font-semibold text-gray-900">커스텀 텍스트</h4>
          <textarea value={customText} onChange={(e) => setCustomText(e.target.value)} placeholder="커스텀 텍스트 입력..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent resize-none" rows={3} />
          <button onClick={() => { if (customText.trim()) { onAddCustomText(customText); setCustomText(''); } }}
            disabled={!customText.trim()}
            className="w-full bg-black text-white font-medium py-2 px-4 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm">
            페이지에 추가
          </button>
        </div>
      )}
    </div>
  );
};

export default Step1PersonalShopper;

