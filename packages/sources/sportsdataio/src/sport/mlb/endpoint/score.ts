import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig } from '@chainlink/types'
import { Config } from '../../../config'
import { ethers } from 'ethers'
import { GameResponse } from '../types'
import { getGamesByDate } from '../utils'

export const NAME = 'score'

const customParams = {
  gameID: true,
  date: true,
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const date = validator.validated.data.date
  const gameID = validator.validated.data.gameID
  const games = await getGamesByDate(date, config)
  const game = games.find((game) => game.GameID === gameID)

  if (!game) {
    throw new Error(`Cannot find game with ID ${gameID} on date ${date}`)
  }
  const encodedGame = encodeGame(game)
  const respData = {
    data: {
      ...game,
      result: encodedGame,
    },
    result: encodedGame,
  }

  return Requester.success(jobRunID, respData, config.verbose)
}

const encodeGame = (game: GameResponse): string => {
  const types = ['uint256', 'string', 'string', 'string', 'string', 'string', 'string']
  const values = [
    game.GameID,
    game.Status,
    game.DateTime,
    game.AwayTeam,
    game.HomeTeam,
    game.AwayTeamMoneyLine,
    game.HomeTeamMoneyLine,
  ]
  return ethers.utils.defaultAbiCoder.encode(types, values)
}
