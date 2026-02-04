import express from "express";
import { and, desc, eq, getTableColumns, ilike, or, sql } from "drizzle-orm";
import { user } from "../db/schema/auth";
import { db } from "../db";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { search, role, page = 1, limit = 10 } = req.query;

    const currentPage = Math.max(1, parseInt(String(page), 10) || 1);
    const limitPerPage = Math.min(Math.max(1, parseInt(String(limit), 10) || 10), 100);
    const offset = (currentPage - 1) * limitPerPage;

    const filterConditions = [] as any[];

    if (search) {
      filterConditions.push(
        or(
          ilike(user.name, `%${search}%`),
          ilike(user.email, `%${search}%`),
        )
      );
    }

    if (role) {
      filterConditions.push(eq(user.role, String(role)));
    }

    const whereClause = filterConditions.length > 0 ? and(...filterConditions) : undefined;

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(user)
      .where(whereClause);

    const totalCount = countResult[0]?.count ?? 0;

    const usersList = await db
      .select({ ...getTableColumns(user) })
      .from(user)
      .where(whereClause)
      .orderBy(desc(user.createdAt))
      .limit(limitPerPage)
      .offset(offset);

    res.status(200).json({
      data: usersList,
      pagination: {
        page: currentPage,
        limit: limitPerPage,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitPerPage),
      },
    });
  } catch (error) {
    console.log("GET /users error:", error);
    return res.status(500).json({ message: "Failed to get users" });
  }
});

export default router;
