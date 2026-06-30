'use client'

import { useState, useEffect } from 'react'
import type { ArticleType } from './api/news/route'

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
}

export default function ArticleCard({ article }: { article: ArticleType }) {
  const [thumbnail, setThumbnail] = useState(article.thumbnail)

  useEffect(() => {
    if (thumbnail || !article.link) return
    fetch(`/api/thumbnail?url=${encodeURIComponent(article.link)}`)
      .then((r) => r.json())
      .then((data) => { if (data.thumbnail) setThumbnail(data.thumbnail) })
      .catch(() => {})
  }, [article.link, thumbnail])

  return (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-gray-300 hover:shadow-sm transition-all group"
    >
      <div className="flex">
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
          {article.matched.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {article.matched.map((kw) => (
                <span key={kw} className="px-2 py-0.5 bg-yellow-50 text-yellow-700 text-xs rounded-full">
                  {kw}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex-shrink-0 w-24 h-24 m-4 ml-0 rounded-xl overflow-hidden bg-gray-100">
          {thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbnail}
              alt=""
              className="w-full h-full object-cover"
              onError={() => setThumbnail('')}
            />
          ) : (
            <div className="w-full h-full bg-gray-100" />
          )}
        </div>
      </div>
    </a>
  )
}
