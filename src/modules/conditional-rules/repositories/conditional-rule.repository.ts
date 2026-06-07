import { prisma } from '../../../lib/prisma';
import { Prisma } from '@prisma/client';

export class PrismaConditionalRuleRepository {
  async create(data: Prisma.ConditionalRuleUncheckedCreateInput) {
    return prisma.conditionalRule.create({ data });
  }

  async findById(id: string) {
    return prisma.conditionalRule.findUnique({
      where: { id },
      include: {
        question: {
          include: { block: { include: { survey: true } } }
        },
        targetBlock: true
      }
    });
  }

  async findByQuestionId(questionId: string) {
    return prisma.conditionalRule.findMany({
      where: { questionId },
      include: { targetBlock: true }
    });
  }

  async update(id: string, data: Prisma.ConditionalRuleUncheckedUpdateInput) {
    return prisma.conditionalRule.update({
      where: { id },
      data
    });
  }

  async delete(id: string) {
    return prisma.conditionalRule.delete({
      where: { id }
    });
  }

  async existsDuplicateRule(questionId: string, matchValue: string, excludeRuleId?: string) {
    const where: any = { questionId, matchValue };
    if (excludeRuleId) {
      where.id = { not: excludeRuleId };
    }
    const count = await prisma.conditionalRule.count({ where });
    return count > 0;
  }

  async findQuestionSurvey(questionId: string) {
    return prisma.question.findUnique({
      where: { id: questionId },
      include: {
        block: { include: { survey: { include: { responses: { take: 1 } } } } }
      }
    });
  }

  async findTargetBlockSurvey(blockId: string) {
    return prisma.block.findUnique({
      where: { id: blockId },
      include: { survey: true }
    });
  }

  async surveyHasResponses(surveyId: string) {
    const count = await prisma.surveyResponse.count({
      where: { surveyId }
    });
    return count > 0;
  }

  async detectNavigationCycle(surveyId: string, newRuleSourceBlockId: string, newRuleTargetBlockId: string): Promise<boolean> {
    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
      include: {
        blocks: {
          include: {
            questions: {
              include: { rules: true }
            }
          }
        }
      }
    });

    if (!survey) return false;

    const graph = new Map<string, Set<string>>();

    for (const block of survey.blocks) {
      if (!graph.has(block.id)) {
        graph.set(block.id, new Set());
      }
      for (const question of block.questions) {
        for (const rule of question.rules) {
          graph.get(block.id)!.add(rule.targetBlockId);
        }
      }
    }

    if (!graph.has(newRuleSourceBlockId)) {
      graph.set(newRuleSourceBlockId, new Set());
    }
    graph.get(newRuleSourceBlockId)!.add(newRuleTargetBlockId);

    const visited = new Set<string>();
    const recStack = new Set<string>();

    const dfs = (node: string): boolean => {
      if (!visited.has(node)) {
        visited.add(node);
        recStack.add(node);

        const neighbors = graph.get(node) || new Set();
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor) && dfs(neighbor)) {
            return true;
          } else if (recStack.has(neighbor)) {
            return true;
          }
        }
      }
      recStack.delete(node);
      return false;
    };

    for (const node of graph.keys()) {
      if (!visited.has(node)) {
        if (dfs(node)) return true;
      }
    }

    return false;
  }
}
