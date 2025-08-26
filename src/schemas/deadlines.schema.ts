// src/schemas/deadlines.schema.ts
import { z } from 'zod';

export const createDeadlineSchema = z.object({
  processId: z.string().min(1, 'Processo é obrigatório'),
  type: z.enum(['response', 'appeal', 'hearing', 'filing', 'payment', 'document', 'other'], {
    errorMap: () => ({ message: 'Tipo de prazo inválido' })
  }),
  title: z.string().min(1, 'Título é obrigatório').max(100, 'Título muito longo'),
  description: z.string().optional(),
  dueDate: z.string().min(1, 'Data de vencimento é obrigatória'),
  priority: z.enum(['low', 'medium', 'high', 'urgent'], {
    errorMap: () => ({ message: 'Prioridade inválida' })
  }),
  isRecurring: z.boolean().default(false),
  recurringPattern: z.string().optional(),
  notes: z.string().optional(),
});

export const updateDeadlineSchema = z.object({
  type: z.enum(['response', 'appeal', 'hearing', 'filing', 'payment', 'document', 'other'], {
    errorMap: () => ({ message: 'Tipo de prazo inválido' })
  }).optional(),
  title: z.string().min(1, 'Título é obrigatório').max(100, 'Título muito longo').optional(),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent'], {
    errorMap: () => ({ message: 'Prioridade inválida' })
  }).optional(),
  status: z.enum(['pending', 'completed', 'overdue'], {
    errorMap: () => ({ message: 'Status inválido' })
  }).optional(),
  isRecurring: z.boolean().optional(),
  recurringPattern: z.string().optional(),
  notes: z.string().optional(),
  completedAt: z.string().optional(),
  completedBy: z.string().optional(),
});

export const createHearingSchema = z.object({
  processId: z.string().min(1, 'Processo é obrigatório'),
  title: z.string().min(1, 'Título é obrigatório').max(100, 'Título muito longo'),
  description: z.string().optional(),
  scheduledDate: z.string().min(1, 'Data da audiência é obrigatória'),
  location: z.string().min(1, 'Local é obrigatório'),
  judge: z.string().optional(),
  type: z.enum(['conciliation', 'instruction', 'judgment', 'preliminary', 'other'], {
    errorMap: () => ({ message: 'Tipo de audiência inválido' })
  }),
  participants: z.array(z.string()).optional(),
  notes: z.string().optional(),
  reminders: z.array(z.object({
    type: z.enum(['email', 'notification', 'sms']),
    beforeMinutes: z.number().positive()
  })).optional(),
});

export const updateHearingSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(100, 'Título muito longo').optional(),
  description: z.string().optional(),
  scheduledDate: z.string().optional(),
  location: z.string().optional(),
  judge: z.string().optional(),
  type: z.enum(['conciliation', 'instruction', 'judgment', 'preliminary', 'other'], {
    errorMap: () => ({ message: 'Tipo de audiência inválido' })
  }).optional(),
  status: z.enum(['scheduled', 'completed', 'cancelled', 'postponed'], {
    errorMap: () => ({ message: 'Status inválido' })
  }).optional(),
  participants: z.array(z.string()).optional(),
  notes: z.string().optional(),
  reminders: z.array(z.object({
    type: z.enum(['email', 'notification', 'sms']),
    beforeMinutes: z.number().positive()
  })).optional(),
});

export type CreateDeadlineFormData = z.infer<typeof createDeadlineSchema>;
export type UpdateDeadlineFormData = z.infer<typeof updateDeadlineSchema>;
export type CreateHearingFormData = z.infer<typeof createHearingSchema>;
export type UpdateHearingFormData = z.infer<typeof updateHearingSchema>;