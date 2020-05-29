# Protected SensorThings API

The `docker-compose` file orchestrates a SensorThings API instance with a
PostgreSQL database as data backend. The infrastructure adds an Apache2
Web server which proxies the SensorThings API `/sta` endpoint by an
[OpenId Connect configuration](https://github.com/zmartzone/mod_auth_openidc).

Put your server specific configuration into the `.env` file. For the OpenId
Connect specific configuration you have to create an `oidc.env` file next to
the `.env` file. It will contain the confidential openidc configuration, e.g.
the `client_secret` you get when registering the application at your provider.
