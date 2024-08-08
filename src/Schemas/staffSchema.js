const {model, Schema} = require('mongoose');
 
let StaffSetupMessage = new Schema({
    GuildID: String,
    Channel: String,
    Transcripts: String,
    Description: String,
    Button: String,
    Emoji: String,
    Role: String
})
 
module.exports = model('StaffSetupMessage', StaffSetupMessage);