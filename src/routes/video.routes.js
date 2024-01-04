import { Router } from "express";
import { getAllVideos, updateVideo, uploadVideo } from "../controllers/myVideo.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/upload-video").post(
   verifyJWT , upload.fields([
        {
            name : "videoFile" ,
            maxCount : 1
        },
        {
            name : "thumbnail",
            maxCount : 1
        }
    ]), uploadVideo
)

router.route("/update-video/:videoID").patch(
    verifyJWT , upload.single("thumbnail") , updateVideo
)

router.route("/get-Videos").get(getAllVideos)
export default router