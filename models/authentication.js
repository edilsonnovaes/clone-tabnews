import user from "models/user.js";
import password from "models/password.js";
import { NotFoundError, UnauthorizedError } from "infra/errors.js";

async function getAuthenticatedUser(providedEmail, providePassword) {
  try {
    const storedUser = await findUserByEmail(providedEmail);
    await validatePassword(providePassword, storedUser.password);

    return storedUser;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw new UnauthorizedError({
        message: "Dados de autenticação não conferem.",
        action: "Verfique se os dados enviados estão corretos.",
      });
    }

    throw error;
  }

  async function findUserByEmail(providedEmail) {
    let storedUser;
    try {
      storedUser = await user.findOneByEmail(providedEmail, providePassword);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new UnauthorizedError({
          message: "Email não confere.",
          action: "Verfique se este dado está correto.",
        });
      }

      throw error;
    }

    return storedUser;
  }

  async function validatePassword(providePassword, storedPassword) {
    const correctPasswordMatch = await password.compare(
      providePassword,
      storedPassword,
    );

    if (!correctPasswordMatch) {
      throw new UnauthorizedError({
        message: "Senha não confere.",
        action: "Verfique se este dado está correto.",
      });
    }
  }
}

const authentication = {
  getAuthenticatedUser,
};

export default authentication;
