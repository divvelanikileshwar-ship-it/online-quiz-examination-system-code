const mongoose = require("mongoose");
module.exports = mongoose.model("Quiz", new mongoose.Schema({
 title:{type:String,required:true},category:{type:String,required:true},description:{type:String,default:""},
 durationMinutes:{type:Number,default:15},difficulty:{type:String,enum:["easy","medium","hard"],default:"medium"},
 status:{type:String,enum:["draft","published","archived"],default:"published"},allowedAttempts:{type:Number,default:2},
 negativeMarking:{type:Number,default:0},passingPercentage:{type:Number,default:40},createdBy:{type:mongoose.Schema.Types.ObjectId,ref:"User"}
},{timestamps:true}));
