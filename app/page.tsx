'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ArticleType, SourceStatusType } from './api/news/route'
import ArticleCard from './ArticleCard'

const DEFAULT_KEYWORDS = ['AI', 'UX', '디자인', '개발자', '트렌드']

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return '좋은 아침이에요 ☀️'
  if (h < 18) return '좋은 오후예요'
  return '좋은 저녁이에요 🌙'
}

export default function Home() {
  const [articles, setArticles] = useState<ArticleType[]>([])
  const [sourceStatuses, setSourceStatuses] = useState<SourceStatusType[]>([])
  const [keywords, setKeywords] = useState<string[]>(DEFAULT_KEYWORDS)
  const [inputValue, setInputValue] = useState(DEFAULT_KEYWORDS.join(', '))
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
    fetchNews(keywords)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleApply = () => {
    const kws = inputValue.split(',').map((k) => k.trim()).filter(Boolean)
    setKeywords(kws)
    fetchNews(kws)
  }

  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  })

  const failedSources = sourceStatuses.filter((s) => !s.ok)

  return (
    <div className="min-h-screen bg-gray-50">
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
              onClick={() => fetchNews(keywords)}
              disabled={loading}
              className="text-xs text-blue-600 hover:text-blue-700 disabled:opacity-40 font-medium"
            >
              {loading ? '불러오는 중…' : '새로고침'}
            </button>
          </div>
          <div className="flex gap-2">
            <input
              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 text-gray-800"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApply()}
              placeholder="비워두면 전체 글 표시 / AI, UX, 디자인시스템…"
            />
            <button
              onClick={handleApply}
              disabled={loading}
              className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 disabled:opacity-40 font-medium"
            >
              적용
            </button>
          </div>
          {keywords.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {keywords.map((kw) => (
                <span key={kw} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium">
                  {kw}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 소스 상태 */}
        {sourceStatuses.length > 0 && (
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
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
        )}

        {!loading && articles.length === 0 && !error && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-sm">해당 키워드의 최신 글이 없어요.</p>
            <p className="text-xs mt-1">키워드를 비워두면 전체 글을 볼 수 있어요.</p>
          </div>
        )}

        {!loading && articles.length > 0 && (
          <>
            <p className="text-xs text-gray-400 mb-4">
              {articles.length}개의 글
              {fetchedAt && ` · ${new Date(fetchedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 기준`}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
