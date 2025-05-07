"use client"

import { useState, useEffect } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import api from "../utils/api"

const PhotoDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [photo, setPhoto] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [comment, setComment] = useState("")
  const [rating, setRating] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const fetchPhoto = async () => {
      try {
        const { data } = await api.get(`/api/photos/${id}`)
        setPhoto(data)
        setLoading(false)
      } catch (err) {
        setError("Failed to load media")
        setLoading(false)
      }
    }

    fetchPhoto()
  }, [id])

  const handleCommentSubmit = async (e) => {
    e.preventDefault()
    if (!comment.trim()) return

    try {
      setSubmitting(true)
      const { data } = await api.post(`/api/photos/${id}/comments`, { text: comment })
      setPhoto({
        ...photo,
        comments: [...photo.comments, data],
      })
      setComment("")
    } catch (err) {
      setError("Failed to add comment")
    } finally {
      setSubmitting(false)
    }
  }

  const handleRatingSubmit = async () => {
    if (rating === 0) return

    try {
      setSubmitting(true)
      const { data } = await api.post(`/api/photos/${id}/ratings`, { rating })
      setPhoto({
        ...photo,
        ratings: [...photo.ratings, data],
        averageRating: data.newAverage,
      })
    } catch (err) {
      console.log(err)
      setError("Already rated this media")
      console.log(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeletePhoto = async () => {
    if (!window.confirm("Are you sure you want to delete this media?")) {
      return
    }

    try {
      setDeleting(true)
      await api.delete(`/api/photos/${id}`)
      navigate("/feed")
    } catch (err) {
      setError("Failed to delete media")
      setDeleting(false)
    }
  }

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) {
      return
    }

    try {
      await api.delete(`/api/comments/${commentId}`)
      // Update the UI by removing the deleted comment
      setPhoto({
        ...photo,
        comments: photo.comments.filter(comment => comment._id !== commentId)
      })
    } catch (err) {
      setError("Failed to delete comment")
    }
  }

  // Check if user is the creator of the photo
  const isPhotoOwner = photo && user && photo.user._id === user._id

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

  if (!photo) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">Media not found</p>
      </div>
    )
  }

  // Check if user has already rated this photo
  const hasRated = photo.ratings.some((r) => r.user === user._id)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg overflow-hidden shadow-lg">
        {/* Photo header */}
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex items-center">
            <Link to={`/profile/${photo.user._id}`} className="font-medium text-gray-800 hover:underline">
              {photo.user.username}
            </Link>
            <span className="mx-2 text-gray-400">•</span>
            <span className="text-gray-500 text-sm">{new Date(photo.createdAt).toLocaleDateString()}</span>
          </div>
          
          {/* Delete photo button (only visible to photo owner) */}
          {isPhotoOwner && (
            <button
              onClick={handleDeletePhoto}
              disabled={deleting}
              className="text-red-500 hover:text-red-700 disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          )}
        </div>

        {/* Media content */}
        <div className="relative">
          {photo.mediaType === "video" ? (
            <video 
              src={photo.imageUrl} 
              controls
              className="w-full max-h-[600px] object-contain bg-black"
            />
          ) : (
            <img
              src={photo.imageUrl || "/placeholder.svg"}
              alt={photo.title}
              className="w-full max-h-[600px] object-contain bg-black"
            />
          )}
        </div>

        {/* Photo details */}
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{photo.title}</h1>

          {photo.caption && <p className="text-gray-600 mb-4">{photo.caption}</p>}

          {photo.location && (
            <p className="text-gray-500 text-sm mb-4">
              <span className="inline-block mr-1">📍</span>
              {photo.location}
            </p>
          )}

          {photo.people && photo.people.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-1">People in this {photo.mediaType || "photo"}:</p>
              <div className="flex flex-wrap gap-2">
                {photo.people.map((person, index) => (
                  <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                    {person}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Rating section */}
          <div className="mt-6 mb-8">
            <div className="flex items-center mb-2">
              <span className="text-yellow-500 mr-2">★</span>
              <span className="font-medium">
                {photo.averageRating ? photo.averageRating.toFixed(1) : "No ratings yet"}
              </span>
              <span className="text-gray-500 ml-2">
                ({photo.ratings.length} {photo.ratings.length === 1 ? "rating" : "ratings"})
              </span>
            </div>

            {!hasRated && (
              <div className="flex items-center">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`text-2xl ${rating >= star ? "text-yellow-500" : "text-gray-300"} focus:outline-none`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleRatingSubmit}
                  disabled={rating === 0 || submitting}
                  className="ml-4 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                >
                  Rate
                </button>
              </div>
            )}
          </div>

          {/* Comments section */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Comments</h3>

            {photo.comments.length === 0 ? (
              <p className="text-gray-500 italic">No comments yet</p>
            ) : (
              <div className="space-y-4">
                {photo.comments.map((comment) => (
                  <div key={comment._id} className="border-b pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <Link to={`/profile/${comment.user._id}`} className="font-medium text-gray-800 hover:underline">
                          {comment.user.username}
                        </Link>
                        <span className="mx-2 text-gray-400">•</span>
                        <span className="text-gray-500 text-sm">{new Date(comment.createdAt).toLocaleDateString()}</span>
                      </div>
                      
                      {/* Delete comment button (visible to comment author or photo owner) */}
                      {(user._id === comment.user._id || isPhotoOwner) && (
                        <button
                          onClick={() => handleDeleteComment(comment._id)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <p className="text-gray-700">{comment.text}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Add comment form */}
            <form onSubmit={handleCommentSubmit} className="mt-6">
              <textarea
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Add a comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
              ></textarea>
              <button
                type="submit"
                disabled={submitting}
                className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
              >
                {submitting ? "Posting..." : "Post Comment"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PhotoDetail