import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials : true
}))

app.use(express.json({limit : "20kb"}))
app.use(express.urlencoded({extended: true , limit : "20kb"}))
app.use(express.static("public"))
app.use(cookieParser())

// routes import

import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js"
import commentRouter from "./routes/comment.routes.js"
import likeRouter from "./routes/like.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"
// routes decllaration

app.use('/api/v1/users' , userRouter)
app.use("/api/v1/video" , videoRouter)
app.use("/api/v1/comment" , commentRouter)
app.use("/api/v1/likes" , likeRouter)
app.use("/api/v1/subscription" , subscriptionRouter)
// http://localhost:6000/api/v1/users/

export { app }