import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Comments } from "../models/comments.model.js";


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
export {addComment}
