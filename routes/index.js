const { compareSync } = require('bcrypt');
var express = require('express');
var router = express.Router();
var passport = require('passport');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Expense Tracker' });
});

//render dashboard page
router.get('/home', (req, res, next) => {
  res.render('dashboard');
});

//sending request to github server
router.get('/auth/github', passport.authenticate('github'));

//callback route
router.get('/auth/github/callback', passport.authenticate('github', {failureRedirect: '/users/login'}), (req, res) => {
const user = req.user;
req.session.userId = user.id;
  res.redirect('/home');
});

//sending request to google server
router.get('/auth/google', passport.authenticate('google', {scope: ['email', 'profile']}));

//callback route 
router.get('/auth/google/callback', passport.authenticate('google', {failureRedirect: '/users/login'}), (req, res) => {
  const user = req.user;
  req.session.userId = user.id;
  res.redirect('/home');
});

module.exports = router;
