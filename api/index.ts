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
        const cookieJar = new CookieJar();
        const response = await got(url, { cookieJar });

        // Set header để giữ nguyên xuống dòng
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.setHeader("X-Content-Type-Options", "nosniff"); // Tránh thay đổi nội dung

        // Gửi nội dung chính xác, không bị thay đổi xuống dòng
        res.end(response.body);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
