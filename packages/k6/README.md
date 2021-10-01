### k6 Load Testing

1. `docker pull loadimpact/k6`

2. `docker run -v [[RELATIVE PATH TO /dist]]:/load -i loadimpact/k6 run /load/test.js`

When running against local adapters Docker will need to know the path to your local machine.

Add the following flags after `run`:
`--add-host=host.docker.internal:host-gateway --network="host"`

To run with the new docker method.
1. Set any environment variables you need for this test in the .env file.
2. If running against an ephemeral adapter set the QA_RELEASE_TAG in the .env to the same RELEASE_TAG used when starting the adapter. If you are just running against adapters in the staging cluster you should leave this blank.
3. run `yarn test:docker`