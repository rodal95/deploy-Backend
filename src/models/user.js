const mongoose = require("mongoose")

const userCollection = "users"
const userSchema =  new mongoose.Schema({
    name:String,
    username:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    }
})
const userModel = mongoose.model(userCollection,userSchema)

module.exports = {userModel}