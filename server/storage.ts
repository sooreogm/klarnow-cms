import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";
import {
  users,
  categories,
  challenges,
  articles,
  comments,
  replies,
  likes,
  firebaseSettings,
  type User,
  type InsertUser,
  type Category,
  type Challenge,
  type InsertCategory,
  type InsertChallenge,
  type Article,
  type InsertArticle,
  type ArticleWithRelations,
  type Comment,
  type InsertComment,
  type CommentWithRelations,
  type Reply,
  type InsertReply,
  type Like,
  type InsertLike,
  type FirebaseSettings,
  type InsertFirebaseSettings,
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Category methods
  getCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: InsertCategory): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<void>;

  // Challenge methods
  getChallenges(): Promise<Challenge[]>;
  getChallenge(id: string): Promise<Challenge | undefined>;
  createChallenge(challenge: InsertChallenge): Promise<Challenge>;
  updateChallenge(id: string, challenge: InsertChallenge): Promise<Challenge | undefined>;
  deleteChallenge(id: string): Promise<void>;

  // Article methods
  getArticles(): Promise<ArticleWithRelations[]>;
  getArticle(id: string): Promise<Article | undefined>;
  createArticle(article: InsertArticle): Promise<Article>;
  updateArticle(id: string, article: Partial<InsertArticle>): Promise<Article | undefined>;
  deleteArticle(id: string): Promise<void>;

  // Comment methods
  getComments(): Promise<CommentWithRelations[]>;
  getComment(id: string): Promise<Comment | undefined>;
  createComment(comment: InsertComment): Promise<Comment>;
  deleteComment(id: string): Promise<void>;

  // Reply methods
  createReply(reply: InsertReply): Promise<Reply>;
  deleteReply(id: string): Promise<void>;

  // Like methods
  createLike(like: InsertLike): Promise<Like>;
  deleteLike(id: string): Promise<void>;

  // Firebase settings methods
  getFirebaseSettings(): Promise<FirebaseSettings | undefined>;
  saveFirebaseSettings(settings: InsertFirebaseSettings): Promise<FirebaseSettings>;

  // Stats methods
  getStats(): Promise<{ totalArticles: number; totalLikes: number; totalCategories: number }>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(categories.name);
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category || undefined;
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values(insertCategory).returning();
    return category;
  }

  async updateCategory(id: string, insertCategory: InsertCategory): Promise<Category | undefined> {
    const [category] = await db
      .update(categories)
      .set(insertCategory)
      .where(eq(categories.id, id))
      .returning();
    return category || undefined;
  }

  async deleteCategory(id: string): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  // Challenge methods
  async getChallenges(): Promise<Challenge[]> {
    return await db.select().from(challenges).orderBy(challenges.name);
  }

  async getChallenge(id: string): Promise<Challenge | undefined> {
    const [challenge] = await db.select().from(challenges).where(eq(challenges.id, id));
    return challenge || undefined;
  }

  async createChallenge(insertChallenge: InsertChallenge): Promise<Challenge> {
    const [challenge] = await db.insert(challenges).values(insertChallenge).returning();
    return challenge;
  }

  async updateChallenge(id: string, insertChallenge: InsertChallenge): Promise<Challenge | undefined> {
    const [challenge] = await db
      .update(challenges)
      .set(insertChallenge)
      .where(eq(challenges.id, id))
      .returning();
    return challenge || undefined;
  }

  async deleteChallenge(id: string): Promise<void> {
    await db.delete(challenges).where(eq(challenges.id, id));
  }

  // Article methods
  async getArticles(): Promise<ArticleWithRelations[]> {
    const articlesData = await db.query.articles.findMany({
      with: {
        author: true,
        category: true,
        challenge: true,
        likes: true,
        comments: {
          with: {
            replies: {
              with: {
                author: true,
              },
              orderBy: [desc(replies.createdAt)],
            },
          },
          orderBy: [desc(comments.createdAt)],
        },
      },
      orderBy: [desc(articles.createdAt)],
    });

    return articlesData.map(article => ({
      ...article,
      author: article.author || null,
      challenge: article.challenge || null,
      likesCount: article.likes.length,
      comments: article.comments.map(comment => ({
        ...comment,
        replies: comment.replies.map(reply => ({
          ...reply,
          author: reply.author || null,
        })),
      })),
    }));
  }

  async getArticle(id: string): Promise<Article | undefined> {
    const [article] = await db.select().from(articles).where(eq(articles.id, id));
    return article || undefined;
  }

  async createArticle(insertArticle: InsertArticle): Promise<Article> {
    const [article] = await db.insert(articles).values(insertArticle).returning();
    return article;
  }

  async updateArticle(id: string, insertArticle: Partial<InsertArticle>): Promise<Article | undefined> {
    const [article] = await db
      .update(articles)
      .set({ ...insertArticle, updatedAt: new Date() })
      .where(eq(articles.id, id))
      .returning();
    return article || undefined;
  }

  async deleteArticle(id: string): Promise<void> {
    await db.delete(articles).where(eq(articles.id, id));
  }

  // Comment methods
  async getComments(): Promise<CommentWithRelations[]> {
    const commentsData = await db.query.comments.findMany({
      with: {
        replies: {
          with: {
            author: true,
          },
          orderBy: [desc(replies.createdAt)],
        },
      },
      orderBy: [desc(comments.createdAt)],
    });

    return commentsData.map(comment => ({
      ...comment,
      replies: comment.replies.map(reply => ({
        ...reply,
        author: reply.author || null,
      })),
    }));
  }

  async getComment(id: string): Promise<Comment | undefined> {
    const [comment] = await db.select().from(comments).where(eq(comments.id, id));
    return comment || undefined;
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const [comment] = await db.insert(comments).values(insertComment).returning();
    return comment;
  }

  async deleteComment(id: string): Promise<void> {
    await db.delete(comments).where(eq(comments.id, id));
  }

  // Reply methods
  async createReply(insertReply: InsertReply): Promise<Reply> {
    const [reply] = await db.insert(replies).values(insertReply).returning();
    return reply;
  }

  async deleteReply(id: string): Promise<void> {
    await db.delete(replies).where(eq(replies.id, id));
  }

  // Like methods
  async createLike(insertLike: InsertLike): Promise<Like> {
    const [like] = await db.insert(likes).values(insertLike).returning();
    return like;
  }

  async deleteLike(id: string): Promise<void> {
    await db.delete(likes).where(eq(likes.id, id));
  }

  // Firebase settings methods
  async getFirebaseSettings(): Promise<FirebaseSettings | undefined> {
    const [settings] = await db.select().from(firebaseSettings).orderBy(desc(firebaseSettings.updatedAt)).limit(1);
    return settings || undefined;
  }

  async saveFirebaseSettings(insertSettings: InsertFirebaseSettings): Promise<FirebaseSettings> {
    // Delete old settings and insert new one
    await db.delete(firebaseSettings);
    const [settings] = await db.insert(firebaseSettings).values(insertSettings).returning();
    return settings;
  }

  // Stats methods
  async getStats(): Promise<{ totalArticles: number; totalLikes: number; totalCategories: number }> {
    const [articlesCount] = await db.select({ count: sql<number>`count(*)::int` }).from(articles);
    const [likesCount] = await db.select({ count: sql<number>`count(*)::int` }).from(likes);
    const [categoriesCount] = await db.select({ count: sql<number>`count(*)::int` }).from(categories);

    return {
      totalArticles: articlesCount.count,
      totalLikes: likesCount.count,
      totalCategories: categoriesCount.count,
    };
  }
}

export const storage = new DatabaseStorage();
