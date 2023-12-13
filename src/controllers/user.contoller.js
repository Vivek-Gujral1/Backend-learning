import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"

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
  console.log("email" , email , );
  console.log("password" , password);

  if([fullName  , email , userName , password ].some((field)=> field?.trim() === "")){
    throw new ApiError(400 , "All field is required")
  }

 const existedUser  =  User.findOne({
     $or: [{ userName } , { email }]
  }) 

  if(existedUser){
    throw new ApiError(409 , "USer with userName or email alrady exists ")
  }
 
   const avatarlocalPath = req.files?.avatar[0]?.path ; 
  const coverImageLocalpath = req.files?.coverImage[0]?.path ;
   
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
   
  if(cretedUser) {
    throw new ApiError(500 , "Something went Wrong in registering a user in Database")
  }

  return res.status(201).json(
    new ApiResponse(200 , cretedUser , "user registered Successfully")
  )


})

export {registerUser}