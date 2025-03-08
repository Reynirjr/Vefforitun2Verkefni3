import { describe, it, expect, vi, beforeEach } from 'vitest';
import { app } from '../index.js';

// Import mocked version of the database modules
vi.mock('../categories.db.js', () => {
  return {
    getCategories: vi.fn().mockResolvedValue([
      { id: 1, title: 'HTML', slug: 'html' },
      { id: 2, title: 'CSS', slug: 'css' },
    ]),
    getCategoryBySlug: vi.fn().mockImplementation((slug) => {
      if (slug === 'html') {
        return Promise.resolve({ id: 1, title: 'HTML', slug: 'html' });
      }
      return Promise.resolve(null);
    }),
    createCategory: vi.fn().mockImplementation((data) => {
      return Promise.resolve({ id: 3, title: data.title, slug: data.title.toLowerCase() });
    }),
    updateCategory: vi.fn().mockImplementation((slug, data) => {
      if (slug === 'html') {
        return Promise.resolve({ id: 1, title: data.title, slug: data.title.toLowerCase() });
      }
      return Promise.resolve(null);
    }),
    deleteCategory: vi.fn().mockImplementation((slug) => {
      if (slug === 'html') {
        return Promise.resolve({ id: 1, title: 'HTML', slug: 'html' });
      }
      return Promise.resolve(null);
    }),
    validateCategoryForCreate: vi.fn().mockImplementation((data) => {
      if (data?.title?.length >= 3) {
        return { success: true, data };
      }
      return { success: false, error: { flatten: () => ({ fieldErrors: { title: ['Too short'] } }) } };
    }),
    validateCategoryForUpdate: vi.fn().mockImplementation((data) => {
      if (data?.title?.length >= 3) {
        return { success: true, data };
      }
      return { success: false, error: { flatten: () => ({ fieldErrors: { title: ['Too short'] } }) } };
    })
  };
});

vi.mock('../questions.db.js', () => {
  return {
    getQuestions: vi.fn().mockResolvedValue([
      { id: 1, question: 'What is HTML?', answer: 'A markup language', slug: 'what-is-html', categoryId: 1 },
    ]),
    getQuestionById: vi.fn().mockImplementation((id) => {
      if (id === 1) {
        return Promise.resolve({ id: 1, question: 'What is HTML?', answer: 'A markup language', slug: 'what-is-html', categoryId: 1 });
      }
      return Promise.resolve(null);
    }),
    createQuestion: vi.fn().mockImplementation((data) => {
      return Promise.resolve({ id: 2, ...data, slug: data.question.toLowerCase().replace(/\s+/g, '-') });
    }),
    updateQuestion: vi.fn().mockImplementation((id, data) => {
      if (id === 1) {
        return Promise.resolve({ 
          id: 1, 
          question: data.question || 'What is HTML?', 
          answer: data.answer || 'A markup language', 
          slug: (data.question || 'What is HTML?').toLowerCase().replace(/\s+/g, '-'), 
          categoryId: data.categoryId || 1 
        });
      }
      return Promise.resolve(null);
    }),
    deleteQuestion: vi.fn().mockImplementation((id) => {
      if (id === 1) {
        return Promise.resolve({ id: 1, question: 'What is HTML?', answer: 'A markup language', slug: 'what-is-html', categoryId: 1 });
      }
      return Promise.resolve(null);
    }),
    getQuestionByCategorySlug: vi.fn().mockImplementation((slug) => {
      if (slug === 'html') {
        return Promise.resolve([
          { id: 1, question: 'What is HTML?', answer: 'A markup language', slug: 'what-is-html', categoryId: 1 },
        ]);
      }
      return Promise.resolve(null);
    }),
    validateQuestionForCreate: vi.fn().mockImplementation((data) => {
      if (data?.question?.length >= 3 && data?.answer?.length >= 3) {
        return { success: true, data };
      }
      return { success: false, error: { flatten: () => ({ fieldErrors: { question: ['Too short'] } }) } };
    }),
    validateQuestionForUpdate: vi.fn().mockImplementation((data) => {
      return { success: true, data };
    })
  };
});

// Set the environment to 'test' to prevent server from starting
process.env.NODE_ENV = 'test';

describe('API Routes', () => {
  // No need for dynamic import since we're not starting the server anymore
  // beforeEach is still useful for resetting mocks between tests
  beforeEach(() => {
    vi.resetModules();
  });

  describe('GET /', () => {
    it('should return hello message', async () => {
      const res = await app.request('/');
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data).toEqual({ hello: 'hono' });
    });
  });

  describe('Category routes', () => {
    it('GET /categories should return all categories', async () => {
      const res = await app.request('/categories');
      expect(res.status).toBe(200);
      
      const categories = await res.json();
      expect(categories.length).toBe(2);
      expect(categories[0].title).toBe('HTML');
    });
    
    it('GET /categories/:slug should return a category', async () => {
      const res = await app.request('/categories/html');
      expect(res.status).toBe(200);
      
      const category = await res.json();
      expect(category.title).toBe('HTML');
    });
    
    it('GET /categories/:slug should return 404 for non-existent category', async () => {
      const res = await app.request('/categories/nonexistent');
      expect(res.status).toBe(404);
    });
    
    it('POST /categories should create a category', async () => {
      const res = await app.request('/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'React' })
      });
      
      expect(res.status).toBe(201);
      const created = await res.json();
      expect(created.title).toBe('React');
    });
    
    it('POST /categories should return 400 for invalid data', async () => {
      const res = await app.request('/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'R' }) // Too short
      });
      
      expect(res.status).toBe(400);
    });
    
    it('PATCH /categories/:slug should update a category', async () => {
      const res = await app.request('/categories/html', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Updated HTML' })
      });
      
      expect(res.status).toBe(200);
      const updated = await res.json();
      expect(updated.title).toBe('Updated HTML');
    });
    
    it('DELETE /categories/:slug should delete a category', async () => {
      const res = await app.request('/categories/html', {
        method: 'DELETE'
      });
      
      expect(res.status).toBe(204);
    });
  });

  describe('Question routes', () => {
    it('GET /questions should return all questions', async () => {
      const res = await app.request('/questions');
      expect(res.status).toBe(200);
      
      const questions = await res.json();
      expect(questions.length).toBe(1);
      expect(questions[0].question).toBe('What is HTML?');
    });
    
    it('GET /questions/:id should return a question', async () => {
      const res = await app.request('/questions/1');
      expect(res.status).toBe(200);
      
      const question = await res.json();
      expect(question.question).toBe('What is HTML?');
    });
    
    it('POST /questions should create a question', async () => {
      const res = await app.request('/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: 'What is CSS?',
          answer: 'A styling language',
          categoryId: 2
        })
      });
      
      expect(res.status).toBe(201);
      const created = await res.json();
      expect(created.question).toBe('What is CSS?');
    });
    
    it('PATCH /questions/:id should update a question', async () => {
      const res = await app.request('/questions/1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: 'Updated question'
        })
      });
      
      expect(res.status).toBe(200);
      const updated = await res.json();
      expect(updated.question).toBe('Updated question');
    });
    
    it('DELETE /questions/:id should delete a question', async () => {
      const res = await app.request('/questions/1', {
        method: 'DELETE'
      });
      
      expect(res.status).toBe(204);
    });
    
    it('GET /categories/:slug/questions should return questions by category', async () => {
      const res = await app.request('/categories/html/questions');
      expect(res.status).toBe(200);
      
      const questions = await res.json();
      expect(questions.length).toBe(1);
      expect(questions[0].question).toBe('What is HTML?');
    });
  });
});
