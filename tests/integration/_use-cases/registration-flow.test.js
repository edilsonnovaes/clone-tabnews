import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator.js";
import activation from "models/activation";
import user from "models/user.js";
import webserver from "infra/webserver";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe("Use case: Registration Flow (all successful)", () => {
  let createUserBody;
  let activationToken;

  test("Create user account", async () => {
    const createUserResponse = await fetch(`${webserver.origin}/api/v1/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "RegistrationFlow",
        email: "registration.flow@curso.dev",
        password: "RegistrationFlowPassword",
      }),
    });

    expect(createUserResponse.status).toBe(201);

    createUserBody = await createUserResponse.json();

    expect(createUserBody).toEqual({
      id: createUserBody.id,
      username: "RegistrationFlow",
      features: ["read:activation_token"],
      created_at: createUserBody.created_at,
      updated_at: createUserBody.updated_at,
    });
  });

  test("Receive activation email", async () => {
    const lastEmail = await orchestrator.getLastEmail();

    const regexToken = /cadastro\/ativar\/[^\r?\n]*/;

    const emailToken = lastEmail.text
      .match(regexToken)[0]
      .replace("cadastro/ativar/", "");

    activationToken = await activation.findOneByTokenId(emailToken);

    expect(lastEmail.sender).toBe(`<contato@${process.env.APP_DOMAIN}>`);
    expect(lastEmail.recipients[0]).toBe("<registration.flow@curso.dev>");
    expect(lastEmail.subject).toBe(
      "Ative seu cadastro no Consciencia e Movimento!",
    );
    expect(lastEmail.text).toContain("RegistrationFlow");

    expect(uuidVersion(activationToken.id)).toBe(4);
    expect(activationToken.user_id).toBe(createUserBody.id);
    expect(activationToken.expires_at).toBeTruthy();
    expect(activationToken.used_at).toBeNull();
  });

  test("Activate account", async () => {
    const activationResponse = await fetch(
      `http://localhost:3000/api/v1/activations/${activationToken.id}`,
      {
        method: "PATCH",
      },
    );

    expect(activationResponse.status).toBe(200);

    const activationResponseBody = await activationResponse.json();

    expect(Date.parse(activationResponseBody.used_at)).not.toBeNaN();

    const activatedUser = await user.findOneByUsername("RegistrationFlow");
    expect(activatedUser.features).toEqual([
      "create:session",
      "read:session",
      "update:user",
    ]);
  });

  test("Login", async () => {
    const createSessionResponse = await fetch(
      `${webserver.origin}/api/v1/sessions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "registration.flow@curso.dev",
          password: "RegistrationFlowPassword",
        }),
      },
    );

    expect(createSessionResponse.status).toBe(201);

    const createSessionResponseBody = await createSessionResponse.json();

    expect(createSessionResponseBody.user_id).toEqual(createUserBody.id);
  });

  test("Get user information", async () => {
    const getUserResponse = await fetch(`http://localhost:3000/api/v1/user`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    expect(getUserResponse.status).toBe(403);

    const sessionObject = await orchestrator.createSession(createUserBody.id);
    const getUserResponseAfterFeatureUpdate = await fetch(
      `http://localhost:3000/api/v1/user`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
      },
    );

    expect(getUserResponseAfterFeatureUpdate.status).toBe(200);
  });
});
