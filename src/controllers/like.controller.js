import {likes} from "../models/likes.model.js"
import {Comments} from  "../models/comments.model.js"
import {Video} from "../models/video.model.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {ApiError} from "../utils/ApiError.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {tweets} from "../models/tweet.model.js"

const toggleVideoLike  = asyncHandler(async (req , res)=>{
     const {videoID} = req.params ;
     const video = await Video.findById(videoID)
     
     if (!video) {
        throw new ApiError(404 , "ERROR video not found")
     }

     // see if user already liked the video

     const isAlreadyLiked = await likes.findOne({
        videoID ,
        likedBy : req.user?._id
     })

     if (isAlreadyLiked) {
        // if already liked the dislike the video and remove the record from database

       await likes.findOneAndDelete({
        videoID , 
        likedBy : req.user?._id
       })

       return res
       .status(200)
       .json(new ApiResponse(200 , {isLiked : false} , "unliked Successfully"))
     }
     else {
        await likes.create({
            videoID ,
            likedBy : req.user?._id
        })

       return res
       .status(200)
       .json(new ApiResponse(200 , {isLiked : true} , "Liked Successfully")) 
     }


})

const toggleCommentLike = asyncHandler(async (req , res)=>{
    const {commentID} = req.params ;
    const comment = await Comments.findById(commentID)

    if (!comment) {
        throw new ApiError(404 , "ERROR comment not found")
    }

    const isAlreadyLiked = await likes.findOne({
        commentID , 
        likedBy : req.user?._id
    })

    if (isAlreadyLiked) {
        await likes.findOneAndDelete({
            commentID , 
            likedBy : req.user?._id
        })

        return res
        .status(200)
        .json(new ApiResponse(200  , {isLiked : false} , "Comment Unliked"))
    }
    else {
        await likes.create({
           commentID ,
           likedBy : req.user?._id 
        })

        return res
        .status(200)
        .json(new ApiResponse(200 , {isLiked : true} , "Comment liked"))
    }


})

const toggleTweetLike = asyncHandler(async (req , res)=>{
  const {tweetID} = req.params ; 

  const tweet = await tweets.findById(tweetID)

  if (!tweet) {
    throw new ApiError(404 , "ERROR tweet not found")
  }

  const isAlreadyLiked = await likes.findOne({
    tweetID , 
    likedBy : req.user?._id
  })

  if (isAlreadyLiked) {
    await likes.findOneAndDelete({
        tweetID , 
        likedBy : req.user?._id
    })

    return res
    .status(200)
    .json(new ApiResponse(200 , {isLiked : false} , "tweet unlike successfully"))
  }
  else {
    await likes.create({     
      tweetID , 
      likedBy : req.user?._id
    })
  }

  return res
  .status(200)
  .json(new ApiResponse(200 , {isLiked : true} , "tweet liked successfully"))
})

export {toggleVideoLike , toggleCommentLike , toggleTweetLike}