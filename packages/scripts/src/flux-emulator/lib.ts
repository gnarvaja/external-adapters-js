import chalk from 'chalk'
import {
  checkEnvironment,
  deployAdapter,
  generateName,
  Inputs as AdapterInputs,
} from '../ephemeral-adapters/lib'
import {
  addAdapterToConfig,
  fetchConfigFromUrl,
  removeAdapterFromFeed,
  setFluxConfig,
} from './ReferenceContractConfig'
const { red, blue } = chalk

export const ACTIONS: string[] = ['start', 'stop']
export const WEIWATCHER_SERVER = 'https://weiwatchers.com/flux-emulator-mainnet.json'
export const CONFIG_SERVER = 'https://adapters.qa.stage.cldev.sh/fluxconfig'
export const FLUX_CONFIG_INPUTS: AdapterInputs = {
  action: 'start',
  adapter: 'dummy-external',
  release: 'fluxconfig',
  imageTag: 'latest',
  imageRepository: 'kalverra/',
  helmValuesOverride: './packages/scripts/src/flux-emulator/values.yaml',
  name: 'fluxconfig',
}

export interface Inputs {
  action: string
  adapter: string
  release: string
  ephemeralName: string
  weiWatcherServer: string
  configServer: string
}

export const main = async (): Promise<void> => {
  blue.bold('Checking the arguments')
  const inputs: Inputs = checkArgs()

  blue.bold('Checking the config server is deployed in this cluster')
  if (!isConfigServerDeployed()) {
    deployConfigServer()
  }

  if (process.argv[2] === 'start') {
    blue.bold('Adding configuation')
    await start(inputs)
  } else {
    blue.bold('Removing configuation')
    await stop(inputs)
  }
}

const usageString = `
3 arguments are required
1: Options are "start" or "stop". In releation to whether you want to start or stop the testing the adapter.
2: The adapter name you wish to tell flux emulator to test.
3. The unique release tag for this adapter`

const checkArgs = (): Inputs => {
  if (process.argv.length < 4) {
    red.bold(usageString)
  }
  const action: string = process.argv[2]
  if (!ACTIONS.includes(action))
    throw red.bold(`The first argument must be one of: ${ACTIONS.join(', ')}`)

  const adapter: string = process.argv[3]
  if (!adapter) throw red.bold('Missing second argument: adapter\n' + usageString)

  const release: string = process.argv[4]
  if (!release) throw red.bold('Missing third argument: release tag\n' + usageString)

  // check the environment variables
  let weiWatcherServer: string | undefined = process.env['WEIWATCHER_SERVER']
  if (!weiWatcherServer) weiWatcherServer = WEIWATCHER_SERVER

  let configServer: string | undefined = process.env['CONFIG_SERVER']
  if (!configServer) configServer = CONFIG_SERVER

  const ephemeralName = generateName({
    action: '',
    adapter,
    release,
    name: '',
  })

  return {
    action,
    adapter,
    release,
    ephemeralName,
    weiWatcherServer,
    configServer,
  }
}

const isConfigServerDeployed = (): boolean => {
  return false
}

const deployConfigServer = () => {
  checkEnvironment()
  deployAdapter(FLUX_CONFIG_INPUTS)
}

const start = async (inputs: Inputs) => {
  const masterConfig = await fetchConfigFromUrl(inputs.weiWatcherServer).toPromise()
  if (!masterConfig || !masterConfig.configs) {
    throw red.bold('Could not get the master configuration')
  }
  const qaConfig = await fetchConfigFromUrl(inputs.configServer).toPromise()
  if (!qaConfig || !qaConfig.configs) {
    throw red.bold('Could not get the qa configuration')
  }
  const newConfig = addAdapterToConfig(
    inputs.adapter,
    inputs.ephemeralName,
    masterConfig.configs,
    qaConfig.configs,
  )
  setFluxConfig(newConfig, inputs.configServer)
}

const stop = async (inputs: Inputs) => {
  const qaConfig = await fetchConfigFromUrl(inputs.configServer).toPromise()
  if (!qaConfig || !qaConfig.configs) {
    throw red.bold('Could not get the qa configuration')
  }
  const newConfig = removeAdapterFromFeed(inputs.ephemeralName, qaConfig.configs)
  setFluxConfig(newConfig, inputs.configServer)
  return
}
