import mongoose from "mongoose"

export const getmongoosePaginationOptions = ({
    page = 1 ,
    limit = 10 ,
    customLables
}) => {
   return {
    page : Math.max(page , 1),
    limit : Math.max(limit , 1) ,
    pagination : true , 
    customLables : {
      pagingCounter : "serialNumberStartFrom" ,
      ...customLables ,
    }
   }
}