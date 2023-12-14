import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"

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

  const {email , password} = req.body ; 

  if(!email){
    throw new ApiError(400 , "email is required")
  }
   
  const user =  await User.findOne({email})
 
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
export {registerUser , loginUser  , logoutUser}