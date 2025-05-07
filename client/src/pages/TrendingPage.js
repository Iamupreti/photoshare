"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import api from "../utils/api"

const TrendingPage = () => {
  const { user } = useAuth()
  const [trendingMedia, setTrendingMedia] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 1,
  })

  const fetchTrendingMedia = async (page = 1) => {
    try {
      setLoading(true)
      const { data } = await api.get(`/api/trending?page=${page}&limit=${pagination.limit}`)
      setTrendingMedia(data.photos)
      setPagination(data.pagination)
      setLoading(false)
    } catch (err) {
      setError("Failed to load trending media")
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTrendingMedia()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.pages) return
    fetchTrendingMedia(newPage)
  }

  const handleDeletePhoto = async (photoId, e) => {
    e.preventDefault() // Prevent navigation to photo detail
    e.stopPropagation() // Prevent event bubbling

    if (!window.confirm("Are you sure you want to delete this media?")) {
      return
    }

    try {
      await api.delete(`/api/photos/${photoId}`)
      // Update the UI by removing the deleted photo
      setTrendingMedia(trendingMedia.filter((media) => media._id !== photoId))
    } catch (err) {
      setError("Failed to delete media")
    }
  }

  if (loading && trendingMedia.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading trending media...</div>
      </div>
    )
  }

  if (error && trendingMedia.length === 0) {
    return <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Trending Now</h1>
        <p className="text-gray-600 mt-2">Discover what's popular on PhotoShare right now</p>
      </div>

      {trendingMedia.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">No trending media found</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {trendingMedia.map((media) => (
              <div key={media._id} className="relative">
                <Link to={`/photo/${media._id}`} className="block">
                  <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
                    <div className="h-64 overflow-hidden relative">
                      {media.mediaType === "video" ? (
                        <>
                          <video src={media.imageUrl} className="w-full h-full object-cover" muted />
                          <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs">
                            Video
                          </div>
                        </>
                      ) : (
                        <img
                          src={media.imageUrl || "/placeholder.svg"}
                          alt={media.title}
                          className="w-full h-full object-cover"
                        />
                      )}

                      {/* Engagement stats */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                        <div className="flex justify-between text-white text-xs">
                          <div className="flex items-center">
                            <span className="mr-1">💬</span>
                            <span>{media.comments?.length || 0}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="mr-1">⭐</span>
                            <span>{media.averageRating?.toFixed(1) || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-1">{media.title}</h3>
                      <p className="text-gray-600 text-sm mb-2">
                        by {media.user.username} • {new Date(media.createdAt).toLocaleDateString()}
                      </p>
                      {media.location && (
                        <p className="text-gray-500 text-sm">
                          <span className="inline-block mr-1">📍</span>
                          {media.location}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>

                {/* Delete button (only visible to photo owner) */}
                {user._id === media.user._id && (
                  <button
                    onClick={(e) => handleDeletePhoto(media._id, e)}
                    className="absolute top-2 left-2 bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                  >
                    Delete
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center mt-8">
              <nav className="flex items-center">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 rounded-md mr-2 bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                >
                  Previous
                </button>

                <div className="flex items-center">
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                    .filter((page) => {
                      // Show current page, first, last, and pages around current
                      return page === 1 || page === pagination.pages || Math.abs(page - pagination.page) <= 1
                    })
                    .map((page, index, array) => {
                      // Add ellipsis if there are gaps
                      const showEllipsis = index > 0 && page - array[index - 1] > 1

                      return (
                        <div key={page} className="flex items-center">
                          {showEllipsis && <span className="px-2">...</span>}
                          <button
                            onClick={() => handlePageChange(page)}
                            className={`w-8 h-8 flex items-center justify-center rounded-md mx-1 ${
                              pagination.page === page ? "bg-blue-500 text-white" : "bg-gray-200 hover:bg-gray-300"
                            }`}
                          >
                            {page}
                          </button>
                        </div>
                      )
                    })}
                </div>

                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-1 rounded-md ml-2 bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default TrendingPage
