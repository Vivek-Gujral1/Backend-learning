import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const ConnectDB = async() =>{
    try {
      const connecitonInstance =   await mongoose.connect(`${process.env.MONGODB_URl}/${DB_NAME}`)
      console.log(`\n MongoDB connected DB HOST:${connecitonInstance.connection.host}`);
    } catch (error) {
        console.log("MONGODB CONNECTION ERROR" , error);
        process.exit(1)
    }
}

export default ConnectDB