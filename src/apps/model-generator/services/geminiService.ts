
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI, Part, GenerateContentResponse } from "@google/genai";
import { enforceAspectRatio } from '../lib/canvasUtils';

const MODEL_NAME = 'gemini-3-pro-image-preview';

const getAiClient = () => new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY! });

// =================================================================
// PROMPTS (Korean Logic Tuned)
// =================================================================

const campaignSynthesisPrompt = `
// SYSTEM: Senior VFX Supervisor & High-End Retoucher
// TASK: Create a seamless composite image.
// INPUTS:
// 1. [Target Shot]: Base model/pose/background.
// 2. [Face ID]: Identity to swap.
// 3. [Product]: Shoes to try on.

// ===== INSTRUCTIONS =====

// 1. FACE SWAP (PRIORITY 1 - RECONSTRUCTION):
//    - IGNORE the original face features.
//    - RECONSTRUCT the face using [Face ID] as the source.
//    - LIGHTING/ANGLE: Adapt [Face ID] to match the [Target Shot]'s environment perfectly.
//    - BLENDING: Seamless skin texture blending at the neck.
//    - PROPORTION: Make head smaller (9-head ratio / 9등신 비율).

// 2. SHOES (PRIORITY 2 - PIXEL COPY):
//    - Replace original shoes with [Product].
//    - Use pixel data from [Product]. Do not generate random shoes.
//    - Match perspective and ground shadows.

// 3. OUTFIT & MOOD (PRIORITY 3 - PRESERVE):
//    - LOCK original outfit texture.
//    - STYLE: Analog Film (Kodak Portra 400), Grainy, High Fashion.

// ===== OUTPUT =====
// Photorealistic, 9-head ratio fashion campaign shot.
`;

const poseVariationPrompt = (poseDescription: string) => `
// SYSTEM: Fashion Photographer
// TASK: Re-shoot the model in a NEW POSE.
// INPUTS: Reference Image (current result), Face ID, Product.

// ===== NEW POSE =====
// "${poseDescription}"

// ===== RULES =====
// 1. IDENTITY: Keep [Face ID] strictly.
// 2. SHOES: Keep [Product] strictly.
// 3. OUTFIT: Keep the same outfit style.
// 4. ACTION: Change ONLY the pose based on instruction.
// 5. STYLE: 9-head ratio, Analog Film Look.
`;

const refineImagePrompt = `
// SYSTEM: Film Scanner Restoration
// TASK: Enhance texture, add film grain, sharpen details.
// DO NOT CHANGE FACE OR SHOES.
// AESTHETIC: Kodak Portra 400.
`;

async function fileToGenerativePart(file: File): Promise<Part> {
    const base64EncodedDataPromise = new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = reject;
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result.split(',')[1]);
            } else {
                reject(new Error('Failed to read file as data URL.'));
            }
        };
        reader.readAsDataURL(file);
    });
    return { inlineData: { data: await base64EncodedDataPromise, mimeType: file.type } };
}

async function urlToGenerativePart(url: string): Promise<Part> {
    const response = await fetch(url);
    const blob = await response.blob();
    const base64EncodedDataPromise = new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = reject;
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result.split(',')[1]);
            } else {
                reject(new Error('Failed to read blob as data URL.'));
            }
        };
        reader.readAsDataURL(blob);
    });
    return { inlineData: { data: await base64EncodedDataPromise, mimeType: blob.type } };
}

function getImageUrlFromResponse(response: GenerateContentResponse): string {
    for (const candidate of response.candidates || []) {
        for (const part of candidate.content?.parts || []) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
    }
    throw new Error('No image found in the response.');
}

async function generateImage(prompt: string, imageParts: Part[]): Promise<string> {
    const allParts = [{ text: prompt }, ...imageParts];
    const response = await getAiClient().models.generateContent({
        model: MODEL_NAME,
        contents: { parts: allParts },
        config: { 
            imageConfig: { aspectRatio: "3:4" }
        },
    });

    const originalImageUrl = getImageUrlFromResponse(response);
    try {
        return await enforceAspectRatio(originalImageUrl, 830, 1106); 
    } catch {
        return originalImageUrl;
    }
}

export async function synthesizeCampaignImage(
    targetShotFile: File,
    faceFile: File,
    shoeFiles: File[]
): Promise<string> {
    const targetPart = await fileToGenerativePart(targetShotFile);
    const facePart = await fileToGenerativePart(faceFile);
    const shoeParts = await Promise.all(shoeFiles.map(fileToGenerativePart));
    return generateImage(campaignSynthesisPrompt, [targetPart, facePart, ...shoeParts]);
}

export async function generatePoseVariation(
    currentImageUrl: string,
    faceFile: File,
    shoeFiles: File[],
    poseDescription: string
): Promise<string> {
    const currentImagePart = await urlToGenerativePart(currentImageUrl);
    const facePart = await fileToGenerativePart(faceFile);
    const shoeParts = await Promise.all(shoeFiles.map(fileToGenerativePart));
    return generateImage(poseVariationPrompt(poseDescription), [currentImagePart, facePart, ...shoeParts]);
}

export async function refineImage(shoeFiles: File[], modelImageUrl: string): Promise<string> {
    const shoeImageParts = await Promise.all(shoeFiles.map(fileToGenerativePart));
    const modelImagePart = await urlToGenerativePart(modelImageUrl);
    return generateImage(refineImagePrompt, [modelImagePart, ...shoeImageParts]);
}
