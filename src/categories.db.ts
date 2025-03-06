import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CategorySchema = z.object({
  id: z.number(),
  title: z
    .string()
    .min(3, 'title must be at least three letters')
    .max(1024, 'title must be at most 1024 letters'),
  slug: z.string(),
});

const CategoryToCreateSchema = z.object({
  title: z
    .string()
    .min(3, 'title must be at least three letters')
    .max(1024, 'title must be at most 1024 letters'),
});

const CategoryToUpdateSchema = z.object({
  title: z.string().min(3).max(1024),
});

export type Category = z.infer<typeof CategorySchema>;
export type CategoryToCreate = z.infer<typeof CategoryToCreateSchema>;
export type CategoryToUpdate = z.infer<typeof CategoryToUpdateSchema>;

export function validateCategoryForCreate(data: unknown){
  return CategoryToCreateSchema.safeParse(data);
}

export function validateCategoryForUpdate(data: unknown){
  return CategoryToUpdateSchema.safeParse(data);
}


const mockCategories: Array<Category> = [
  {
    id: 1,
    slug: 'html',
    title: 'HTML',
  },
  {
    id: 2,
    slug: 'css',
    title: 'CSS',
  },
  {
    id: 3,
    slug: 'js',
    title: 'JavaScript',
  },
];


export async function getCategories(
  limit: number = 10,
  offset: number = 0,
): Promise<Array<Category>> {
  const categories = await prisma.categories.findMany({
    skip: offset,
    take: limit,
    orderBy: { id: 'asc' },
  });
  return categories;
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const category = await prisma.categories.findUnique({
    where: { slug },
  });
  return category;
}

export function getCategory(slug: string): Category | null {
  const cat = mockCategories.find((c) => c.slug === slug);

  return cat ?? null;
}

export function validateCategory(categoryToValidate: unknown) {
  const result = CategoryToCreateSchema.safeParse(categoryToValidate);

  return result;
}

export async function createCategory(categoryToCreate: CategoryToCreate): Promise<Category> {
  const slug = categoryToCreate.title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '');

  const createdCategory = await prisma.categories.create({
    data: {
      title: categoryToCreate.title,
      slug,
    },
  });

  return createdCategory;
}

export async function updateCategory(slug: string, changes: CategoryToUpdate): Promise<Category | null> {
  const existing = await prisma.categories.findUnique({
    where: { slug }
  });
  if (!existing) {
    return null;
  }

  let newSlug = existing.slug;
  if (changes.title) {
    newSlug = changes.title
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '');
  }
  
  const updated = await prisma.categories.update({
    where: { slug },
    data: {
      title: changes.title ?? existing.title,
      slug: newSlug,
    },
  });
  return updated;
}

export async function deleteCategory(slug: string): Promise<Category | null> {
  const existing = await prisma.categories.findUnique({
    where: { slug }
  });
  if (!existing) {
    return null;
  }

  const deleted = await prisma.categories.delete({
    where: { slug }
  });
  return deleted;
}