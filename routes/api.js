/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

"use strict";

var expect = require("chai").expect;
const mongoose = require("mongoose");

// Setup Mongoose/MongoDB and connection
const Schema = mongoose.Schema;

const threadSchema = new Schema(
  {
    board: String,
    text: String,
    reported: { type: Boolean, default: false },
    delete_password: String,

    // Replies array to handle all replies to specific thread
    replies: [
      {
        text: String,
        reported: { type: Boolean, default: false },
        delete_password: String,
        created_on: Date // This timestamp is for the COMMENT/REPLY
      }
    ]

    // This timestamp is for the THREAD
  },
  {
    timestamps: {
      createdAt: "created_on",
      updatedAt: "bumped_on"
    }
  }
);

const Thread = mongoose.model("Thread", threadSchema);

// MongoDB Connection String
const CONNECTION_STRING = process.env.DB;
mongoose.connect(
  CONNECTION_STRING,
  { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true },
  () => {
    console.log("Connection to MongoDB: Succesful");
  }
);

module.exports = function(app) {
  app
    .route("/api/threads/:board")
    .post(function(req, res) {
      let { board, text, delete_password } = req.body;
      board =
        board === undefined
          ? req.params.board.replace(/\s+/g, "-")
          : board.replace(/\s+/g, "-");

      const newThread = new Thread({
        board,
        text,
        delete_password
      });

      newThread.save((err, results) => {
        res.redirect(`/b/${board}/`);
      });
    })
    .get(function(req, res) {
      const board = req.params.board; // Grab the name of the current board

      // Find all the threads in the current board, sort them by most recently bumped, limit by 10 only
      Thread.find({ board })
        .sort({ bumped_on: -1 })
        .limit(10)
        .exec((err, data) => {
          if (err) console.log("Error: " + err);

          // Map through the threads then we organize all the replies and threads to show specific data
          const threads = data.map(function(thread) {
            // If there are replies in the current thread, we run this code
            if (thread.replies.length > 0) {
              const replies = thread.replies
                .sort((a, b) => b.created_on - a.created_on)
                .slice(0, 3); // Sort reply
              const organizedReplies = replies.map(reply => {
                // This sends back the reply with specific data
                return {
                  _id: reply._id,
                  text: reply.text,
                  created_on: reply.created_on
                };
              });

              return {
                _id: thread._id,
                board: thread.board,
                text: thread.text,
                created_on: thread.created_on,
                bumped_on: thread.bumped_on,
                replies: organizedReplies
              };
            } else {
              // If there are no replies, just send back the thread with specific data only
              return {
                _id: thread._id,
                board: thread.board,
                text: thread.text,
                created_on: thread.created_on,
                bumped_on: thread.bumped_on,
                replies: thread.replies
              };
            }
          });

          // Send this array data to be displayed on web page
          res.send(threads);
        });
    })

    .delete(async function(req, res) {
      const { thread_id, delete_password } = req.body;
      let deleted = false;

      const deleteThread = await Thread.deleteOne({
        _id: thread_id,
        delete_password: delete_password
      });
      const confirmDelete =
        deleteThread.deletedCount === 0 ? (deleted = false) : (deleted = true);

      if (deleted) {
        res.send("Success");
      } else {
        res.send("Incorrect Password");
      }
    })
  
    .put(function (req,res) {
      const report_id = req.body.report_id ? req.body.report_id : req.body.thread_id
      
      Thread.findByIdAndUpdate(report_id, {reported: true},{new:true, useFindAndModify: false}, (err, success) => {
        if(err) console.log("Error: " + err)
        res.send("Success")
      })
  })

  app
    .route("/api/replies/:board")
    .post(function(req, res) {
      const { board, thread_id, text, delete_password } = req.body;

      Thread.findByIdAndUpdate(
        thread_id,
        {
          $push: { replies: { text, delete_password, created_on: new Date() } }
        },
        { new: true, useFindAndModify:false },
        (err, data) => {
          if (err) console.log("Error: " + err);
          res.redirect(`/b/${board}/${thread_id}`);
        }
      );
    })

    .get(function(req, res) {
      const thread_id = req.query.thread_id;

      Thread.findById(thread_id, (err, data) => {
        // Map through the replies and format the data to only show specific information
        const replies = data.replies.map(reply => {
          return {
            _id: reply._id,
            text: reply.text,
            created_on: reply.created_on
          };
        });

        // Send the thread object with the modified replies array
        res.json({
          _id: data._id,
          board: data.board,
          text: data.text,
          replies: replies,
          created_on: data.created_on,
          bumped_on: data.bumped_on
        });
      });
    })

    .delete(async function(req, res) {
      const { thread_id, reply_id, delete_password } = req.body;
      let deleteReply = false;

      // Find the correct document and filter the correct reply by using the ID's + password, use await to handle async issues
      const findThread = await Thread.findOne({ _id: thread_id });
      const filterReply = findThread === null ? [] : findThread.replies.filter(
        reply =>
          reply._id == reply_id && reply.delete_password === delete_password
      );

      // Now that we checked for the correct using ID + checking if the password matched the reply, we check if
      // we found any matches. If we didn't find a match, don't delete anything, if we did, delete that match.
      filterReply.length > 0 ? (deleteReply = true) : (deleteReply = false);

      // LETZ DELETE THAT MATCH BOIIIIII! YOU THOUGHT THANOS WAS BAD? WATCH THIS
      if (deleteReply) {
        Thread.findOneAndUpdate(
          { _id: thread_id, "replies._id": reply_id },
          { $set: { "replies.$.text": "deleted" } },
          { new: true, useFindAndModify: false },
          function(error, success) {
            if (success) {
              res.send("Success");
            } else {
              res.send("Error");
            }
          }
        );
      } else {
        // Noting to delete, password is most likely incorrect
        res.send("Incorrect Password");
      }
    })
  
    .put(function (req,res) {
      const thread_id = req.body.thread_id
      const reply_id = req.body.reply_id
      
      Thread.findOneAndUpdate(
          { _id: thread_id, "replies._id": reply_id },
          { $set: { "replies.$.reported": true } },
          { new: true, useFindAndModify: false },
          function(error, success) {
            if (error) console.log("Error: " + error) 
              res.send("Success");
          }
        );
      
  })
};
