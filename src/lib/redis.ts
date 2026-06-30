import Redis from 'ioredis';
import 'dotenv/config';

// Usa a variável de ambiente REDIS_URL ou o default local
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    // Tenta reconectar até 5 vezes, com um tempo crescente
    const delay = Math.min(times * 50, 2000);
    if (times > 5) {
      console.error('Falha crítica ao conectar no Redis após 5 tentativas.');
      return null; // Cancela novas tentativas de reconexão
    }
    return delay;
  },
});

redis.on('error', (err) => {
  console.error('Erro na conexão com Redis:', err.message);
});

redis.on('connect', () => {
  console.log('Conectado ao Redis com sucesso!');
});
