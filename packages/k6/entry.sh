#!/bin/bash
set -x

if [ ! -f /load/.env ]
then
  export $(cat .env | xargs)
fi

if [ $# -eq 0 ]; then
  # used in k8s
  k6 --verbose run /load/dist/test.js
else
  # used in local runs when you want to pass specific args to the test
  k6 $@
fi