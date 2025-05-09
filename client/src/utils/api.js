import axios from "axios"

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "https://photoshare-server-b8fjbshmfxb8dbgh.uksouth-01.azurewebsites.net/",
  withCredentials: true,
})

const token = localStorage.getItem("token")
if (token) {
  api.defaults.headers.common["Authorization"] = `Bearer ${token}`
}

export default api
