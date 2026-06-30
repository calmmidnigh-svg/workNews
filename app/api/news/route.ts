import { NextRequest, NextResponse } from 'next/server'
import Parser from 'rss-parser'

type CustomItem = {
  'media:content'?: { $?: { url?: string } }
  'media:thumbnail'?: { $?: { url?: string } }
  enclosure?: { url?: string; type?: string }
  'itunes:image'?: { $?: { href?: string } }
  content?: string
}

const parser = new Parser<Record<string, unknown>, CustomItem>({
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
  },
  customFields: {
    item: [
      ['media:content', 'media:content'],
      ['media:thumbnail', 'media:thumbnail'],
      ['enclosure', 'enclosure'],
      ['itunes:image', 'itunes:image'],
    ],
  },
})

const SOURCES = [
  { name: '요즘IT', url: 'https://yozm.wishket.com/magazine/rss/', category: 'tech' },
  { name: '토스 테크', url: 'https://toss.tech/rss.xml', category: 'tech' },
  { name: '카카오 테크', url: 'https://tech.kakao.com/feed/', category: 'tech' },
  { name: '네이버 D2', url: 'https://d2.naver.com/d2.atom', category: 'tech' },
  { name: 'LINE 엔지니어링', url: 'https://engineering.linecorp.com/ko/feed', category: 'tech' },
  { name: 'UX 콜렉티브', url: 'https://uxdesign.cc/feed', category: 'design' },
  { name: '브런치 IT', url: 'https://brunch.co.kr/rss/@@rss', category: 'tech' },
]

export type ArticleType = {
  id: string
  title: string
  link: string
  summary: string
  thumbnail: string
  date: string
  source: string
  category: string
  matched: string[]
}

export type SourceStatusType = {
  name: string
  ok: boolean
  count: number
  error?: string
}

function extractThumbnail(item: CustomItem & { content?: string }): string {
  const mediaContent = item['media:content']?.$?.url
  if (mediaContent) return mediaContent

  const mediaThumbnail = item['media:thumbnail']?.$?.url
  if (mediaThumbnail) return mediaThumbnail

  const enc = item.enclosure
  if (enc?.url && enc?.type?.startsWith('image')) return enc.url

  const itunesImage = item['itunes:image']?.$?.href
  if (itunesImage) return itunesImage

  const content = item.content ?? ''
  const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i)
  if (imgMatch?.[1]) return imgMatch[1]

  return ''
}

function summarize(content: string): string {
  const clean = content
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return clean.length > 120 ? clean.slice(0, 120) + '…' : clean
}

function matchKeywords(text: string, keywords: string[]): string[] {
  const lower = text.toLowerCase()
  return keywords.filter((kw) => lower.includes(kw.toLowerCase()))
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const raw = searchParams.get('keywords') ?? ''
  const keywords = raw.split(',').map((k) => k.trim()).filter(Boolean)

  const results: ArticleType[] = []
  const sourceStatuses: SourceStatusType[] = []

  await Promise.allSettled(
    SOURCES.map(async (source) => {
      try {
        const feed = await parser.parseURL(source.url)
        const items = feed.items.slice(0, 15)
        let count = 0
        for (const item of items) {
          const title = item.title ?? ''
          const content = item.contentSnippet ?? item.content ?? item.summary ?? ''
          const matched = keywords.length > 0
            ? matchKeywords(title + ' ' + content, keywords)
            : []

          // 키워드 있으면 매칭된 것만, 없으면 전체 표시
          if (keywords.length > 0 && matched.length === 0) continue

          results.push({
            id: item.guid ?? item.link ?? Math.random().toString(36),
            title,
            link: item.link ?? '',
            summary: summarize(content),
            thumbnail: extractThumbnail(item),
            date: item.pubDate ?? item.isoDate ?? '',
            source: source.name,
            category: source.category,
            matched,
          })
          count++
        }
        sourceStatuses.push({ name: source.name, ok: true, count })
      } catch (e) {
        sourceStatuses.push({
          name: source.name,
          ok: false,
          count: 0,
          error: e instanceof Error ? e.message : String(e),
        })
      }
    }),
  )

  results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return NextResponse.json({
    articles: results,
    keywords,
    sourceStatuses,
    fetchedAt: new Date().toISOString(),
  })
}
