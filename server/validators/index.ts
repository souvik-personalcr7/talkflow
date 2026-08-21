import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name is too long"),
  username: z.string().min(3, "Username must be at least 3 characters").max(30, "Username is too long").regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").max(100, "Password is too long"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const aiPromptSchema = z.object({
  message: z.string()
    .min(1, "Message cannot be empty")
    .max(4000, "Message is too long (max 4000 characters)"),
  context: z.array(z.object({
    role: z.enum(["user", "assistant", "model"]),
    content: z.string()
  })).optional()
});
