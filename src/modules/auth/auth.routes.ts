import { FastifyInstance } from "fastify";
import { RegisterController } from "./controllers/register.controller";
import { LoginController } from "./controllers/login.controller";
import { RefreshTokenController } from "./controllers/refresh-token.controller";
import { jwtAuthGuard } from "./guards/jwt-auth.guard";
import { LogoutController } from "./controllers/logout.controller";
import { MeController } from "./controllers/me.controller";

export async function authRoutes(app: FastifyInstance) {
  const registerController = new RegisterController();
  const loginController = new LoginController(app);
  const refreshTokenController = new RefreshTokenController(app);
  const logoutController = new LogoutController();
  const meController = new MeController();

  app.post("/register", registerController.handle.bind(registerController));
  app.post("/login", loginController.handle.bind(loginController));
  app.post(
    "/refresh",
    refreshTokenController.handle.bind(refreshTokenController),
  );

  app.post(
    "/logout",
    { preHandler: [jwtAuthGuard] },
    logoutController.handle.bind(logoutController),
  );
  app.get(
    "/me",
    { preHandler: [jwtAuthGuard] },
    meController.handle.bind(meController),
  );
}
