import mongoose , {Schema , model} from "mongoose";

const tweetSchema = new Schema({
    ownerID : {
        type : Schema.Types.ObjectId,
        ref : "User"
    },
    content : {
        type : String ,
        required :true   
    }
} , {
    timestamps : true
})

export const tweets = model("tweets" , tweetSchema)