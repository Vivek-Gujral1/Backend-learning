import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import {Comments} from "../models/comments.model.js";
import {getmongoosePaginationOptions} from "../utils/helper.js"

const addComment = asyncHandler(async (req , res)=>{
 const {content} = req.body;
 const {videoID} = req.params;
   
 const comment = await Comments.create({
    content,
    commentBy : req.user?._id,
    videoID
 })
  
 if(!comment){
    throw new ApiError(500 , "error while creating a comment")
 }

 return res
 .status(201)
 .json(new ApiResponse(201 , comment , "comment added successfully"))
})

const getVideoComments = asyncHandler(async(req , res)=>{
   const {videoID} = req.params ;
   const {page = 1 , limit = 10} = req.query ;
  
   const commentAggregation = Comments.aggregate([
      {
         $match : {
            videoID : new mongoose.Types.ObjectId(videoID)
         }
      },
      {
         $lookup : {
            from : "likes" ,
            localField : "_id" ,
            foreignField : "commentID",
            as : "likes"
         }
      } ,
      {
         $lookup : {
            from : "likes",
            localField : "_id" ,
            foreignField : "commentID" ,
            as : "isLiked" ,
            pipeline : [
               {
                  $match : {
                     likedBy : new mongoose.Types.ObjectId(req.user?._id)
                  }
               }
            ]
         }
      } ,
      {
         $addFields : {
            likes : { $size : "$likes"},
            isLiked : {
               $cond : {
                  if : {
                     $gte : [
                        {
                           $size : "$isLiked"
                        },
                        1 ,
                     ]
                  },
                  then : true ,
                  else : false
               }
            }
         }
      }
   ]) ;

   const comments  = await Comments.aggregatePaginate(
      commentAggregation ,
      getmongoosePaginationOptions({
         page ,
         limit ,
         customLables : {
            totalDocs : "totalComments",
            docs : "comments",
         },
      })
   );

   return res
   .status(200)
   .json(new ApiResponse(200 , comments , "video comments fetched successfully"))
})

const deleteComment = asyncHandler(async(req , res)=>{
   const {commentID} = req.params 

   const deletedComment = await Comments.findOneAndDelete({
      _id : new mongoose.Types.ObjectId(commentID),
      commentBy : req.user?._id
   })

   if(!deletedComment){
      throw new ApiError(404 , "comment is not find")
   }

   return res 
   .status(200)
   .json(new ApiResponse(200 , {deletedComment} , "comment deleted successfully"))
})

const updateComment = asyncHandler(async(req , res)=>{
   const {commentID} = req.params ;
   const {content} = req.body

   const updatedComment = await Comments.findOneAndUpdate(
      {
         _id : new mongoose.Types.ObjectId(commentID),
         commentBy : req.user?._id
      },
      {
         $set : {content}
      },
      {new : true}
   )

   if(!updatedComment){
      throw new ApiError(404 , "comment not found for update")
   }

   return res
   .status(200)
   .json(new ApiResponse(200 , updatedComment , "comment update successfully"))
})
export {addComment , getVideoComments , deleteComment , updateComment}
