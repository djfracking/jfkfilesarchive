const functions = require('firebase-functions/v2');
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

const addComment = require("./src/comments/createComment");
const editComment = require("./src/comments/editaComment");
const getComments = require("./src/comments/gettheComments");
const voteComment = require("./src/comments/voteComment");
const mainSearch = require("./src/search/searchMain");
const castVotes = require("./src/voting/castVote");
const getLeaderboard = require ("./src/leaderboard/getLeaderboard")

exports.addComment = addComment;
exports.editComment = editComment;
exports.getComments = getComments;
exports.voteComment = voteComment;
exports.castVotes = castVotes;
exports.getLeaderboard = getLeaderboard;
exports.mainSearch = mainSearch;
