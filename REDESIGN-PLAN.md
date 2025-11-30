# UI/UX Redesign Plan - Model Generator Layout for All Apps

## Target Layout (Model Generator Style)

```
┌─────────────────────────────────────────────────────┐
│ ← HOME                    AI Fashion Hub            │
├──────────────┬──────────────────────────────────────┤
│              │                                       │
│  SIDEBAR     │         MAIN RESULTS AREA            │
│  (입력 UI)    │         (생성 결과)                    │
│              │                                       │
│  01. Step 1  │                                       │
│  [Upload]    │          Generated Images             │
│              │          [Download] [Refine]          │
│  02. Step 2  │                                       │
│  [Upload]    │                                       │
│              │                                       │
│  03. Step 3  │                                       │
│  [Settings]  │                                       │
│              │                                       │
│  [Generate]  │                                       │
│              │                                       │
└──────────────┴──────────────────────────────────────┘
```

## Apps to Redesign

### 1. ✅ Model Generator (Reference)
- Already has perfect sidebar + main layout
- Use as template

### 2. 🔄 Content Generator
- Current: Tab-based
- Target: Sidebar (01. 교체할 사진, 02. 제품 사진) + Main (results)

### 3. 🔄 Shoe Editor  
- Current: Has sidebar but different style
- Target: Match Model Generator style exactly

### 4. 🔄 Detail Generator (Most Complex)
- Current: StartScreen → Results (no sidebar)
- Target: Sidebar (01. 제품, 02. 모델, 03. 설정) + Main (preview)

## Key Principles
✅ API logic 100% preserved
✅ Consistent sidebar width
✅ Unified MIZU styling (fonts, colors, spacing)
✅ Clear step numbers (01, 02, 03)
✅ Same button styles
