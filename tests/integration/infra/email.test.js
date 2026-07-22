import email from "infra/email.js";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("infra/email.js", () => {
  test("send()", async () => {
    await orchestrator.deleteAllEmails();

    await email.send({
      from: `ConscienciaeMovimento <contato@${process.env.APP_DOMAIN}>`,
      to: "contato@curso.dev",
      subject: "Teste de assunto",
      text: "Teste de corpo.",
    });

    await email.send({
      from: `ConscienciaeMovimento <contato@${process.env.APP_DOMAIN}>`,
      to: "contato@curso.dev",
      subject: "Ultimo Email Enviado.",
      text: "Corpo do ultimo email enviado.",
    });

    const lastEmail = await orchestrator.getLastEmail();
    expect(lastEmail.sender).toBe(`<contato@${process.env.APP_DOMAIN}>`);
    expect(lastEmail.recipients[0]).toBe("<contato@curso.dev>");
    expect(lastEmail.subject).toBe("Ultimo Email Enviado.");
    expect(lastEmail.text).toBe("Corpo do ultimo email enviado.\n");
  });
});
