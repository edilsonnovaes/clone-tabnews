import useSWR from "swr";

async function fetchAPI(key) {
  const response = await fetch(key);
  const responseBody = await response.json();
  return responseBody;
}

export default function StatusPage() {
  return (
    <>
      <h1>Status</h1>
      <UpdatedAt />
      <Database />
    </>
  );
}

function UpdatedAt() {
  const { isLoading, data } = useSWR("/api/v1/status", fetchAPI, {
    refreshInterval: 2000,
  });

  let updatedAtText = "Carregando...";

  if (!isLoading && data) {
    updatedAtText = new Date(data.updated_at).toLocaleString("pt-BR");
  }

  return <div>Última atualização: {updatedAtText}</div>;
}

function Database() {
  const { isLoading, data } = useSWR("/api/v1/status", fetchAPI, {
    refreshInterval: 5000,
    dedupingInterval: 5000,
  });

  let connectionsOpen = 0;
  let postgresVersion = 0;
  let maxConnections = 0;

  if (!isLoading && data) {
    console.log("atualizou max connections");
    let database = data.dependencies.database;

    connectionsOpen = database.connections_open;
    postgresVersion = database.version;
    maxConnections = database.max_connections;
  }

  return (
    <>
      <div>Conexões abertas: {connectionsOpen}</div>
      <div>Máximo de conexões suportadas: {maxConnections}</div>
      <div>Versão do Postgres: {postgresVersion}</div>
    </>
  );
}
