import { Question, ScaleVisualType } from '@prisma/client';
import { CreateScaleOptionsDto } from '../dtos/scale-options.schema';

export function validateScaleOptions(question: Question, payload: CreateScaleOptionsDto) {
  if (question.type !== 'LIKERT') {
    const err = new Error('Apenas perguntas do tipo LIKERT suportam customização de opções de escala explícitas');
    (err as any).status = 400;
    throw err;
  }

  if (question.scaleStart === null || question.scaleEnd === null || !question.scaleVisualType) {
    const err = new Error('A pergunta não possui scaleStart, scaleEnd ou scaleVisualType configurados');
    (err as any).status = 400;
    throw err;
  }

  const expectedCount = (question.scaleEnd - question.scaleStart) + 1;
  if (payload.options.length !== expectedCount) {
    const err = new Error(`A quantidade de opções enviadas (${payload.options.length}) não bate com a grade esperada (${expectedCount})`);
    (err as any).status = 400;
    throw err;
  }

  const { scaleVisualType } = question;

  for (const item of payload.options) {
    if (item.numericValue < question.scaleStart || item.numericValue > question.scaleEnd) {
      const err = new Error(`O valor numérico ${item.numericValue} está fora dos limites configurados (${question.scaleStart} a ${question.scaleEnd})`);
      (err as any).status = 400;
      throw err;
    }

    if (scaleVisualType === ScaleVisualType.EMOJIS && !item.emoji) {
      const err = new Error(`Para escalas EMOJIS, todas as opções devem ter um 'emoji'`);
      (err as any).status = 400;
      throw err;
    }
    if (scaleVisualType === ScaleVisualType.ICONS && !item.icon) {
      const err = new Error(`Para escalas ICONS, todas as opções devem ter um 'icon'`);
      (err as any).status = 400;
      throw err;
    }
    if (scaleVisualType === ScaleVisualType.TEXT_LABELS && !item.label) {
      const err = new Error(`Para escalas TEXT_LABELS, todas as opções devem ter um 'label'`);
      (err as any).status = 400;
      throw err;
    }
    if (scaleVisualType === ScaleVisualType.NUMBERS) {
      if (item.emoji || item.icon || item.label) {
        const err = new Error(`Para escalas NUMBERS, não envie emoji, icon ou label`);
        (err as any).status = 400;
        throw err;
      }
    }
  }
}
