defmodule SwCore.Repo do
  use Ecto.Repo,
    otp_app: :sw_core,
    adapter: Ecto.Adapters.Postgres
end
