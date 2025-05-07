"use client"

import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import api from "../utils/api"

const Profile = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: profileData } = await api.get(`/api/users/${id}`)
        setProfile(profileData)

        const { data: photosData } = await api.get(`/api/photos/user/${id}`)
        setPhotos(photosData)

        setLoading(false)
      } catch (err) {
        setError("Failed to load profile")
        setLoading(false)
      }
    }

    fetchProfile()
  }, [id])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading profile...</div>
      </div>
    )
  }

  if (error) {
    return <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>
  }

  if (!profile) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">Profile not found</p>
      </div>
    )
  }

  const isOwnProfile = user._id === profile._id

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row items-center md:items-start">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 text-2xl font-bold mb-4 md:mb-0 md:mr-6">
            {profile.username.charAt(0).toUpperCase()}
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">{profile.username}</h1>
            <p className="text-gray-600 mb-2">{profile.email}</p>
            <p className="text-gray-500 mb-4">{profile.role === "creator" ? "Creator" : "Consumer"} Account</p>

            <div className="text-sm text-gray-500">
              <p>Joined {new Date(profile.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Photos section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">{isOwnProfile ? "Your Photos" : `${profile.username}'s Photos`}</h2>

        {profile.role === "consumer" ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-gray-500">
              {isOwnProfile
                ? "You have a consumer account and cannot upload photos."
                : "This user has a consumer account and cannot upload photos."}
            </p>
          </div>
        ) : photos.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-gray-500">
              {isOwnProfile ? "You haven't uploaded any photos yet." : "This user hasn't uploaded any photos yet."}
            </p>

            {isOwnProfile && (
              <Link
                to="/dashboard"
                className="inline-block mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
              >
                Go to Dashboard
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {photos.map((photo) => (
              <Link to={`/photo/${photo._id}`} key={photo._id} className="block">
                <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
                  <div className="h-48 overflow-hidden">
                    <img
                      src={photo.imageUrl || "/placeholder.svg"}
                      alt={photo.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">{photo.title}</h3>
                    <p className="text-gray-500 text-sm">{new Date(photo.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Profile
