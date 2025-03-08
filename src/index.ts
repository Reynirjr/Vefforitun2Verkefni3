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
  validateCategoryForUpdate
} from './categories.db.js'
import {
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  validateQuestionForCreate,
  validateQuestionForUpdate,
  getQuestionByCategorySlug
} from './questions.db.js'


export const app = new Hono()

app.use('/*', cors())

app.get('/', (c) => {
  const data =  {
    hello: 'hono'
  }

  return c.json(data)
})

app.get('/categories', async (c) => {
  try{
  const categories = await getCategories();
  return c.json(categories, 200);
  }catch(error) {
    console.error(error)
    return c.json({error: 'Internal error'}, 500)
  }
  
})

app.get('/categories/:slug', async (c) => {
  const slug = c.req.param('slug')
  try{
    const category = await getCategoryBySlug(slug);
    if (!category) {
      return c.json({ message: 'Category not found' }, 404)
    }
    return c.json(category, 200);
  }catch(error){
    console.error(error)
    return c.json({error: 'Internal error'}, 500)
  }
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
  try {
    const updated = await updateCategory(slug, validCategory.data);

    if (!updated) {
      return c.json({ message: 'Category not found' }, 404)
    }

    return c.json(updated, 200);
  } catch (e) {
    console.error(e)
    return c.json({ error: 'Internal error' }, 500)
  }
});

app.delete('/categories/:slug', async (c) => {
  const slug = c.req.param('slug');
  try{
    const deleted = await deleteCategory(slug);
    if (!deleted) {
      return c.json({ error: 'Category not found' }, 404);
    }
    return c.body(null, 204);
  } catch(e){
    console.error(e)
    return c.json({ error: 'Internal error' }, 500)
  }
});

app.get('/questions', async (c) => {
  try {
    const questions = await getQuestions()
    return c.json(questions, 200)
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Internal error' }, 500)
  }
})

app.get('/questions/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10)
  if (Number.isNaN(id)) {
    return c.json({ error: 'Invalid ID' }, 400)
  }

  try {
    const question = await getQuestionById(id)
    if (!question) {
      return c.json({ error: 'Question not found' }, 404)
    }
    return c.json(question, 200)
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Internal error' }, 500)
  }
})

app.post('/questions', async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch (err) {
    return c.json({ error: 'Invalid JSON' }, 400)
  }

  const validation = validateQuestionForCreate(body)
  if (!validation.success) {
    return c.json({ error: 'Invalid data', issues: validation.error.flatten() }, 400)
  }

  try {
    const created = await createQuestion(validation.data)
    return c.json(created, 201)
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Internal error' }, 500)
  }
})

app.patch('/questions/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10)
  if (Number.isNaN(id)) {
    return c.json({ error: 'Invalid ID' }, 400)
  }

  let body: unknown
  try {
    body = await c.req.json()
  } catch (err) {
    return c.json({ error: 'Invalid JSON' }, 400)
  }

  const validation = validateQuestionForUpdate(body)
  if (!validation.success) {
    return c.json({ error: 'Invalid data', issues: validation.error.flatten() }, 400)
  }

  try {
    const updated = await updateQuestion(id, validation.data)
    if (!updated) {
      return c.json({ error: 'Question not found' }, 404)
    }
    return c.json(updated, 200)
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Internal error' }, 500)
  }
})


app.get('/categories/:slug/questions', async (c) => {
  const slug = c.req.param('slug')
  try {
    const questions = await getQuestionByCategorySlug(slug)
    if (questions === null) {
      return c.json({ error: 'Category not found' }, 404)
    }
    return c.json(questions, 200)
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Internal error' }, 500)
  }
})

app.delete('/questions/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10)
  if (Number.isNaN(id)) {
    return c.json({ error: 'Invalid ID' }, 400)
  }

  try {
    const deleted = await deleteQuestion(id)
    if (!deleted) {
      return c.json({ error: 'Question not found' }, 404)
    }
    return c.body(null, 204)
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Internal error' }, 500)
  }
})

if (process.env.NODE_ENV !== 'test' && import.meta.url === `file://${process.argv[1]}`) {
  serve({
    fetch: app.fetch,
    port: 3000
  }, (info) => {
    console.log(`Server is running on http://localhost:${info.port}`)
  })
}

export default app
