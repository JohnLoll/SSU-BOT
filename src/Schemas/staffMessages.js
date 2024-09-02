const { model, Schema } = require('mongoose');
 
let staffMessages = new Schema({
    Guild: String,
    User: String,
    Messages: String,
    QuestionNumber: Number,
    Question1: String,
    Question2: String,
    Question3: String,
    Question4: String,
    Question5: String,
    Question6: String,
    Question7: String,
    Question8: String,
    Question9: String,
    Question10: String,
    Question11: String,
    Duration: String,
    inProgress: { type: Boolean, default: false }
});
 
module.exports = model("staffMessages", staffMessages);