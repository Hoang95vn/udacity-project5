import 'source-map-support/register'
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  APIGatewayProxyHandler
} from 'aws-lambda'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import { encodeNextPage, getAllTodoItems, parseLimitParam, parseNextPageParam } from '../../businessLogic/todoItems'
import { getUserId } from '../utils'
import { createLogger } from '../../utils/logger'
import { PageTodoItem } from '../../models/PageTodoItem'

const logger = createLogger('getTodos')

const getTodosHandler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  logger.info('Caller event', event)

  const limitDefault = 10
  const nextPage = await parseNextPageParam(event)
  const limit = await parseLimitParam(event,limitDefault) || limitDefault
  const userId = getUserId(event)
  const items: PageTodoItem = await getAllTodoItems(userId, limit, nextPage)

  logger.info("Get Todo by user ", userId);
  logger.info('Todo items fetched', { userId, count: items.items.length })

  return {
    statusCode: 200,
    body: JSON.stringify({ 
      "items": items.items,
      "nextPage": encodeNextPage(items.nextPage) 
    })
  }
}

export const handler = middy(getTodosHandler).use(cors({ credenials: true }))
