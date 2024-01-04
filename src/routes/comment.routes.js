import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { addComment } from "../controllers/myComment.controller.js";


const router = Router()

 

router.route("/add-comment/:videoID").post(verifyJWT ,addComment )

export default router