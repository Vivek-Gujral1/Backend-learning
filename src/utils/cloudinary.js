import { v2 as cloudinary} from "cloudinary";
import fs from "fs"


          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath)=>{
   try {
    if(!localFilePath) return console.log("COULD NOT FIND THE FILE !!");
   const response =   await cloudinary.uploader.upload(localFilePath , {
        resource_type : "auto"
    })
    //file upload successfully
   // console.log("successfully upload",response);
   fs.unlinkSync(localFilePath)
    return response
   } catch (error) {
    fs.unlinkSync(localFilePath)
    return null
   }
}

export {uploadOnCloudinary}