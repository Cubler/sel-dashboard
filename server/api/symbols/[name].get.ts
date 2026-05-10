import { generateSymbolValue } from '../../utils/mockData'

export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, 'name') ?? ''

  const value = generateSymbolValue(name)
  if (!value) {
    throw createError({
      statusCode: 404,
      message: `Symbol '${name}' not found`,
    })
  }

  return value
})
