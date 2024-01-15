import { Router } from "express";
import { deleteVideo, getVideosBySearchInput, getMyVideos,updateVideo, publishAVideo, togglePublishStatus} from "../controllers/myVideo.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/get-videos").get( verifyJWT , getVideosBySearchInput)
router .route("/publish-status/:videoID").patch(verifyJWT , togglePublishStatus )


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
    ]), publishAVideo
)

router.route("/update-video/:videoID").patch(
    verifyJWT , upload.single("thumbnail") , updateVideo
)

router.route("/get-my-videos").get(verifyJWT , getMyVideos)

router.route("/delete-video/:videoID").delete(verifyJWT , deleteVideo )



export default router