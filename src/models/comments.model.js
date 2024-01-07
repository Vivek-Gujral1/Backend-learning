import mongoose , {Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

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

CommentSchema.plugin(mongooseAggregatePaginate)
export const Comments = mongoose.model("Comments" , CommentSchema)