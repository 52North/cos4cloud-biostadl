FROM httpd:2.4

RUN apt-get update && apt-get install -y \
    libapache2-mod-auth-openidc \
    && rm -rf /var/lib/apt/lists/* \
    && ln -s /usr/lib/apache2/modules/mod_auth_openidc.so /usr/local/apache2/modules/mod_auth_openidc.so

ENV HTTPD_PORT 8888
ENV HTTPD_STA_PATH "/sta"
ENV OIDC_PROVIDER_METADATA_URL "https://www.authenix.eu/.well-known/openid-configuration"
ENV OIDC_PROVIDER_END_SESSION_ENDPOINT "https://authenix.eu/oauth/logout"
ENV OIDC_RESPONSE_TYPE "code id_token"
ENV OIDC_RESPONSE_MODE "query"
ENV OIDC_SSL_VALIDATE_SERVER "On"

ENV OIDC_CLIENT_ID "<your_client_id>"
ENV OIDC_CLIENT_SECRET "<your_client_secret>"
ENV OIDC_REDIRECT_URI "http://localhost/sta/redirect_uri"
ENV OIDC_SCOPE "openid"

COPY . .

LABEL maintainer="Henning Bredel <h.bredel@52north.org>" \
                  org.opencontainers.image.title="52°North Sensor Things API" \
                  org.opencontainers.image.description="52°North Sensor Things API" \
                  org.opencontainers.image.licenses="MIT" \
                  org.opencontainers.image.url="https://52north.org/software/software-projects/sos/" \
                  org.opencontainers.image.vendor="52°North GmbH" \
                  org.opencontainers.image.source="https://github.com/52north/biostadl.git" \
                  org.opencontainers.image.version="0.0.1" \
                  Vorg.opencontainers.image.authors="Henning Bredel <h.bredel@52north.org"


