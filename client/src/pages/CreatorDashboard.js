"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import api from "../utils/api"

const CreatorDashboard = () => {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    caption: "",
    location: "",
    people: "",
    media: null,
  })
  const [preview, setPreview] = useState(null)
  const [mediaType, setMediaType] = useState(null)

  useEffect(() => {
    const fetchCreatorPhotos = async () => {
      try {
        const { data } = await api.get("/api/photos/my-photos")
        setPhotos(data)
        setLoading(false)
      } catch (err) {
        setError("Failed to load your photos")
        setLoading(false)
      }
    }

    fetchCreatorPhotos()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleMediaChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Check file size
      const isVideo = file.type.startsWith("video/")
      const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024 // 50MB for videos, 10MB for images
      
      if (file.size > maxSize) {
        setError(`File size exceeds the limit (${isVideo ? '50MB' : '10MB'})`)
        return
      }
      
      setFormData({
        ...formData,
        media: file,
      })

      setMediaType(isVideo ? "video" : "image")

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.media) {
      setError("Please select an image or video to upload")
      return
    }

    try {
      setUploading(true)
      setError("")

      // Create form data for file upload
      const photoData = new FormData()
      photoData.append("media", formData.media)
      photoData.append("title", formData.title)
      photoData.append("caption", formData.caption)
      photoData.append("location", formData.location)

      // Handle people array
      if (formData.people) {
        const peopleArray = formData.people.split(",").map((person) => person.trim())
        photoData.append("people", JSON.stringify(peopleArray))
      }

      const { data } = await api.post("/api/photos", photoData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      // Add the new photo to the list
      setPhotos([data, ...photos])

      // Reset form
      setFormData({
        title: "",
        caption: "",
        location: "",
        people: "",
        media: null,
      })
      setPreview(null)
      setMediaType(null)

      // Reset file input
      document.getElementById("media-upload").value = ""
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload media")
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (photoId) => {
    if (!window.confirm("Are you sure you want to delete this media?")) {
      return
    }

    try {
      await api.delete(`/api/photos/${photoId}`)
      setPhotos(photos.filter((photo) => photo._id !== photoId))
    } catch (err) {
      setError("Failed to delete media")
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Creator Dashboard</h1>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

      {/* Upload form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Upload New Photo or Video</h2>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
                  Title *
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="title"
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="caption">
                  Caption
                </label>
                <textarea
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="caption"
                  name="caption"
                  rows="3"
                  value={formData.caption}
                  onChange={handleChange}
                ></textarea>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="location">
                  Location
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="location"
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="people">
                  People (comma separated)
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="people"
                  type="text"
                  name="people"
                  value={formData.people}
                  onChange={handleChange}
                  placeholder="John, Jane, etc."
                />
              </div>
            </div>

            <div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="media-upload">
                  Photo or Video *
                </label>
                <input
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  id="media-upload"
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleMediaChange}
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Max size: Images - 10MB, Videos - 50MB
                </p>
              </div>

              {preview && (
                <div className="mt-4 border rounded-lg overflow-hidden">
                  {mediaType === "image" ? (
                    <img src={preview || "/placeholder.svg"} alt="Preview" className="w-full h-48 object-cover" />
                  ) : (
                    <video src={preview} controls className="w-full h-48 object-contain" />
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6">
            <button
              type="submit"
              disabled={uploading}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full md:w-auto disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Upload Media"}
            </button>
          </div>
        </form>
      </div>

      {/* Photos list */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Your Media</h2>

        {loading ? (
          <div className="text-center py-10">
            <p className="text-gray-500">Loading your media...</p>
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-lg shadow-md">
            <p className="text-gray-500">You haven't uploaded any photos or videos yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {photos.map((photo) => (
              <div key={photo._id} className="bg-white rounded-lg overflow-hidden shadow-md">
                <div className="h-48 overflow-hidden">
                  {photo.mediaType === "video" ? (
                    <video 
                      src={photo.imageUrl} 
                      className="w-full h-full object-cover" 
                      controls
                    />
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
                  <p className="text-gray-500 text-sm mb-2">{new Date(photo.createdAt).toLocaleDateString()}</p>

                  <div className="flex items-center mt-4">
                    <Link to={`/photo/${photo._id}`} className="text-blue-500 hover:text-blue-700 mr-4">
                      View
                    </Link>
                    <button onClick={() => handleDelete(photo._id)} className="text-red-500 hover:text-red-700">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default CreatorDashboard