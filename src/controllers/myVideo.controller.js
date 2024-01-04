import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {Video} from "../models/video.model.js"
import { User } from "../models/user.model.js";
import mongoose from "mongoose";
import { getmongoosePaginationOptions } from "../utils/helper.js";

const vidoeCommanAggregation = (req) => {
  return [
    {
      $lookup :{
        from : "comments",
        localField : "_id",
        foreignField : "videoID",
        as : "comments"
      },
    },
    {
     $lookup : {
      from : "likes",
      localField : "_id",
      foreignField : "videoID",
      as : "likes"
     }
    },
    {
      $lookup : {
        from : "likes",
        localField : "_id",
        foreignField : "videoID",
        as : "isLiked",
        pipeline : [
          {
            $match : {
              likedBy : new mongoose.Types.ObjectId(req.user?.id)
            }
          }
        ]
       }
    },
    {
      $addFields : {
        likes : { $size : "$likes"},
        comments : { $size : "$comments"},
        isLiked : {
          $cond : {
            if : {
              $gte : [
                {
                  $size : "$isLiked"
                },
                1
              ]
            },
            then : true , 
            else : false
          }
        }
      }
    }
  ]
}

const uploadVideo = asyncHandler(async(req , res)=>{
  // get videos details from body
  // validation (for empty)
  // get video and check file in local path
  // ulpoad on cloudinary
  // get video thumbnail and check
  // upload on cloudinary
  // check who is the owner of video
  // make entry in db
  // check created video in db
  // return res

  const { title , description} = req.body

  if([title , description].some((field)=>field?.trim() === "")){
    throw new ApiError(400 , "All Filed is required")
  }

  const videoLocalPath = req.files?.videoFile[0]?.path

  if(!videoLocalPath){
    throw new ApiError(400 , "Video file is missing in loacal path")
  }

  const videoFile = await uploadOnCloudinary(videoLocalPath)

  if(!videoFile){
    throw new ApiError(500 , "error while uploading video on cloudinary")
  }
 
  const videoDuration = Math.ceil(videoFile.duration)

  const thumbnailLocalPath = req.files?.thumbnail[0]?.path

  if(!thumbnailLocalPath){
    throw new ApiError(400 , "thumbnail is missing in local path")
  }

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath) 

  if(!thumbnail){
    throw new ApiError(500 , "error while uploading thumbnail on cloudinary")
  }

  const ownerOfVideo = req.user._id

  if (!ownerOfVideo) {
    throw new ApiError(400 , "owner not found")
  } 

  
  const video  = await Video.create({
    title , 
    description,
    videoFile : videoFile.url,
    thumbnail : thumbnail.url,   
    duration : videoDuration ,
   owner : ownerOfVideo
  })
   
  if(!video){
    throw new ApiError(500 , "error while creating a video")
  }

 const createdVideo = await Video.aggregate([
  {
    $match : {
      _id : video._id
    },
  },
  ...vidoeCommanAggregation(req)
 ])

  return res
  .status(200)
  .json(new ApiResponse(201 , createdVideo[0] , "video successfully created "))
  
})

const updateVideo  = asyncHandler(async(req , res)=>{
  const {title , description } = req.body ;

  if([title , description].some((field)=>field?.trim() === "")){
    throw new ApiError(400 , "All Filed is required")
  }

  const {videoID} = req.params ;
  const VideoMongoDbId = new mongoose.Types.ObjectId(videoID)

  const video = await Video.findOne({
    _id : VideoMongoDbId,
    owner : req.user?.id
  }) 

  if (!video) {
    throw new ApiError(404 , "video Does Not Exist")
  }
  const thumbnailLocalPath = req.file?.path

  if(!thumbnailLocalPath){
    throw new ApiError(500 , "thumbnail is missing in localPath")
  }

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

  if(!thumbnail.url){
    throw new ApiError(500 , "error while upload on cloudinary")
  }

  const updatedVideo = await Video.findByIdAndUpdate(
   videoID ,{
    $set : {
      title ,
      description ,
      thumbnail : thumbnail.url
    }
   },
   {new : true}
  )

  const aggregateVideo = await Video.aggregate([
    {
      $match : {
        _id : updatedVideo._id
      }
    },
    ...vidoeCommanAggregation(req)
  ])

  return res
  .status(200)
  .json(new ApiResponse(200 ,aggregateVideo[0], "video update successfully"))

})

const getAllVideos = asyncHandler(async (req , res)=>{
  const {page = 1 , limit = 10} = req.query
  const videoAggregation = Video.aggregate([...vidoeCommanAggregation(req)])

  const videos = await Video.aggregatePaginate(
    videoAggregation ,
    getmongoosePaginationOptions({
      page ,
      limit ,
      customLables : {
        totalvideos : "totalVideos",
        videos : "videos"
      }
    })

  )

  return res 
  .status(200)
  .json(new ApiResponse(200 , videos , "videos fetched successfully"))
})

const getVideosByUserName = asyncHandler(async (req , res)=> {
  const {page = 1 , limit = 10} = req.query ;
  const {userName} = req.params ;

  const user = await User.findOne({
    userName : userName.toLowerCase()
  })

  if(!user){
    throw new ApiError(
      404 , 
      "user with username " + userName + " does not exist "
    )
  }

  const userID = user._id ;

  const videoAggregation = Video.aggregate([
    {
      $match : {
        owner : new mongoose.Types.ObjectId(userID)
      }
    },
    ...vidoeCommanAggregation(req)
  ])

  const videos = await Video.aggregatePaginate(
    videoAggregation ,
    getmongoosePaginationOptions({
      page ,
      limit ,
      customLables : {
        totalvideos : "totalVideos",
        videos : "videos"
      }
    })
  )

  return res
  .status(200)
  .json(new ApiResponse(200 , videos , "User Videos fetched Successfully"))
})

 


export {uploadVideo , updateVideo , getAllVideos , getVideosByUserName}