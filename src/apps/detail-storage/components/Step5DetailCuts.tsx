import React, { useState } from 'react';

interface UploadedImage {
    file: File;
    previewUrl: string;
    base64: string;
    mimeType: string;
}

interface Step5DetailCutsProps {
    productImages: UploadedImage[];
    onAddToPreview: (content: string, type: 'section' | 'image') => void;
}

const Step5DetailCuts: React.FC<Step5DetailCutsProps> = ({ productImages, onAddToPreview }) => {
    const [materialCareText, setMaterialCareText] = useState(`가죽 주의 사항

• 습기 주의: 습기 제거제 사용 권장
• 가죽 영양제: 월 1회 이상 영양 보충
• 직사광선: 변색 및 변형 주의
• 수분 방지: 방수 스프레이 사용
• 통풍 보관: 신발장 내부 환기 필수

제품 하자 시 처리:
배송 상태 확인 후 즉시 문의 주시기 바랍니다.
전자상거래법에 따라 제품 수령 후 7일 이내 교환/환불이 가능하며, 착용/사용 흔적이 없는 경우에 한정합니다.

A/S 안내:
고객센터: 070-4844-1711
카카오톡 채널: 스토어이름`);

    const [shippingText, setShippingText] = useState(`배송/교환/환불 안내

• 교환 및 반품
교환 및 반품 가능 기간: 상품 수령일로부터 7일 이내
단순 변심 및 주문 오류로 인한 교환/반품의 경우 왕복 배송비가 발생합니다.

• 교환 및 환불 불가 안내
- 신발의 변화 또는 착용 흔적이 있을 시
- 주문한 상품이 결함이 없는 경우 단순 변심
- 상품 수령일로부터 7일 후에 신고를 했을 경우
- 재판매가 불가능한 상품의 경우`);

    const addMaterialCareToPreview = () => {
        const htmlContent = `
<div style="padding: 40px 20px; background-color: #f9f9f9; font-family: 'Inter', sans-serif;">
    <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 20px; border-bottom: 1px solid #ddd; padding-bottom: 10px;">
        소재 관리 및 A/S
    </h3>
    <div style="font-size: 13px; line-height: 1.8; color: #555; white-space: pre-line;">
        ${materialCareText}
    </div>
</div>`;
        onAddToPreview(htmlContent, 'section');
        alert('템플릿이 상세페이지에 추가되었습니다!');
    };

    const addShippingToPreview = () => {
        const htmlContent = `
<div style="padding: 40px 20px; background-color: #f9f9f9; font-family: 'Inter', sans-serif;">
    <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 20px; border-bottom: 1px solid #ddd; padding-bottom: 10px;">
        배송/교환/환불
    </h3>
    <div style="font-size: 13px; line-height: 1.8; color: #555; white-space: pre-line;">
        ${shippingText}
    </div>
</div>`;
        onAddToPreview(htmlContent, 'section');
        alert('템플릿이 상세페이지에 추가되었습니다!');
    };

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-lg font-bold text-gray-900">Content Cuts</h3>
                <p className="text-xs text-gray-500 mt-0.5">상세페이지 템플릿 섹션을 편집하고 추가하세요</p>
            </div>

            {/* Material Care Template */}
            <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-900">🧴 소재 관리 및 A/S</h4>
                <textarea
                    value={materialCareText}
                    onChange={(e) => setMaterialCareText(e.target.value)}
                    className="w-full h-48 px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                    placeholder="소재 관리 및 A/S 내용을 입력하세요..."
                />
                <button
                    onClick={addMaterialCareToPreview}
                    className="w-full px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors"
                >
                    프리뷰에 추가
                </button>
            </div>

            {/* Shipping Template */}
            <div className="space-y-2 pt-4 border-t">
                <h4 className="text-sm font-semibold text-gray-900">🚚 배송/교환/환불</h4>
                <textarea
                    value={shippingText}
                    onChange={(e) => setShippingText(e.target.value)}
                    className="w-full h-48 px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                    placeholder="배송/교환/환불 내용을 입력하세요..."
                />
                <button
                    onClick={addShippingToPreview}
                    className="w-full px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors"
                >
                    프리뷰에 추가
                </button>
            </div>
        </div>
    );
};

export default Step5DetailCuts;
