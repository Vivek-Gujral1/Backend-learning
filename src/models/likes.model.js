import mongoose , {Schema , model} from "mongoose";

const likesSchema = new Schema({
    videoID :{
        type : Schema.Types.ObjectId, 
        ref : "Video",
        default : null
    },
    commentID : {
        type : Schema.Types.ObjectId,
        ref : "Comments",
        default : null
    },
    tweetID : {
        type : Schema.Types.ObjectId,
        ref : "tweets",
        default : null
    },
    likedBy : {
        type : Schema.Types.ObjectId,
        ref : "User"
    }
},{
    timestamps : true
})

export const likes = model("likes" , likesSchema)