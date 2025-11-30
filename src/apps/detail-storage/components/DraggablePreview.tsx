/**
 * DraggablePreview Component (Compact Version)
 * Draggable preview with multi-selection, compact UI matching SectionOrderPanel style
 */

import React, { useState } from 'react';

export interface PreviewItem {
    id: string;
    type: 'section' | 'image';
    sectionType?: string;
    content: string;
    imageUrl?: string;
    title?: string;
    fontSize?: number;
    fontFamily?: string;
    textAlign?: 'left' | 'center' | 'right';
    isSelected?: boolean;
}

interface DraggablePreviewProps {
    items: PreviewItem[];
    onReorder: (newOrder: PreviewItem[]) => void;
    onSelectionChange?: (selectedIds: string[]) => void;
    onToggleSelection?: (id: string) => void;
    onDeleteItem?: (id: string) => void;  // NEW
    onDuplicateItem?: (id: string) => void;  // NEW
}

const DraggablePreview: React.FC<DraggablePreviewProps> = ({
    items,
    onReorder,
    onToggleSelection,
    onDeleteItem,
    onDuplicateItem
}) => {
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    // Context Menu State
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; itemId: string } | null>(null);

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        if (draggedIndex !== null && draggedIndex !== index) {
            setDragOverIndex(index);
        }
    };

    const handleDragLeave = () => {
        setDragOverIndex(null);
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();

        if (draggedIndex === null || draggedIndex === dropIndex) {
            setDraggedIndex(null);
            setDragOverIndex(null);
            return;
        }

        const newItems = [...items];
        const [draggedItem] = newItems.splice(draggedIndex, 1);
        newItems.splice(dropIndex, 0, draggedItem);

        onReorder(newItems);
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleSelectionToggle = (id: string, e: React.MouseEvent) => {
        // Don't stop propagation - allows clicking anywhere while keeping selections
        if (onToggleSelection) {
            onToggleSelection(id);
        }
    };

    // Context Menu Handlers
    const handleContextMenu = (e: React.MouseEvent, itemId: string) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            itemId
        });
    };

    const closeContextMenu = () => {
        setContextMenu(null);
    };

    const handleDeleteFromContext = () => {
        if (contextMenu && onDeleteItem) {
            onDeleteItem(contextMenu.itemId);
        }
        closeContextMenu();
    };

    const handleDuplicateFromContext = () => {
        if (contextMenu && onDuplicateItem) {
            onDuplicateItem(contextMenu.itemId);
        }
        closeContextMenu();
    };

    const handleSelectFromContext = () => {
        if (contextMenu && onToggleSelection) {
            onToggleSelection(contextMenu.itemId);
        }
        closeContextMenu();
    };

    // Close context menu when clicking outside
    React.useEffect(() => {
        const handleClick = () => closeContextMenu();
        if (contextMenu) {
            document.addEventListener('click', handleClick);
            return () => document.removeEventListener('click', handleClick);
        }
    }, [contextMenu]);

    const applyTypography = (content: string, fontSize: number, fontFamily?: string, textAlign?: string): string => {
        let processedContent = content;

        // 1. Scale inline font-sizes if fontSize is not 100%
        if (fontSize !== 100) {
            const ratio = fontSize / 100;
            // Replace font-size: XXpx with scaled value
            processedContent = processedContent.replace(/font-size:\s*([\d.]+)px/gi, (match, size) => {
                const newSize = parseFloat(size) * ratio;
                return `font-size:${newSize.toFixed(1)}px`;
            });
        }

        // 2. Apply font-family and text-align wrapper
        const styles: string[] = [];
        if (fontFamily && fontFamily !== 'default') styles.push(`font-family: ${fontFamily} !important`);
        if (textAlign) styles.push(`text-align: ${textAlign} !important`);

        // Also apply a general font-size scale for relative units (em, rem, %) or text without inline styles
        if (fontSize !== 100) styles.push(`font-size: ${fontSize}%`);

        if (styles.length === 0 && fontSize === 100) return processedContent;

        return `<div style="${styles.join('; ')};">${processedContent}</div>`;
    };

    return (
        <div className="space-y-2">
            {items.map((item, index) => (
                <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    onContextMenu={(e) => handleContextMenu(e, item.id)}
                    className={`group relative cursor-move transition-all ${draggedIndex === index
                        ? 'opacity-50 scale-95'
                        : dragOverIndex === index
                            ? 'border-t-2 border-blue-500'
                            : ''
                        }`}
                >
                    {/* Compact Selection Checkbox */}
                    <div className="absolute top-1 left-1 z-20">
                        <label
                            className="flex items-center gap-1 bg-white bg-opacity-90 px-1.5 py-0.5 rounded shadow cursor-pointer hover:bg-opacity-100"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <input
                                type="checkbox"
                                checked={item.isSelected || false}
                                onChange={(e) => handleSelectionToggle(item.id, e as any)}
                                className="h-3 w-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-xs font-semibold text-gray-700">선택</span>
                        </label>
                    </div>

                    {/* Compact Drag Handle */}
                    <div className="absolute top-1 right-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-blue-600 text-white px-2 py-0.5 rounded shadow flex items-center gap-1 text-xs font-semibold">
                            <span className="text-xs">⋮⋮</span>
                        </div>
                    </div>

                    {/* Compact Section Title */}
                    {item.type === 'section' && item.title && (
                        <div className="absolute top-8 left-1 z-10 bg-gray-800 bg-opacity-75 text-white px-1.5 py-0.5 rounded text-xs font-semibold flex items-center gap-1">
                            <span>{item.title}</span>
                            {(item.fontSize && item.fontSize !== 100) || (item.fontFamily && item.fontFamily !== 'default') ? (
                                <span className="bg-purple-500 px-1 rounded text-xs">
                                    {item.fontSize && item.fontSize !== 100 && `${item.fontSize}%`}
                                    {item.fontFamily && item.fontFamily !== 'default' && ' 🔤'}
                                </span>
                            ) : null}
                        </div>
                    )}

                    {/* Compact Image Badge */}
                    {item.type === 'image' && (
                        <div className="absolute top-8 left-1 z-10 bg-purple-600 text-white px-1.5 py-0.5 rounded text-xs font-semibold">
                            📸 이미지 {index + 1}
                        </div>
                    )}

                    {/* Compact Selected Highlight */}
                    {item.isSelected && (
                        <div className="absolute inset-0 border-2 border-green-500 rounded pointer-events-none z-5" />
                    )}

                    {/* Compact Border */}
                    <div className={`border rounded overflow-hidden transition-all ${draggedIndex === index
                        ? 'border-blue-400'
                        : item.isSelected
                            ? 'border-green-400 border-2'
                            : 'border-gray-200 group-hover:border-blue-300'
                        }`}>
                        {item.type === 'image' && item.imageUrl ? (
                            <img
                                src={item.imageUrl}
                                alt={`Product ${index + 1}`}
                                className="w-full h-auto block"
                                draggable={false}
                            />
                        ) : (
                            <div
                                className="text-sm"
                                dangerouslySetInnerHTML={{ __html: applyTypography(item.content, item.fontSize || 100, item.fontFamily, item.textAlign) }}
                            />
                        )}
                    </div>

                    {/* Compact Drop Indicator */}
                    {dragOverIndex === index && draggedIndex !== index && (
                        <div className="absolute -top-0.5 left-0 right-0 h-0.5 bg-blue-500 rounded-full shadow" />
                    )}
                </div>
            ))}

            {/* Context Menu */}
            {contextMenu && (
                <div
                    style={{
                        position: 'fixed',
                        top: contextMenu.y,
                        left: contextMenu.x,
                        zIndex: 9999
                    }}
                    className="bg-white rounded-lg shadow-2xl border-2 border-gray-200 py-1 min-w-[180px]"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={handleSelectFromContext}
                        className="w-full text-left px-4 py-2 hover:bg-blue-50 flex items-center gap-3 text-sm font-medium text-gray-700"
                    >
                        <span className="text-lg">☑️</span>
                        선택/선택 해제
                    </button>
                    {onDuplicateItem && (
                        <button
                            onClick={handleDuplicateFromContext}
                            className="w-full text-left px-4 py-2 hover:bg-green-50 flex items-center gap-3 text-sm font-medium text-gray-700"
                        >
                            <span className="text-lg">📋</span>
                            복제하기
                        </button>
                    )}
                    <div className="border-t border-gray-200 my-1"></div>
                    {onDeleteItem && (
                        <button
                            onClick={handleDeleteFromContext}
                            className="w-full text-left px-4 py-2 hover:bg-red-50 flex items-center gap-3 text-sm font-medium text-red-600"
                        >
                            <span className="text-lg">🗑️</span>
                            삭제하기
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default DraggablePreview;
