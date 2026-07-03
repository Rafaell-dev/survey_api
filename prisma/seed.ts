import { QuestionType, ScaleVisualType } from '@prisma/client';
import * as argon2 from 'argon2';
import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Iniciando o seed do banco de dados...');

  // Limpar tabelas principais (cuidado: isso apaga tudo)
  await prisma.surveyResponse.deleteMany();
  await prisma.participant.deleteMany();
  await prisma.question.deleteMany();
  await prisma.block.deleteMany();
  await prisma.survey.deleteMany();
  await prisma.user.deleteMany();

  // 1. Criar Usuário (Pesquisador)
  const passwordHash = await argon2.hash('123456');
  const user = await prisma.user.create({
    data: {
      name: 'Pesquisador Demo',
      email: 'demo@survey.com',
      password: passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE'
    }
  });
  console.log(`Usuário criado: ${user.email}`);

  // 2. Criar Formulário
  const survey = await prisma.survey.create({
    data: {
      title: 'Pesquisa de Clima Organizacional e Avaliação de Produto 2026',
      description: 'Uma pesquisa abrangente para testes do Dashboard de Analytics.',
      status: 'PUBLISHED',
      publicLinkActive: true,
      publicSlug: 'pesquisa-demo-2026',
      participantIdentificationType: 'NAME_AND_EMAIL',
      researcherId: user.id
    }
  });
  console.log(`Survey criado: ${survey.title}`);

  // 3. Criar Bloco
  const block = await prisma.block.create({
    data: {
      title: 'Bloco 1 - Experiência Geral',
      orderIndex: 1,
      surveyId: survey.id
    }
  });

  // 4. Criar Perguntas
  const qShortText = await prisma.question.create({
    data: {
      title: 'Qual é o seu cargo atual?',
      type: 'SHORT_TEXT',
      orderIndex: 1,
      blockId: block.id
    }
  });

  const qLongText = await prisma.question.create({
    data: {
      title: 'Como podemos melhorar nosso ambiente de trabalho?',
      type: 'LONG_TEXT',
      orderIndex: 2,
      blockId: block.id
    }
  });

  const qSingleChoice = await prisma.question.create({
    data: {
      title: 'Qual seu modelo de trabalho preferido?',
      type: 'SINGLE_CHOICE',
      orderIndex: 3,
      blockId: block.id,
      options: {
        create: [
          { label: 'Totalmente Remoto', orderIndex: 1 },
          { label: 'Híbrido (2x Presencial)', orderIndex: 2 },
          { label: 'Híbrido (3x Presencial)', orderIndex: 3 },
          { label: 'Totalmente Presencial', orderIndex: 4 }
        ]
      }
    },
    include: { options: true }
  });

  const qMultipleChoice = await prisma.question.create({
    data: {
      title: 'Quais ferramentas você usa no dia a dia? (Selecione várias)',
      type: 'MULTIPLE_CHOICE',
      orderIndex: 4,
      blockId: block.id,
      options: {
        create: [
          { label: 'Slack', orderIndex: 1 },
          { label: 'Microsoft Teams', orderIndex: 2 },
          { label: 'Notion', orderIndex: 3 },
          { label: 'Jira', orderIndex: 4 },
          { label: 'Figma', orderIndex: 5 },
          { label: 'VS Code', orderIndex: 6 }
        ]
      }
    },
    include: { options: true }
  });

  const qLikert = await prisma.question.create({
    data: {
      title: 'Como você avalia a comunicação da liderança da empresa?',
      type: 'LIKERT',
      orderIndex: 5,
      scaleStart: 1,
      scaleEnd: 5,
      scaleVisualType: 'TEXT_LABELS',
      blockId: block.id,
      scaleOptions: {
        create: [
          { numericValue: 1, label: 'Muito Insatisfeito', orderIndex: 1 },
          { numericValue: 2, label: 'Insatisfeito', orderIndex: 2 },
          { numericValue: 3, label: 'Neutro', orderIndex: 3 },
          { numericValue: 4, label: 'Satisfeito', orderIndex: 4 },
          { numericValue: 5, label: 'Muito Satisfeito', orderIndex: 5 }
        ]
      }
    },
    include: { scaleOptions: true }
  });

  const qSlider = await prisma.question.create({
    data: {
      title: 'De 0 a 10, qual a probabilidade de você recomendar a empresa para um amigo?',
      type: 'SLIDER',
      orderIndex: 6,
      scaleStart: 0,
      scaleEnd: 10,
      scaleVisualType: 'NUMBERS',
      blockId: block.id
    }
  });
  console.log('Perguntas criadas.');

  // 5. Criar Participantes e Respostas
  const names = ['Carlos Silva', 'Ana Beatriz', 'Fernanda Souza', 'Roberto Almeida', 'Julia Costa', 'Marcos Paulo', 'Lucas Mendes', 'Sofia Martins', 'Pedro Henrique', 'Mariana Ribeiro'];
  const cargos = ['Engenheiro de Software', 'Designer', 'Product Manager', 'Analista de QA', 'DevOps', 'Scrum Master', 'Tech Lead', 'Especialista de RH'];
  const feedbacks = ['Deveria ter mais flexibilidade.', 'Acho que está ótimo do jeito que está.', 'Os equipamentos poderiam ser melhores.', 'Sinto falta de momentos de descompressão.', 'Tudo perfeito, amo a empresa.', 'Comunicação precisa melhorar entre as equipes.', 'Salários um pouco defasados em relação ao mercado.'];

  for (let i = 0; i < 20; i++) {
    const participantName = names[i % names.length] + (i >= names.length ? ` ${i}` : '');
    const participant = await prisma.participant.create({
      data: {
        name: participantName,
        email: `participant${i}@test.com`
      }
    });

    const response = await prisma.surveyResponse.create({
      data: {
        participantId: participant.id,
        surveyId: survey.id,
        status: 'COMPLETED',
        startedAt: new Date(Date.now() - 1000 * 60 * 10), // 10 mins ago
        finishedAt: new Date()
      }
    });

    // Answer Short Text
    await prisma.answer.create({
      data: {
        responseId: response.id,
        questionId: qShortText.id,
        textValue: cargos[Math.floor(Math.random() * cargos.length)]
      }
    });

    // Answer Long Text
    await prisma.answer.create({
      data: {
        responseId: response.id,
        questionId: qLongText.id,
        textValue: feedbacks[Math.floor(Math.random() * feedbacks.length)]
      }
    });

    // Answer Single Choice
    const singleOption = qSingleChoice.options[Math.floor(Math.random() * qSingleChoice.options.length)];
    await prisma.answer.create({
      data: {
        responseId: response.id,
        questionId: qSingleChoice.id,
        selectedOptionId: singleOption.id,
        selectedOptionsIds: [singleOption.id]
      }
    });

    // Answer Multiple Choice
    const shuffledMultiple = [...qMultipleChoice.options].sort(() => 0.5 - Math.random());
    const selectedMultiple = shuffledMultiple.slice(0, Math.floor(Math.random() * 3) + 1); // 1 to 3 options
    await prisma.answer.create({
      data: {
        responseId: response.id,
        questionId: qMultipleChoice.id,
        selectedOptionsIds: selectedMultiple.map(o => o.id)
      }
    });

    // Answer Likert
    const likertOption = qLikert.scaleOptions[Math.floor(Math.random() * qLikert.scaleOptions.length)];
    await prisma.answer.create({
      data: {
        responseId: response.id,
        questionId: qLikert.id,
        numericValue: likertOption.numericValue
      }
    });

    // Answer Slider
    await prisma.answer.create({
      data: {
        responseId: response.id,
        questionId: qSlider.id,
        numericValue: Math.floor(Math.random() * 11) // 0 to 10
      }
    });
  }

  console.log('20 respostas geradas com sucesso!');
  console.log('Seed completo!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
