import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'

import {
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  validateCategoryForCreate,
  validateCategoryForUpdate,
} from './categories.db.js';

const app = new Hono()

app.use('/*', cors())

app.get('/', (c) => {

  const data =  {
    hello: 'hono'
  }

  return c.json(data)
})

app.get('/categories', async (c) => {
  const categories = await getCategories();
  return c.json(categories, 200);
})

app.get('/categories/:slug', async (c) => {
  const slug = c.req.param('slug')

  const category = await getCategoryBySlug(slug);

  if (!category) {
    return c.json({ message: 'Category not found' }, 404)
  }

  return c.json(category, 200);
})

app.post('/categories', async (c) => {
  let categoryToCreate: unknown;
  try {
    categoryToCreate = await c.req.json();
  } catch (e) {
    return c.json({ error: 'invalid json' }, 400)
  }

  const validCategory = validateCategoryForCreate(categoryToCreate)

  if (!validCategory.success) {
    return c.json({ error: 'invalid data', errors: validCategory.error.flatten() }, 400)
  }

  try{
    const created = await createCategory(validCategory.data)
    return c.json(created, 201)
  }catch(e){
    return c.json({error: 'Internal error'}, 500);
  }
});

app.patch('/categories/:slug', async (c) => {
  const slug = c.req.param('slug')

  let categoryToUpdate: unknown;
  try {
    categoryToUpdate = await c.req.json();
  } catch (e) {
    return c.json({ error: 'invalid json' }, 400)
  }

  const validCategory = validateCategoryForUpdate(categoryToUpdate)
  if(!validCategory.success){
    return c.json({ error: 'invalid data', errors: validCategory.error.flatten() }, 400)
  }

  const updated = await updateCategory(slug, validCategory.data);

  if (!updated) {
    return c.json({ message: 'Category not found' }, 404)
  }

  return c.json(updated, 200);
});

app.delete('/categories/:slug', async (c) => {
  const slug = c.req.param('slug');

  const deleted = await deleteCategory(slug);
  if (!deleted) {
    return c.json({ error: 'Category not found' }, 404);
  }
  return c.body(null, 204);
});

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})