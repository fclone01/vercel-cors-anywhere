import { NowRequest, NowResponse } from "@vercel/node";
import got from "got";
import { CookieJar } from "tough-cookie";
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL); // Redis cache

export default async function (req: NowRequest, res: NowResponse) {
    const { url = null } = req.query;

    if (!url || typeof url !== "string") {
        res.status(400).json({ error: "Invalid or missing url parameter." });
        return;
    }

    try {
        // Kiểm tra cache Redis (lưu dưới dạng Buffer để hỗ trợ mọi loại nội dung)
        const cachedData = await redis.getBuffer(url);
        if (cachedData) {
            console.log("Cache hit");
            const metadata = await redis.hgetall(`${url}:meta`);
            setHeaders(res, metadata);
            res.end(cachedData);
            return;
        }

        console.log("Cache miss, fetching...");
        const cookieJar = new CookieJar();
        const response = await got(url, {
            cookieJar,
            responseType: "buffer", // Hỗ trợ tất cả loại dữ liệu
        });

        // Lưu cache dữ liệu
        await redis.set(url, response.body, "EX", 60 * 60 * 24 * 365 * 100); // Cache 100 năm
        await redis.hmset(`${url}:meta`, response.headers); // Cache headers

        // Trả về dữ liệu từ URL gốc, giữ nguyên headers
        setHeaders(res, response.headers);
        res.end(response.body);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Hàm thiết lập headers giữ nguyên từ URL gốc
function setHeaders(res: NowResponse, headers: Record<string, string | string[]>) {
    for (const [key, value] of Object.entries(headers)) {
        if (key.toLowerCase() !== "transfer-encoding") {
            res.setHeader(key, value);
        }
    }
}
