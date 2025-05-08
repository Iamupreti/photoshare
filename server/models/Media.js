import mongoose from "mongoose"

const MediaSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  mediaUrl: {
    type: String,
    required: true,
  },
  mediaType: {
    type: String,
    enum: ["image", "video"],
    required: true,
  },
  publicId: {
    type: String,
    required: true,
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  people: {
    type: [String],
    default: [],
  },
  location: {
    type: String,
    trim: true,
  },
  ratings: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      value: {
        type: Number,
        min: 1,
        max: 10,
        required: true,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

MediaSchema.virtual("averageRating").get(function () {
  if (this.ratings.length === 0) return 0

  const sum = this.ratings.reduce((total, rating) => total + rating.value, 0)
  return sum / this.ratings.length
})

MediaSchema.set("toJSON", { virtuals: true })
MediaSchema.set("toObject", { virtuals: true })

const Media = mongoose.model("Media", MediaSchema)

export default Media
