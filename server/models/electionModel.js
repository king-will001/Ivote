const {Schema, model, Types} = require('mongoose');

const electionSchema = new Schema({
    title: {type: String, required: true},
    description: {type: String, required: true},
    date: {type: Date, required: true},
    thumbnail: {type: String},
    candidates: [{type: Types.ObjectId, ref: 'Candidate', required: true}],
    startTime: {type: Date, required: true},
    endTime: {type: Date, required: true},
    voters: [{type: Types.ObjectId, ref: 'Voter', required: true}],
    isActive: {type: Boolean, default: true}
}, {timestamps: true})

module.exports = model('Election', electionSchema);
