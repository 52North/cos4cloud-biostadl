# Protected SensorThings API

The `docker-compose` file orchestrates a SensorThings API instance with a
PostgreSQL database as data backend. The infrastructure adds an Apache2
Web server which proxies the SensorThings API `/sta` endpoint by an
[OpenId Connect configuration](https://github.com/zmartzone/mod_auth_openidc).

## App Registration

To login via OIDC login provider (in this case <https://www.authenix.eu)> you
have to register your application first to obtain OIDC configuration infos
needed to make login via OpenId Connect possible. Go to

  <https://www.authenix.eu/registerapps>

and answer the required fields to get the needed id and secret parameters.

## Configuration

Configuration is done via `.env` file and `oidc.env` file. For both files
there is a `sample*.env` template which can be copied or renamed to the
appropriate name. Make your changes according to your environment.

Put your server specific configuration into the `.env` file. For the OpenId
Connect specific configuration you have to create an `oidc.env` file next to
the `.env` file. It will contain the confidential openidc configuration, e.g.
the `client_secret` you get when registering the application at your provider.
