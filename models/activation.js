import email from "infra/email.js";
import database from "infra/database.js";
import webserver from "infra/webserver.js";

const EXPIRATION_IN_MILLISECONDS = 60 * 15 * 1000; // 15 minutes

async function create(userId) {
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);

  const newToken = await runInsertQuery(userId, expiresAt);
  return newToken;

  async function runInsertQuery(userId, expiresAt) {
    const results = await database.query({
      text: ` INSERT INTO 
                user_activation_tokens (user_id, expires_at) 
              VALUES 
                ($1, $2)
              RETURNING
              *
            ;`,
      values: [userId, expiresAt],
    });

    return results.rows[0];
  }
}

async function sendEmailToUser(user, activationToken) {
  await email.send({
    from: "Fintab <contato@fintab.com.br>",
    to: user.email,
    subject: "Ative seu cadastro no Fintab!",
    text: `${user.username}, clique no link abaixo para ativar seu cadastro:

${webserver.origin}/cadastro/ativar/${activationToken.id}

Atenciosamente,
Equipe Fintab
`,
  });
}

async function findOneByTokenId(tokenId) {
  const token = await selectQuery(tokenId);
  return token;

  async function selectQuery(tokenId) {
    const results = await database.query({
      text: `
      SELECT 
        * 
      FROM 
        user_activation_tokens 
      WHERE 
        id = $1
        AND expires_at > NOW()
        AND used_at IS NULL
      LIMIT 
        1
      ;`,
      values: [tokenId],
    });

    return results.rows[0];
  }
}

const activation = {
  create,
  sendEmailToUser,
  findOneByTokenId,
  EXPIRATION_IN_MILLISECONDS,
};

export default activation;
