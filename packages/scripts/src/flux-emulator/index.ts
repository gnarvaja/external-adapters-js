import { getResponse, setResponse } from './MockServer'

async function main() {
  setResponse({
    blarg: 'yes',
  })
  // await getResponse()
}
main()
