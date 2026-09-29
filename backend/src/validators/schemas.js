import { z } from 'zod';

// ---- Field rules (mirrored in frontend/src/utils/validation.js) ----
export const nameRule = z
  .string({ required_error: 'Name is required' })
  .trim()
  .min(20, 'Name must be at least 20 characters')
  .max(60, 'Name must be at most 60 characters');

export const emailRule = z
  .string({ required_error: 'Email is required' })
  .trim()
  .max(255, 'Email is too long')
  .email('Enter a valid email address')
  .transform((v) => v.toLowerCase());

export const addressRule = z
  .string({ required_error: 'Address is required' })
  .trim()
  .min(1, 'Address is required')
  .max(400, 'Address must be at most 400 characters');

export const passwordRule = z
  .string({ required_error: 'Password is required' })
  .min(8, 'Password must be 8–16 characters')
  .max(16, 'Password must be 8–16 characters')
  .regex(/[A-Z]/, 'Password must include at least one uppercase letter')
  .regex(/[^A-Za-z0-9]/, 'Password must include at least one special character');

export const roleRule = z.enum(['ADMIN', 'USER', 'OWNER'], { errorMap: () => ({ message: 'Role must be ADMIN, USER or OWNER' }) });

// ---- Request bodies ----
export const registerSchema = z.object({
  name: nameRule,
  email: emailRule,
  address: addressRule,
  password: passwordRule,
});

export const loginSchema = z.object({
  email: emailRule,
  password: z.string().min(1, 'Password is required'),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordRule,
  })
  .refine((d) => d.currentPassword !== d.newPassword, {
    path: ['newPassword'],
    message: 'New password must be different from the current one',
  });

export const createUserSchema = registerSchema.extend({ role: roleRule });

export const createStoreSchema = z.object({
  name: nameRule,
  email: emailRule,
  address: addressRule,
  ownerId: z.coerce.number().int().positive().nullable().optional(),
});

export const ratingSchema = z.object({
  rating: z.coerce
    .number({ invalid_type_error: 'Rating must be a number' })
    .int('Rating must be a whole number')
    .min(1, 'Rating must be between 1 and 5')
    .max(5, 'Rating must be between 1 and 5'),
});

export const idParam = z.object({ id: z.coerce.number().int().positive('Invalid id') });

// ---- Query strings (listing, filtering, sorting, paging) ----
const listBase = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  order: z.enum(['asc', 'desc']).default('asc'),
};
const optionalText = z.string().trim().max(400).optional();

export const userListQuery = z.object({
  ...listBase,
  sortBy: z.enum(['name', 'email', 'address', 'role', 'rating', 'createdAt']).default('name'),
  name: optionalText,
  email: optionalText,
  address: optionalText,
  role: roleRule.optional().or(z.literal('').transform(() => undefined)),
});

export const adminStoreListQuery = z.object({
  ...listBase,
  sortBy: z.enum(['name', 'email', 'address', 'rating', 'ratingCount', 'createdAt']).default('name'),
  name: optionalText,
  email: optionalText,
  address: optionalText,
});

export const userStoreListQuery = z.object({
  ...listBase,
  sortBy: z.enum(['name', 'address', 'rating', 'myRating']).default('name'),
  search: optionalText,
  name: optionalText,
  address: optionalText,
});

export const ownerRatersQuery = z.object({
  sortBy: z.enum(['name', 'email', 'rating', 'ratedAt']).default('ratedAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});
