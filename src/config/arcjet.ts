import arcjet, { shield, detectBot, tokenBucket  , slidingWindow} from "@arcjet/node";

if (!process.env.ARCJET_KEY && process.env.NODE_ENV !== "test") {
    throw new Error("ARCJET_KEY env is required");
}
import { isSpoofedBot } from "@arcjet/inspect";
const aj = arcjet({
    key: process.env.ARCJET_KEY!,
    rules: [
        // Shield protects your app from common attacks e.g. SQL injection
        shield({ mode: "LIVE" }),
        // Create a bot detection rule
        detectBot({
            mode: "LIVE", // Blocks requests. Use "DRY_RUN" to log only
            // Block all bots except the following
            allow: [
                "CATEGORY:SEARCH_ENGINE", // Google, Bing, etc
                // Uncomment to allow these other common bot categories
                // See the full list at https://arcjet.com/bot-list
                //"CATEGORY:MONITOR", // Uptime monitoring services
                "CATEGORY:PREVIEW", // Link previews e.g. Slack, Discord
            ],
        }),
        // Create a token bucket rate limit. Other algorithms are supported.
        slidingWindow({
            mode: "LIVE",
            // Tracked by IP address by default, but this can be customized
            // See https://docs.arcjet.com/fingerprints
            //characteristics: ["ip.src"],
            interval: 2, // Refill every 10 seconds
            max: 5, // Bucket capacity of 10 tokens
        }),
    ],
});

export default aj;