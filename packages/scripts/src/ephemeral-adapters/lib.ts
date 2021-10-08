import chalk from 'chalk'
import * as shell from 'shelljs'
import { ShellString } from 'shelljs'
const { red, blue } = chalk
const { log } = console

const ACTIONS: string[] = ['start', 'stop']
const HELM_CHART_DIR = 'chainlink/cl-adapter'
const IMAGE_REPOSITORY = 'public.ecr.aws/chainlink/adapters/'
const IMAGE_TAG = 'develop-latest'
const NAMESPACE = 'ephemeral-adapters'

interface Inputs {
  action: string
  adapter: string
  release: string
  imageTag: string
  imageRepository: string
  helmChartDir: string
  helmValuesOverride: string
  name: string
}

const usageString = `
At least 3 arguments are required and 1 optional.
1: Options are "start" or "stop". In releation to whether you want to start or stop the adapter.
2: The adapter name you wish to start. Must match an adapter we have built a docker image for.
3: The unique release tag for this deployment. Use your name if you are running locally or the PR number for CI.
4: Optional. The docker image tag you wish to deploy. Can also be a sha256 for the image. Defaults to develop-latest.
There are 3 other variables that can be changed via environment variables. These are:
HELM_CHART_DIR - The path to the helm chart directory for the adapters. Defaults to the one in this project.
HELM_VALUES - The path to a helm values file you wish to use to override any default values in the chart
IMAGE_REPOSITORY - The docker image reposoitory where the image you want deployed lives. Defaults to the public chainlink ecr.`

/**
 * Verifies we have a command installed on this machine
 * @param command The command to check for
 */
const checkCommandIsInstalled = (command: string): void => {
  const c: string = shell.exec(`command -v ${command}`).toString()
  if (!c) throw red.bold(`${command} is not installed`)
}

/**
 * We only want to start and stop adapter containers on the qa cluster.
 * This verifies we are on the qa cluster.
 */
const verifyWeAreOnQaStagingCluster = (): void => {
  const response: ShellString = shell.exec(
    `kubectl config get-contexts | grep '*' | grep qa-stage-cluster`,
  )
  log(response)
  if (response.code !== 0)
    throw red.bold(
      'We only want to spin ephemeral environments up on the qa cluster. Please change your kubectx.',
    )
}

/**
 * Generates the name to be used for the adapter in the cluster
 * @param {Inputs} config The configuation for this deployment
 * @returns The string to use for the name of the adapter
 */
const generateName = (config: Inputs): string => {
  return `qa-ea-${config.adapter}-${config.release}`
}

/**
 * Checks the args and environment for required inputs and commands.
 * @returns The inputs from the args and env.
 */
const checkArgsAndEnvironment = (): Inputs => {
  // check the args
  if (process.argv.length < 5) {
    throw red.bold(usageString)
  }
  const action: string = process.argv[2]
  if (!ACTIONS.includes(action))
    throw red.bold(`The first argument must be one of: ${ACTIONS.join(', ')}`)

  const adapter: string = process.argv[3]
  if (!adapter) throw red.bold('Missing second argument: adapter\n' + usageString)

  const release: string = process.argv[4]
  if (!release) throw red.bold('Missing third argument: release tag\n' + usageString)

  let imageTag: string = process.argv[5]
  if (!imageTag) imageTag = IMAGE_TAG

  // check the environment variables
  let imageRepository: string | undefined = process.env['IMAGE_REPOSITORY']
  if (!imageRepository) imageRepository = IMAGE_REPOSITORY

  let helmChartDir: string | undefined = process.env['HELM_CHART_DIR']
  if (!helmChartDir) helmChartDir = HELM_CHART_DIR

  let helmValuesOverride: string | undefined = process.env['HELM_VALUES']
  if (!helmValuesOverride) {
    helmValuesOverride = ''
  } else {
    helmValuesOverride = `-f ${helmValuesOverride}`
  }

  // check if required commands are installed
  checkCommandIsInstalled('kubectl')
  checkCommandIsInstalled('helm')
  checkCommandIsInstalled('grep')
  verifyWeAreOnQaStagingCluster()

  const inputs: Inputs = {
    action,
    adapter,
    release,
    imageTag,
    imageRepository,
    helmChartDir,
    helmValuesOverride,
    name: '',
  }
  const name: string = generateName(inputs)
  inputs.name = name

  return inputs
}

/**
 * Deploy adapter to the cluster
 * @param {Input} config The configuration of the adapter you wish to deploy
 */
export const deployAdapter = (config: Inputs): void => {
  shell.exec('helm repo add chainlink https://smartcontractkit.github.io/charts')
  shell.exec(
    `helm upgrade ${config.name} ${config.helmChartDir} \
      --install \
      --namespace ${NAMESPACE} \
      --create-namespace \
      ${config.helmValuesOverride} \
      --set image.repository="${config.imageRepository}${config.adapter}-adapter" \
      --set image.tag=${config.imageTag} \
      --set name=${config.name} \
      --wait`,
  )
}

/**
 * Remove an adapter from the cluster
 * @param {Inputs} config The configuration to use to stop an adapter
 */
export const removeAdapter = (config: Inputs): void => {
  shell.exec(
    `helm uninstall ${config.name} \
      --namespace ${NAMESPACE} \
      --wait`,
  )
}

export async function main(): Promise<void> {
  log(blue.bold('Running input checks'))
  const inputs: Inputs = checkArgsAndEnvironment()

  log(blue.bold(`The configuration for this run is:\n ${JSON.stringify(inputs, null, 2)}`))

  log(blue.bold(`${inputs.action} ${inputs.adapter} adapter as ${inputs.name}`))
  if (inputs.action === 'start') {
    deployAdapter(inputs)
  } else {
    removeAdapter(inputs)
  }
}
