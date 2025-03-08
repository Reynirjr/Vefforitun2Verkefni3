import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  validateQuestionForCreate,
  validateQuestionForUpdate,
  getQuestions,
  getQuestionById,
  createQuestion,
  deleteQuestion,
  updateQuestion,
  getQuestionByCategorySlug
} from '../questions.db.js';

// Mock the Prisma client
vi.mock('@prisma/client', () => {
  const mockQuestions = [
    { id: 1, question: 'Test Question 1', answer: 'Test Answer 1', slug: 'test-question-1', categoryId: 1 },
    { id: 2, question: 'Test Question 2', answer: 'Test Answer 2', slug: 'test-question-2', categoryId: 2 },
  ];
  
  const mockCategories = [
    { id: 1, title: 'HTML', slug: 'html' },
    { id: 2, title: 'CSS', slug: 'css' },
  ];

  return {
    PrismaClient: vi.fn().mockImplementation(() => ({
      questions: {
        findMany: vi.fn().mockResolvedValue(mockQuestions),
        findUnique: vi.fn().mockImplementation(({ where }) => {
          const question = mockQuestions.find(q => q.id === where.id);
          return Promise.resolve(question || null);
        }),
        create: vi.fn().mockImplementation(({ data }) => {
          const newQuestion = { id: 3, ...data };
          mockQuestions.push(newQuestion);
          return Promise.resolve(newQuestion);
        }),
        update: vi.fn().mockImplementation(({ where, data }) => {
          const index = mockQuestions.findIndex(q => q.id === where.id);
          if (index === -1) return Promise.resolve(null);
          
          const updated = { ...mockQuestions[index], ...data };
          mockQuestions[index] = updated;
          return Promise.resolve(updated);
        }),
        delete: vi.fn().mockImplementation(({ where }) => {
          const index = mockQuestions.findIndex(q => q.id === where.id);
          if (index === -1) return Promise.resolve(null);
          
          const deleted = mockQuestions[index];
          mockQuestions.splice(index, 1);
          return Promise.resolve(deleted);
        }),
      },
      categories: {
        findUnique: vi.fn().mockImplementation(({ where }) => {
          const category = mockCategories.find(c => c.slug === where.slug);
          return Promise.resolve(category || null);
        }),
      }
    })),
  };
});

describe('Question validation', () => {
  it('should validate a valid question for creation', () => {
    const validQuestion = {
      question: 'Is this a test question?',
      answer: 'Yes, it is a test question.',
      categoryId: 1,
    };
    
    const result = validateQuestionForCreate(validQuestion);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validQuestion);
    }
  });
  
  it('should reject an invalid question for creation', () => {
    const invalidQuestion = {
      question: 'Hi', // Too short
      answer: 'Yo', // Too short
      categoryId: 1,
    };
    
    const result = validateQuestionForCreate(invalidQuestion);
    expect(result.success).toBe(false);
  });
  
  it('should validate a valid question update', () => {
    const validUpdate = {
      question: 'Updated question?',
      answer: 'Updated answer.',
    };
    
    const result = validateQuestionForUpdate(validUpdate);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validUpdate);
    }
  });
  
  it('should accept a partial question update', () => {
    const partialUpdate = {
      question: 'Only updating the question',
    };
    
    const result = validateQuestionForUpdate(partialUpdate);
    expect(result.success).toBe(true);
  });
});

describe('Question database operations', () => {
  it('should get all questions', async () => {
    const questions = await getQuestions();
    expect(questions.length).toBe(2);
    expect(questions[0].id).toBe(1);
    expect(questions[1].id).toBe(2);
  });
  
  it('should get a question by id', async () => {
    const question = await getQuestionById(1);
    expect(question).not.toBeNull();
    expect(question?.question).toBe('Test Question 1');
  });
  
  it('should return null for non-existent question id', async () => {
    const question = await getQuestionById(999);
    expect(question).toBeNull();
  });
  
  it('should create a question', async () => {
    const newQuestion = {
      question: 'New test question',
      answer: 'New test answer',
      categoryId: 1,
    };
    
    const created = await createQuestion(newQuestion);
    expect(created.id).toBe(3);
    expect(created.question).toBe('New test question');
    expect(created.slug).toBe('new-test-question');
  });
  
  it('should update a question', async () => {
    const updates = {
      question: 'Updated test question',
      answer: 'Updated test answer',
    };
    
    const updated = await updateQuestion(1, updates);
    expect(updated).not.toBeNull();
    expect(updated?.question).toBe('Updated test question');
    expect(updated?.slug).toBe('updated-test-question');
  });
  
  it('should return null when updating non-existent question', async () => {
    const updates = { question: 'This will fail' };
    const result = await updateQuestion(999, updates);
    expect(result).toBeNull();
  });
  
  it('should delete a question', async () => {
    const deleted = await deleteQuestion(1);
    expect(deleted).not.toBeNull();
    expect(deleted?.id).toBe(1);
    
    const notFound = await getQuestionById(1);
    expect(notFound).toBeNull();
  });
  
  it('should return null when deleting non-existent question', async () => {
    const result = await deleteQuestion(999);
    expect(result).toBeNull();
  });
  
  it('should get questions by category slug', async () => {
    const questions = await getQuestionByCategorySlug('html');
    expect(questions).not.toBeNull();
    expect(Array.isArray(questions)).toBe(true);
  });
  
  it('should return null for invalid category slug', async () => {
    const questions = await getQuestionByCategorySlug('invalid-slug');
    expect(questions).toBeNull();
  });
});
