import mongoose from "mongoose"

const ratingSchema = new mongoose.Schema(
  {
    photo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Photo",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
  },
  {
    timestamps: true,
  },
)

// Ensure one rating per user per photo
ratingSchema.index({ photo: 1, user: 1 }, { unique: true })

const Rating = mongoose.model("Rating", ratingSchema)

export default Rating
