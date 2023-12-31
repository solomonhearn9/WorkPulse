const mongoose = require("mongoose");
const Status = require('../utils/status'); 

const logSchema = mongoose.Schema({

    employee : { type: String, required: true },
    task : { type: String, required: false },
    department : { type: [String], default: [], required: false},
    project : {type: [String], default: [], required: false},
    startTimestamp : { type: Date, default: Date.now(), required: true },
    endTimestamp : { type: Date, required: false },
    status: {
      type: String,
      required: true,
      enum: Object.values(Status),
      default: Status.starting
    },
    log : [{
      type: mongoose.Schema.Types.Mixed 
    }] 

});
// if the log is a post-algorithm log =
// log: [(timestampA, timestampB, result)]
// timestampA = start time
// timestampB = end time
// Result for that time chunk
logSchema.methods.endSession = function () {
    return new Promise(async (resolve, reject) => {
      const end = Date.now(); 
      if (this.startTimestamp < end && this.endTimestamp == null) {
        try {
          await this.model('Log').updateOne(
            { _id: this._id }, 
            { $set: { 
              endTimestamp: end,
              status: Status.closed
            } } ,
          );
          this.endTimestamp = end
          this.status = Status.closed
          resolve();
        } catch (error) {
          reject(error); 
        }
      } else {
        resolve(); 
      }
    });
  };
  

module.exports = mongoose.model("Log", logSchema)