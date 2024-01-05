import { Router } from "express";
import { deleteVideo, getAllVideos, getMyVideos, getVideoByTitle, getVideosByUserName, updateVideo, uploadVideo } from "../controllers/myVideo.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/get-videos").get(getAllVideos)
router.route("/get-videos-by-username/:userName").get(getVideosByUserName)
router.route("/get-video-by-title/:title").get(getVideoByTitle)

// secured routes

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

router.route("/get-my-videos").get(verifyJWT , getMyVideos)

router.route("/delete-video/:videoID").delete(verifyJWT , deleteVideo )



export default router