#!/bin/bash

DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# switch to the project home so we can run normal yarn commands
cd ${DIR}/../../../
set -x

ADAPTER=dummy-external \
NAME=fluxconfig \
RELEASE_TAG=fluxconfig \
IMAGE_REPOSITORY=kalverra/ \
IMAGE_TAG=latest \
HELM_VALUES=${DIR}/values.yaml \
yarn qa:adapter:start