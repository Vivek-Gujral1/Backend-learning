import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";

const toggleSubscription = asyncHandler(async (req , res)=>{
   const {channelID} = req.params ; 
  // check channel exists
   const channel = await User.findById(channelID)

   if (!channel) {
    throw new ApiError(404 , "channel does not exist")
   }

   // check if user request to subscribe his/her own channel

   if (channelID.toString() === req.user._id.toString()) {
    throw new ApiError(422 , "You cannot subscribe yourself")
   }

   // check if user already subscribed to given channel 

   const isAlreadySubscribed = await Subscription.findOne({
    subscriber : req.user._id,
    channel :  channel._id
   })

   if (isAlreadySubscribed) {
    // if yes then unsubscribe the channel 

    await Subscription.findOneAndDelete({
        subscriber : req.user._id,
        channel :  channel._id
    })

    return res
    .status(200)
    .json(new ApiResponse(200 , {subscription : false} , "channel unsubscribed successfully"))
   }
   else {
    // if no then subscribe the channel

    await Subscription.create({
        subscriber : req.user._id,
        channel :  channel._id
    })
    return res 
    .status(200)
    .json(new ApiResponse(200 , {subscription : true} , "channel subscribed successfully"))
   }
})

export {toggleSubscription}