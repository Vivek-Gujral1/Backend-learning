import { verifyJWT } from "../middlewares/auth.middleware.js";
import { toggleCommentLike, toggleTweetLike, toggleVideoLike } from "../controllers/like.controller.js";

import { Router } from "express";

const router = Router()

router.route("/video/:videoID").post(verifyJWT , toggleVideoLike)
router.route("/comment/:commentID").post(verifyJWT , toggleCommentLike)
router.route("/tweet/:tweetID").post(verifyJWT , toggleTweetLike)

export default router