import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken";

const generateAccessTokenAndRefreshToken = async(userId)=>{
   try {
        const user =  await User.findById(userId)
        const accessToken =  user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
       await user.save({validateBeforeSave : false})

       return{ accessToken , refreshToken}

   } catch (error) {
    throw new ApiError(500 , "Something Went wrong While genrating Refresh And Access token")
   }
}

const registerUser = asyncHandler( async (req , res)=>{
   // get user details from frontend
   // validation - not empty
   // check if user already exist : username and email
   // check for images : check for avatar
   // upload them to cloudianary
   // create user object -- make entry in db
   // remove password and refresh token from response
   // check for user creation
   // return res

  const {userName ,email , fullName , password}  = req.body
//  console.log("email" , email , );
//  console.log("password" , password);

  if([fullName  , email , userName , password ].some((field)=> field?.trim() === "")){
    throw new ApiError(400 , "All field is required")
  }

 const existedUser  = await User.findOne({
     $or: [{ userName } , { email }]
  }) 

  if(existedUser){
    throw new ApiError(409 , "USer with userName or email alrady exists ")
  }
 
   const avatarlocalPath = req.files?.avatar[0]?.path ; 
 // const coverImageLocalpath = req.files?.coverImage[0]?.path ;

 let coverImageLocalpath ; 

 if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
  coverImageLocalpath = req.files.coverImage[0].path
 }
   
  if(!avatarlocalPath){
    throw new ApiError(400 , "Avatar image is required")
  }

 const avatar =  await uploadOnCloudinary(avatarlocalPath)
 const coverImage = await uploadOnCloudinary(coverImageLocalpath)

  if(!avatar){
    throw new ApiError(400 , "Avatar image ERROR on Upload on Clodinary")
  }

  const user = await User.create({
    fullName , 
    avatar : avatar.url ,
    coverImage : coverImage?.url || "",
    email ,
    userName : userName.toLowerCase() ,
    password
  })

  const cretedUser =  await User.findById(user._id).select(
    "-password -refreshToken"
  )
   
  if(!cretedUser) {
    throw new ApiError(500 , "Something went Wrong in registering a user in Database")
  }

  return res.status(201).json(
    new ApiResponse(200 , cretedUser , "user registered Successfully")
  )


})

const loginUser = asyncHandler(async(req , res)=>{
  // req body data
  // email clarificaton
  // find the user
  // password check
  // acess and refresh token 
  // send cookies 
  // response

  const {email , password } = req.body ; 
 

  if(!email){
    throw new ApiError(400 , "email  is required")
  }
  
  const user  = await User.findOne({email})
 
   if(!user){
    throw new ApiError(404 , "user does not exist")
   }

  const isPasswordValid  = await user.isPasswordCorrect(password)

  if(!isPasswordValid){
    throw new ApiError(404 , "Password incorrect")
  }

  const {accessToken , refreshToken} =  await generateAccessTokenAndRefreshToken(user._id)

  const loggedInUSer = await User.findById(user._id).select("-password -refreshToken")
   
  const options = {
    httpOnly : true , 
    secure : true
  }
   
  return res
  .status(200)
  .cookie("accessToken" , accessToken , options)
  .cookie("refreshToken" , refreshToken , options)
  .json(
    new ApiResponse( 
      200 , 
      {
        user : loggedInUSer , accessToken , refreshToken  
      }  , 
       "User logged in Successfuly"
      )
  )
   
})

const logoutUser = asyncHandler(async(req , res)=>{
   await User.findByIdAndUpdate(
    req.user._id , 
    {
      $set: {
        refreshToken : undefined
      }
    },
    {
      new: true
    }
   ) 

   const options = {
    httpOnly : true , 
    secure : true
  }

   return res 
   .status(200)
   .clearCookie("accessToken" , options)
   .clearCookie("refreshToken" , options)
   .json(new ApiResponse(200 , {} , "User Logout"))
})

const refreshAccessToken = asyncHandler(async (req , res )=>{

   const incomingRefreshToken  = req.cookies.refreshToken || req.body.refreshToken

   if (!incomingRefreshToken) {
      throw new ApiError(401 , "unothrized request")
   }

 try {
  const decodedToken = jwt.verify(incomingRefreshToken , process.env.REFRESH_TOKEN_SECRET)
 
  const user = User.findById(decodedToken?._id)
 
  if (!user) {
   throw new ApiError(401 , "Invalid refresh Token")
  }
 
   if (incomingRefreshToken !== user?.refreshToken) {
     throw new ApiError(401 , "Refresh Token is expired or used")
   }
 
   const options = {
     httpOnly : true ,
     secure :  true
   }
 
  const {accessToken ,newRefreshToken } =  await generateAccessTokenAndRefreshToken(user._id)
 
    return res
    .status(200)
    .cookie("accessToken" , accessToken , options)
    .cookie("refreshToken" , newRefreshToken , options)
    .json(
     new ApiResponse(
       200 ,
       {accessToken , refreshToken : newRefreshToken},
       "Aceess token refreshed")
    )
 } catch (error) {
  throw new ApiError(401 , error?.message || "Invalid refresh token" )
 }

})

const changeCurrentPassword = asyncHandler(async (req , res)=>{
   const {oldPassword , newPassword} = req.body

   const user =  await User.findById(req.user?._id) 
  const isPasswordCorrect =  await user.isPasswordCorrect(oldPassword) 

  if(!isPasswordCorrect){
    new ApiError(400 , "old Password incorect")
  }
   
  user.password = newPassword

  user.save({validateBeforeSave : false})

  return res
  .status(200)
  .json(new ApiResponse(200 , {} , "password changed successfuly"))
})

const getCurrentUser = asyncHandler(async (req , res)=>{
  return res
  .status(200)
  .json(new ApiResponse(200 , req.user , "current user fetched successfully"))
})

const updateAccountDetails = asyncHandler(async (req ,res)=>{
  const {fullName , userName} = req.body

  if (!fullName || !userName) {
    throw new ApiError(400 , "ALl fiels are Required")
  }

  const user = User.findByIdAndUpdate(req.user?._id , 
    {
       $set : {
        fullName ,
        userName
       }
    } ,
    {
      new : true
    }).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200 , user , "Account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async(req , res)=>{
 const avatarLocalPath  =  req.file?.path

  if (!avatarLocalPath) {
  throw new ApiError(400 , "Avatar file in local Path is missing ")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)
 
  if (!avatar.url) {
    throw new ApiError(500 , "Error while Uploading on cloudinary ")
  }

 const user =   await User.findByIdAndUpdate(req.user?._id ,
    {
      $set : {
        avatar  : avatar.url
      }
    } ,
    {new : true}).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200 , user  , "avatar image Update Successfully " ))

})

const updateCoverImage  = asyncHandler(async(req , res)=>{
  const coverImageLocalPath = req.file?.path

  if (!coverImageLocalPath) {
    throw new ApiError(400 , "coverImage file in local Path is missing")
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if(!coverImage.url){
    throw new ApiError(500 , "Error while Uploading coverImage on cloudinary")
  }

  const user =  await User.findByIdAndUpdate(req.user?._id ,
    {
      $set : {
        coverImage : coverImage.url
      }
    } ,
    {new : true}).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200 , user , "coverImage update Successfully"))

})

const getUserChannelProfile = asyncHandler(async (req , res)=>{
   const {userName}  = req.params

   if (!userName?.trim()) {
    throw new ApiError(400 , "username is missing")
   }

  const channel =  await  User.aggregate([
    {
      $match :{
        userName : userName?.toLowerCase()
      }
    },
    {
      $lookup :{
        from : "subscriptions",
        localField : "_id",
        foreignField : "channel",
        as : "Subscribers"
      }
    },
    {
      $lookup :{
        from : "subscriptions",
        localField : "_id",
        foreignField : "subscriber",
        as : "subscribedTo"
      }
    },
    {
      $addFields :{
        subscribersCount : {
          $size : "$Subscribers"
        },
        channnelSubscribedTo :{
          $size : "$subscribedTo"
        },
        isSubscribed : {
          $cond : {
            if : {$in : [req.user?._id , "$Subscribers.subscriber"]} ,
            then : true ,
            else : false
          }
        }
      }
    },
    {
      $project :{
        fullName : 1 ,
        userName : 1 ,
        email : 1 ,
        avatar : 1 ,
        coverImage : 1 ,
        subscribersCount : 1 ,
        channnelSubscribedTo : 1 ,
        isSubscribed : 1
      }
    }
  ])

  if(!channel?.length){
    throw new ApiError(404 , "channel doesnot exist")
  }
 // todo : check the value of channel console.log(channel);

  return res 
  .status(200)
  .json(
    new ApiResponse(200 , channel[0] , "user Channnel fetched Successfully")
  )

})
export {registerUser , loginUser  , logoutUser , refreshAccessToken , changeCurrentPassword , getCurrentUser , updateAccountDetails , updateUserAvatar , updateCoverImage , getUserChannelProfile}