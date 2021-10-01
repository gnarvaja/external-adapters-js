#!/bin/bash

if [ ! -f /load/.env ]
then
  export $(cat .env | xargs)
fi

k6 $@