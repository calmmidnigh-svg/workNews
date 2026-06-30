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
  headers: { 'User-Agent': 'Mozilla/5.0' },
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

function extractThumbnail(item: CustomItem & { content?: string }): string {
  // 1. media:content
  const mediaContent = item['media:content']?.$?.url
  if (mediaContent) return mediaContent

  // 2. media:thumbnail
  const mediaThumbnail = item['media:thumbnail']?.$?.url
  if (mediaThumbnail) return mediaThumbnail

  // 3. enclosure (이미지 타입)
  const enc = item.enclosure
  if (enc?.url && enc?.type?.startsWith('image')) return enc.url

  // 4. itunes:image
  const itunesImage = item['itunes:image']?.$?.href
  if (itunesImage) return itunesImage

  // 5. content 내 첫 번째 <img> 태그
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
  const raw = searchParams.get('keywords') ?? 'AI,UX,디자인'
  const keywords = raw.split(',').map((k) => k.trim()).filter(Boolean)

  const results: ArticleType[] = []

  await Promise.allSettled(
    SOURCES.map(async (source) => {
      try {
        const feed = await parser.parseURL(source.url)
        const items = feed.items.slice(0, 10)
        for (const item of items) {
          const title = item.title ?? ''
          const content = item.contentSnippet ?? item.content ?? item.summary ?? ''
          const matched = matchKeywords(title + ' ' + content, keywords)
          if (matched.length === 0) continue
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
        }
      } catch {
        // 개별 소스 실패는 무시
      }
    }),
  )

  results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return NextResponse.json({ articles: results, keywords, fetchedAt: new Date().toISOString() })
}
