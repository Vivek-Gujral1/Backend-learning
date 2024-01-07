import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { addComment, deleteComment, getVideoComments, updateComment } from "../controllers/myComment.controller.js";


const router = Router()

 

router.route("/add-comment/:videoID").post(verifyJWT ,addComment )
router.route("/get-video-comments/:videoID").get(verifyJWT , getVideoComments)
router.route("/delete-comment/:commentID").delete(verifyJWT , deleteComment)
router.route("/update-comment/:commentID").patch(verifyJWT , updateComment)

export default router