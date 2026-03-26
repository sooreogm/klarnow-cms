import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
    insertCategorySchema,
    insertChallengeSchema,
    insertArticleSchema,
    insertCommentSchema,
    insertReplySchema,
    insertLikeSchema,
    type InsertArticle,
} from "@shared/schema";
import {
    PocketBaseUploadError,
    UploadValidationError,
    readMultipartFormData,
    uploadImageToPocketBase,
} from "./pocketbase";
import {
    buildAuthSessionResponse,
    getAdminUsername,
    isValidAdminPassword,
    requireApiAccess,
    SESSION_COOKIE_NAME,
} from "./auth";
import type { LoginRequestBody } from "@shared/auth";

function hasOwnProperty(value: object, key: string) {
    return Object.prototype.hasOwnProperty.call(value, key);
}

function normalizeNullableArticleField(value: unknown) {
    if (typeof value !== "string") {
        return value;
    }

    const normalized = value.trim();
    return normalized === "" ? null : normalized;
}

function normalizeArticlePayload(
    payload: Partial<InsertArticle>
): Partial<InsertArticle> {
    const normalizedPayload: Partial<InsertArticle> = { ...payload };

    if (hasOwnProperty(payload, "challengeId")) {
        normalizedPayload.challengeId = normalizeNullableArticleField(
            payload.challengeId
        ) as InsertArticle["challengeId"];
    }

    if (hasOwnProperty(payload, "coverImageUrl")) {
        normalizedPayload.coverImageUrl = normalizeNullableArticleField(
            payload.coverImageUrl
        ) as InsertArticle["coverImageUrl"];
    }

    if (hasOwnProperty(payload, "description")) {
        normalizedPayload.description = normalizeNullableArticleField(
            payload.description
        ) as InsertArticle["description"];
    }

    return normalizedPayload;
}

export async function registerRoutes(app: Express): Promise<Server> {
    // Health endpoint for Docker/Deploy checks
    app.get("/api/test", (_req, res) => {
        res.json({ ok: true });
    });

    app.get("/api/auth/session", (req, res) => {
        res.json(buildAuthSessionResponse(req));
    });

    app.post("/api/auth/login", (req, res, next) => {
        const { password } = (req.body ?? {}) as Partial<LoginRequestBody>;

        if (typeof password !== "string" || password.trim().length === 0) {
            return res.status(400).json({ error: "Password is required" });
        }

        if (!isValidAdminPassword(password)) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        req.session.regenerate((regenerateError) => {
            if (regenerateError) {
                return next(regenerateError);
            }

            req.session.isAuthenticated = true;
            req.session.username = getAdminUsername();

            req.session.save((saveError) => {
                if (saveError) {
                    return next(saveError);
                }

                res.json(buildAuthSessionResponse(req));
            });
        });
    });

    app.post("/api/auth/logout", (req, res, next) => {
        if (!req.session) {
            return res.json({ authenticated: false, username: null });
        }

        req.session.destroy((destroyError) => {
            if (destroyError) {
                return next(destroyError);
            }

            res.clearCookie(SESSION_COOKIE_NAME);
            res.json({ authenticated: false, username: null });
        });
    });

    app.use("/api", requireApiAccess);

    app.post("/api/uploads/images", async (req, res) => {
        try {
            const formData = await readMultipartFormData(req);
            const upload = await uploadImageToPocketBase(formData);

            res.status(201).json(upload);
        } catch (error) {
            console.error("Error in POST /api/uploads/images:", error);

            if (error instanceof UploadValidationError) {
                return res.status(400).json({ error: error.message });
            }

            if (error instanceof PocketBaseUploadError) {
                return res.status(502).json({ error: error.message });
            }

            res.status(500).json({
                error: "Failed to upload image",
                details: error instanceof Error ? error.message : String(error),
            });
        }
    });

    // Stats endpoint
    app.get("/api/stats", async (_req, res) => {
        try {
            const stats = await storage.getStats();
            res.json(stats);
        } catch (error) {
            console.error("Error in /api/stats:", error);
            res.status(500).json({
                error: "Failed to fetch stats",
                details: error instanceof Error ? error.message : String(error),
            });
        }
    });

    // Category endpoints
    app.get("/api/categories", async (_req, res) => {
        try {
            const categories = await storage.getCategories();
            res.json(categories);
        } catch (error) {
            console.error("Error in /api/categories:", error);
            res.status(500).json({
                error: "Failed to fetch categories",
                details: error instanceof Error ? error.message : String(error),
            });
        }
    });

    // Challenge endpoints
    app.get("/api/challenges", async (_req, res) => {
        try {
            const challenges = await storage.getChallenges();
            res.json(challenges);
        } catch (error) {
            console.error("Error in /api/challenges:", error);
            res.status(500).json({
                error: "Failed to fetch challenges",
                details: error instanceof Error ? error.message : String(error),
            });
        }
    });

    app.get("/api/challenges/:id", async (req, res) => {
        try {
            const challenge = await storage.getChallenge(req.params.id);
            if (!challenge) {
                return res.status(404).json({ error: "Challenge not found" });
            }
            res.json(challenge);
        } catch (error) {
            console.error("Error in /api/challenges/:id:", error);
            res.status(500).json({
                error: "Failed to fetch challenge",
                details: error instanceof Error ? error.message : String(error),
            });
        }
    });

    app.post("/api/challenges", async (req, res) => {
        try {
            const parsed = insertChallengeSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ error: parsed.error.message });
            }
            const challenge = await storage.createChallenge(parsed.data);
            res.json(challenge);
        } catch (error: any) {
            console.error("Error in POST /api/challenges:", error);
            if (error.message?.includes("unique")) {
                return res
                    .status(400)
                    .json({ error: "Challenge name already exists" });
            }
            res.status(500).json({
                error: "Failed to create challenge",
                details: error instanceof Error ? error.message : String(error),
            });
        }
    });

    app.patch("/api/challenges/:id", async (req, res) => {
        try {
            const parsed = insertChallengeSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ error: parsed.error.message });
            }
            const challenge = await storage.updateChallenge(
                req.params.id,
                parsed.data
            );
            if (!challenge) {
                return res.status(404).json({ error: "Challenge not found" });
            }
            res.json(challenge);
        } catch (error: any) {
            console.error("Error in PATCH /api/challenges/:id:", error);
            if (error.message?.includes("unique")) {
                return res
                    .status(400)
                    .json({ error: "Challenge name already exists" });
            }
            res.status(500).json({
                error: "Failed to update challenge",
                details: error instanceof Error ? error.message : String(error),
            });
        }
    });

    app.delete("/api/challenges/:id", async (req, res) => {
        try {
            await storage.deleteChallenge(req.params.id);
            res.json({ success: true });
        } catch (error) {
            console.error("Error in DELETE /api/challenges/:id:", error);
            res.status(500).json({
                error: "Failed to delete challenge",
                details: error instanceof Error ? error.message : String(error),
            });
        }
    });

    app.get("/api/categories/:id", async (req, res) => {
        try {
            const category = await storage.getCategory(req.params.id);
            if (!category) {
                return res.status(404).json({ error: "Category not found" });
            }
            res.json(category);
        } catch (error) {
            console.error("Error in /api/categories/:id:", error);
            res.status(500).json({
                error: "Failed to fetch category",
                details: error instanceof Error ? error.message : String(error),
            });
        }
    });

    app.post("/api/categories", async (req, res) => {
        try {
            const parsed = insertCategorySchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ error: parsed.error.message });
            }
            const category = await storage.createCategory(parsed.data);
            res.json(category);
        } catch (error: any) {
            console.error("Error in POST /api/categories:", error);
            if (error.message?.includes("unique")) {
                return res
                    .status(400)
                    .json({ error: "Category name already exists" });
            }
            res.status(500).json({
                error: "Failed to create category",
                details: error instanceof Error ? error.message : String(error),
            });
        }
    });

    app.patch("/api/categories/:id", async (req, res) => {
        try {
            const parsed = insertCategorySchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ error: parsed.error.message });
            }
            const category = await storage.updateCategory(
                req.params.id,
                parsed.data
            );
            if (!category) {
                return res.status(404).json({ error: "Category not found" });
            }
            res.json(category);
        } catch (error: any) {
            console.error("Error in PATCH /api/categories/:id:", error);
            if (error.message?.includes("unique")) {
                return res
                    .status(400)
                    .json({ error: "Category name already exists" });
            }
            res.status(500).json({
                error: "Failed to update category",
                details: error instanceof Error ? error.message : String(error),
            });
        }
    });

    app.delete("/api/categories/:id", async (req, res) => {
        try {
            await storage.deleteCategory(req.params.id);
            res.json({ success: true });
        } catch (error) {
            console.error("Error in DELETE /api/categories/:id:", error);
            res.status(500).json({
                error: "Failed to delete category",
                details: error instanceof Error ? error.message : String(error),
            });
        }
    });

    // Article endpoints
    app.get("/api/articles", async (_req, res) => {
        try {
            const articles = await storage.getArticles();
            res.json(articles);
        } catch (error) {
            console.error("Error in /api/articles:", error);
            res.status(500).json({
                error: "Failed to fetch articles",
                details: error instanceof Error ? error.message : String(error),
            });
        }
    });

    app.get("/api/articles/:id", async (req, res) => {
        try {
            const article = await storage.getArticle(req.params.id);
            if (!article) {
                return res.status(404).json({ error: "Article not found" });
            }
            res.json(article);
        } catch (error) {
            console.error("Error in /api/articles/:id:", error);
            res.status(500).json({
                error: "Failed to fetch article",
                details: error instanceof Error ? error.message : String(error),
            });
        }
    });

    app.post("/api/articles", async (req, res) => {
        try {
            const parsed = insertArticleSchema.safeParse(
                normalizeArticlePayload(req.body)
            );
            if (!parsed.success) {
                return res.status(400).json({ error: parsed.error.message });
            }
            const article = await storage.createArticle(parsed.data);
            res.json(article);
        } catch (error) {
            console.error("Error in POST /api/articles:", error);
            res.status(500).json({
                error: "Failed to create article",
                details: error instanceof Error ? error.message : String(error),
            });
        }
    });

    app.patch("/api/articles/:id", async (req, res) => {
        try {
            const parsed = insertArticleSchema.safeParse(
                normalizeArticlePayload(req.body)
            );
            if (!parsed.success) {
                return res.status(400).json({ error: parsed.error.message });
            }
            const article = await storage.updateArticle(
                req.params.id,
                parsed.data
            );
            if (!article) {
                return res.status(404).json({ error: "Article not found" });
            }
            res.json(article);
        } catch (error) {
            console.error("Error in PATCH /api/articles/:id:", error);
            res.status(500).json({
                error: "Failed to update article",
                details: error instanceof Error ? error.message : String(error),
            });
        }
    });

    app.delete("/api/articles/:id", async (req, res) => {
        try {
            await storage.deleteArticle(req.params.id);
            res.json({ success: true });
        } catch (error) {
            console.error("Error in DELETE /api/articles/:id:", error);
            res.status(500).json({
                error: "Failed to delete article",
                details: error instanceof Error ? error.message : String(error),
            });
        }
    });

    // Comment endpoints
    app.get("/api/comments", async (_req, res) => {
        try {
            const comments = await storage.getComments();
            res.json(comments);
        } catch (error) {
            console.error("Error in /api/comments:", error);
            res.status(500).json({
                error: "Failed to fetch comments",
                details: error instanceof Error ? error.message : String(error),
            });
        }
    });

    app.get("/api/comments/:id", async (req, res) => {
        try {
            const comment = await storage.getComment(req.params.id);
            if (!comment) {
                return res.status(404).json({ error: "Comment not found" });
            }
            res.json(comment);
        } catch (error) {
            console.error("Error in /api/comments/:id:", error);
            res.status(500).json({
                error: "Failed to fetch comment",
                details: error instanceof Error ? error.message : String(error),
            });
        }
    });

    app.post("/api/comments", async (req, res) => {
        try {
            const parsed = insertCommentSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ error: parsed.error.message });
            }
            const comment = await storage.createComment(parsed.data);
            res.json(comment);
        } catch (error) {
            console.error("Error in POST /api/comments:", error);
            res.status(500).json({
                error: "Failed to create comment",
                details: error instanceof Error ? error.message : String(error),
            });
        }
    });

    app.delete("/api/comments/:id", async (req, res) => {
        try {
            await storage.deleteComment(req.params.id);
            res.json({ success: true });
        } catch (error) {
            console.error("Error in DELETE /api/comments/:id:", error);
            res.status(500).json({
                error: "Failed to delete comment",
                details: error instanceof Error ? error.message : String(error),
            });
        }
    });

    // Reply endpoints
    app.post("/api/replies", async (req, res) => {
        try {
            const parsed = insertReplySchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ error: parsed.error.message });
            }
            const reply = await storage.createReply(parsed.data);
            res.json(reply);
        } catch (error) {
            console.error("Error in POST /api/replies:", error);
            res.status(500).json({
                error: "Failed to create reply",
                details: error instanceof Error ? error.message : String(error),
            });
        }
    });

    app.delete("/api/replies/:id", async (req, res) => {
        try {
            await storage.deleteReply(req.params.id);
            res.json({ success: true });
        } catch (error) {
            console.error("Error in DELETE /api/replies/:id:", error);
            res.status(500).json({
                error: "Failed to delete reply",
                details: error instanceof Error ? error.message : String(error),
            });
        }
    });

    // Like endpoints
    app.post("/api/likes", async (req, res) => {
        try {
            const parsed = insertLikeSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ error: parsed.error.message });
            }
            const like = await storage.createLike(parsed.data);
            res.json(like);
        } catch (error: any) {
            console.error("Error in POST /api/likes:", error);
            if (error.message?.includes("unique")) {
                return res.status(400).json({ error: "Already liked" });
            }
            res.status(500).json({
                error: "Failed to create like",
                details: error instanceof Error ? error.message : String(error),
            });
        }
    });

    app.delete("/api/likes/:id", async (req, res) => {
        try {
            await storage.deleteLike(req.params.id);
            res.json({ success: true });
        } catch (error) {
            console.error("Error in DELETE /api/likes/:id:", error);
            res.status(500).json({
                error: "Failed to delete like",
                details: error instanceof Error ? error.message : String(error),
            });
        }
    });
    const httpServer = createServer(app);
    return httpServer;
}
