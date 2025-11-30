import React, { useState, useRef, useEffect } from 'react';
import Step1PersonalShopper from './components/Step1PersonalShopper';
import Step2ProductDetails, { ResultItem } from './components/Step2ProductDetails';
import Step3ProductCuts from './components/Step3ProductCuts';
import Step4ModelCuts from './components/Step4ModelCuts';
import Step5DetailCuts from './components/Step5DetailCuts';
import Step5FinalReview from './components/Step5FinalReview';
import DraggablePreview, { PreviewItem } from './components/DraggablePreview';
import { generateSimpleHTML } from './services/htmlGenerator';
import { chatWithGemini } from './services/geminiService';
import './DetailStorageApp.css';

// Icons
const ICONS = {
    step1: '🛍️',
    step2: '📝',
    step3: '📸',
    step4: '💃',
    step5: '🔍',
    step6: '✅',
    chat: '💬',
    zoomIn: '➕',
    zoomOut: '➖',
    reset: '↺'
};

export interface UploadedImage {
    file: File;
    previewUrl: string;
    base64: string;
    mimeType: string;
}

interface CompatibleUploadedImage {
    file: File;
    previewUrl: string;
    base64: string;
    mimeType: string;
}

interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

const DetailStorageApp = () => {
    // --- State Management ---
    const [currentStep, setCurrentStep] = useState<number>(1); // Keep for compatibility if needed
    const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
    const [step2Results, setStep2Results] = useState<ResultItem[]>([]);
    const [draggableItems, setDraggableItems] = useState<PreviewItem[]>([]);
    const [compatibleImages, setCompatibleImages] = useState<CompatibleUploadedImage[]>([]);
    const [viewMode, setViewMode] = useState<'main' | 'mobile' | 'desktop'>('main');

    // Canvas State
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
    const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

    // UI State
    const [activePanel, setActivePanel] = useState<number | null>(null); // Start closed (Empty screen)
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
        { role: 'model', text: 'Welcome to AI Studio Vision PRO! This powerful tool helps you create stunning detail pages. Click any tool on the left toolbar to get started. What would you like to create today? 🎨' }
    ]);
    const [chatInput, setChatInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);

    const canvasRef = useRef<HTMLDivElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // --- Effects ---
    useEffect(() => {
        const compatible = uploadedImages.map(img => ({
            file: img.file,
            previewUrl: img.previewUrl,
            base64: img.base64,
            mimeType: img.mimeType
        }));
        setCompatibleImages(compatible);
    }, [uploadedImages]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    // --- Canvas Logic ---
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom(prev => Math.max(0.25, Math.min(3, prev + delta)));
    };

    const handleCanvasMouseDown = (e: React.MouseEvent) => {
        setIsDraggingCanvas(true);
        setLastMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleCanvasMouseMove = (e: React.MouseEvent) => {
        if (isDraggingCanvas) {
            const dx = e.clientX - lastMousePos.x;
            const dy = e.clientY - lastMousePos.y;
            setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
            setLastMousePos({ x: e.clientX, y: e.clientY });
        }
    };

    const handleCanvasMouseUp = () => {
        setIsDraggingCanvas(false);
    };

    // --- Chat Logic ---
    const handleSendMessage = async () => {
        if (!chatInput.trim() || isChatLoading) return;

        const userMsg = chatInput;
        setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setChatInput('');
        setIsChatLoading(true);

        try {
            const history = chatMessages.map(msg => ({
                role: msg.role,
                parts: [{ text: msg.text }]
            }));

            const responseText = await chatWithGemini(userMsg, history);
            setChatMessages(prev => [...prev, { role: 'model', text: responseText }]);
        } catch (error) {
            console.error('Chat Error:', error);
            setChatMessages(prev => [...prev, { role: 'model', text: 'Sorry, I encountered an error. Please try again.' }]);
        } finally {
            setIsChatLoading(false);
        }
    };

    // Generate Simple HTML
    const generateSimpleHTML = (items: PreviewItem[]) => {
        const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Product Detail Page</title>
</head>
<body>
    <div class="product-detail">
        ${items.map((item) => {
            if (item.type === 'image' && item.imageUrl) {
                return `<img src="${item.imageUrl}" alt="${item.title}" style="width: 100%; display: block;" />`;
            } else if (item.type === 'section' && item.content) {
                return `<div class="section"><pre>${item.content}</pre></div>`;
            }
            return '';
        }).join('\n')}
    </div>
</body>
</html>
        `;

        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'detail-page.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Download Preview as JPG
    const downloadAsJPG = async () => {
        const previewElement = document.querySelector('.ds-preview-area');
        if (!previewElement) {
            alert('프리뷰 영역을 찾을 수 없습니다.');
            return;
        }

        try {
            const html2canvas = (await import('html2canvas')).default;
            const canvas = await html2canvas(previewElement as HTMLElement, {
                backgroundColor: '#ffffff',
                scale: 2, // 고화질
            });

            canvas.toBlob((blob) => {
                if (!blob) return;
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `detail-page-${Date.now()}.jpg`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 'image/jpeg', 0.95);
        } catch (error) {
            console.error('JPG 다운로드 오류:', error);
            alert('JPG 다운로드 중 오류가 발생했습니다.');
        }
    };

    const handleAddToPreview = (content: string, type: 'section' | 'image') => {
        setDraggableItems(prev => [...prev, {
            id: Math.random().toString(36).substr(2, 9),
            type: type,
            content: type === 'section' ? content : '',
            imageUrl: type === 'image' ? content : undefined,
            title: type === 'section' ? 'Section' : 'Image',
            isSelected: false
        }]);
    };

    // --- Render Helpers ---
    const renderConfigPanel = () => {
        switch (activePanel) {
            case 1:
                return <Step1PersonalShopper
                    onNext={() => setActivePanel(2)}
                    onAddToPreview={handleAddToPreview}
                    onImagesChange={setUploadedImages}
                    initialImages={uploadedImages}
                />;
            case 2:
                return (
                    <Step2ProductDetails
                        uploadedImages={uploadedImages}
                        onNext={() => setActivePanel(3)}
                        results={step2Results}
                        setResults={setStep2Results}
                        onAddToPreview={handleAddToPreview}
                    />
                );
            case 3:
                return (
                    <Step3ProductCuts
                        uploadedImages={uploadedImages}
                        onNext={() => setActivePanel(4)}
                        onAddToPreview={handleAddToPreview}
                    />
                );
            case 4:
                return (
                    <Step4ModelCuts
                        productImages={compatibleImages}
                        onAddToPreview={handleAddToPreview}
                    />
                );
            case 5:
                return (
                    <Step5DetailCuts
                        productImages={compatibleImages}
                        onAddToPreview={handleAddToPreview}
                    />
                );
            case 6:
                return (
                    <Step5FinalReview
                        draggableItems={draggableItems}
                        setDraggableItems={setDraggableItems}
                        onDownloadHTML={() => generateSimpleHTML(draggableItems)}
                    />
                );
            default:
                return <div className="p-8 text-gray-500">Select a tool from the left toolbar.</div>;
        }
    };

    return (
        <div className="ds-app-container">
            {/* Floating Left Toolbar */}
            <div className="ds-floating-toolbar">
                <button className={`ds-tool-btn ${activePanel === 1 ? 'active' : ''}`} onClick={() => setActivePanel(activePanel === 1 ? null : 1)} title="제품 정보">{ICONS.step1}</button>
                <button className={`ds-tool-btn ${activePanel === 2 ? 'active' : ''}`} onClick={() => setActivePanel(activePanel === 2 ? null : 2)} title="제품 보정">{ICONS.step2}</button>
                <button className={`ds-tool-btn ${activePanel === 3 ? 'active' : ''}`} onClick={() => setActivePanel(activePanel === 3 ? null : 3)} title="제품컷">{ICONS.step3}</button>
                <button className={`ds-tool-btn ${activePanel === 4 ? 'active' : ''}`} onClick={() => setActivePanel(activePanel === 4 ? null : 4)} title="모델컷">{ICONS.step4}</button>
                <button className={`ds-tool-btn ${activePanel === 5 ? 'active' : ''}`} onClick={() => setActivePanel(activePanel === 5 ? null : 5)} title="콘텐츠컷">{ICONS.step5}</button>
                <button className={`ds-tool-btn ${activePanel === 6 ? 'active' : ''}`} onClick={() => setActivePanel(activePanel === 6 ? null : 6)} title="최종 검토">{ICONS.step6}</button>
                <div className="h-px bg-gray-200 my-2" />
                <button className={`ds-tool-btn ${isChatOpen ? 'active' : ''}`} onClick={() => setIsChatOpen(!isChatOpen)} title="AI 채팅">{ICONS.chat}</button>
            </div>

            {/* Floating Top Bar (Only for Final Review - Step 6) */}
            {activePanel === 6 && (
                <div className="ds-floating-topbar">
                    <button
                        className={`ds-view-btn ${viewMode === 'main' ? 'active' : ''}`}
                        onClick={() => setViewMode('main')}
                    >
                        🎨 MAIN
                    </button>
                    <button
                        className={`ds-view-btn ${viewMode === 'mobile' ? 'active' : ''}`}
                        onClick={() => setViewMode('mobile')}
                    >
                        📱 Mobile
                    </button>
                    <button
                        className={`ds-view-btn ${viewMode === 'desktop' ? 'active' : ''}`}
                        onClick={() => setViewMode('desktop')}
                    >
                        💻 Desktop
                    </button>
                    <div className="w-px h-4 bg-gray-300 mx-2"></div>
                    <button onClick={() => generateSimpleHTML(draggableItems)} className="text-xs font-bold text-blue-600 hover:text-blue-800 px-3">
                        Download HTML
                    </button>
                    <button onClick={() => downloadAsJPG()} className="text-xs font-bold text-green-600 hover:text-green-800 px-3">
                        Download JPG
                    </button>
                </div>
            )}

            {/* Floating Right Panel (Config or Chat) */}
            {(activePanel || isChatOpen) && (
                <div className="ds-floating-panel">
                    <div className="ds-panel-header">
                        <h2 className="text-lg font-bold">
                            {activePanel === 1 && 'Product Info'}
                            {activePanel === 2 && 'Product Enhancement'}
                            {activePanel === 3 && 'Product Cuts'}
                            {activePanel === 4 && 'Model Lookbook'}
                            {activePanel === 5 && 'Content Cuts'}
                            {activePanel === 6 && 'Final Review'}
                            {!activePanel && isChatOpen && 'AI Assistant'}
                        </h2>
                        <button onClick={() => { setActivePanel(null); setIsChatOpen(false); }} className="text-gray-400 hover:text-gray-600">✕</button>
                    </div>

                    {activePanel ? (
                        <div className="ds-panel-content">
                            {renderConfigPanel()}
                        </div>
                    ) : isChatOpen ? (
                        <>
                            <div className="ds-chat-messages">
                                {chatMessages.map((msg, idx) => (
                                    <div key={idx} className={`ds-message ${msg.role === 'user' ? 'user' : 'ai'}`}>
                                        {msg.text}
                                    </div>
                                ))}
                                {isChatLoading && <div className="ds-message ai">Thinking...</div>}
                                <div ref={chatEndRef} />
                            </div>
                            <div className="ds-chat-input-area">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        className="flex-1 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white"
                                        placeholder="Ask Gemini..."
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    />
                                    <button
                                        className="bg-black text-white rounded-xl px-4 py-2 text-sm font-bold hover:bg-gray-800 transition-colors"
                                        onClick={handleSendMessage}
                                        disabled={isChatLoading}
                                    >
                                        Send
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : null}
                </div>
            )}

            {/* Main Canvas Area */}
            <div
                className="ds-canvas-area"
                ref={canvasRef}
            >
                <div
                    className="ds-canvas-content"
                >
                    {draggableItems.length === 0 ? (
                        // Empty State: Clean canvas
                        <div className="absolute inset-0 pointer-events-none select-none" style={{ width: '100vw', height: '100vh' }}>
                            {/* Intentionally blank for clean canvas */}
                        </div>
                    ) : (
                        // Content State: 860px Detail Page Canvas
                        <div
                            className="absolute bg-white shadow-2xl"
                            onWheel={handleWheel}
                            onMouseDown={handleCanvasMouseDown}
                            onMouseMove={handleCanvasMouseMove}
                            onMouseUp={handleCanvasMouseUp}
                            onMouseLeave={handleCanvasMouseUp}
                            style={{
                                left: '50%',
                                top: '100px',
                                width: viewMode === 'main' ? '860px' : viewMode === 'mobile' ? '375px' : '1200px',
                                transform: `translate(calc(-50% + ${pan.x}px), ${pan.y}px) scale(${zoom})`,
                                transformOrigin: 'top center',
                                minHeight: '1200px',
                                borderRadius: '0px',
                                cursor: isDraggingCanvas ? 'grabbing' : 'grab',
                            }}
                        >
                            {/* Draggable Preview Content */}
                            <div className="w-full">
                                <DraggablePreview
                                    items={draggableItems}
                                    onReorder={setDraggableItems}
                                    onDeleteItem={(id) => setDraggableItems(prev => prev.filter(item => item.id !== id))}
                                    onDuplicateItem={(id) => {
                                        const itemToDuplicate = draggableItems.find(item => item.id === id);
                                        if (itemToDuplicate) {
                                            setDraggableItems(prev => {
                                                const index = prev.findIndex(item => item.id === id);
                                                const newItems = [...prev];
                                                newItems.splice(index + 1, 0, {
                                                    ...itemToDuplicate,
                                                    id: Math.random().toString(36).substr(2, 9),
                                                    title: itemToDuplicate.title ? `${itemToDuplicate.title} (Copy)` : undefined
                                                });
                                                return newItems;
                                            });
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Canvas Controls */}
                <div className="ds-canvas-controls" style={{ right: (activePanel || isChatOpen) ? '400px' : '24px' }}>
                    <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}>{ICONS.zoomOut}</button>
                    <span className="text-xs font-mono w-12 text-center">{Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom(z => Math.min(3, z + 0.1))}>{ICONS.zoomIn}</button>
                    <div className="w-px h-4 bg-gray-300 mx-1"></div>
                    <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} title="Reset View">{ICONS.reset}</button>
                </div>
            </div>
        </div>
    );
};

export default DetailStorageApp;
