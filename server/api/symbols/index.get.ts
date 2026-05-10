import { getSymbolList } from '../../utils/mockData'

export default defineEventHandler(async (event) => {
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 150))

  const query = getQuery(event)
  let symbols = getSymbolList()

  if (query.sort === 'asc') {
    symbols = symbols.sort((a, b) => a.Name.localeCompare(b.Name))
  } else if (query.sort === 'desc') {
    symbols = symbols.sort((a, b) => b.Name.localeCompare(a.Name))
  }

  if (query.limit) {
    symbols = symbols.slice(0, Number(query.limit))
  }

  return symbols
})
