// src/schemas/cases.schema.ts
import { z } from 'zod';

export const createCaseSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(200, 'Título muito longo'),
  description: z.string().optional(),
  clientId: z.string().min(1, 'Cliente é obrigatório'),
  subject: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent'], {
    errorMap: () => ({ message: 'Prioridade inválida' })
  }),
  processNumber: z.string().optional(),
  court: z.string().optional(),
  value: z.number().positive('Valor deve ser positivo').optional(),
  expectedEndDate: z.string().optional(),
  nextAction: z.string().optional(),
  nextActionDate: z.string().optional(),
});

export const updateCaseSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(200, 'Título muito longo'),
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'waiting_documents', 'in_court', 'appealing', 'concluded', 'archived'], {
    errorMap: () => ({ message: 'Status inválido' })
  }),
  priority: z.enum(['low', 'medium', 'high', 'urgent'], {
    errorMap: () => ({ message: 'Prioridade inválida' })
  }),
  subject: z.string().optional(),
  processNumber: z.string().optional(),
  court: z.string().optional(),
  value: z.number().positive('Valor deve ser positivo').optional(),
  expectedEndDate: z.string().optional(),
  nextAction: z.string().optional(),
  nextActionDate: z.string().optional(),
});

export type CreateCaseFormData = z.infer<typeof createCaseSchema>;
export type UpdateCaseFormData = z.infer<typeof updateCaseSchema>;