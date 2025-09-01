// src/schemas/processes.schema.ts
import { z } from 'zod';

export const createProcessSchema = z.object({
  number: z.string().min(1, 'Número do processo é obrigatório'),
  internalNumber: z.string().optional(),
  title: z.string().min(1, 'Título é obrigatório').max(200, 'Título muito longo'),
  description: z.string().optional(),
  type: z.enum(['civil', 'criminal', 'labor', 'administrative', 'tax', 'family', 'commercial', 'consumer', 'environmental', 'constitutional'], {
    errorMap: () => ({ message: 'Tipo de processo inválido' })
  }),
  priority: z.enum(['low', 'medium', 'high', 'urgent'], {
    errorMap: () => ({ message: 'Prioridade inválida' })
  }),
  caseId: z.string().optional(),
  clientIds: z.array(z.string()).min(1, 'Pelo menos um cliente deve ser selecionado'),
  responsibleLawyerId: z.string().min(1, 'Advogado responsável é obrigatório'),
  court: z.string().min(1, 'Tribunal/Foro é obrigatório'),
  district: z.string().min(1, 'Comarca/Foro é obrigatório'),
  city: z.string().min(1, 'Cidade é obrigatória'),
  state: z.string().min(1, 'Estado é obrigatório'),
  country: z.string().min(1, 'País é obrigatório'),
  opposingParty: z.string().optional(),
  opposingLawyer: z.string().optional(),
  processValue: z.string().optional(),
  processValueDescription: z.string().optional(),
  filingDate: z.string().min(1, 'Data de ajuizamento é obrigatória'),
  citationDate: z.string().optional(),
  notes: z.string().optional(),
  tags: z.string().optional(),
  isConfidential: z.boolean().default(false),
});

export const updateProcessSchema = z.object({
  number: z.string().min(1, 'Número do processo é obrigatório'),
  internalNumber: z.string().optional(),
  title: z.string().min(1, 'Título é obrigatório').max(200, 'Título muito longo'),
  description: z.string().optional(),
  type: z.enum(['civil', 'criminal', 'labor', 'administrative', 'tax', 'family', 'commercial', 'consumer', 'environmental', 'constitutional'], {
    errorMap: () => ({ message: 'Tipo de processo inválido' })
  }),
  status: z.enum(['active', 'suspended', 'archived', 'concluded', 'appealed'], {
    errorMap: () => ({ message: 'Status inválido' })
  }),
  phase: z.enum(['initial', 'instruction', 'judgment', 'appeal', 'execution'], {
    errorMap: () => ({ message: 'Fase inválida' })
  }),
  priority: z.enum(['low', 'medium', 'high', 'urgent'], {
    errorMap: () => ({ message: 'Prioridade inválida' })
  }),
  caseId: z.string().optional(),
  clientIds: z.array(z.string()).min(1, 'Pelo menos um cliente deve ser selecionado'),
  responsibleLawyerId: z.string().min(1, 'Advogado responsável é obrigatório'),
  court: z.string().min(1, 'Tribunal/Foro é obrigatório'),
  district: z.string().min(1, 'Comarca/Foro é obrigatório'),
  city: z.string().min(1, 'Cidade é obrigatória'),
  state: z.string().min(1, 'Estado é obrigatório'),
  country: z.string().min(1, 'País é obrigatório'),
  opposingParty: z.string().optional(),
  opposingLawyer: z.string().optional(),
  processValue: z.string().optional(),
  processValueDescription: z.string().optional(),
  filingDate: z.string().min(1, 'Data de ajuizamento é obrigatória'),
  citationDate: z.string().optional(),
  notes: z.string().optional(),
  tags: z.string().optional(),
  isConfidential: z.boolean().default(false),
});

export type CreateProcessFormData = z.infer<typeof createProcessSchema>;
export type UpdateProcessFormData = z.infer<typeof updateProcessSchema>;