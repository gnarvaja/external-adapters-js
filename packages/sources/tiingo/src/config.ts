import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

/**
 * @swagger
 * securityDefinitions:
 *  environment-variables:
 *    API_KEY:
 *      required: true
 *    API_ENDPOINT:
 *       required: false
 *       default: https://api.tiingo.com/tiingo/
 */

export const DEFAULT_ENDPOINT = 'eod'
export const DEFAULT_BASE_URL = 'https://api.tiingo.com/tiingo/'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix, true)
  config.api = {
    ...config.api,
    baseURL: config.api.baseURL || DEFAULT_BASE_URL,
  }
  return config
}