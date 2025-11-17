import { sql, relations } from "drizzle-orm";
import {
    pgTable,
    text,
    varchar,
    timestamp,
    integer,
    unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
    id: varchar("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
    name: text("name"),
    email: text("email").unique(),
    avatarUrl: text("avatar_url"),
});

// Categories table
export const categories = pgTable("categories", {
    id: varchar("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
    name: text("name").notNull().unique(),
});

// Challenges table
export const challenges = pgTable("challenges", {
    id: varchar("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
    name: text("name").notNull().unique(),
});

// Articles table
export const articles = pgTable("articles", {
    id: varchar("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
    title: text("title").notNull(),
    coverImageUrl: text("cover_image_url"),
    description: text("description"),
    content: text("content").notNull().default(""),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    authorId: varchar("author_id").references(() => users.id, {
        onDelete: "set null",
    }),
    categoryId: varchar("category_id")
        .references(() => categories.id, { onDelete: "cascade" })
        .notNull(),
    challengeId: varchar("challenge_id").references(() => challenges.id, {
        onDelete: "set null",
    }),
});

// Comments table
export const comments = pgTable("comments", {
    id: varchar("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
    comment: text("comment").notNull(),
    avatar: text("avatar"),
    username: text("username"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    articleId: varchar("article_id")
        .references(() => articles.id, { onDelete: "cascade" })
        .notNull(),
});

// Replies table
export const replies = pgTable("replies", {
    id: varchar("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
    text: text("text").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    authorId: varchar("author_id").references(() => users.id, {
        onDelete: "set null",
    }),
    commentId: varchar("comment_id")
        .references(() => comments.id, { onDelete: "cascade" })
        .notNull(),
});

// Likes table (ensure unique user-article pairs)
export const likes = pgTable("likes", {
    id: varchar("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
    articleId: varchar("article_id")
        .references(() => articles.id, { onDelete: "cascade" })
        .notNull(),
    userId: varchar("user_id").default(""),
});

// Firebase settings table (stores Firebase configuration)
export const firebaseSettings = pgTable("firebase_settings", {
    id: varchar("id")
        .primaryKey()
        .default(sql`gen_random_uuid()`),
    apiKey: text("api_key").notNull(),
    authDomain: text("auth_domain").notNull(),
    projectId: text("project_id").notNull(),
    storageBucket: text("storage_bucket").notNull(),
    messagingSenderId: text("messaging_sender_id").notNull(),
    appId: text("app_id").notNull(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
    articles: many(articles),
    comments: many(comments),
    replies: many(replies),
    likes: many(likes),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
    articles: many(articles),
}));

export const challengesRelations = relations(challenges, ({ many }) => ({
    articles: many(articles),
}));

export const articlesRelations = relations(articles, ({ one, many }) => ({
    author: one(users, {
        fields: [articles.authorId],
        references: [users.id],
    }),
    category: one(categories, {
        fields: [articles.categoryId],
        references: [categories.id],
    }),
    challenge: one(challenges, {
        fields: [articles.challengeId],
        references: [challenges.id],
    }),
    comments: many(comments),
    likes: many(likes),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
    article: one(articles, {
        fields: [comments.articleId],
        references: [articles.id],
    }),
    replies: many(replies),
}));

export const repliesRelations = relations(replies, ({ one }) => ({
    author: one(users, {
        fields: [replies.authorId],
        references: [users.id],
    }),
    comment: one(comments, {
        fields: [replies.commentId],
        references: [comments.id],
    }),
}));

export const likesRelations = relations(likes, ({ one }) => ({
    article: one(articles, {
        fields: [likes.articleId],
        references: [articles.id],
    }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertCategorySchema = createInsertSchema(categories).omit({
    id: true,
});
export const insertChallengeSchema = createInsertSchema(challenges).omit({
    id: true,
});
export const insertArticleSchema = createInsertSchema(articles)
    .omit({
        id: true,
        createdAt: true,
        updatedAt: true,
    })
    .extend({
        title: z.string().min(1, "Title is required"),
        content: z.string(),
    });
export const insertCommentSchema = createInsertSchema(comments).omit({
    id: true,
    createdAt: true,
});
export const insertReplySchema = createInsertSchema(replies).omit({
    id: true,
    createdAt: true,
});
export const insertLikeSchema = createInsertSchema(likes).omit({ id: true });
export const insertFirebaseSettingsSchema = createInsertSchema(
    firebaseSettings
).omit({
    id: true,
    updatedAt: true,
});

// Select types
export type User = typeof users.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Challenge = typeof challenges.$inferSelect;
export type Article = typeof articles.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type Reply = typeof replies.$inferSelect;
export type Like = typeof likes.$inferSelect;
export type FirebaseSettings = typeof firebaseSettings.$inferSelect;

// Insert types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertChallenge = z.infer<typeof insertChallengeSchema>;
export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type InsertReply = z.infer<typeof insertReplySchema>;
export type InsertLike = z.infer<typeof insertLikeSchema>;
export type InsertFirebaseSettings = z.infer<
    typeof insertFirebaseSettingsSchema
>;

// Extended types for API responses with relations
export type ArticleWithRelations = Article & {
    author: User | null;
    category: Category;
    challenge: Challenge | null;
    likesCount: number;
    comments: CommentWithRelations[];
};

export type CommentWithRelations = Comment & {
    replies: (Reply & { author: User | null })[];
};
