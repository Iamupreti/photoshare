"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import api from "../utils/api"

const Feed = () => {
  const { user } = useAuth()
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const { data } = await api.get("/api/photos")
        setPhotos(data)
        setLoading(false)
      } catch (err) {
        setError("Failed to load media")
        setLoading(false)
      }
    }

    fetchPhotos()
  }, [])

  const handleSearch = async (e) => {
    e.preventDefault()

    try {
      setLoading(true)
      const { data } = await api.get(`/api/photos/search?term=${searchTerm}`)
      setPhotos(data)
    } catch (err) {
      setError("Search failed")
    } finally {
      setLoading(false)
    }
  }

  const resetSearch = async () => {
    try {
      setLoading(true)
      setSearchTerm("")
      const { data } = await api.get("/api/photos")
      setPhotos(data)
    } catch (err) {
      setError("Failed to reset search")
    } finally {
      setLoading(false)
    }
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
      setPhotos(photos.filter(photo => photo._id !== photoId))
    } catch (err) {
      setError("Failed to delete media")
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading media...</div>
      </div>
    )
  }

  if (error) {
    return <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>
  }

  return (
    <div>
      <div className="mb-8">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Search by title, caption, or location..."
            className="flex-grow px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg">
            Search
          </button>
          {searchTerm && (
            <button
              type="button"
              onClick={resetSearch}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"
            >
              Reset
            </button>
          )}
        </form>
      </div>

      {photos.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">No media found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {photos.map((photo) => (
            <div key={photo._id} className="relative">
              <Link to={`/photo/${photo._id}`} className="block">
                <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
                  <div className="h-64 overflow-hidden relative">
                    {photo.mediaType === "video" ? (
                      <>
                        <video
                          src={photo.imageUrl}
                          className="w-full h-full object-cover"
                          muted
                        />
                        <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs">
                          Video
                        </div>
                      </>
                    ) : (
                      <img
                        src={photo.imageUrl || "/placeholder.svg"}
                        alt={photo.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">{photo.title}</h3>
                    <p className="text-gray-600 text-sm mb-2">
                      by {photo.user.username} • {new Date(photo.createdAt).toLocaleDateString()}
                    </p>
                    {photo.location && (
                      <p className="text-gray-500 text-sm">
                        <span className="inline-block mr-1">📍</span>
                        {photo.location}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
              
              {/* Delete button (only visible to photo owner) */}
              {user._id === photo.user._id && (
                <button
                  onClick={(e) => handleDeletePhoto(photo._id, e)}
                  className="absolute top-2 left-2 bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                >
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Feed