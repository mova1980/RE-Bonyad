import express from "express";
import path from "path";
import {
    generateSpeechServer,
    transcribeMemoirServer,
    semanticSearchServer,
    performOCRServer,
    restoreImageServer,
    analyzeFacesServer,
    analyzeSentimentServer,
    autoCategorizeServer,
    analyzeFileForArchiveServer,
    performImageMatchServer,
    analyzeVideoWithReferenceServer,
    searchInternalArchiveServer,
    getChatResponseServer,
    generateCreativeContentServer
} from "./server/geminiServerService";

async function startServer() {
    const app = express();
    const PORT = 3000;

    // Use JSON parser with high payload limits for base64 file uploads
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));

    // Health check endpoint
    app.get("/api/health", (req, res) => {
        res.json({ status: "ok", time: new Date().toISOString() });
    });

    // Gemini API proxy routes
    app.post("/api/gemini/chat", async (req, res) => {
        try {
            const { history, newMessage } = req.body;
            const reply = await getChatResponseServer(history, newMessage);
            res.json({ text: reply });
        } catch (error: any) {
            console.error("Server API Error (Chat):", error);
            res.status(500).send(error.message || "خطا در برقراری ارتباط با مدل هوش مصنوعی");
        }
    });

    app.post("/api/gemini/ocr", async (req, res) => {
        try {
            const { file } = req.body;
            if (!file || !file.data) {
                return res.status(400).send("فایل ارسال نشده است.");
            }
            const reply = await performOCRServer(file.data, file.mimeType);
            res.json({ text: reply });
        } catch (error: any) {
            console.error("Server API Error (OCR):", error);
            res.status(500).send(error.message || "خطا در استخراج متن سند");
        }
    });

    app.post("/api/gemini/faces", async (req, res) => {
        try {
            const { file } = req.body;
            if (!file || !file.data) {
                return res.status(400).send("تصویر برای پردازش ارسال نشده است.");
            }
            const reply = await analyzeFacesServer(file.data, file.mimeType);
            res.json({ text: reply });
        } catch (error: any) {
            console.error("Server API Error (Faces):", error);
            res.status(500).send(error.message || "خطا در تشخیص چهره تصویر");
        }
    });

    app.post("/api/gemini/category", async (req, res) => {
        try {
            const { file } = req.body;
            if (!file || !file.data) {
                return res.status(400).send("فایل برای طبقه‌بندی ارسال نشده است.");
            }
            const reply = await autoCategorizeServer(file.data, file.mimeType);
            res.json({ text: reply });
        } catch (error: any) {
            console.error("Server API Error (Category):", error);
            res.status(500).send(error.message || "خطا در طبقه‌بندی هوشمند سند");
        }
    });

    app.post("/api/gemini/sentiment", async (req, res) => {
        try {
            const { text } = req.body;
            const reply = await analyzeSentimentServer(text);
            res.json({ text: reply });
        } catch (error: any) {
            console.error("Server API Error (Sentiment):", error);
            res.status(500).send(error.message || "خطا در تحلیل احساس متن");
        }
    });

    app.post("/api/gemini/face-video", async (req, res) => {
        try {
            const { video, reference } = req.body;
            if (!video || !video.data || !reference || !reference.data) {
                return res.status(400).send("ویدئو یا تصویر مرجع به درستی ارسال نشده است.");
            }
            const reply = await analyzeVideoWithReferenceServer(video.data, video.mimeType, reference.data, reference.mimeType);
            res.json({ text: reply });
        } catch (error: any) {
            console.error("Server API Error (Face Video):", error);
            res.status(500).send(error.message || "خطا در تشخیص چهره در ویدیو");
        }
    });

    app.post("/api/gemini/image-match", async (req, res) => {
        try {
            const { file, query } = req.body;
            if (!file || !file.data) {
                return res.status(400).send("تصویر برای مطابقت ارسال نشده است.");
            }
            const reply = await performImageMatchServer(file.data, file.mimeType, query);
            res.json(reply);
        } catch (error: any) {
            console.error("Server API Error (Image Match):", error);
            res.status(500).send(error.message || "خطا در مطابقت تصویر");
        }
    });

    app.post("/api/gemini/internal-search", async (req, res) => {
        try {
            const { file, repoPath } = req.body;
            if (!file || !file.data) {
                return res.status(400).send("سند برای جستجوی داخلی ارسال نشده است.");
            }
            const reply = await searchInternalArchiveServer(file.data, file.mimeType, repoPath);
            res.json({ text: reply });
        } catch (error: any) {
            console.error("Server API Error (Internal Search):", error);
            res.status(500).send(error.message || "خطا در جستجو در مخزن محلی آرشیو");
        }
    });

    app.post("/api/gemini/transcribe-memoir", async (req, res) => {
        try {
            const { file } = req.body;
            if (!file || !file.data) {
                return res.status(400).send("فایل صوتی ارسال نشده است.");
            }
            const reply = await transcribeMemoirServer(file.data, file.mimeType);
            res.json({ text: reply });
        } catch (error: any) {
            console.error("Server API Error (Transcribe):", error);
            res.status(500).send(error.message || "خطا در واژه‌نگاری صوت روایت");
        }
    });

    app.post("/api/gemini/generate-speech", async (req, res) => {
        try {
            const { text } = req.body;
            const audioBase64 = await generateSpeechServer(text);
            res.json({ base64: audioBase64 });
        } catch (error: any) {
            console.error("Server API Error (Speech Generation):", error);
            res.status(500).send(error.message || "خطا در تبدیل متن به گفتار دکلمه");
        }
    });

    app.post("/api/gemini/semantic-search", async (req, res) => {
        try {
            const { query, profiles, documents } = req.body;
            const reply = await semanticSearchServer(query, profiles, documents);
            res.json(reply);
        } catch (error: any) {
            console.error("Server API Error (Semantic Search):", error);
            res.status(500).send(error.message || "خطا در اجرای جستجوی معنایی هوشمند");
        }
    });

    app.post("/api/gemini/restore", async (req, res) => {
        try {
            const { file } = req.body;
            if (!file || !file.data) {
                return res.status(400).send("تصویر برای ترمیم ارسال نشده است.");
            }
            const reply = await restoreImageServer(file.data, file.mimeType);
            res.json(reply);
        } catch (error: any) {
            console.error("Server API Error (Restore Image):", error);
            res.status(500).send(error.message || "خطا در پردازش ترمیم تصویر");
        }
    });

    app.post("/api/gemini/analyze-archive", async (req, res) => {
        try {
            const { file, profiles } = req.body;
            if (!file || !file.data) {
                return res.status(400).send("فایل برای تحلیل آرشیو ارسال نشده است.");
            }
            const reply = await analyzeFileForArchiveServer(file.data, file.mimeType, profiles);
            res.json(reply);
        } catch (error: any) {
            console.error("Server API Error (Analyze Archive):", error);
            res.status(500).send(error.message || "خطا در تحلیل و انطباق آرشیو");
        }
    });

    app.post("/api/gemini/creative", async (req, res) => {
        try {
            const { type, tags, contextDocs, profiles, additionalPrompt } = req.body;
            const reply = await generateCreativeContentServer({ type, tags, contextDocs, profiles, additionalPrompt });
            res.json({ text: reply });
        } catch (error: any) {
            console.error("Server API Error (Creative Gen):", error);
            res.status(500).send(error.message || "خطا در تولید محتوای هنری");
        }
    });

    // Detect production environment more robustly (explicitly checking for Cloud Run environment variables)
    let isProd = process.env.NODE_ENV === "production" || !!process.env.K_SERVICE || !!process.env.K_REVISION;

    let useVite = !isProd;
    if (useVite) {
        try {
            const { createServer: createViteServer } = await import("vite");
            const vite = await createViteServer({
                server: { middlewareMode: true },
                appType: "spa",
            });
            app.use(vite.middlewares);
            console.log("Started Vite Dev Server middleware inside Express");
        } catch (viteError) {
            console.warn("Could not import Vite / start Vite Dev Server. Falling back to production static serve:", viteError);
            useVite = false;
            isProd = true;
        }
    }

    if (!useVite) {
        const distPath = path.join(process.cwd(), 'dist');
        app.use(express.static(distPath));
        
        // Single-page application route support for Express 5
        app.get('*all', (req, res) => {
            res.sendFile(path.join(distPath, 'index.html'));
        });
        
        // Robust fallback middleware for any unmatched GET requests requesting HTML
        app.use((req, res, next) => {
            if (req.method === 'GET' && (req.headers.accept || '').includes('text/html')) {
                res.sendFile(path.join(distPath, 'index.html'));
            } else {
                res.status(404).json({ error: "Page not found" });
            }
        });
        console.log("Serving static production assets from dist/");
    }

    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Express Full-Stack Server running on http://localhost:${PORT}`);
    });
}

startServer().catch(err => {
    console.error("Critical: Failed to boot express full-stack server:", err);
});
