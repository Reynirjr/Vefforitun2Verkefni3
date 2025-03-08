import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import xss from 'xss';

const prisma = new PrismaClient();

const QuestionSchema = z.object({
    id: z.number(),
    question: z.string().min(3).max(1024),
    answer: z.string().min(3).max(1024),
    slug: z.string(),
    categoryId: z.number(),
})

const QuestionToCreateSchema = z.object({
    question: z.string().min(3).max(1024),
    answer: z.string().min(3).max(1024),
    categoryId: z.number(),
  })

const QuestionToUpdateSchema = z.object({
  question: z.string().min(3).max(1024).optional(),
  answer: z.string().min(3).max(1024).optional(),
  categoryId: z.number().optional(),
})

export type Question = z.infer<typeof QuestionSchema>;
export type QuestionToCreate = z.infer<typeof QuestionToCreateSchema>;
export type QuestionToUpdate = z.infer<typeof QuestionToUpdateSchema>;

export function validateQuestionForCreate(data: unknown){
  return QuestionToCreateSchema.safeParse(data);
}

export function validateQuestionForUpdate(data: unknown){
  return QuestionToUpdateSchema.safeParse(data);
}

export async function getQuestions(): Promise<Question[]> {
    return prisma.questions.findMany({
      orderBy: { id: 'asc' },
    })
}

export async function getQuestionById(id: number): Promise<Question | null> {
    return prisma.questions.findUnique({
      where: { id },
    })
}

export async function createQuestion(data: QuestionToCreate): Promise<Question> {

    const safeQuestion = xss(data.question);
    const safeAnswer = xss(data.answer);

    const slug = data.question
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
  
    const created = await prisma.questions.create({
      data: {
        question: safeQuestion,
        answer: safeAnswer,
        categoryId: data.categoryId,
        slug,
      },
    })
    return created
  }

  export async function deleteQuestion(id: number): Promise<Question | null> {
    const existing = await prisma.questions.findUnique({
        where: { id } });
    if (!existing) {
        return null
    }
    return prisma.questions.delete({
        where: { id }})
    }
    



  export async function updateQuestion(
    id: number,
    changes: QuestionToUpdate,
    ): Promise<Question | null> {

        const existing = await prisma.questions.findUnique({
            where: { id } })

        if (!existing) {
            return null
        }

        let safeQuestion = existing.question
        let safeAnswer = existing.answer

        if (changes.question) {
            safeQuestion = xss(changes.question)
        }
        if (changes.answer) {
            safeAnswer = xss(changes.answer)
        } 

        let newSlug = existing.slug
        if (changes.question) {
            newSlug = safeQuestion
              .toLowerCase()
              .replace(/\s+/g, '-')
              .replace(/[^\w-]+/g, '')
        }

        const updated = await prisma.questions.update({
            where: { id },
            data: {
              question: safeQuestion,
              answer: safeAnswer,
              categoryId: changes.categoryId ?? existing.categoryId,
              slug: newSlug,
            },
            })
            return updated
        }

    export async function getQuestionByCategorySlug(slug: string): Promise<Question[] | null> {
       
        const category = await prisma.categories.findUnique({
            where: { slug },
        })
        if (!category) {
            return null
        }
        return prisma.questions.findMany({
            where: { categoryId: category.id },
            orderBy: { id: 'asc' },
        })
    }


