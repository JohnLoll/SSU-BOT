const { log } = require('mathjs');
const { Schema, model } = require('mongoose');

// Define the schema
const guardlogchannelSchema = new Schema({
    Guild: String,
    Channel: String,
});

// Create the model
const guardlogchannelModel = model('guardlogchannel', guardlogchannelSchema);

// Extract individual properties from the schema
const {Guild, Channel} = guardlogchannelSchema.obj;

// Export the model and individual properties
module.exports = { guardlogchannelModel, Guild, Channel };