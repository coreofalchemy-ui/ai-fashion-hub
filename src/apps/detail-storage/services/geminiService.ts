/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Helper to get GoogleGenAI client
const getGenAIClient = (): GoogleGenAI => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) throw new Error("API key not found");
    return new GoogleGenAI({ apiKey });
};

// ============================================================================
// [ANTI-GRAVITY ENGINE] TYPE DEFINITIONS
// ============================================================================
export type Effect =
    'natural_light' |
    'cinematic' |
    'side_lighting' |
    'beautify' |
    'custom' |
    'studio_minimal_prop' |
    'studio_natural_floor' |
    'studio_texture_emphasis' |
    'studio_cinematic';

// Helper: File to Base64
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

// ============================================================================
// [ANTI-GRAVITY ENGINE] PROMPT LOGIC
// ============================================================================

/**
 * 효과(Effect) 및 포즈(Pose)에 따른 3D 렌더링 프롬프트를 생성합니다.
 * 이 함수가 엔진의 '두뇌' 역할을 합니다.
 */
const getPromptForEffect = (effect: Effect, poseId?: string): string => {

    // 1. SYSTEM PERSONA (핵심 역할 정의)
    // AI를 단순 편집자가 아닌 '3D 제품 시각화 엔진'으로 정의합니다.
    const SYSTEM_ROLE = `
**SYSTEM ROLE:** You are a "Technical 3D Product Visualization Engine" and "Master Retoucher".
**INPUT:** Raw reference photo of a shoe.
**OUTPUT:** A Photorealistic Commercial Asset (2K Resolution, Factory Fresh).

**[CRITICAL EXECUTION RULES]**
1.  **IDENTITY LOCK (Non-Negotiable):** 
    *   The shoe's LOGO, STITCHING, LACE PATTERN, and DESIGN LINES must be a 100% PERFECT CLONE of the reference.
    *   DO NOT hallucinate new features.
2.  **QUANTITY & GEOMETRY:**
    *   "SINGLE" mode = Render EXACTLY ONE shoe. Crop out or erase any partial second shoe.
    *   "PAIR" mode = Render EXACTLY TWO shoes.
    *   **ALIGNMENT:** The object must be visually CENTERED (X=50%, Y=50%). 
    *   **HORIZON:** The ground plane must be perfectly flat and horizontal.
3.  **SURFACE RE-SYNTHESIS (CGI MODE):**
    *   Treat the input as a "Geometry Reference Only".
    *   **DO NOT COPY PIXELS.** Re-render the surface to look "Factory Fresh".
    *   Remove all dust, wrinkles, glue marks, and scuffs.
    *   Fix lens distortion.
`;

    // 2. MODULE: BEAUTIFY (안티그래비티 아이솔레이션)
    if (effect === 'beautify') {
        let poseInstruction = '';

        // 포즈별 정밀 레이아웃 지시 (Strict Layout - Landscape)
        switch (poseId) {
            case 'left_profile_single':
                poseInstruction = `
                **[LAYOUT: SINGLE - LEFT PROFILE]**
                *   **QUANTITY:** ONLY 1 SHOE (Left Foot). [NEGATIVE: Pair, Double, Mirror].
                *   **ANGLE:** Perfect Side Profile (90 deg). Toe pointing Left.
                *   **COMPOSITION:** Horizontal Canvas. Shoe fills 85% width. Dead Center.
                `;
                break;
            case 'left_diagonal_single':
                poseInstruction = `
                **[LAYOUT: SINGLE - 3/4 ISOMETRIC]**
                *   **QUANTITY:** ONLY 1 SHOE (Left Foot). [NEGATIVE: Pair, Second shoe].
                *   **ANGLE:** 45-Degree Front-Left view. Best Angle.
                *   **COMPOSITION:** Horizontal Canvas. Shoe fills 85% width. Dead Center.
                `;
                break;
            case 'front_apart_pair':
                poseInstruction = `
                **[LAYOUT: PAIR - FRONT VIEW]**
                *   **QUANTITY:** 2 SHOES (Left & Right).
                *   **ARRANGEMENT:** Side-by-side. **GAP < 5% (Very Tight)**.
                *   **ANGLE:** Direct Front view.
                *   **COMPOSITION:** Horizontal Canvas. Pair fills 90% width.
                `;
                break;
            case 'rear_pair':
                poseInstruction = `
                **[LAYOUT: PAIR - REAR VIEW]**
                *   **QUANTITY:** 2 SHOES (Left & Right).
                *   **ARRANGEMENT:** Side-by-side, heels aligned. **GAP < 5% (Very Tight)**.
                *   **ANGLE:** Direct Rear view.
                `;
                break;
            case 'top_down_instep_pair':
                poseInstruction = `
                **[LAYOUT: PAIR - HIGH ANGLE]**
                *   **ANGLE:** 60-Degree Elevation (Looking down).
                *   **CRITICAL:** Hide the deep insole/heel cup. Focus on Laces and Vamp.
                *   **ARRANGEMENT:** **GAP < 5% (Very Tight)**.
                `;
                break;
            case 'left_diagonal_pair':
                poseInstruction = `
                **[LAYOUT: PAIR - DIAGONAL VIEW]**
                *   **QUANTITY:** 2 SHOES.
                *   **ANGLE:** Both angled 45 degrees left.
                *   **ARRANGEMENT:** One slightly forward. **GAP < 5% (Very Tight)**.
                `;
                break;
            default:
                poseInstruction = '**LAYOUT:** Standard Commercial Center.';
        }

        return `${SYSTEM_ROLE}
**[TASK: ANTI-GRAVITY ISOLATION RENDER]**

${poseInstruction}

**[RETOUCHING & LIGHTING ENGINE]**
1.  **LIGHTING RESET:** Delete original lighting. Use **"Softbox Studio Strobe"**. Even illumination.
2.  **COLOR GRADING:** 
    *   **White Balance:** FORCE NEUTRAL (5500K). Remove ALL yellow/orange indoor tints.
    *   **Blacks:** FORCE "JET BLACK" (#050505). Remove brown reflections.
    *   **Whites:** Crisp, clean white. No cream tint.
3.  **BACKGROUND:** PURE WHITE (#FFFFFF). No cast shadows (Floating).
`;
    }

    // 3. MODULE: STUDIO BASE (스튜디오 공통 설정 - 가로형)
    const studioBase = `${SYSTEM_ROLE}
**[TASK: HIGH-END EDITORIAL CAMPAIGN]**
**FORMAT:** Horizontal Landscape (4:3).
**COMPOSITION:** Product fills 85% width. 5% Padding. Perfectly Centered.
`;

    // 4. MODULE: MINIMAL PROP
    if (effect === 'studio_minimal_prop') {
        return `${studioBase}
**SCENE: "MODERN ARCHITECTURE"**
*   **Background:** Matte Off-White (#F0F0F0) wall, polished concrete floor.
*   **Prop:** Single geometric concrete cube or cylinder. Shoe leaning against it.
*   **Lighting:** Softbox Window Light (Top-Left). Soft, diffused shadows.
*   **Vibe:** Calm, museum-like, sophisticated.
`;
    }

    // 5. MODULE: NATURAL FLOOR
    if (effect === 'studio_natural_floor') {
        return `${studioBase}
**SCENE: "URBAN SUNLIGHT"**
*   **Background:** Rough textured pavement or bright concrete.
*   **Lighting:** Hard Sunlight (Direct Sun, 5500K). High contrast.
*   **Shadow:** Cast a "Gobo" shadow (Window frame or Plant leaf) across the floor.
*   **Vibe:** Energetic, organic, summer street.
`;
    }

    // 6. MODULE: TEXTURE EMPHASIS
    if (effect === 'studio_texture_emphasis') {
        return `${studioBase}
**SCENE: "DARK MODE DETAIL"**
*   **Background:** Dark Charcoal Grey (#333333) seamless infinity wall.
*   **Lighting:** Low-angle "Raking Light". Grazes the surface to pop texture depth (suede/mesh).
*   **Vibe:** Masculine, technical, heavy, premium.
`;
    }

    // 7. MODULE: CINEMATIC
    if (effect === 'studio_cinematic') {
        return `${studioBase}
**SCENE: "FUTURE RUNWAY"**
*   **Background:** Glossy wet black floor.
*   **Atmosphere:** Low-lying fog/mist/dry-ice.
*   **Action:** "Levitation" illusion (Shoe floating slightly above ground).
*   **Lighting:** Top-down "God Ray" spotlight. Rim lighting on edges.
`;
    }

    // 8. MODULE: CUSTOM BACKGROUND
    if (effect === 'custom') {
        return `${SYSTEM_ROLE}
**[TASK: COMPOSITE BLENDING]**
*   **Instruction:** Seamlessly integrate the shoe into the provided custom background.
*   **Match:** Perspective, Light direction, and Shadow casting.
*   **Output:** Photorealistic composite.
`;
    }

    return `${SYSTEM_ROLE} Photorealistic product shot.`;
}

// ============================================================================
// [ANTI-GRAVITY ENGINE] API HANDLERS
// ============================================================================

/**
 * 메인 이미지 생성 함수
 */
export const applyShoeEffect = async (
    files: File[],
    effect: Effect,
    onProgressUpdate: (message: string) => void,
    customBackground: File | null,
    poseId?: string
): Promise<string> => {
    // 1. Init
    // @ts-ignore
    const ai = new GoogleGenAI({ apiKey: (import.meta as any).env.VITE_GEMINI_API_KEY });

    onProgressUpdate('Anti-Gravity: 프롬프트 구성 및 시나리오 로드...');
    const prompt = getPromptForEffect(effect, poseId);

    // 2. Payload Construction
    const imageParts: InlineDataPart[] = [];

    // 배경 이미지가 있으면 먼저 추가 (참조용)
    if (effect === 'custom' && customBackground) {
        imageParts.push({ inlineData: { data: await fileToBase64(customBackground), mimeType: customBackground.type } });
    }

    // 원본 신발 이미지 추가
    for (const file of files) {
        imageParts.push({ inlineData: { data: await fileToBase64(file), mimeType: file.type } });
    }

    const parts = [...imageParts, { text: prompt }];

    // 3. Gemini 3.0 Pro Call (High-Res Configuration)
    onProgressUpdate('Anti-Gravity: 3D 렌더링 및 리터칭 실행...');
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview', // 최신 3.0 모델 필수
        contents: { parts },
        config: {
            responseModalities: [Modality.IMAGE],
            imageConfig: {
                aspectRatio: '4:3', // [중요] 가로형(Landscape) 강제
                imageSize: '2K'     // 고해상도 출력
            }
        },
    });

    onProgressUpdate('최종 후처리 중...');

    // 4. Response Handling
    if (response.promptFeedback?.blockReason) {
        throw new Error(`생성 차단됨 (사유: ${response.promptFeedback.blockReason})`);
    }

    const candidate = response.candidates?.[0];
    if (!candidate?.content?.parts?.[0]) {
        throw new Error('오류: 이미지가 생성되지 않았습니다.');
    }

    for (const part of candidate.content.parts) {
        if (part.inlineData) {
            return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
    }
    throw new Error('이미지 데이터 누락');
};

/**
 * 색상 변경 (Color Change) 함수
 */
export const applyColorChange = async (
    baseImageFile: File,
    onProgressUpdate: (message: string) => void,
    selectedColor: string | null,
    customColorImage: File | null,
): Promise<string> => {
    // @ts-ignore
    const ai = new GoogleGenAI({ apiKey: (import.meta as any).env.VITE_GEMINI_API_KEY });
    onProgressUpdate('소재 분석 및 마스킹 영역 계산...');

    const colorInstruction = customColorImage
        ? `**Target Color:** Extract dominant color from the reference image.`
        : `**Target Color:** HEX ${selectedColor}.`;

    const colorChangePrompt = `
**SYSTEM ROLE:** Expert Digital Retoucher.
**TASK:** Recolor the UPPER material only.
**CONSTRAINT:** Keep OUTSOLE and LOGO 100% UNTOUCHED.

**EXECUTION:**
1.  **Masking:** Isolate 'Upper' material.
2.  **Color:** Apply ${colorInstruction}.
3.  **Realism:** Preserve stitching, grain, and highlights.
4.  **Lighting:** Blend naturally with existing light.
`;

    const parts = [
        { inlineData: { data: await fileToBase64(baseImageFile), mimeType: baseImageFile.type } },
        { text: colorChangePrompt }
    ];

    if (customColorImage) {
        parts.push({ inlineData: { data: await fileToBase64(customColorImage), mimeType: customColorImage.type } });
    }

    onProgressUpdate('Anti-Gravity: 색상 적용 렌더링...');
    const colorResponse = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts },
        config: {
            responseModalities: [Modality.IMAGE],
            imageConfig: {
                aspectRatio: '1:1', // 색상 변경은 1:1 유지
                imageSize: '2K'
            }
        },
    });

    onProgressUpdate('완료');

    const finalCandidate = colorResponse.candidates?.[0];
    if (!finalCandidate?.content?.parts?.[0]) {
        throw new Error('색상 변경 실패');
    }

    for (const part of finalCandidate.content.parts) {
        if (part.inlineData) {
            return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
    }
    throw new Error('이미지 데이터 반환 실패');
};

/**
 * DetailStorageApp 호환성 래퍼 함수 (Legacy Support)
 */
export const enhanceProductImage = async (file: File, effect: string, pose: string): Promise<Blob> => {
    // 'standard' 효과를 'beautify'로 매핑
    const targetEffect: Effect = effect === 'standard' ? 'beautify' : (effect as Effect);

    // applyShoeEffect 호출
    const base64 = await applyShoeEffect([file], targetEffect, (msg) => console.log(msg), null, pose);

    // Base64 -> Blob 변환
    const response = await fetch(base64);
    return await response.blob();
};

/**
 * 텍스트 채팅 함수 (Gemini Chat)
 */
export const chatWithGemini = async (
    message: string,
    history: { role: 'user' | 'model', parts: { text: string }[] }[]
): Promise<string> => {
    // @ts-ignore
    const ai = new GoogleGenAI({ apiKey: (import.meta as any).env.VITE_GEMINI_API_KEY });
    const model = ai.models.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const chat = model.startChat({
        history: history,
        generationConfig: {
            maxOutputTokens: 1000,
        },
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    return response.text();
};

/**
 * Generate a batch of 5 realistic K-pop style faces
 */
export const generateFaceBatch = async (
    gender: 'male' | 'female',
    race: string,
    age: string
): Promise<string[]> => {
    try {
        const ai = getGenAIClient();
        const genderTerm = gender === 'male' ? 'male' : 'female';

        // 1. Race mapping
        const raceMapping: Record<string, string> = {
            "한국인": "Korean",
            "코리안": "Korean",
            "동아시아인": "East Asian",
            "아시아인": "East Asian",
            "백인": "White",
            "흑인": "Black",
            "히스패닉": "Hispanic/Latino",
            "중동인": "Middle Eastern",
            "혼혈": "Mixed race"
        };
        const englishRace = raceMapping[race] || "Korean";

        // 2. Age-based skin details
        const numericAge = parseInt(age, 10);
        let ageDetails = "";

        if (Number.isNaN(numericAge)) {
            ageDetails = "Realistic Korean skin texture for their age range, visible pores, subtle redness, very light imperfections, no beauty filter.";
        } else if (numericAge <= 25) {
            ageDetails = "Youthful Korean skin with visible but fine pores, natural glow, slight redness around nose and cheeks, tiny blemishes, no heavy smoothing.";
        } else if (numericAge <= 35) {
            ageDetails = "Fresh but mature Korean skin texture with micropores, very faint fine lines, natural tone variation, realistic under-eye texture.";
        } else {
            ageDetails = "Mature Korean skin texture with fine lines, slight wrinkles, sunspots, realistic pores and unevenness, still elegant and healthy.";
        }

        // 3. Vibe and texture keywords
        const vibeKeywords = gender === 'female'
            ? "realistic K-pop female idol vibe, Seoul street casting, trendy but approachable, natural charm, modern K-beauty mood"
            : "realistic K-pop male idol vibe, Seoul street casting, chic but approachable, calm charisma, modern K-beauty mood";

        const textureKeywords = "hyper-detailed Korean skin texture, visible fine pores, subtle peach fuzz, small imperfections, realistic under-eye area, natural nasolabial folds, slight asymmetry, no plastic smooth skin, no filter-like beauty effect";

        // 4. Style variations
        const hairStylesFemale = [
            "long straight black hair with soft layers and natural shine",
            "medium length hime cut inspired style, clean but modern",
            "soft wavy hair with see-through bangs, natural volume",
            "low ponytail with loose front pieces framing the face",
            "short chic bob cut with slight C-curl at the ends"
        ];
        const hairStylesMale = [
            "short clean cut Korean men's hairstyle",
            "medium two-block style with textured top",
            "classic Korean side-parted hair",
            "soft messy fringe hairstyle",
            "clean undercut with natural volume"
        ];
        const hairStyles = gender === 'female' ? hairStylesFemale : hairStylesMale;

        const studioBackgrounds = [
            "solid light grey Korean studio backdrop with soft gradient",
            "clean warm beige backdrop used in beauty editorials",
            "cool pale blue seamless studio background",
            "subtle pastel mint studio wall with very soft texture",
            "solid off-white background with slight falloff in light"
        ];

        const makeupStylesFemale = [
            "Natural Korean makeup with soft peach tones",
            "Fresh dewy look with minimal color",
            "Elegant makeup with defined eyes",
            "Soft pink tones with glossy lips",
            "Clean beauty look with natural brows"
        ];
        const makeupStylesMale = [
            "Natural grooming, clean skin, no makeup",
            "Light BB cream for even tone only",
            "Fresh clean look, natural eyebrows",
            "Minimal grooming, natural appearance",
            "Clean skin with subtle enhancement"
        ];
        const makeupStyles = gender === 'female' ? makeupStylesFemale : makeupStylesMale;

        const targetLook = gender === 'male' ? "Handsome K-Pop Idol / Actor Visual" : "Beautiful K-Pop Idol / Actress Visual";
        const faceDescription = gender === 'male' ? "Sharp jawline, symmetrical features, masculine but clean" : "Small face, symmetrical features, feminine and elegant";
        const sectionTitle = gender === 'male' ? "[GROOMING & STYLING]" : "[MAKEUP]";

        // 5. Generate 5 images in parallel
        const promises = Array(5)
            .fill(null)
            .map(async (_, idx) => {
                try {
                    const hairStyle = hairStyles[idx % hairStyles.length] || "Clean hair";
                    const bg = studioBackgrounds[idx % studioBackgrounds.length] || "Studio background";
                    const makeup = makeupStyles[idx % makeupStyles.length] || "Natural look";

                    const prompt = `
[SUBJECT]
Ultra-detailed close-up portrait of a ${age}-year-old ${englishRace} ${genderTerm},
inspired by realistic K-pop idol photography in Seoul.
Target Look: ${targetLook}.
Facial Features: ${faceDescription}.
Casting style: street-casting K-pop idol, natural but charismatic.

[VIBE]
${vibeKeywords}

[FACE AND SKIN]
${textureKeywords}
${ageDetails}
Natural Korean skin tone, slight variation between forehead, cheeks, and nose.
Subtle highlight on nose bridge and cheekbones, natural shadow under jawline.
Under-eye area stays realistic, not overly brightened.
Slight natural asymmetry is allowed and preferred.

[HAIR]
${hairStyle}

${sectionTitle}
${makeup}

[CROP AND FRAMING]
Framed from shoulders and neck up, focus on the face.
No visible clothing logos.
Neutral, non-sexual presentation.

[BACKGROUND]
${bg}
Simple, clean, and even lighting on the background to make the face stand out.
Easy to cut out for design use.

[STYLE]
High-end Korean idol photoshoot for an album concept photo.
Shot on a professional digital camera or high-end film camera.
Direct or semi-direct soft flash to give trendy K-pop look.
Full color only, no black and white, no monochrome.
Minimal retouching, keep skin texture and pores visible.

[AVOID]
Do not make the face look like an AI-generated doll.
Do not over-smooth the skin.
No anime style, no illustration, no 3D render.
No uncanny valley eyes, no extreme symmetry, no plastic shine.
${gender === 'male' ? "No lipstick, no feminine makeup, no heavy eyeshadow." : ""}
          `;

                    const response = await ai.models.generateContent({
                        model: 'gemini-3-pro-image-preview',
                        contents: { parts: [{ text: prompt }] },
                        config: {
                            imageConfig: {
                                aspectRatio: '1:1',
                                imageSize: '1K'
                            },
                            safetySettings: [
                                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
                                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
                                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
                                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH }
                            ]
                        }
                    });

                    for (const part of response.candidates?.[0]?.content?.parts || []) {
                        if (part.inlineData) {
                            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                        }
                    }
                    return null;
                } catch (e: any) {
                    console.error(`Face generation error for image ${idx}:`, e);
                    return null;
                }
            });

        const results = await Promise.all(promises);
        return results.filter((url): url is string => url !== null);
    } catch (e) {
        console.error('generateFaceBatch error:', e);
        throw e;
    }
};

/**
 * Upscale a face image to higher resolution
 */
export const upscaleFace = async (base64Image: string): Promise<string> => {
    try {
        const ai = getGenAIClient();

        const dataPart = base64Image.split(',')[1] || base64Image;
        const mimeMatch = base64Image.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';

        const prompt = `
[TASK: UPSCALE & ENHANCE]
Re-generate this portrait in 4K resolution.
Maintain the exact same face, identity, pose, lighting, and composition.
Significantly improve skin texture, hair details, and eye sharpness.
Make it look like a high-end commercial beauty shot.
Output: High-fidelity 4K photograph.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: {
                parts: [
                    { inlineData: { mimeType, data: dataPart } },
                    { text: prompt }
                ]
            },
            config: {
                imageConfig: {
                    aspectRatio: '1:1',
                    imageSize: '4K'
                },
                safetySettings: [
                    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
                    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
                    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
                    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH }
                ]
            }
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        throw new Error("Upscaling failed: No image returned");
    } catch (e) {
        console.error('upscaleFace error:', e);
        throw e;
    }
};

/**
 * Extract product info from images using Gemini 1.5 Flash (Client-side)
 */
export const extractProductInfoFromImages = async (
    images: { base64: string; mimeType: string }[],
    promptText: string
): Promise<any> => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) throw new Error("API key not found");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: { responseMimeType: "application/json" }
    });

    const parts = [
        ...images.map(img => ({
            inlineData: {
                mimeType: img.mimeType,
                data: img.base64
            }
        })),
        { text: promptText }
    ];

    const result = await model.generateContent(parts);
    const response = result.response;
    const text = response.text();

    try {
        return JSON.parse(text);
    } catch (e) {
        console.error("Failed to parse JSON response:", text);
        throw new Error("AI 응답을 분석할 수 없습니다.");
    }
};

/**
 * Swap face in target image with source face
 */
export const swapFace = async (
    sourceFaceBase64: string,
    targetImageFile: File
): Promise<string> => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) throw new Error("API key not found");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash-exp',
        generationConfig: {
            temperature: 0.4,
            topP: 0.95,
        }
    });

    const sourceData = sourceFaceBase64.split(',')[1] || sourceFaceBase64;
    const sourceMimeMatch = sourceFaceBase64.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);
    const sourceMime = sourceMimeMatch ? sourceMimeMatch[1] : 'image/png';

    const targetBase64 = await fileToBase64(targetImageFile);

    const prompt = `
[TASK: FACE SWAP]
Replace the face of the model in the [TARGET IMAGE] with the face from the [SOURCE FACE].
1.  **Identity:** The face in the output MUST match the [SOURCE FACE] identity.
2.  **Context:** Keep the [TARGET IMAGE] body, pose, hair (if possible/relevant), clothing, and background EXACTLY the same.
3.  **Blending:** Match the skin tone, lighting, and grain of the [TARGET IMAGE] for a seamless photorealistic result.
4.  **Output:** High-fidelity photograph.
`;

    const result = await model.generateContent([
        { text: "SOURCE FACE:" },
        { inlineData: { mimeType: sourceMime, data: sourceData } },
        { text: "TARGET IMAGE:" },
        { inlineData: { mimeType: targetImageFile.type, data: targetBase64 } },
        { text: prompt }
    ]);

    const response = result.response;

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
    }
    throw new Error("Face swap failed: No image returned");
};
