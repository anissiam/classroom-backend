import { slidingWindow } from "@arcjet/node";
import type { ArcjetNodeRequest } from "@arcjet/node";
import type { NextFunction, Request, Response } from "express";

import aj from "../config/arcjet";

// Helper to read integer env vars with default
function envInt(name: string, def: number): number {
    const v = process.env[name];
    if (!v) return def;
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : def;
}

const securityMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // If NODE_ENV is TEST, skip security middleware
    if (process.env.NODE_ENV === "test") {
        return next();
    }

    // Optional bypass in development for easier local testing
    if (process.env.NODE_ENV !== "production" && process.env.BYPASS_RATE_LIMIT === "true") {
        return next();
    }

    try {
        const role: RateLimitRole = req.user?.role ?? "guest";

        // Base per-role limits (per minute), configurable via env vars
        const adminBase = envInt("RATE_LIMIT_ADMIN", process.env.NODE_ENV === "production" ? 20 : 300);
        const userBase = envInt("RATE_LIMIT_USER", process.env.NODE_ENV === "production" ? 10 : 120);
        const guestBase = envInt("RATE_LIMIT_GUEST", process.env.NODE_ENV === "production" ? 5 : 60);

        // Path-specific higher limit for subjects GETs (useful for UI pagination)
        const subjectsGetLimit = envInt("RATE_LIMIT_SUBJECTS_GET", process.env.NODE_ENV === "production" ? 30 : 240);

        let limit: number;
        let message: string;

        switch (role) {
            case "admin":
                limit = adminBase;
                message = `Admin request limit exceeded (${adminBase} per minute). Slow down!`;
                break;
            case "teacher":
            case "student":
                limit = userBase;
                message = `User request limit exceeded (${userBase} per minute). Please wait.`;
                break;
            default:
                limit = guestBase;
                message = `Guest request limit exceeded (${guestBase} per minute). Please sign up for higher limits.`;
                break;
        }

        // If this is a GET to /api/subjects, allow a higher cap
        if (req.method === "GET" && req.path.startsWith("/api/subjects")) {
            limit = Math.max(limit, subjectsGetLimit);
        }

        const client = aj.withRule(
            slidingWindow({
                mode: "LIVE",
                interval: "1m",
                max: limit,
            })
        );

        const arcjetRequest: ArcjetNodeRequest = {
            headers: req.headers,
            method: req.method,
            url: req.originalUrl ?? req.url,
            socket: {
                remoteAddress: req.socket.remoteAddress ?? req.ip ?? "0.0.0.0",
            },
        };

        const decision = await client.protect(arcjetRequest);

        if (decision.isDenied() && decision.reason.isBot()) {
            return res.status(403).json({
                error: "Forbidden",
                message: "Automated requests are not allowed",
            });
        }

        if (decision.isDenied() && decision.reason.isShield()) {
            return res.status(403).json({
                error: "Forbidden",
                message: "Request blocked by security policy",
            });
        }

        if (decision.isDenied() && decision.reason.isRateLimit()) {
            return res.status(429).json({
                error: "Too Many Requests",
                message,
            });
        }

        next();
    } catch (error) {
        console.error("Arcjet middleware error:", error);
        res.status(500).json({
            error: "Internal Server Error",
            message: "Something went wrong with the security middleware.",
        });
    }
};

export default securityMiddleware;