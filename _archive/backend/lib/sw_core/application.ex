defmodule SwCore.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      SwCoreWeb.Telemetry,
      SwCore.Repo,
      {DNSCluster, query: Application.get_env(:sw_core, :dns_cluster_query) || :ignore},
      {Phoenix.PubSub, name: SwCore.PubSub},
      # Start a worker by calling: SwCore.Worker.start_link(arg)
      # {SwCore.Worker, arg},
      # Start to serve requests, typically the last entry
      SwCoreWeb.Endpoint
    ]

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: SwCore.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    SwCoreWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
