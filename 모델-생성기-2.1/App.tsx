
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { synthesizeCampaignImage, refineImage, generatePoseVariation } from './services/geminiService';
import { getFriendlyErrorMessage } from './lib/utils';
import Spinner from './components/Spinner';
import { UploadCloudIcon, Trash2Icon, ShirtIcon, XIcon, PlusIcon, DownloadIcon, SparklesIcon, ZoomInIcon, Wand2Icon, CameraIcon, CheckSquareIcon, FileDownIcon, StarIcon, UserIcon, CheckCircleIcon, ArrowRightIcon, ChevronRightIcon } from './components/icons';

type GeneratedModel = {
    id: string;
    url: string;
    type: 'campaign' | 'detail' | 'pose-variation';
};

const POSE_PRESETS = [
    { id: 'runway', label: '런웨이 워킹 (Runway)', prompt: 'Model walking confidently on a fashion runway, full body shot, dynamic movement.' },
    { id: 'sitting', label: '다리 꼬고 앉기 (Sitting)', prompt: 'Model sitting on a chair with legs crossed, elegant pose, looking at camera.' },
    { id: 'leaning', label: '벽에 기대기 (Leaning)', prompt: 'Model leaning casually against a wall, relaxed yet stylish posture.' },
    { id: 'low_angle', label: '로우 앵글 (Low Angle)', prompt: 'Low angle shot looking up at the model, empowering and tall stance.' },
    { id: 'back_view', label: '뒤돌아보기 (Looking Back)', prompt: 'Model standing with back to camera, looking back over shoulder, highlighting shoes.' },
    { id: 'front', label: '정면 클로즈업 (Front Full)', prompt: 'Straight on front view, symmetrical standing pose, arms at sides.' },
    { id: 'kneeling', label: '한쪽 무릎 꿇기 (Kneeling)', prompt: 'Model kneeling on one knee, fashion editorial style pose.' },
    { id: 'dynamic', label: '역동적인 점프 (Dynamic)', prompt: 'Model mid-air or in a dynamic motion pose, hair moving, energetic.' },
    { id: 'pockets', label: '주머니 손 (Hands in Pockets)', prompt: 'Model standing coolly with hands in pockets, casual chic vibe.' },
    { id: 'stroll', label: '자연스러운 걷기 (Stroll)', prompt: 'Model walking naturally on a street, candid style paparazzi shot.' },
];

const App: React.FC = () => {
    const [hasApiKey, setHasApiKey] = useState(false);
    const [shoeFiles, setShoeFiles] = useState<File[]>([]);
    const [shoeImageUrls, setShoeImageUrls] = useState<string[]>([]);
    const [faceFile, setFaceFile] = useState<File | null>(null);
    const [faceImageUrl, setFaceImageUrl] = useState<string | null>(null);
    const [baseModelFiles, setBaseModelFiles] = useState<File[]>([]);
    const [baseModelImageUrls, setBaseModelImageUrls] = useState<string[]>([]);
    const [generatedModels, setGeneratedModels] = useState<GeneratedModel[]>([]);
    const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);
    const [viewingModel, setViewingModel] = useState<GeneratedModel | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isRefining, setIsRefining] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isDraggingShoe, setIsDraggingShoe] = useState(false);
    const [isDraggingFace, setIsDraggingFace] = useState(false);
    const [isDraggingModel, setIsDraggingModel] = useState(false);
    const MAX_FILES = 10;

    useEffect(() => {
        const checkApiKey = async () => {
            if ((window as any).aistudio?.hasSelectedApiKey && await (window as any).aistudio.hasSelectedApiKey()) {
                setHasApiKey(true);
            }
        };
        checkApiKey();
    }, []);

    const handleConnectApiKey = async () => {
        try {
            if ((window as any).aistudio?.openSelectKey) {
                await (window as any).aistudio.openSelectKey();
                setHasApiKey(true);
            } else {
                setError("AI Studio API 초기화 실패.");
            }
        } catch (e: any) {
             if (e.message?.includes("Requested entity was not found")) {
                 setHasApiKey(false);
                 setError("API 키 연결 실패. 다시 시도해주세요.");
            }
        }
    };

    const handleShoeSelect = (files: FileList | null) => {
        if (!files) return;
        const newFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
        if (newFiles.length === 0) return;
        setShoeFiles(prev => [...prev, ...newFiles].slice(0, MAX_FILES));
        newFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = () => setShoeImageUrls(prev => [...prev, reader.result as string]);
            reader.readAsDataURL(file);
        });
    };

    const handleFaceSelect = (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const file = files[0];
        if (!file.type.startsWith('image/')) return;
        setFaceFile(file);
        const reader = new FileReader();
        reader.onload = () => setFaceImageUrl(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleModelSelect = (files: FileList | null) => {
        if (!files) return;
        const newFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
        if (newFiles.length === 0) return;
        setBaseModelFiles(prev => [...prev, ...newFiles].slice(0, MAX_FILES));
        newFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = () => setBaseModelImageUrls(prev => [...prev, reader.result as string]);
            reader.readAsDataURL(file);
        });
    };

    const removeShoe = (index: number) => {
        setShoeFiles(prev => prev.filter((_, i) => i !== index));
        setShoeImageUrls(prev => prev.filter((_, i) => i !== index));
    };
    const removeModel = (index: number) => {
        setBaseModelFiles(prev => prev.filter((_, i) => i !== index));
        setBaseModelImageUrls(prev => prev.filter((_, i) => i !== index));
    };

    const handleDrag = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };

    const handleGenerateCampaign = async () => {
        if (!hasApiKey) { handleConnectApiKey(); return; }
        if (isGenerating) return;
        if (shoeFiles.length === 0 || !faceFile || baseModelFiles.length === 0) {
            setError("세 가지 요소를 모두 업로드해주세요: 신발, 얼굴, 모델");
            return;
        }
        setIsGenerating(true);
        setError(null);
        setGeneratedModels([]);
        const total = baseModelFiles.length;
        setProgress({ current: 0, total });

        try {
            for (let i = 0; i < baseModelFiles.length; i++) {
                setLoadingMessage(`${i + 1}/${total} 컷 생성 중 | 얼굴 합성 및 조명 계산...`);
                setProgress({ current: i + 1, total });
                const targetShot = baseModelFiles[i];
                const newUrl = await synthesizeCampaignImage(targetShot, faceFile, shoeFiles);
                setGeneratedModels(prev => [...prev, { id: `campaign-${Date.now()}-${i}`, url: newUrl, type: 'campaign' }]);
            }
            setLoadingMessage("최종 렌더링 완료...");
        } catch (err) {
            setError(getFriendlyErrorMessage(err, '캠페인 생성 실패'));
        } finally {
            setIsGenerating(false);
            setLoadingMessage('');
            setProgress({ current: 0, total: 0 });
        }
    };

    const handleRefine = async () => {
        if (isRefining || selectedImageIds.length === 0) {
             if (selectedImageIds.length === 0) setError("보정할 이미지를 선택해주세요.");
             return;
        }
        setIsRefining(true);
        setError(null);
        setLoadingMessage("필름 그레인 추가 및 디테일 보정 중...");
        try {
            const selectedModels = generatedModels.filter(m => selectedImageIds.includes(m.id));
            for (const model of selectedModels) {
                 const refinedUrl = await refineImage(shoeFiles, model.url);
                 setGeneratedModels(prev => prev.map(m => m.id === model.id ? { ...m, url: refinedUrl } : m));
            }
        } catch (err) {
            setError(getFriendlyErrorMessage(err, '보정 실패'));
        } finally {
            setIsRefining(false);
            setLoadingMessage('');
        }
    };

    const handlePoseVariation = async (pose: { id: string, label: string, prompt: string }) => {
        if (!viewingModel || !faceFile) return;
        setIsGenerating(true);
        setLoadingMessage(`'${pose.label}' 포즈로 재생성 중...`);
        try {
            const newUrl = await generatePoseVariation(viewingModel.url, faceFile, shoeFiles, pose.prompt);
            const newModel: GeneratedModel = { id: `pose-${pose.id}-${Date.now()}`, url: newUrl, type: 'pose-variation' };
            setGeneratedModels(prev => [newModel, ...prev]);
            setViewingModel(newModel);
        } catch (err) {
             setError(getFriendlyErrorMessage(err, '자세 변경 실패'));
        } finally {
            setIsGenerating(false);
            setLoadingMessage('');
        }
    };

    const downloadImage = (url: string, filename: string) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadSelected = () => {
        generatedModels.filter(m => selectedImageIds.includes(m.id)).forEach((model, i) => {
            setTimeout(() => downloadImage(model.url, `campaign-shot-${i}.png`), i * 200);
        });
    };

    const toggleSelection = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setSelectedImageIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const openModal = (model: GeneratedModel) => setViewingModel(model);
    const closeModal = () => setViewingModel(null);

    const isLoading = isGenerating || isRefining;
    const canGenerate = shoeFiles.length > 0 && faceFile !== null && baseModelFiles.length > 0 && !isLoading;

    return (
        <div className="flex h-screen w-full bg-[#F4F4F5] overflow-hidden font-sans text-gray-900 selection:bg-indigo-500 selection:text-white">
            <aside className="w-[360px] bg-[#0F0F10] text-gray-300 flex flex-col shrink-0 z-30 shadow-2xl relative">
                <div className="px-8 py-8 border-b border-white/5 bg-[#0F0F10]">
                    <div className="flex items-center gap-3 text-white mb-1">
                        <CameraIcon className="w-5 h-5" />
                        <h1 className="text-xl font-serif tracking-widest font-bold">AI 패션 스튜디오</h1>
                    </div>
                    <p className="text-[11px] text-gray-500 tracking-wider uppercase pl-8">Gemini 3.0 Pro VFX Engine</p>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 custom-scrollbar-dark">
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-[11px] font-bold text-white/90 uppercase tracking-[0.1em] flex items-center gap-2">
                                01. 신발 제품 (Product)
                                {shoeFiles.length > 0 && <CheckCircleIcon className="w-3 h-3 text-emerald-500" />}
                            </h2>
                            <span className="text-[10px] text-gray-600">최대 10장</span>
                        </div>
                        <div 
                            className={`border border-dashed rounded-lg p-4 transition-all duration-300 ${isDraggingShoe ? 'border-indigo-500 bg-white/5' : 'border-white/10 bg-[#18181B] hover:border-white/20'}`}
                            onDragEnter={() => setIsDraggingShoe(true)}
                            onDragLeave={() => setIsDraggingShoe(false)}
                            onDragOver={handleDrag}
                            onDrop={(e) => { handleDrag(e); setIsDraggingShoe(false); handleShoeSelect(e.dataTransfer.files); }}
                        >
                            {shoeImageUrls.length > 0 ? (
                                <div className="grid grid-cols-3 gap-2">
                                    {shoeImageUrls.map((url, i) => (
                                        <div key={i} className="relative aspect-square rounded bg-black overflow-hidden group border border-white/5">
                                            <img src={url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                            <button onClick={() => removeShoe(i)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 hover:bg-red-500/80 transition-all"><XIcon className="w-2 h-2"/></button>
                                        </div>
                                    ))}
                                    <label className="flex items-center justify-center aspect-square bg-white/5 rounded border border-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                                        <PlusIcon className="w-4 h-4 text-gray-500" />
                                        <input type="file" multiple className="hidden" onChange={(e) => handleShoeSelect(e.target.files)} accept="image/*" />
                                    </label>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center h-32 cursor-pointer group">
                                    <UploadCloudIcon className="w-6 h-6 mb-3 text-gray-600 group-hover:text-indigo-400 transition-colors" />
                                    <span className="text-xs text-center text-gray-500 group-hover:text-gray-300">이미지 드래그 또는<br/>클릭하여 업로드</span>
                                    <input type="file" multiple className="hidden" onChange={(e) => handleShoeSelect(e.target.files)} accept="image/*" />
                                </label>
                            )}
                        </div>
                    </section>
                    <section>
                        <h2 className="text-[11px] font-bold text-white/90 uppercase tracking-[0.1em] mb-4 flex items-center gap-2">
                            02. 모델 얼굴 (Face ID)
                            {faceFile && <CheckCircleIcon className="w-3 h-3 text-emerald-500" />}
                        </h2>
                        <div 
                             className={`border border-dashed rounded-lg p-4 transition-all duration-300 ${isDraggingFace ? 'border-indigo-500 bg-white/5' : 'border-white/10 bg-[#18181B] hover:border-white/20'}`}
                             onDragEnter={() => setIsDraggingFace(true)}
                             onDragLeave={() => setIsDraggingFace(false)}
                             onDragOver={handleDrag}
                             onDrop={(e) => { handleDrag(e); setIsDraggingFace(false); handleFaceSelect(e.dataTransfer.files); }}
                        >
                             {faceImageUrl ? (
                                <div className="relative aspect-[3/4] rounded bg-black overflow-hidden group border border-white/5 mx-auto max-w-[160px]">
                                    <img src={faceImageUrl} className="w-full h-full object-cover opacity-90" />
                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50" />
                                    <div className="absolute bottom-2 left-2 text-[10px] text-white font-medium">Face ID Locked</div>
                                    <button onClick={() => { setFaceFile(null); setFaceImageUrl(null); }} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 hover:bg-red-500/80 transition-all"><XIcon className="w-3 h-3"/></button>
                                </div>
                             ) : (
                                <label className="flex flex-col items-center justify-center h-40 cursor-pointer group">
                                    <UserIcon className="w-8 h-8 mb-3 text-gray-600 group-hover:text-indigo-400 transition-colors" />
                                    <span className="text-xs text-center text-gray-500 group-hover:text-gray-300">고해상도 얼굴 사진<br/>(정면 사진 권장)</span>
                                    <input type="file" className="hidden" onChange={(e) => handleFaceSelect(e.target.files)} accept="image/*" />
                                </label>
                             )}
                        </div>
                    </section>
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-[11px] font-bold text-white/90 uppercase tracking-[0.1em] flex items-center gap-2">
                                03. 모델 포즈 (Model Poses)
                                {baseModelFiles.length > 0 && <CheckCircleIcon className="w-3 h-3 text-emerald-500" />}
                            </h2>
                        </div>
                        <div 
                            className={`border border-dashed rounded-lg p-4 transition-all duration-300 ${isDraggingModel ? 'border-indigo-500 bg-white/5' : 'border-white/10 bg-[#18181B] hover:border-white/20'}`}
                            onDragEnter={() => setIsDraggingModel(true)}
                            onDragLeave={() => setIsDraggingModel(false)}
                            onDragOver={handleDrag}
                            onDrop={(e) => { handleDrag(e); setIsDraggingModel(false); handleModelSelect(e.dataTransfer.files); }}
                        >
                            {baseModelImageUrls.length > 0 ? (
                                <div className="grid grid-cols-3 gap-2">
                                    {baseModelImageUrls.map((url, i) => (
                                        <div key={i} className="relative aspect-[3/4] rounded bg-black overflow-hidden group border border-white/5">
                                            <img src={url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                            <button onClick={() => removeModel(i)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 hover:bg-red-500/80 transition-all"><XIcon className="w-2 h-2"/></button>
                                        </div>
                                    ))}
                                     <label className="flex items-center justify-center aspect-[3/4] bg-white/5 rounded border border-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                                        <PlusIcon className="w-4 h-4 text-gray-500" />
                                        <input type="file" multiple className="hidden" onChange={(e) => handleModelSelect(e.target.files)} accept="image/*" />
                                    </label>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center h-40 cursor-pointer group">
                                    <ShirtIcon className="w-8 h-8 mb-3 text-gray-600 group-hover:text-indigo-400 transition-colors" />
                                    <span className="text-xs text-center text-gray-500 group-hover:text-gray-300">모델 전신 사진<br/>(포즈 참고용)</span>
                                    <input type="file" multiple className="hidden" onChange={(e) => handleModelSelect(e.target.files)} accept="image/*" />
                                </label>
                            )}
                        </div>
                    </section>
                </div>
                <div className="p-6 border-t border-white/5 bg-[#0F0F10]">
                    {!hasApiKey && (
                         <div className="mb-4 p-3 bg-indigo-900/20 border border-indigo-500/30 rounded text-[11px] text-indigo-300 flex items-center justify-between">
                            <span>API 키 연결 필요</span>
                            <button onClick={handleConnectApiKey} className="underline hover:text-white">연결하기</button>
                         </div>
                    )}
                    <button 
                        onClick={handleGenerateCampaign} 
                        disabled={!canGenerate && hasApiKey} 
                        className={`w-full py-4 rounded font-serif text-lg transition-all shadow-xl flex items-center justify-center gap-3 relative overflow-hidden
                            ${canGenerate 
                                ? 'bg-white text-black hover:bg-gray-200' 
                                : 'bg-[#27272A] text-gray-500 cursor-not-allowed'}`}
                    >
                        {isGenerating ? (
                            <>
                                <Spinner />
                                <span className="text-sm font-sans tracking-widest uppercase">생성 중...</span>
                            </>
                        ) : (
                            <>
                                <SparklesIcon className={`w-5 h-5 ${canGenerate ? 'text-indigo-600' : 'text-gray-600'}`} />
                                <span>캠페인 생성 시작</span>
                            </>
                        )}
                    </button>
                    {!hasApiKey && (
                        <button onClick={handleConnectApiKey} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" aria-label="Connect API Key"></button>
                    )}
                </div>
            </aside>
            <main className="flex-1 relative flex flex-col h-full overflow-hidden">
                <header className="absolute top-0 left-0 right-0 h-24 px-8 flex items-center justify-between z-20 bg-gradient-to-b from-[#F4F4F5] via-[#F4F4F5]/90 to-transparent pointer-events-none">
                    <div className="pointer-events-auto mt-4">
                        <h2 className="text-3xl font-serif text-gray-900 tracking-tight">캠페인 결과물 (Campaign)</h2>
                        <p className="text-xs text-gray-500 mt-1 font-medium tracking-wide">
                            {generatedModels.length} 장 생성됨
                        </p>
                    </div>
                    <div className="flex items-center gap-3 pointer-events-auto mt-4">
                        <AnimatePresence>
                            {selectedImageIds.length > 0 && (
                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex items-center gap-2">
                                    <button onClick={handleRefine} disabled={isRefining} className="px-5 py-2.5 bg-white border border-gray-200 text-gray-800 rounded shadow-sm hover:shadow-md hover:border-gray-300 transition-all text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                        <StarIcon className="w-3 h-3 text-indigo-500" />
                                        필름 질감 보정
                                    </button>
                                    <button onClick={handleDownloadSelected} className="px-5 py-2.5 bg-black text-white rounded shadow-lg hover:bg-gray-800 transition-all text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                        <FileDownIcon className="w-3 h-3" />
                                        다운로드 ({selectedImageIds.length})
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </header>
                <AnimatePresence>
                    {error && (
                        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="absolute top-24 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded shadow-2xl text-sm font-medium flex items-center gap-3">
                            <XIcon className="w-4 h-4 cursor-pointer opacity-80 hover:opacity-100" onClick={() => setError(null)}/>
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>
                <div className="flex-1 overflow-y-auto pt-28 pb-12 px-8 custom-scrollbar">
                    {isLoading && generatedModels.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center">
                            <Spinner />
                            <p className="mt-8 font-serif text-2xl text-gray-800 animate-pulse">{loadingMessage}</p>
                            <p className="mt-3 text-xs text-gray-400 uppercase tracking-[0.2em]">Gemini 3.0 Pro Visual Synthesis</p>
                        </div>
                    ) : generatedModels.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {generatedModels.map((model) => {
                                const isSelected = selectedImageIds.includes(model.id);
                                return (
                                    <div key={model.id} className="group relative">
                                        <div 
                                            onClick={() => openModal(model)}
                                            className={`aspect-[3/4] bg-white rounded overflow-hidden cursor-pointer shadow-sm transition-all duration-500 relative
                                                ${isSelected ? 'ring-2 ring-offset-4 ring-indigo-500 shadow-xl' : 'hover:shadow-2xl hover:-translate-y-1'}`}
                                        >
                                            <img src={model.url} alt="Generated" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                 <span className="bg-white/90 text-black text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider">
                                                     {model.type === 'pose-variation' ? '자세 변경' : '캠페인'}
                                                 </span>
                                            </div>
                                        </div>
                                        <div className="mt-3 flex items-center justify-between px-1">
                                            <span className="text-[10px] text-gray-400 font-mono uppercase truncate w-24">ID: {model.id.split('-').pop()}</span>
                                            <button 
                                                onClick={(e) => toggleSelection(e, model.id)} 
                                                className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded transition-colors
                                                    ${isSelected ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-200'}`}
                                            >
                                                {isSelected ? <CheckSquareIcon className="w-3 h-3" /> : <div className="w-3 h-3 border border-current rounded-sm" />}
                                                {isSelected ? '선택됨' : '선택'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center opacity-40">
                            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center mb-6">
                                <SparklesIcon className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-serif text-gray-800 mb-2">스튜디오가 준비되었습니다</h3>
                            <p className="text-sm text-gray-500 max-w-xs text-center leading-relaxed">
                                좌측 사이드바에서 신발, 얼굴, 모델 사진을 업로드하여<br/>나만의 VFX 캠페인을 완성하세요.
                            </p>
                        </div>
                    )}
                </div>
                <AnimatePresence>
                    {isLoading && generatedModels.length > 0 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-white/80 backdrop-blur-sm z-40 flex flex-col items-center justify-center">
                            <Spinner />
                            <p className="mt-6 font-serif text-xl text-gray-900">{loadingMessage}</p>
                            <div className="w-64 h-0.5 bg-gray-200 mt-6 rounded-full overflow-hidden">
                                <motion.div 
                                    className="h-full bg-indigo-600" 
                                    initial={{ width: "0%" }} 
                                    animate={{ width: `${(progress.current / Math.max(progress.total, 1)) * 100}%` }} 
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
            <AnimatePresence>
                {viewingModel && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeModal}
                        className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex"
                    >
                        <div className="flex-1 flex items-center justify-center p-8 relative">
                            <motion.img 
                                key={viewingModel.url}
                                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} 
                                src={viewingModel.url} alt="Detail View" onClick={(e) => e.stopPropagation()}
                                className="max-w-full max-h-full object-contain shadow-2xl bg-[#0a0a0a]" 
                            />
                            <button onClick={(e) => { e.stopPropagation(); closeModal(); }} className="absolute top-6 left-6 text-white/50 hover:text-white transition-colors">
                                <XIcon className="w-8 h-8" />
                            </button>
                        </div>
                        <motion.div 
                            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} onClick={(e) => e.stopPropagation()}
                            className="w-[320px] bg-[#121212] border-l border-white/10 flex flex-col overflow-hidden"
                        >
                            <div className="p-6 border-b border-white/10">
                                <h3 className="text-white font-serif text-xl tracking-wide">자세 변경 (Pose)</h3>
                                <p className="text-gray-500 text-xs mt-1">현재 모델과 얼굴을 유지하며 자세만 변경합니다.</p>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar-dark">
                                <div className="space-y-2">
                                    {POSE_PRESETS.map((pose) => (
                                        <button
                                            key={pose.id}
                                            onClick={() => handlePoseVariation(pose)}
                                            disabled={isGenerating}
                                            className="w-full text-left p-3 rounded bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/20 transition-all flex items-center justify-between group"
                                        >
                                            <div className="text-gray-200 text-sm font-medium">{pose.label}</div>
                                            <ChevronRightIcon className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="p-6 border-t border-white/10 space-y-3">
                                <button 
                                    onClick={() => downloadImage(viewingModel!.url, `vfx-campaign-${viewingModel!.id}.png`)}
                                    className="w-full py-3 bg-white text-black rounded-full font-bold uppercase tracking-widest text-xs hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                                >
                                    <DownloadIcon className="w-4 h-4" />
                                    다운로드
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
export default App;
