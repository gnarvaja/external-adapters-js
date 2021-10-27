import { check, sleep } from 'k6'
import { SharedArray } from "k6/data";
import http from 'k6/http'
import { Rate } from 'k6/metrics'
import {
  AdapterNames,
  ADAPTERS,
  GROUP_COUNT,
  httpPayloadsByAdapter,
  wsPayloads,
} from './config/index'

export const options = {
  vus: 1,
  duration: '12h',
  thresholds: {
    http_req_failed: ['rate<0.01'], // http errors should be less than 1%
    http_req_duration: ['p(95)<200'], // 95% of requests should be below 200ms
  },
}

let currIteration = 0
export const errorRate = new Rate('errors')

let payloadData = wsPayloads
if (__ENV.PAYLOAD_GENERATED) {
  payloadData = new SharedArray("payloadData", function () {
    // here you can open files, and then do additional processing or generate the array with data dynamically
    const f = JSON.parse(open("../src/config/ws.json"));
    return f; // f must be an array[]
  });
}

interface LoadTestGroupUrls {
  [loadTestGroup: string]: {
    [adapterName: string]: string
  }
}

function getLoadTestGroupsUrls(): LoadTestGroupUrls {
  if (__ENV.LOCAL_ADAPTER_NAME) {
    /**
     * Local environment only handles a single endpoint
     */
    return {
      local: {
        [__ENV.LOCAL_ADAPTER_NAME]: 'http://host.docker.internal:8080',
      },
    }
  } else {
    const loadTestGroup = Array(GROUP_COUNT)
      .fill(null)
      .map((_) => {
        if (__ENV.QA_RELEASE_TAG) {
          return `https://adapters.qa.stage.cldev.sh/`
        } else {
          return `https://adapters.main.stage.cldev.sh/`
        }
      })

    const adaptersToMap = ADAPTERS.filter((a) => currIteration % a.secondsPerCall === 0).map(
      (a) => a.name,
    )
    const adaptersPerLoadTestGroup = loadTestGroup.map(
      (u, i) =>
        [
          i,
          Object.fromEntries(
            adaptersToMap.map((a) => {
              if (__ENV.QA_RELEASE_TAG) {
                return [a, `${u}qa-ea-${a}-${__ENV.QA_RELEASE_TAG}`] as const
              }
              return [a, `${u}${a}`] as const
            }),
          ),
        ] as const,
    )

    return Object.fromEntries(adaptersPerLoadTestGroup)
  }
}

function buildRequests() {
  const batchRequests: Parameters<typeof http.batch>[0] = {}
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  }
  const urls = getLoadTestGroupsUrls()
  for (const [loadTestGroup, adaptersByAdapterName] of Object.entries(urls)) {
    for (const [adapterName, url] of Object.entries(adaptersByAdapterName)) {
      if (__ENV.WS_ENABLED) {
        for (const payload of payloadData) {
          if (adapterName === 'coinapi') {
            const body = JSON.parse(payload.data)
            body.data.endpoint = 'assets'
            batchRequests[`Group-${loadTestGroup}-${adapterName}-${payload.name}`] = {
              method: payload.method,
              url,
              body,
              params,
            }
          } else {
            batchRequests[`Group-${loadTestGroup}-${adapterName}-${payload.name}`] = {
              method: payload.method,
              url,
              body: payload.data,
              params,
            }
          }
        }
      }

      for (const payload of httpPayloadsByAdapter[adapterName as AdapterNames]) {
        batchRequests[`Group-${loadTestGroup}-${adapterName}-${payload.name}`] = {
          method: payload.method,
          url,
          body: payload.data,
          params,
        }
      }
    }
  }

  return batchRequests
}

const batchRequests = buildRequests()

export default (): void => {
  currIteration++
  const responses = http.batch(batchRequests)
  for (const [name, response] of Object.entries(responses)) {
    const result = check(response, {
      [`${name} returned 200`]: (r) => r.status == 200,
    })

    errorRate.add(!result)
  }

  sleep(1)
}
