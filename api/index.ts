import { NowRequest, NowResponse } from "@vercel/node";
import got from "got";
import { CookieJar } from "tough-cookie";

export default async function (req: NowRequest, res: NowResponse) {
    const { url = null } = req.query;

    if (!url || typeof url !== "string") {
        res.status(400).json({ error: "Invalid or missing url parameter." });
        return;
    }

    try {
        console.log("Fetching:", url);
        const cookieJar = new CookieJar();
        const response = await got(url, {
            cookieJar,
            responseType: "buffer", // Hỗ trợ mọi loại nội dung
        });

        // Thiết lập cache HTTP 1 năm
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

        // Giữ nguyên headers từ response gốc
        setHeaders(res, response.headers);
        res.end(response.body);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Hàm sao chép headers từ response gốc
function setHeaders(res: NowResponse, headers: Record<string, string | string[]>) {
    for (const [key, value] of Object.entries(headers)) {
        if (key.toLowerCase() !== "transfer-encoding") {
            res.setHeader(key, value);
        }
    }
}
