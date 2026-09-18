import type {
  Canteen,
  CanteenCapacityApiResponse,
  CanteenCapacityTimelineApiResponse,
  Meal,
  MealReviewItem,
  MealsApiResponse,
  PaginatedMealReviewsResponse,
} from '~/types'
import type { Page, Route } from '@playwright/test'

const apiOrigin = 'https://3b-meals.mh-home.net'

const addDays = (dateString: string, days: number) => {
  const date = new Date(`${dateString}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

const mealDate = (startDate: string, dayOffset: number) =>
  `${addDays(startDate, dayOffset)}T11:30:00.000Z`

const elbe: Canteen = {
  id: 8,
  name: 'Elbe',
  displayName: 'Kantine Elbe',
  hash: 'elbe',
  orderInApp: 1,
  outletId: 8,
  locationInfo: { id: 8, name: 'Hamburg' },
}

const bonprix: Canteen = {
  id: 2,
  name: 'bonprix',
  displayName: 'Kantine bonprix',
  hash: 'bonprix',
  orderInApp: 2,
  outletId: 2,
  locationInfo: { id: 2, name: 'Hamburg' },
}

const meal = (overrides: Partial<Meal> & Pick<Meal, 'id' | 'title' | 'date' | 'canteenId'>): Meal => ({
  price: 5.5,
  studentPrice: 3.9,
  guestPrice: 6.5,
  images: [],
  features: [],
  category: { id: 201, name: 'Hauptgericht', unifiedName: 'Hauptgericht' },
  reviewStats: { totalReviews: 0, averageStars: 0 },
  ...overrides,
})

export const createMealsResponse = (startDate: string): MealsApiResponse => ({
  canteens: [elbe, bonprix],
  meals: [
    meal({
      id: 101,
      title: 'Gegrilltes Gemüse',
      date: mealDate(startDate, 0),
      canteenId: elbe.id,
      category: { id: 204, name: 'Grill', unifiedName: 'Grill' },
      images: [
        { url: '/img/meal-101-a.webp', aiSuggested: false },
        { url: '/img/meal-101-b.webp', aiSuggested: true },
      ],
      features: [
        { id: 25, name: 'Vegetarisch', showInOverview: true, orderInApp: 1 },
      ],
      reviewStats: { totalReviews: 12, averageStars: 4.5 },
    }),
    meal({
      id: 102,
      title: 'Cremige Tomatensuppe',
      date: mealDate(startDate, 0),
      canteenId: bonprix.id,
      category: { id: 233, name: 'Suppe', unifiedName: 'Suppe' },
    }),
    meal({
      id: 103,
      title: 'Bunter Salat',
      date: mealDate(startDate, 0),
      canteenId: elbe.id,
      category: { id: 235, name: 'Salat', unifiedName: 'Salat' },
    }),
    ...Array.from({ length: 4 }, (_, index) => meal({
      id: 110 + index,
      title: `Tagesgericht ${index + 2}`,
      date: mealDate(startDate, index + 1),
      canteenId: elbe.id,
      category: { id: 201, name: 'Hauptgericht', unifiedName: 'Hauptgericht' },
    })),
  ],
})

export const createCapacityResponse = (): CanteenCapacityApiResponse => ({
  success: true,
  data: [
    {
      canteen: elbe,
      capacity: {
        value: 0.62,
        relativePercent: 62,
        absolutePersons: 310,
        unitValueRelative: '%',
        unitValueAbsolute: 'Personen',
        timestamp: '2025-01-06T11:30:00.000Z',
      },
    },
    {
      canteen: bonprix,
      capacity: {
        value: 0.28,
        relativePercent: 28,
        absolutePersons: 140,
        unitValueRelative: '%',
        unitValueAbsolute: 'Personen',
        timestamp: '2025-01-06T11:30:00.000Z',
      },
    },
  ],
})

export const createTimelineResponse = (date: string, canteen: Canteen = elbe): CanteenCapacityTimelineApiResponse => ({
  success: true,
  data: {
    date,
    canteen,
    observations: [
      {
        value: 0.35,
        relativePercent: 35,
        absolutePersons: 175,
        timestamp: `${date}T10:00:00.000Z`,
      },
      {
        value: 0.62,
        relativePercent: 62,
        absolutePersons: 310,
        timestamp: `${date}T11:30:00.000Z`,
      },
    ],
    prediction: {
      basedOnDates: ['2024-12-02', '2024-12-09'],
      points: [
        {
          value: 0.4,
          relativePercent: 40,
          absolutePersons: 200,
          time: '11:00',
          sampleCount: 2,
        },
        {
          value: 0.65,
          relativePercent: 65,
          absolutePersons: 325,
          time: '13:00',
          sampleCount: 2,
        },
      ],
    },
  },
})

const reviews: MealReviewItem[] = [
  {
    id: 1,
    star: 5,
    comment: 'Sehr lecker!',
    createdAt: '2025-01-06T10:00:00.000Z',
    mealId: 101,
    isFromOriginalMeal: true,
    matchType: 'original',
  },
]

export const createReviewsResponse = (mealId: number): { success: true; data: PaginatedMealReviewsResponse } => ({
  success: true,
  data: {
    reviews: reviews.filter((review) => review.mealId === mealId),
    pagination: { page: 1, limit: 50, total: reviews.length, pages: 1 },
    stats: { totalReviews: reviews.length, averageStars: 5 },
  },
})

const json = async (route: Route, body: unknown, status = 200) => {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })
}

export const installApiMocks = async (page: Page) => {
  await page.route(`${apiOrigin}/**`, async (route) => {
    const request = route.request()
    const url = new URL(request.url())

    if (url.pathname === '/meals' && request.method() === 'GET') {
      const start = url.searchParams.get('start') ?? '2025-01-06'
      await json(route, createMealsResponse(start))
      return
    }

    if (url.pathname === '/capacity/current' && request.method() === 'GET') {
      await json(route, createCapacityResponse())
      return
    }

    if (url.pathname === '/capacity/timeline' && request.method() === 'GET') {
      const date = url.searchParams.get('date') ?? '2025-01-06'
      const canteenId = Number(url.searchParams.get('canteenId'))
      await json(route, createTimelineResponse(date, canteenId === bonprix.id ? bonprix : elbe))
      return
    }

    const reviewsMatch = url.pathname.match(/^\/meals\/(\d+)\/reviews$/)
    if (reviewsMatch && request.method() === 'GET') {
      await json(route, createReviewsResponse(Number(reviewsMatch[1])))
      return
    }

    if (reviewsMatch && request.method() === 'POST') {
      await json(route, { success: true, review: reviews[0] })
      return
    }

    if (url.pathname === '/meals/sync-now' && request.method() === 'POST') {
      await json(route, { success: true })
      return
    }

    if (url.pathname.startsWith('/img/admin/') && request.method() === 'DELETE') {
      await json(route, { success: true, data: { linkedMealsDeleted: 1 } })
      return
    }

    if (url.pathname.startsWith('/img/')) {
      await route.fulfill({
        status: 200,
        contentType: 'image/svg+xml',
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="#d8c1b5"/></svg>',
      })
      return
    }

    await route.continue()
  })
}
