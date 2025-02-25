import database from "../../../../infra/database.js";

async function status(request, response) {
  const result = await database.query('SELECT 1 + 1 as sum;');
  console.log(result.rows);
  
  return response.json({ chave: "Retornando a primeira function da api." });
}
export default status;
