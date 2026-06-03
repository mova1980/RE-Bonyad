import { MOCK_PROFILES } from '../data';

export const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64Data = reader.result as string;
            const base64Content = base64Data.split(',')[1];
            resolve({
                inlineData: {
                    data: base64Content,
                    mimeType: file.type,
                },
            });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

const fileToSimplePart = async (file: File): Promise<{ data: string; mimeType: string }> => {
    const part = await fileToGenerativePart(file);
    return {
        data: part.inlineData.data,
        mimeType: part.inlineData.mimeType
    };
};

const blobToSimplePart = async (blob: Blob): Promise<{ data: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64Data = reader.result as string;
            const base64Content = base64Data.split(',')[1];
            resolve({
                data: base64Content,
                mimeType: blob.type
            });
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

export const generateSpeech = async (text: string): Promise<void> => {
    try {
        const response = await fetch('/api/gemini/generate-speech', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });
        if (!response.ok) throw new Error(await response.text());
        const { base64 } = await response.json();
        
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const decodeBase64 = (b64: string) => {
            const bin = atob(b64);
            const bytes = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) {
                bytes[i] = bin.charCodeAt(i);
            }
            return bytes;
        };
        const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number) => {
            const dataInt16 = new Int16Array(data.buffer);
            const frameCount = dataInt16.length / numChannels;
            const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
            for (let channel = 0; channel < numChannels; channel++) {
                const channelData = buffer.getChannelData(channel);
                for (let i = 0; i < frameCount; i++) {
                    channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
                }
            }
            return buffer;
        };
        const buffer = await decodeAudioData(decodeBase64(base64), audioCtx, 24000, 1);
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtx.destination);
        source.start();
    } catch (error: any) {
        console.warn("Client TTS server error, falling back to Web Speech API:", error);
        if ('speechSynthesis' in window) {
            try {
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = 'fa-IR';
                utterance.rate = 0.95;
                window.speechSynthesis.speak(utterance);
            } catch (synthError) {
                console.error("SpeechSynthesis failed:", synthError);
                throw new Error("خطا در خوانش متن وصیت‌نامه.");
            }
        } else {
            throw new Error(error.message || "خطا در تولید صوت دکلمه خان");
        }
    }
};

export const transcribeMemoir = async (audioBlob: Blob): Promise<string> => {
    try {
        const filePart = await blobToSimplePart(audioBlob);
        const response = await fetch('/api/gemini/transcribe-memoir', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ file: filePart })
        });
        if (!response.ok) throw new Error(await response.text());
        const data = await response.json();
        return data.text;
    } catch (error: any) {
        throw new Error("خطا در تبدیل صوت به متن: " + (error.message || "خطای ناشناخته"));
    }
};

export const semanticSearch = async (query: string, profiles: any[], documents: any[]): Promise<{ profileIds: string[], docIds: string[] }> => {
    try {
        const response = await fetch('/api/gemini/semantic-search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, profiles, documents })
        });
        if (!response.ok) throw new Error(await response.text());
        return await response.json();
    } catch (error) {
        console.error("Semantic Search Error:", error);
        return { profileIds: [], docIds: [] };
    }
};

export const performOCR = async (file: File): Promise<string> => {
    try {
        const filePart = await fileToSimplePart(file);
        const response = await fetch('/api/gemini/ocr', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ file: filePart })
        });
        if (!response.ok) throw new Error(await response.text());
        const data = await response.json();
        return data.text;
    } catch (error: any) {
        throw new Error(error.message || "خطا در واژه‌نگاری سند بوسیله هوش مصنوعی");
    }
};

export const restoreImage = async (file: File): Promise<{ base64: string, analysis: string }> => {
    try {
        const filePart = await fileToSimplePart(file);
        const response = await fetch('/api/gemini/restore', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ file: filePart })
        });
        if (!response.ok) throw new Error(await response.text());
        return await response.json();
    } catch (error: any) {
        console.error("Restoration Error:", error);
        throw new Error(error.message || "خطا در ترمیم هوش مصنوعی تصویر");
    }
};

export const analyzeFaces = async (file: File): Promise<string> => {
    try {
        const filePart = await fileToSimplePart(file);
        const response = await fetch('/api/gemini/faces', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ file: filePart })
        });
        if (!response.ok) throw new Error(await response.text());
        const data = await response.json();
        return data.text;
    } catch (error: any) {
        throw new Error("خطا در تشخیص چهره: " + (error.message || "خطای ناشناخته"));
    }
};

export const analyzeSentiment = async (text: string): Promise<string> => {
    try {
        const response = await fetch('/api/gemini/sentiment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });
        if (!response.ok) throw new Error(await response.text());
        const data = await response.json();
        return data.text;
    } catch (error: any) {
        throw new Error("خطا در تحلیل احساس: " + (error.message || "خطای ناشناخته"));
    }
};

export const autoCategorize = async (file: File): Promise<string> => {
    try {
        const filePart = await fileToSimplePart(file);
        const response = await fetch('/api/gemini/category', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ file: filePart })
        });
        if (!response.ok) throw new Error(await response.text());
        const data = await response.json();
        return data.text;
    } catch (error) {
        return "خطا در دسته‌بندی";
    }
};

export const analyzeFileForArchive = async (file: File, profiles: any[] = MOCK_PROFILES): Promise<{ category: string, suggestedName: string, suggestedId: string, analysis: string, confidence: number }> => {
    try {
        const filePart = await fileToSimplePart(file);
        const response = await fetch('/api/gemini/analyze-archive', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ file: filePart, profiles })
        });
        if (!response.ok) throw new Error(await response.text());
        return await response.json();
    } catch (error) {
        console.error("Analysis Error:", error);
        return { category: 'سایر', suggestedName: 'خطا در تحلیل', suggestedId: 'None', analysis: 'خطا در پردازش هوشمند فایل رخ داد.', confidence: 0 };
    }
};

export const performImageMatch = async (imageFile: File, query: string): Promise<{ text: string, urls: string[] }> => {
    try {
        const filePart = await fileToSimplePart(imageFile);
        const response = await fetch('/api/gemini/image-match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ file: filePart, query })
        });
        if (!response.ok) throw new Error(await response.text());
        return await response.json();
    } catch (error) {
        throw new Error("خطا در تطبیق تصویر.");
    }
};

export const analyzeVideoWithReference = async (videoFile: File, referenceImageFile: File): Promise<string> => {
    try {
        const videoPart = await fileToSimplePart(videoFile);
        const imagePart = await fileToSimplePart(referenceImageFile);
        const response = await fetch('/api/gemini/face-video', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ video: videoPart, reference: imagePart })
        });
        if (!response.ok) throw new Error(await response.text());
        const data = await response.json();
        return data.text;
    } catch (error) {
        throw new Error("خطا در پردازش ویدیو.");
    }
};

export const searchInternalArchive = async (file: File, repoPath: string): Promise<string> => {
    try {
        const filePart = await fileToSimplePart(file);
        const response = await fetch('/api/gemini/internal-search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ file: filePart, repoPath })
        });
        if (!response.ok) throw new Error(await response.text());
        const data = await response.json();
        return data.text;
    } catch (error) {
        throw new Error("خطا در اجرای جستجوی هوشمند.");
    }
};

export const getChatResponse = async (history: { role: string, parts: { text: string }[] }[], newMessage: string): Promise<string> => {
    try {
        const response = await fetch('/api/gemini/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ history, newMessage })
        });
        if (!response.ok) throw new Error(await response.text());
        const data = await response.json();
        return data.text;
    } catch (error: any) {
        console.error("Chat API Error:", error);
        throw new Error(error.message || "خطا در ارتباط با هوش مصنوعی");
    }
};

export const generateCreativeContent = async (params: {
    type: string;
    tags: string[];
    contextDocs: any[];
    profiles: any[];
    additionalPrompt: string;
}): Promise<string> => {
    try {
        const response = await fetch('/api/gemini/creative', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        });
        if (!response.ok) throw new Error(await response.text());
        const data = await response.json();
        return data.text;
    } catch (error: any) {
        console.error("Creative Content Gen Error:", error);
        throw new Error(error.message || "خطا در تولید محتوای هنری.");
    }
};
