FROM httpd:2.4

RUN apt-get update && apt-get install -y \
    libapache2-mod-auth-openidc \
#    libapache2-mod-jk \
    && rm -rf /var/lib/apt/lists/* \
    && ln -s /usr/lib/apache2/modules/mod_auth_openidc.so /usr/local/apache2/modules/mod_auth_openidc.so

ENV OIDC_REDIRECT_URI http://localhost:8888/sta/redirect_uri

COPY ./conf/httpd.conf /usr/local/apache2/conf/httpd.conf
COPY ./conf/extra/* /usr/local/apache2/conf/extra/
COPY ./htdocs/* /usr/local/apache2/htdocs/

LABEL maintainer="Henning Bredel <h.bredel@52north.org>" \
                  org.opencontainers.image.title="52°North Sensor Things API" \
                  org.opencontainers.image.description="52°North Sensor Things API" \
                  org.opencontainers.image.licenses="MIT" \
                  org.opencontainers.image.url="https://52north.org/software/software-projects/sos/" \
                  org.opencontainers.image.vendor="52°North GmbH" \
                  org.opencontainers.image.source="https://github.com/52north/biostadl.git" \
                  org.opencontainers.image.version="0.0.1" \
                  Vorg.opencontainers.image.authors="Henning Bredel <h.bredel@52north.org"


