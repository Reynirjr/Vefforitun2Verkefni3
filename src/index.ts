import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { createCategory, getCategories, getCategory, validateCategory } from './categories.db.js'
import { cors } from 'hono/cors'

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
  return c.json(categories)
})

app.get('/categories/:slug', (c) => {
  const slug = c.req.param('slug')

  // Validate á hámarkslengd á slug

  const category = getCategory(slug)

  if (!category) {
    return c.json({ message: 'not found' }, 404)
  }

  return c.json(category);
})

app.post('/categories', async (c) => {
  let categoryToCreate: unknown;
  try {
    categoryToCreate = await c.req.json();
    console.log(categoryToCreate);
  } catch (e) {
    return c.json({ error: 'invalid json' }, 400)
  }

  const validCategory = validateCategory(categoryToCreate)

  if (!validCategory.success) {
    return c.json({ error: 'invalid data', errors: validCategory.error.flatten() }, 400)
  }

  const createdCategory = await createCategory(validCategory.data)

  return c.json(createdCategory, 201)
})

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})