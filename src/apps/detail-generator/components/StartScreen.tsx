
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback } from 'react';
import { ArrowRightIcon, UploadCloudIcon, XIcon, SparklesIcon, RotateCcwIcon, ArrowLeftIcon, CameraIcon, Wand2Icon, LayoutTemplateIcon, ShirtIcon, HistoryIcon } from './icons';
import Spinner from './Spinner';


interface StartScreenProps {
  onGenerate: (
    productFiles: File[],
    modelFiles: File[],
    mode: 'original' | 'studio' | 'frame'
  ) => void;
  isLoading: boolean;
  onOpenInstructions: () => void;
  onHtmlImport: (htmlFile: File) => void;
}

// Helper function to sort files based on numbers in their filenames
const sortFilesByNumberInName = (files: File[]): File[] => {
  const getNumber = (name: string): number => {
    const match = name.match(/(\d+)/);
    return match ? parseInt(match[0], 10) : Infinity;
  };

  return [...files].sort((a, b) => {
    const numA = getNumber(a.name);
    const numB = getNumber(b.name);
    return numA - numB;
  });
};

const FileUploader: React.FC<{
  title: string;
  description: string;
  files: File[];
  onFilesAdded: (files: FileList | null) => void;
  onFileRemoved: (index: number) => void;
  maxFiles?: number;
}> = ({ title, description, files, onFilesAdded, onFileRemoved, maxFiles }) => {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
      <h3 className="text-sm font-bold text-gray-800 mb-1">{title}</h3>
      <p className="text-xs text-gray-500 mb-3">{description}</p>

      {files.length > 0 && (
        <div className="space-y-2 mb-3 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
          {files.map((file, index) => (
            <div key={index} className="relative p-2 bg-gray-50 rounded-md border text-xs flex items-center justify-between">
              <span className="truncate pr-4 font-medium text-gray-700">{file.name}</span>
              <button onClick={() => onFileRemoved(index)} className="p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600">
                <XIcon className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <label
        className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); onFilesAdded(e.dataTransfer.files); }}
      >
        <UploadCloudIcon className="w-6 h-6 text-gray-400 mb-1" />
        <p className="text-xs text-center text-gray-500">클릭 또는 드래그</p>
        <input
          type="file"
          multiple
          className="hidden"
          accept="image/*"
          onChange={(e) => onFilesAdded(e.target.files)}
        />
      </label>
      {maxFiles && <p className="text-xs text-right text-gray-400 mt-1">{files.length} / {maxFiles}</p>}
    </div>
  );
};

const StartScreen: React.FC<StartScreenProps> = ({ onGenerate, isLoading, onOpenInstructions, onHtmlImport }) => {
  const [mode, setMode] = useState<'select' | 'original' | 'studio' | 'frame'>('select');
  const [productFiles, setProductFiles] = useState<File[]>([]);
  const [modelFiles, setModelFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDraggingHtml, setIsDraggingHtml] = useState(false);

  const handleProductFiles = (files: FileList | null) => {
    const selectedFiles = Array.from(files || []).filter(file => file.type.startsWith('image/'));
    if (selectedFiles.length === 0) return;
    const newFiles = [...productFiles, ...selectedFiles];
    setProductFiles(newFiles);
  };

  const handleModelFiles = (files: FileList | null) => {
    const selectedFiles = Array.from(files || []).filter(file => file.type.startsWith('image/'));
    if (selectedFiles.length === 0) return;
    setModelFiles(prev => {
      const newFiles = [...prev, ...selectedFiles];
      const limit = mode === 'original' ? 5 : undefined; // Original mode has a limit
      return limit ? newFiles.slice(0, limit) : newFiles;
    });
  };

  const handleHtmlFile = (files: FileList | null) => {
    if (files && files[0]) {
      if (files[0].type === 'text/html') {
        setError(null);
        onHtmlImport(files[0]);
      } else {
        setError('HTML 파일만 업로드할 수 있습니다.');
      }
    }
  };

  const handleRemoveProductFile = (index: number) => {
    setProductFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveModelFile = (index: number) => {
    setModelFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerateClick = () => {
    if (productFiles.length === 0) {
      setError('최소 1개 이상의 제품 이미지를 업로드해주세요.');
      return;
    }
    if (mode === 'studio' && modelFiles.length === 0) {
      setError('최소 1개 이상의 모델 이미지를 업로드해주세요.');
      return;
    }
    setError(null);
    const sortedProductFiles = sortFilesByNumberInName(productFiles);
    onGenerate(sortedProductFiles, modelFiles, mode as 'original' | 'studio' | 'frame');
  };

  const handleBackToSelect = () => {
    setMode('select');
    setProductFiles([]);
    setModelFiles([]);
    setError(null);
  };

  const isButtonDisabled = isLoading || productFiles.length === 0 || (mode === 'studio' && modelFiles.length === 0);

  return (
    <div className="flex flex-col lg:flex-row h-full">
      {/* Sidebar */}
      <aside className="w-full lg:w-[400px] bg-white border-r border-[#E5E5E5] flex flex-col overflow-hidden z-10 shadow-sm lg:shadow-none">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-[#F0F0F0]">
          <div className="flex items-center gap-2 mb-2">
            <ShirtIcon className="w-5 h-5 text-gray-700" />
            <h1 className="font-display text-xl font-bold text-gray-900">AI 상세페이지 생성기</h1>
          </div>
          <p className="text-sm text-gray-500">
            {mode === 'select' ? '원하는 생성 방식을 선택하여 시작하세요.' :
              mode === 'original' ? '제품과 모델 이미지를 합성합니다.' :
                mode === 'studio' ? '새로운 모델과 착장을 생성합니다.' :
                  '제품 사진으로 기본 틀을 잡습니다.'}
          </p>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          {mode === 'select' ? (
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 className="font-semibold text-blue-900 mb-2 text-sm">시작하기</h3>
                <p className="text-sm text-blue-800 leading-relaxed">
                  오른쪽 화면에서 원하시는 생성 모드를 선택해주세요. 각 모드별로 최적화된 워크플로우를 제공합니다.
                </p>
              </div>

              <div>
                <button onClick={onOpenInstructions} className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors text-left">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">지침 설정</h3>
                    <p className="text-xs text-gray-500 mt-1">AI 생성 규칙 커스터마이징</p>
                  </div>
                  <ArrowRightIcon className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <label
                  className={`flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 ${isDraggingHtml ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white hover:bg-gray-50'
                    }`}
                  onDragOver={(e) => { e.preventDefault(); setIsDraggingHtml(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setIsDraggingHtml(false); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingHtml(false);
                    handleHtmlFile(e.dataTransfer.files);
                  }}
                >
                  <UploadCloudIcon className="w-6 h-6 text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-gray-700 text-center">HTML 파일 불러오기</span>
                  <span className="text-xs text-gray-500 text-center mt-1">기존 작업물 수정</span>
                  <input type="file" className="hidden" accept=".html,text/html" onChange={(e) => handleHtmlFile(e.target.files)} />
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              <button onClick={handleBackToSelect} className="flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors mb-2">
                <ArrowLeftIcon className="w-4 h-4 mr-1" />
                모드 선택으로 돌아가기
              </button>

              <FileUploader
                title="1. 제품 이미지 업로드"
                description={
                  mode === 'original' ? "상세페이지용 제품 이미지 (권장: 7장)" :
                    mode === 'studio' ? "분석할 '주인공' 신발 사진" :
                      "기본 틀 생성용 제품 이미지"
                }
                files={productFiles}
                onFilesAdded={handleProductFiles}
                onFileRemoved={handleRemoveProductFile}
              />

              <FileUploader
                title={mode === 'frame' ? "2. 모델 이미지 (선택사항)" : "2. 모델 이미지 (필수)"}
                description={
                  mode === 'original' ? "1: 얼굴 클로즈업, 2: 전신 샷 (최대 5장)" :
                    mode === 'studio' ? "원하는 분위기/스타일 레퍼런스" :
                      "AI 참고용 모델 컷 (선택)"
                }
                files={modelFiles}
                onFilesAdded={handleModelFiles}
                onFileRemoved={handleRemoveModelFile}
                maxFiles={mode === 'original' ? 5 : undefined}
              />

              {error && <div className="p-3 bg-red-50 text-red-600 text-xs rounded-md border border-red-100 font-medium">{error}</div>}
            </div>
          )}
        </div>

        {/* Sidebar Footer (Generate Button) */}
        {mode !== 'select' && (
          <div className="p-6 border-t border-[#F0F0F0] bg-white">
            <button
              onClick={handleGenerateClick}
              disabled={isButtonDisabled}
              className="w-full flex items-center justify-center text-center bg-gray-900 text-white font-semibold py-3 px-4 rounded-lg transition-all hover:bg-gray-800 active:scale-95 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md"
            >
              {isLoading ? (
                <>
                  <Spinner />
                  <span className="ml-2 text-sm">생성 중...</span>
                </>
              ) : (
                <>
                  <span className="text-sm">
                    {mode === 'original' && '상세페이지 생성하기'}
                    {mode === 'studio' && '스튜디오 모델 생성하기'}
                    {mode === 'frame' && '페이지 프레임 생성하기'}
                  </span>
                  <ArrowRightIcon className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 bg-[#FAFAFA] overflow-y-auto relative">
        {mode === 'select' ? (
          <div className="h-full flex flex-col items-center justify-center p-8 md:p-12">
            <div className="max-w-4xl w-full space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-display font-bold text-gray-900">생성 모드 선택</h2>
                <p className="mt-2 text-gray-600">원하시는 작업 방식을 선택해주세요.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <button onClick={() => setMode('original')} className="flex flex-col items-center p-8 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all duration-300 group text-center h-full">
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors">
                    <CameraIcon className="w-8 h-8 text-blue-600 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">원본 생성</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">사용자가 업로드한 모델과 제품 이미지를 합성하여 상세페이지를 생성합니다.</p>
                </button>

                <button onClick={() => setMode('studio')} className="flex flex-col items-center p-8 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-purple-500 hover:shadow-md transition-all duration-300 group text-center h-full">
                  <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-purple-600 transition-colors">
                    <Wand2Icon className="w-8 h-8 text-purple-600 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">스튜디오 생성</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">스튜디오 배경에서 AI가 레퍼런스를 기반으로 새로운 모델과 착장을 생성합니다.</p>
                </button>

                <button onClick={() => setMode('frame')} className="flex flex-col items-center p-8 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-green-500 hover:shadow-md transition-all duration-300 group text-center h-full">
                  <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-green-600 transition-colors">
                    <LayoutTemplateIcon className="w-8 h-8 text-green-600 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">프레임 생성</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">제품 사진만으로 페이지의 기본 틀을 잡고, 나중에 모델 컷을 추가합니다.</p>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-gray-400">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              {mode === 'original' && <CameraIcon className="w-10 h-10 text-gray-300" />}
              {mode === 'studio' && <Wand2Icon className="w-10 h-10 text-gray-300" />}
              {mode === 'frame' && <LayoutTemplateIcon className="w-10 h-10 text-gray-300" />}
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {mode === 'original' && '원본 생성 모드'}
              {mode === 'studio' && '스튜디오 생성 모드'}
              {mode === 'frame' && '프레임 생성 모드'}
            </h3>
            <p className="max-w-md mx-auto text-gray-500">
              왼쪽 사이드바에서 이미지를 업로드하고 설정을 완료한 후<br />'생성하기' 버튼을 눌러주세요.
            </p>

            {/* Preview of uploaded images could go here */}
            {(productFiles.length > 0 || modelFiles.length > 0) && (
              <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl opacity-50 pointer-events-none">
                {[...productFiles, ...modelFiles].slice(0, 4).map((file, i) => (
                  <div key={i} className="aspect-[3/4] bg-gray-200 rounded-lg overflow-hidden">
                    <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
                {productFiles.length + modelFiles.length > 4 && (
                  <div className="aspect-[3/4] bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 font-medium">
                    +{productFiles.length + modelFiles.length - 4}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default StartScreen;