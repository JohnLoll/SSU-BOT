const { log } = require('mathjs');
const { Schema, model } = require('mongoose');

// Define the schema
const filteringlogchannelSchema = new Schema({
    Guild: String,
    Channel: String,
});

// Create the model
const filteringlogchannelModel = model('filteringlogchannel', filteringlogchannelSchema);

// Extract individual properties from the schema
const {Guild, Channel} = filteringlogchannelSchema.obj;

// Export the model and individual properties
module.exports = { filteringlogchannelModel, Guild, Channel };