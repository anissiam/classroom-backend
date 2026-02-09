import { auth } from "../lib/auth";
import type { NextFunction, Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";

const authMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers),
        });

        if (session) {
            req.user = {
                ...session.user,
                role: session.user.role as "admin" | "teacher" | "student",
            };
        }

        next();
    } catch (error) {
        console.error("Auth middleware error:", error);
        next();
    }
};

export default authMiddleware;
