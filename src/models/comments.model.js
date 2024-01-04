import mongoose , {Schema , model} from "mongoose";

const CommentSchema = new Schema({
    content : {
        type : String , 
        required : true
    },
    videoID : {
        type : Schema.Types.ObjectId,
        ref : "Video"
    },
    commentBy : {
        type : Schema.Types.ObjectId,
        ref : "User"
    }

    
},{
    timestamps : true
})

export const Comments =  model("Comments" , CommentSchema)