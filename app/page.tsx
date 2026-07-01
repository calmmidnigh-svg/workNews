'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { ArticleType, SourceStatusType } from './api/news/route'
import ArticleCard from './ArticleCard'

const DEFAULT_KEYWORDS = ['AI', 'UX', '디자인', '개발자', '트렌드']
const PRESET_TAGS = ['AI', 'UX', '디자인', '개발자', '트렌드', '프로덕트', '데이터', '프론트엔드', '기획', '리서치']

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return '좋은 아침이에요 ☀️'
  if (h < 18) return '좋은 오후예요'
  return '좋은 저녁이에요 🌙'
}

function toDateKey(dateStr: string): string {
  if (!dateStr) return 'older'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return 'older'
  return d.toISOString().slice(0, 10) // YYYY-MM-DD
}

function groupByDate(articles: ArticleType[]) {
  const now = new Date()
  const todayKey = now.toISOString().slice(0, 10)
  const yesterdayKey = new Date(now.getTime() - 86400000).toISOString().slice(0, 10)
  const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10)

  const groups: { label: string; articles: ArticleType[] }[] = []
  const map: Record<string, ArticleType[]> = {}

  for (const article of articles) {
    const key = toDateKey(article.date)
    if (!map[key]) map[key] = []
    map[key].push(article)
  }

  const sortedKeys = Object.keys(map).sort((a, b) => b.localeCompare(a))

  for (const key of sortedKeys) {
    let label: string
    if (key === todayKey) label = '오늘'
    else if (key === yesterdayKey) label = '어제'
    else if (key >= weekAgo) {
      const d = new Date(key)
      label = d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })
    } else if (key === 'older') {
      label = '이전'
    } else {
      const d = new Date(key)
      label = d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
    }
    groups.push({ label, articles: map[key] })
  }

  return groups
}

export default function Home() {
  const [articles, setArticles] = useState<ArticleType[]>([])
  const [sourceStatuses, setSourceStatuses] = useState<SourceStatusType[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>(DEFAULT_KEYWORDS)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetchedAt, setFetchedAt] = useState('')
  const [error, setError] = useState('')
  const [showSources, setShowSources] = useState(false)

  const fetchNews = useCallback(async (kws: string[]) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/news?keywords=${encodeURIComponent(kws.join(','))}`)
      const data = await res.json()
      setArticles(data.articles ?? [])
      setSourceStatuses(data.sourceStatuses ?? [])
      setFetchedAt(data.fetchedAt ?? '')
    } catch {
      setError('뉴스를 불러오는 중 오류가 발생했어요.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNews(selectedTags)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleTag = (tag: string) => {
    const next = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag]
    setSelectedTags(next)
    fetchNews(next)
  }

  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  })

  const [activeFilter, setActiveFilter] = useState<string | null | ''>(null)

  const failedSources = sourceStatuses.filter((s) => !s.ok)

  const searchedArticles = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return articles
    return articles.filter((a) => (a.title + ' ' + a.summary).toLowerCase().includes(q))
  }, [articles, searchTerm])

  const groups = useMemo(() => groupByDate(searchedArticles), [searchedArticles])

  const defaultFilter = useMemo(() => {
    if (groups.length === 0) return null
    const today = groups.find((g) => g.label === '오늘')
    return today ? '오늘' : groups[0].label
  }, [groups])

  const effectiveFilter = activeFilter === null ? defaultFilter : (activeFilter || null)

  const filteredGroups = useMemo(
    () => effectiveFilter ? groups.filter((g) => g.label === effectiveFilter) : groups,
    [groups, effectiveFilter],
  )

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-6xl mx-auto px-6 py-8">

        {/* 인사 + 날짜 */}
        <div className="mb-8">
          <p className="text-2xl font-bold text-gray-900">{getGreeting()}</p>
          <p className="text-gray-400 mt-1 text-sm">{today}</p>
        </div>

        {/* 키워드 설정 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-700">관심 키워드</p>
            <button
              onClick={() => fetchNews(selectedTags)}
              disabled={loading}
              className="text-xs text-blue-600 hover:text-blue-700 disabled:opacity-40 font-medium"
            >
              {loading ? '불러오는 중…' : '새로고침'}
            </button>
          </div>

          {/* 선택형 태그 */}
          <div className="flex flex-wrap gap-2 mb-4">
            {PRESET_TAGS.map((tag) => {
              const active = selectedTags.includes(tag)
              return (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  disabled={loading}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors disabled:opacity-40 ${
                    active
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-50 border border-gray-200 text-gray-500 hover:border-gray-400'
                  }`}
                >
                  {tag}
                </button>
              )
            })}
          </div>

          {/* 검색창 (별개) */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              className="w-full text-sm border border-gray-200 rounded-lg pl-9 pr-3 py-2 outline-none focus:border-blue-400 text-gray-800"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="불러온 글에서 제목·내용 검색"
            />
          </div>
        </div>

        {/* 소스 상태 - hidden */}
        {false && sourceStatuses.length > 0 && (
          <div className="mb-6">
            <button
              onClick={() => setShowSources((v) => !v)}
              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
            >
              <span>소스 현황 {sourceStatuses.filter((s) => s.ok).length}/{sourceStatuses.length}</span>
              {failedSources.length > 0 && (
                <span className="text-red-400">· {failedSources.length}개 오류</span>
              )}
              <span>{showSources ? '▲' : '▼'}</span>
            </button>
            {showSources && (
              <div className="mt-2 bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
                {sourceStatuses.map((s) => (
                  <div key={s.name} className="px-4 py-2.5 flex items-center justify-between">
                    <span className="text-xs text-gray-700 font-medium">{s.name}</span>
                    {s.ok ? (
                      <span className="text-xs text-green-600">{s.count}개 수집</span>
                    ) : (
                      <span className="text-xs text-red-500 truncate max-w-[200px]" title={s.error}>
                        실패 · {s.error?.slice(0, 40)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 rounded-xl p-4 mb-6 text-sm">{error}</div>
        )}

        {loading && (
          <div className="space-y-10">
            {[1, 2].map((g) => (
              <div key={g}>
                <div className="h-4 bg-gray-200 rounded w-16 mb-4 animate-pulse" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden animate-pulse">
                      <div className="aspect-video bg-gray-100" />
                      <div className="p-4">
                        <div className="h-3 bg-gray-100 rounded w-20 mb-3" />
                        <div className="h-4 bg-gray-100 rounded w-full mb-2" />
                        <div className="h-3 bg-gray-100 rounded w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && articles.length === 0 && !error && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-sm">해당 키워드의 최신 글이 없어요.</p>
            <p className="text-xs mt-1">키워드를 비워두면 전체 글을 볼 수 있어요.</p>
          </div>
        )}

        {!loading && groups.length > 0 && (
          <div className="mb-6 flex justify-end">
            <select
              value={effectiveFilter ?? ''}
              onChange={(e) => setActiveFilter(e.target.value === '' ? '' : e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-800 outline-none focus:border-blue-400 cursor-pointer"
            >
              <option value="">전체 보기 ({articles.length}개)</option>
              {groups.map((g) => (
                <option key={g.label} value={g.label}>
                  {g.label} ({g.articles.length}개)
                </option>
              ))}
            </select>
          </div>
        )}

        {!loading && filteredGroups.length > 0 && (
          <div className="space-y-10">
            {filteredGroups.map((group) => (
              <section key={group.label}>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-base font-bold text-gray-900">{group.label}</h2>
                  <span className="text-xs text-gray-400">{group.articles.length}개</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {group.articles.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              </section>
            ))}
            {fetchedAt && (
              <p className="text-xs text-gray-400 text-right">
                {new Date(fetchedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 기준
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
