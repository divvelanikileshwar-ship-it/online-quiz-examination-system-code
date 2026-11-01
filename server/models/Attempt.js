const mongoose = require("mongoose");
const answer = new mongoose.Schema({questionId:mongoose.Schema.Types.ObjectId,selectedOption:{type:Number,default:null}},{_id:false});
module.exports = mongoose.model("Attempt",new mongoose.Schema({
 attemptCode:{type:String,unique:true},userId:{type:mongoose.Schema.Types.ObjectId,ref:"User"},quizId:{type:mongoose.Schema.Types.ObjectId,ref:"Quiz"},
 status:{type:String,enum:["in_progress","submitted","expired"],default:"in_progress"},startedAt:Date,expiresAt:Date,submittedAt:Date,
 answers:{type:[answer],default:[]}
},{timestamps:true}));
