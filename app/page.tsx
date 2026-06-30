'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ArticleType } from './api/news/route'

const DEFAULT_KEYWORDS = ['AI', 'UX', '디자인', '개발자', '트렌드']

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return '좋은 아침이에요 ☀️'
  if (h < 18) return '좋은 오후예요'
  return '좋은 저녁이에요 🌙'
}

export default function Home() {
  const [articles, setArticles] = useState<ArticleType[]>([])
  const [keywords, setKeywords] = useState<string[]>(DEFAULT_KEYWORDS)
  const [inputValue, setInputValue] = useState(DEFAULT_KEYWORDS.join(', '))
  const [loading, setLoading] = useState(false)
  const [fetchedAt, setFetchedAt] = useState('')
  const [error, setError] = useState('')

  const fetchNews = useCallback(async (kws: string[]) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/news?keywords=${encodeURIComponent(kws.join(','))}`)
      const data = await res.json()
      setArticles(data.articles ?? [])
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">모닝 브리핑</h1>
            <p className="text-xs text-gray-400 mt-0.5">{today}</p>
          </div>
          <button
            onClick={() => fetchNews(keywords)}
            disabled={loading}
            className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-40 font-medium"
          >
            {loading ? '불러오는 중…' : '새로고침'}
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-8">
          <p className="text-2xl font-bold text-gray-900">{getGreeting()}</p>
          <p className="text-gray-500 mt-1 text-sm">오늘의 IT·디자인 트렌드를 모아왔어요.</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-8">
          <p className="text-sm font-medium text-gray-700 mb-3">관심 키워드</p>
          <div className="flex gap-2">
            <input
              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 text-gray-800"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApply()}
              placeholder="AI, UX, 디자인시스템, 리액트…"
            />
            <button
              onClick={handleApply}
              disabled={loading}
              className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 disabled:opacity-40 font-medium"
            >
              적용
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {keywords.map((kw) => (
              <span key={kw} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium">
                {kw}
              </span>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 rounded-xl p-4 mb-6 text-sm">{error}</div>
        )}

        {loading && (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse">
                <div className="h-3 bg-gray-100 rounded w-20 mb-3" />
                <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-full mb-1" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        )}

        {!loading && articles.length === 0 && !error && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-sm">해당 키워드의 최신 글이 없어요.</p>
            <p className="text-xs mt-1">키워드를 바꿔 다시 시도해보세요.</p>
          </div>
        )}

        {!loading && articles.length > 0 && (
          <>
            <p className="text-xs text-gray-400 mb-4">
              {articles.length}개의 글을 찾았어요
              {fetchedAt && ` · ${new Date(fetchedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 기준`}
            </p>
            <div className="space-y-4">
              {articles.map((article) => (
                <a
                  key={article.id}
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-gray-300 hover:shadow-sm transition-all group"
                >
                  <div className="flex gap-0">
                    {/* 텍스트 영역 */}
                    <div className="flex-1 p-5 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-gray-500">{article.source}</span>
                        {article.date && (
                          <>
                            <span className="text-gray-200">·</span>
                            <span className="text-xs text-gray-400">{formatDate(article.date)}</span>
                          </>
                        )}
                      </div>
                      <h2 className="text-sm font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors leading-snug">
                        {article.title}
                      </h2>
                      {article.summary && (
                        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{article.summary}</p>
                      )}
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {article.matched.map((kw) => (
                          <span key={kw} className="px-2 py-0.5 bg-yellow-50 text-yellow-700 text-xs rounded-full">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                    {/* 썸네일 */}
                    {article.thumbnail && (
                      <div className="flex-shrink-0 w-24 h-24 m-4 ml-0 rounded-xl overflow-hidden bg-gray-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={article.thumbnail}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                        />
                      </div>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
