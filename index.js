const express = require("express");
const { connect } = require("puppeteer-real-browser");
const StealthPlugin = require("puppeteer-extra-plugin-stealth")

const app = express();

let started = false;
let browser, page;

// Start route (launch Puppeteer only once)
app.get("/start", async (req, res) => {
    if (started) {
        return res.send("Already started");
    }

    try {
        browser = (await connect({
            headless: true,
            args: [
                "--single-process",
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--no-zygote"
            ],
            disableXvfb: true,
            plugins: [StealthPlugin()],
            customConfig: {
                chromePath: "./google-chrome-stable" // make sure this path is correct
            },
            timeout: 60000,
        })).browser;

        page = await browser.newPage();
        await page.goto("https://example.com", { waitUntil: "domcontentloaded", timeout: 60000 });

        started = true;
        console.log("✅ Browser started and page loaded");
        res.send("Project started successfully!");
    } catch (err) {
        console.error("❌ Failed to start:", err);
        res.status(500).send("Failed to start: " + err.message);
    }
});

// Screenshot route
app.get("/", async (req, res) => {
    if (!page) {
        return res.status(400).send("Browser not started. Call /start first.");
    }

    try {
        console.log("✅ Screenshot request");
        const screenshotBuffer = await page.screenshot({ type: "png", fullPage: true });

        res.set("Content-Type", "image/png");
        res.set("Content-Length", screenshotBuffer.length);
        res.end(screenshotBuffer);
        console.log("✅ Screenshot sent");
    } catch (err) {
        console.error("❌ Screenshot failed:", err);
        res.status(500).send("Error: " + err.message);
    }
});

// Graceful shutdown
process.on("SIGINT", async () => {
    console.log("\nShutting down...");
    if (browser) await browser.close();
    process.exit(0);
});

// Start server
const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
});
