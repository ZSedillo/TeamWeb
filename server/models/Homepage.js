const mongoose = require('mongoose')

const homepageSchema = new mongoose.Schema({
    image_url: String,
    key: String,          // S3 object key for deletion
    description: String,  // New description field
    created_at: { type: Date, default: Date.now },
});


const homepageModel = mongoose.model("homepage",homepageSchema)
module.exports = homepageModel