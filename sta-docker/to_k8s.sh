#!/bin/bash

DOCKER_COMPOSE_FILE="docker-compose.yml"

eval $(cat {oidc,}.env | grep -v "^#" | xargs -d '\n') \
        kompose convert -f ${DOCKER_COMPOSE_FILE} -o kubernetes

