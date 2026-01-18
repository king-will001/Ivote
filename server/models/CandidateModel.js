const {Schema, model, Types} = require('mongoose');

const candidateSchema = new Schema({
    firstName: {type: String, required: true}, 
    lastName: {type: String, required: true},
    election: {type: Types.ObjectId, ref: 'Election', required: true},
    votesCount: {type: Number, default: 0},
    motto: {type: String, required: true},
    image: {type: String, required: true}
}, {timestamps: true})

module.exports = model('Candidate', candidateSchema);