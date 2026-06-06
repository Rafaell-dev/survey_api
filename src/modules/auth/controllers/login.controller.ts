import { FastifyRequest, FastifyReply, FastifyInstance } from "fastify";
import { LoginService } from "../services/login.service";
import { loginSchema } from "../dtos/auth.schema";

export class LoginController {
  constructor(private app: FastifyInstance) {}

  async handle(request: FastifyRequest, reply: FastifyReply) {
    const parseResult = loginSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(422).send({
        message: "Dados inválidos",
        errors: parseResult.error,
      });
    }

    try {
      const service = new LoginService(this.app);
      const result = await service.execute(parseResult.data);
      return reply.status(200).send(result);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }
}
