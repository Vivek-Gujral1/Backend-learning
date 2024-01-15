import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { likes } from "../models/likes.model.js";
import mongoose from "mongoose";
import { getmongoosePaginationOptions } from "../utils/helper.js";

const videoCommanAggregation = (req) => {
  return [
    {
      $lookup: {
        from: "comments",
        localField: "_id",
        foreignField: "videoID",
        as: "comments",
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "videoID",
        as: "likes",
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "videoID",
        as: "isLiked",
        pipeline: [
          {
            $match: {
              likedBy: new mongoose.Types.ObjectId(req.user?.id),
            },
          },
        ],
      },
    },
    {
      $addFields: {
        likes: { $size: "$likes" },
        comments: { $size: "$comments" },
        isLiked: {
          $cond: {
            if: {
              $gte: [
                {
                  $size: "$isLiked",
                },
                1,
              ],
            },
            then: true,
            else: false,
          },
        },
      },
    },
  ];
};

const publishAVideo = asyncHandler(async (req, res) => {
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

  const { title, description } = req.body;

  if ([title, description].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All Filed is required");
  }

  const videoLocalPath = req.files?.videoFile[0]?.path;

  if (!videoLocalPath) {
    throw new ApiError(400, "Video file is missing in loacal path");
  }

  const videoFile = await uploadOnCloudinary(videoLocalPath);

  if (!videoFile) {
    throw new ApiError(500, "error while uploading video on cloudinary");
  }

  const videoDuration = Math.ceil(videoFile.duration);

  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "thumbnail is missing in local path");
  }

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!thumbnail) {
    throw new ApiError(500, "error while uploading thumbnail on cloudinary");
  }

  const ownerOfVideo = req.user._id;

  if (!ownerOfVideo) {
    throw new ApiError(400, "owner not found");
  }

  const video = await Video.create({
    title,
    description,
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    duration: videoDuration,
    owner: ownerOfVideo,
  });

  if (!video) {
    throw new ApiError(500, "error while creating a video");
  }

  const createdVideo = await Video.aggregate([
    {
      $match: {
        _id: video._id,
      },
    },
    ...videoCommanAggregation(req),
  ]);

  return res
    .status(200)
    .json(new ApiResponse(201, createdVideo[0], "video successfully created "));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if ([title, description].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All Filed is required");
  }

  const { videoID } = req.params;
  const VideoMongoDbId = new mongoose.Types.ObjectId(videoID);

  const video = await Video.findOne({
    _id: VideoMongoDbId,
    owner: req.user?.id,
  });

  if (!video) {
    throw new ApiError(404, "video Does Not Exist");
  }
  const thumbnailLocalPath = req.file?.path;

  if (!thumbnailLocalPath) {
    throw new ApiError(500, "thumbnail is missing in localPath");
  }

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!thumbnail.url) {
    throw new ApiError(500, "error while upload on cloudinary");
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoID,
    {
      $set: {
        title,
        description,
        thumbnail: thumbnail.url,
      },
    },
    { new: true }
  );

  const aggregateVideo = await Video.aggregate([
    {
      $match: {
        _id: updatedVideo._id,
      },
    },
    ...videoCommanAggregation(req),
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, aggregateVideo[0], "video update successfully"));
});

const getVideosBySearchInput = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query,
    sortType = "ascending",
    sortBy = "views",
  } = req.query;

  const owner = await User.aggregate([
    {
      $match: {
        userName: query,
      },
    },
    {
      $project: {
        fullName: 1,
        userName: 1,
        avatar: 1,
        coverImage: 1,
      },
    },
  ]);
  console.log(owner);

  let OwnerVideos;

  if (owner.length) {
    const ownerID = owner[0]._id;

    OwnerVideos = await Video.aggregate([
      {
        $match: {
          owner: new mongoose.Types.ObjectId(ownerID),
        },
      },
      ...videoCommanAggregation(req),
    ]);
  }

  const TitleVideos = await Video.aggregate([
    {
      $match: {
        title: query,
      },
    },
    ...videoCommanAggregation(req),
  ]);

  const FinalVideos = [...OwnerVideos, ...TitleVideos];

  console.log(FinalVideos);

  return res
    .status(200)
    .json(new ApiResponse(200, FinalVideos, "videos fetched succesfully"));
});

const getMyVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const videoAggregation = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    ...videoCommanAggregation(req),
  ]);

  const videos = await Video.aggregatePaginate(
    videoAggregation,
    getmongoosePaginationOptions({
      page,
      limit,
      customLables: {
        totalVideos: "totalVideos",
        videos: "videos",
      },
    })
  );

  return res
    .status(200)
    .json(new ApiResponse(200, videos, " my videos fetched successfully"));
});

const getVideoById = asyncHandler(async (req , res)=>{
  const {videoID} = req.params ;

  const video = await Video.aggregate([
    {
      $match : {
        _id : videoID
      }
    },
    ...videoCommanAggregation(req)
  ])

  if (!video.length) {
    throw new ApiError(404 , "video cannot found")
  }
  return res
  .status(200)
  .json(new ApiResponse(200 , video[0] , "video fetched successfully"))
})

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoID } = req.params;

  const video = await Video.findOneAndDelete({
    _id: videoID,
    owner: req.user._id,
  });

  if (!video) {
    throw new ApiError(404, "Video does not exist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "video deleted Sucessfully"));
});

const togglePublishStatus = asyncHandler(async (req , res)=>{
  const {videoID} = req.params ; 
  const {status} = req.query ; 
  const owner  = req.user?._id

  // if status  = public then true
  // if status  = private then false

  // BY default status is public it means true
  
  if (status === "private") {
   const PrivateVideo = await Video.aggregate([
     {
      $match : {
        owner : new mongoose.Types.ObjectId(owner) ,
        _id :  new mongoose.Types.ObjectId(videoID)
      }
     },{
      $set : {
        isPublished : false
      }
     },
     ...videoCommanAggregation(req)
   ])
   console.log(PrivateVideo);

    if (!PrivateVideo) {
      throw new ApiError(404 , "video not found")
    }

    return res
    .status(200)
    .json(new ApiResponse(200 ,PrivateVideo[0] , "video private successfully"))

  }
  



  
})



export {
  publishAVideo,
  updateVideo,
  getVideosBySearchInput , 
  getMyVideos,
  deleteVideo,
  getVideoById , 
  togglePublishStatus
};
