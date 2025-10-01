const express = require("express");
const { connect } = require("puppeteer-real-browser");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

const app = express();

(async () => {
    const { browser } = await connect({
        headless: false,
        args: ["--single-process", "--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu", "--no-zygote", "--disable-dev-shm-usage"],
        plugins: [StealthPlugin()],
        customConfig: {
            chromePath: "./google-chrome-stable", // path from your code
        },
    });

    const page = await browser.newPage();
    await page.goto("https://example.com", { waitUntil: "domcontentloaded", timeout: 60000 });

    app.get("/", async (req, res) => {
        try {
            const screenshotBuffer = await page.screenshot({ type: "png", fullPage: true });

            // ✅ Make sure headers are set before sending
            res.set("Content-Type", "image/png");
            res.set("Content-Length", screenshotBuffer.length);

            // ✅ Use res.end so Express doesn’t auto-guess type
            res.end(screenshotBuffer);
        } catch (err) {
            res.status(500).send("Error: " + err.message);
        }
    });

    const port = process.env.PORT || 8080;
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
})();
