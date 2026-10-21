// Local development setup without access to the real backend.
// Starts a mock backend with generated meals for any requested date range and runs `nuxt dev` against it.
//
//   pnpm dev:mock
//
// Open http://localhost:3000/?verification=dev-token (or enter `dev-token` manually).
//
// Environment variables:
//   MOCK_PORT                  Port of the mock backend (default 4175)
//   MOCK_PUBLISH_NEXT_WEEK=0   Do not publish next week's meal plan (tests the empty state)
import { spawn } from 'node:child_process'
import { createServer } from 'node:http'

const port = Number(process.env.MOCK_PORT ?? 4175)
const verificationCode = 'dev-token'
const publishNextWeek = process.env.MOCK_PUBLISH_NEXT_WEEK !== '0'

const canteens = [
  { id: 8, name: 'Elbe', displayName: 'Kantine Elbe', hash: 'elbe', orderInApp: 1, outletId: 8, locationInfo: { id: 8, name: 'Hamburg' } },
  { id: 2, name: 'bonprix', displayName: 'Kantine bonprix', hash: 'bonprix', orderInApp: 2, outletId: 2, locationInfo: { id: 2, name: 'Hamburg' } },
]

const categories = {
  grill: { id: 204, name: 'Grill', unifiedName: 'Grill' },
  main: { id: 201, name: 'Hauptgericht', unifiedName: 'Hauptgericht' },
  soup: { id: 233, name: 'Suppe', unifiedName: 'Suppe' },
  salad: { id: 235, name: 'Salat', unifiedName: 'Salat' },
}

const features = {
  vegetarian: { id: 25, name: 'Vegetarisch', showInOverview: true, showInFilter: true, orderInApp: 1 },
  vegan: { id: 26, name: 'Vegan', showInOverview: true, showInFilter: true, orderInApp: 2 },
}

const dishes = [
  ['Gegrilltes Gemüse', 'grill', ['vegetarian']],
  ['Hähnchenbrust mit Reis', 'main', []],
  ['Cremige Tomatensuppe', 'soup', ['vegetarian']],
  ['Bunter Salat', 'salad', ['vegan']],
  ['Pasta Arrabbiata', 'main', ['vegan']],
  ['Currywurst mit Pommes', 'grill', []],
  ['Linseneintopf', 'soup', ['vegan']],
  ['Lachsfilet mit Kartoffeln', 'main', []],
  ['Gemüse-Lasagne', 'main', ['vegetarian']],
  ['Caesar Salad', 'salad', []],
  ['Kartoffelgratin', 'main', ['vegetarian']],
  ['Rinderburger', 'grill', []],
]

const formatDate = (date) => date.toISOString().slice(0, 10)
const addDays = (date, days) => new Date(date.getTime() + days * 86_400_000)
const startOfWeekUtc = (date) => {
  const day = date.getUTCDay() || 7
  return addDays(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())), 1 - day)
}

const lastPublishedDate = () => {
  const monday = startOfWeekUtc(new Date())
  return formatDate(addDays(monday, publishNextWeek ? 11 : 4))
}

const createMeals = (start, end) => {
  const meals = []
  const published = lastPublishedDate()
  for (let date = new Date(`${start}T00:00:00Z`); formatDate(date) <= end; date = addDays(date, 1)) {
    const day = formatDate(date)
    if (date.getUTCDay() === 0 || date.getUTCDay() === 6 || day > published) continue

    const dayNumber = Math.floor(date.getTime() / 86_400_000)
    canteens.forEach((canteen, canteenIndex) => {
      for (let slot = 0; slot < 4; slot++) {
        const [title, category, featureKeys] = dishes[(dayNumber * 3 + canteenIndex * 5 + slot * 2) % dishes.length]
        const id = Number(day.replaceAll('-', '')) * 100 + canteen.id * 10 + slot
        meals.push({
          id,
          title,
          date: `${day}T11:30:00.000Z`,
          canteenId: canteen.id,
          price: 4.5 + slot,
          studentPrice: 3.5 + slot * 0.8,
          guestPrice: 6.5 + slot,
          images: slot % 2 === 0 ? [{ url: `/img/meal-${id}.svg`, aiSuggested: false }] : [],
          features: featureKeys.map((key) => features[key]),
          category: categories[category],
          reviewStats: { totalReviews: slot * 3, averageStars: slot === 0 ? 0 : 3.5 + slot / 4 },
        })
      }
    })
  }
  return meals
}

const capacityPoint = (percent, timestamp) => ({
  value: percent / 100,
  relativePercent: percent,
  absolutePersons: percent * 5,
  unitValueRelative: '%',
  unitValueAbsolute: 'Personen',
  timestamp,
})

const send = (response, status, body) => {
  response.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' })
  response.end(JSON.stringify(body))
}

const server = createServer((request, response) => {
  const url = new URL(request.url ?? '/', `http://127.0.0.1:${port}`)
  const authenticated = request.headers['x-verification-code'] === verificationCode
  const { pathname } = url

  if (pathname === '/verification') return send(response, 200, { configured: true, authenticated })
  if (!authenticated) return send(response, 401, { success: false, error: { message: 'Unauthorized' } })

  if (pathname === '/meals' && request.method === 'GET') {
    const start = url.searchParams.get('start') ?? formatDate(new Date())
    const end = url.searchParams.get('end') ?? start
    return send(response, 200, { canteens, meals: createMeals(start, end) })
  }

  if (pathname === '/capacity/current') {
    const now = new Date().toISOString()
    return send(response, 200, {
      success: true,
      data: canteens.map((canteen, index) => ({ canteen, capacity: capacityPoint(index === 0 ? 62 : 28, now) })),
    })
  }

  if (pathname === '/capacity/timeline') {
    const date = url.searchParams.get('date') ?? formatDate(new Date())
    const canteen = canteens.find((entry) => entry.id === Number(url.searchParams.get('canteenId'))) ?? canteens[0]
    return send(response, 200, {
      success: true,
      data: {
        date,
        canteen,
        observations: [capacityPoint(35, `${date}T10:00:00.000Z`), capacityPoint(62, `${date}T11:30:00.000Z`)],
        prediction: {
          basedOnDates: [],
          points: [
            { value: 0.4, relativePercent: 40, absolutePersons: 200, time: '11:00', sampleCount: 2 },
            { value: 0.65, relativePercent: 65, absolutePersons: 325, time: '13:00', sampleCount: 2 },
          ],
        },
      },
    })
  }

  if (pathname === '/reviews/settings') return send(response, 200, { success: true, data: { textReviewsEnabled: true } })

  const reviews = pathname.match(/^\/meals\/(\d+)\/reviews$/)
  if (reviews) {
    if (request.method === 'POST') return send(response, 200, { success: true })
    return send(response, 200, {
      success: true,
      data: {
        reviews: [{
          id: 1,
          star: 5,
          comment: 'Sehr lecker!',
          createdAt: new Date().toISOString(),
          mealId: Number(reviews[1]),
          isFromOriginalMeal: true,
          matchType: 'original',
        }],
        pagination: { page: 1, limit: 50, total: 1, pages: 1 },
        stats: { totalReviews: 1, averageStars: 5 },
      },
    })
  }

  if (pathname.startsWith('/img/')) {
    response.writeHead(200, { 'content-type': 'image/svg+xml' })
    return response.end('<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="#d8c1b5"/></svg>')
  }

  return send(response, 404, { error: 'not found' })
})

server.listen(port, '127.0.0.1', () => {
  console.log(`[mock-backend] listening on http://127.0.0.1:${port} (verification code: ${verificationCode}, next week published: ${publishNextWeek})`)
  console.log(`[mock-backend] open http://localhost:3000/?verification=${verificationCode}`)

  const nuxt = spawn('pnpm', ['exec', 'nuxt', 'dev'], {
    stdio: 'inherit',
    env: { ...process.env, NUXT_PUBLIC_API_BASE_URL: `http://127.0.0.1:${port}` },
  })
  const shutdown = () => {
    nuxt.kill('SIGTERM')
    server.close()
  }
  nuxt.on('exit', (code) => {
    server.close()
    process.exit(code ?? 0)
  })
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
})
