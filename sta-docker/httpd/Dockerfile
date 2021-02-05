FROM httpd:2.4

RUN apt-get update && \
    apt-get install -y \
    libapache2-mod-auth-openidc && \
    rm -rf /var/lib/apt/lists/* && \
    ln -s /usr/lib/apache2/modules/mod_auth_openidc.so /usr/local/apache2/modules/mod_auth_openidc.so && \
    apt-get -y clean && \
    rm -rf /var/lib/apt/lists/*

ENV HTTPD_HOST "localhost"
ENV HTTPD_STA_PATH "/sta"
ENV HTTPD_PROTOCOL "http"
ENV STA_SERVER_ROOT_URL "${HTTPD_PROTOCOL}://${HTTPD_HOST}${HTTPD_STA_PATH}/"
ENV HTTPD_STA_INTERNAL_HOST "sta"
ENV HTTPD_STA_INTERNAL_PORT "8080"

ENV HTTPD_LOG_LEVEL "info"
ENV HTTPD_OIDC_LOG_LEVEL "info"

# testsystem: 78.46.190.103 
ENV HTTPD_OIDC_PROVIDER_METADATA_URL "https://www.authenix.eu/.well-known/openid-configuration"
ENV HTTPD_OIDC_PROVIDER_END_SESSION_ENDPOINT "https://authenix.eu/oauth/logout"
ENV HTTPD_OAUTH_INTROSPECTION_ENDPOINT "https://www.authenix.eu/oauth/tokeninfo"

ENV HTTPD_OIDC_CLIENT_ID "<your_client_id>"
ENV HTTPD_OIDC_CLIENT_SECRET "<your_client_secret>"
ENV HTTPD_OIDC_CRYPTO_PASSPHRASE "<change_in_production>"
ENV HTTPD_OIDC_REDIRECT_URI "${STA_SERVER_ROOT_URL}redirect_uri"
ENV HTTPD_OIDC_SSL_VALIDATE_SERVER "On"

ENV HTTPD_OIDC_SCOPE "openid profile email offline_access saml offline_access"
ENV HTTPD_OIDC_RESPONSE_TYPE "code id_token"
ENV HTTPD_OIDC_RESPONSE_MODE "query"
# ENV HTTPD_OIDC_SCOPE "openid"
# ENV HTTPD_OIDC_RESPONSE_TYPE "id_token"
# ENV HTTPD_OIDC_RESPONSE_MODE "fragment"

COPY ./conf ./conf
COPY ./htdocs ./htdocs

LABEL \
    maintainer="Henning Bredel <h.bredel@52north.org>" \
    org.opencontainers.image.title="52°North Sensor Things API" \
    org.opencontainers.image.description="52°North Sensor Things API" \
    org.opencontainers.image.version="0.0.1" \
    org.opencontainers.image.licenses="MIT" \
    org.opencontainers.image.vendor="52°North GmbH" \
    org.opencontainers.image.authors="Henning Bredel <h.bredel@52north.org" \
    org.opencontainers.image.source="https://github.com/52north/biostadl.git" \
    org.opencontainers.image.url="https://cos4cloud-eosc.eu/"

EXPOSE 80 443

CMD if [ "${HTTPD_PROTOCOL}" = "https" ]; \
    then httpd-foreground -DHTTPD_USE_SSL;\
    else httpd-foreground; \
    fi 