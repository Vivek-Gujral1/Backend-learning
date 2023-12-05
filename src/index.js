
import dotenv from "dotenv"


import ConnectDB from "./dataBase/index.js";

dotenv.config({
    path :"./env"
})

ConnectDB()
 

