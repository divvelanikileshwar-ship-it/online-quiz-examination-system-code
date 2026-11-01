const mongoose = require("mongoose");
module.exports = mongoose.model("Question", new mongoose.Schema({
 quizId:{type:mongoose.Schema.Types.ObjectId,ref:"Quiz",required:true},questionText:{type:String,required:true},
 options:{type:[String],validate:v=>v.length>=2},correctOption:{type:Number,required:true},marks:{type:Number,default:1},
 explanation:{type:String,default:""},topic:{type:String,default:"General"}
},{timestamps:true}));
