import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  validateCategoryForCreate,
  validateCategoryForUpdate,
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory
} from '../categories.db.js';

vi.mock('@prisma/client', () => {
  const mockCategories = [
    { id: 1, title: 'HTML', slug: 'html' },
    { id: 2, title: 'CSS', slug: 'css' },
    { id: 3, title: 'JavaScript', slug: 'js' }
  ];

  return {
    PrismaClient: vi.fn().mockImplementation(() => ({
      categories: {
        findMany: vi.fn().mockImplementation(({ skip, take }) => {
          return Promise.resolve(mockCategories.slice(skip, skip + take));
        }),
        findUnique: vi.fn().mockImplementation(({ where }) => {
          const category = mockCategories.find(c => c.slug === where.slug);
          return Promise.resolve(category || null);
        }),
        create: vi.fn().mockImplementation(({ data }) => {
          const newCategory = { id: mockCategories.length + 1, ...data };
          mockCategories.push(newCategory);
          return Promise.resolve(newCategory);
        }),
        update: vi.fn().mockImplementation(({ where, data }) => {
          const index = mockCategories.findIndex(c => c.slug === where.slug);
          if (index === -1) return Promise.resolve(null);
          
          const updated = { ...mockCategories[index], ...data };
          mockCategories[index] = updated;
          return Promise.resolve(updated);
        }),
        delete: vi.fn().mockImplementation(({ where }) => {
          const index = mockCategories.findIndex(c => c.slug === where.slug);
          if (index === -1) return Promise.resolve(null);
          
          const deleted = mockCategories[index];
          mockCategories.splice(index, 1);
          return Promise.resolve(deleted);
        }),
      }
    })),
  };
});

describe('Category validation', () => {
  it('should validate a valid category for creation', () => {
    const validCategory = {
      title: 'TypeScript',
    };
    
    const result = validateCategoryForCreate(validCategory);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validCategory);
    }
  });
  
  it('should reject an invalid category for creation', () => {
    const invalidCategory = {
      title: 'Ts', 
    };
    
    const result = validateCategoryForCreate(invalidCategory);
    expect(result.success).toBe(false);
  });
  
  it('should validate a valid category update', () => {
    const validUpdate = {
      title: 'Updated Category',
    };
    
    const result = validateCategoryForUpdate(validUpdate);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validUpdate);
    }
  });
});

describe('Category database operations', () => {
  it('should get categories with pagination', async () => {
    const categories = await getCategories(2, 0);
    expect(categories.length).toBe(2);
    expect(categories[0].id).toBe(1);
    expect(categories[1].id).toBe(2);
    
    const nextPage = await getCategories(2, 2);
    expect(nextPage.length).toBe(1);
    expect(nextPage[0].id).toBe(3);
  });
  
  it('should get a category by slug', async () => {
    const category = await getCategoryBySlug('html');
    expect(category).not.toBeNull();
    expect(category?.title).toBe('HTML');
  });
  
  it('should return null for non-existent category slug', async () => {
    const category = await getCategoryBySlug('nonexistent');
    expect(category).toBeNull();
  });
  
  it('should create a category', async () => {
    const newCategory = {
      title: 'React',
    };
    
    const created = await createCategory(newCategory);
    expect(created.id).toBe(4);
    expect(created.title).toBe('React');
    expect(created.slug).toBe('react');
  });
  
  it('should update a category', async () => {
    const updates = {
      title: 'Updated HTML',
    };
    
    const updated = await updateCategory('html', updates);
    expect(updated).not.toBeNull();
    expect(updated?.title).toBe('Updated HTML');
    expect(updated?.slug).toBe('updated-html');
  });
  
  it('should return null when updating non-existent category', async () => {
    const updates = { title: 'This will fail' };
    const result = await updateCategory('nonexistent', updates);
    expect(result).toBeNull();
  });
  
  it('should delete a category', async () => {
    const deleted = await deleteCategory('css');
    expect(deleted).not.toBeNull();
    expect(deleted?.title).toBe('CSS');
    
    const notFound = await getCategoryBySlug('css');
    expect(notFound).toBeNull();
  });
  
  it('should return null when deleting non-existent category', async () => {
    const result = await deleteCategory('nonexistent');
    expect(result).toBeNull();
  });
});
