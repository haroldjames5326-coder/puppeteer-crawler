const express = require("express");
const { connect } = require("puppeteer-real-browser");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

const app = express();

(async () => {
    const port = process.env.PORT || 8080;
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });

    console.log("✅ Start");
    const { browser } = await connect({
        headless: false,
        args: ["--single-process", "--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu", "--no-zygote", "--disable-dev-shm-usage"],
        plugins: [StealthPlugin()],
        disableXvfb: true,
        customConfig: {
            chromePath: "./google-chrome-stable", // path from your code
        },
    });
    console.log("✅ Browser Started");

    const page = await browser.newPage();
    console.log("✅ New page started");
    await page.goto("https://example.com", { waitUntil: "domcontentloaded", timeout: 60000 });
    console.log("✅ Goto finished");

    app.get("/", async (req, res) => {
        try {
            console.log("✅ Screenshot request");
            const screenshotBuffer = await page.screenshot({ type: "png", fullPage: true });
            console.log("✅ Screenshot finished");

            // ✅ Make sure headers are set before sending
            res.set("Content-Type", "image/png");
            res.set("Content-Length", screenshotBuffer.length);

            // ✅ Use res.end so Express doesn’t auto-guess type
            res.end(screenshotBuffer);
        } catch (err) {
            const state = await page.evaluate(() => document.readyState); // "loading", "interactive", or "complete"

            res.status(500).send(`Error: ${err.message}. State: ${state}`);
        }
    });
})();
