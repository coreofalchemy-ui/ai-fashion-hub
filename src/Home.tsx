import { Link } from 'react-router-dom';

export function Home() {
    return (
        <div className="min-h-screen bg-[#FAFAFA]">
            {/* Hero Section */}
            <div className="max-w-[1440px] mx-auto px-6 md:px-12 pt-20 md:pt-32 pb-16">
                <h1 className="font-display text-[clamp(48px,8vw,96px)] font-[800] leading-[0.9] tracking-[-0.03em] text-black mb-6">
                    AI FASHION
                    <br />
                    HUB
                </h1>
                <p className="font-primary text-lg md:text-xl text-[#666666] max-w-[600px] mb-4">
                    패션 AI 생성 툴킷
                </p>
                <p className="font-primary text-sm text-[#999999]">
                    Powered by Google Gemini 3.0 Pro
                </p>
            </div>

            {/* Apps Grid */}
            <div className="max-w-[1440px] mx-auto px-6 md:px-12 pb-20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                    {/* Model Generator */}
                    <Link
                        to="/model-generator"
                        className="group block bg-white border border-[#F0F0F0] hover:border-[#E5E5E5] transition-all duration-300 hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] hover:-translate-y-1"
                    >
                        <div className="p-8 md:p-12">
                            <div className="text-5xl mb-6">👗</div>
                            <h2 className="font-display text-2xl md:text-3xl font-[700] text-black mb-3">
                                모델 생성기
                            </h2>
                            <p className="font-primary text-[#666666] text-sm leading-relaxed">
                                패션 캠페인 이미지 생성 - 얼굴 합성, 신발 교체, 포즈 변형
                            </p>
                        </div>
                    </Link>

                    {/* Detail Generator */}
                    <Link
                        to="/detail-generator"
                        className="group block bg-white border border-[#F0F0F0] hover:border-[#E5E5E5] transition-all duration-300 hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] hover:-translate-y-1"
                    >
                        <div className="p-8 md:p-12">
                            <div className="text-5xl mb-6">📄</div>
                            <h2 className="font-display text-2xl md:text-3xl font-[700] text-black mb-3">
                                상세페이지 생성기
                            </h2>
                            <p className="font-primary text-[#666666] text-sm leading-relaxed">
                                쇼핑몰 상세페이지 완전 생성 - 모델 촬영, 클로즈업, 텍스트, HTML
                            </p>
                        </div>
                    </Link>

                    {/* Shoe Editor */}
                    <Link
                        to="/shoe-editor"
                        className="group block bg-white border border-[#F0F0F0] hover:border-[#E5E5E5] transition-all duration-300 hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] hover:-translate-y-1"
                    >
                        <div className="p-8 md:p-12">
                            <div className="text-5xl mb-6">👟</div>
                            <h2 className="font-display text-2xl md:text-3xl font-[700] text-black mb-3">
                                신발 이미지 AI 에디터
                            </h2>
                            <p className="font-primary text-[#666666] text-sm leading-relaxed">
                                제품 이미지 전문 편집 - 누끼, 스튜디오 효과, 색상 변경
                            </p>
                        </div>
                    </Link>

                    {/* Content Generator */}
                    <Link
                        to="/content-generator"
                        className="group block bg-white border border-[#F0F0F0] hover:border-[#E5E5E5] transition-all duration-300 hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] hover:-translate-y-1"
                    >
                        <div className="p-8 md:p-12">
                            <div className="text-5xl mb-6">✨</div>
                            <h2 className="font-display text-2xl md:text-3xl font-[700] text-black mb-3">
                                패션 콘텐츠 생성기
                            </h2>
                            <p className="font-primary text-[#666666] text-sm leading-relaxed">
                                빠른 신발 교체 및 포즈 변경 - 간단하고 빠른 콘텐츠 제작
                            </p>
                        </div>
                    </Link>

                    {/* Detail Storage */}
                    <Link
                        to="/detail-storage"
                        className="group block bg-white border border-[#F0F0F0] hover:border-[#E5E5E5] transition-all duration-300 hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] hover:-translate-y-1"
                    >
                        <div className="p-8 md:p-12">
                            <div className="text-5xl mb-6">📦</div>
                            <h2 className="font-display text-2xl md:text-3xl font-[700] text-black mb-3">
                                상세페이지 스토리지
                            </h2>
                            <p className="font-primary text-[#666666] text-sm leading-relaxed">
                                4가지 앱 통합 공간 - 패션 AI 도구를 한 곳에서 관리
                            </p>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
