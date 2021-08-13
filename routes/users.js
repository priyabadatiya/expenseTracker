var express = require('express');
var router = express.Router();
var User = require('../models/users');
var nodemailer = require('nodemailer');
var random = require('../random');
var bcrypt = require('bcrypt');

/* GET users listing. */
router.get('/', function (req, res, next) {
  res.send('respond with a resource');
});

//render register form
router.get('/register', (req, res, next) => {
  let info = req.flash("info")[0];
  req.session.userId && res.redirect('/home');
  res.render('register', { info, title: 'Register' });
});

//process register request
router.post('/register', (req, res, next) => {
  req.body.isVerified = false;
  req.body.random = random();
  var { email, first_name, last_name } = req.body;
  req.body.name = `${first_name} ${last_name}`;
  delete req.body["first_name"];
  delete req.body["last_name"];
  
  User.create(req.body, (err, user) => {
    if (err) return next(err);
    const transporter = nodemailer.createTransport({
      port: 465,
      host: "smtp.gmail.com",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
      },
      secure: true
    })

    const mailData = {
      from: 'expensetrackerbypiku@gmail.com',
      to: email,
      subject: 'Verification Email',
      html:`<div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
      <div style="margin:50px auto;width:70%;padding:20px 0">
        <div style="border-bottom:1px solid #eee">
          <a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">Expense Tracker</a>
        </div>
        <p style="font-size:1.1em">Hi,</p>
        <p>Thanks for signing up with Expense Tracker! You must follow this link with the following Verification Code to to activate your account: https://expense-tracker-by-piku.herokuapp.com/users/verifyEmail </p>
        <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${req.body.random}</h2>
        <p style="font-size:0.9em;">Regards,<br />Priyanka Badatiya</p>
        <hr style="border:none;border-top:1px solid #eee" />
        <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
          <p>Expense Tracker by piku</p>
          <p>AltCampus</p>
          <p>Dharamshala</p>
        </div>
      </div>
    </div>`
    }

    transporter.sendMail(mailData, function (err, info) {
      if (err) return next(err);
      req.flash("info", "A verification code is send to your Email please check");
      req.session.email1 = user.email;
      res.redirect('/users/register');
    })
  })
});

//render login page
router.get('/login', (req, res, next) => {
  let error = req.flash('error')[0];
  let info = req.flash('info')[0];
  req.session.userId && res.redirect('/home');
  res.render('login', { error, info, title: 'Login' });
});

//process login request
router.post('/login', (req, res, next) => {
  let { email, password } = req.body;
  if (!email || !password) {
    req.flash("error", "Password/Email Required");
    return res.redirect('/users/login');
  }
  User.findOne({ email }, (err, user) => {
    if (err) return next(err);
    if (!user) {
      req.flash("error", "Email is not registerd");
      return res.redirect('/users/login');
    }
    if (!user.isVerified) {
      req.flash("error", "Your Email is not verified");
      return res.redirect('/users/login');
    }
    user.verifyPassword(password, (err, result) => {
      if (err) return next(err);
      if (!result) {
        req.flash("error", "Password is incorrect");
        return res.redirect('/users/login');
      }
      console.log(user);
      req.session.userId = user.id;
      res.redirect('/home');
    })  
  })
});

//logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});


//rendering verify email page
router.get('/verifyEmail', (req, res, next) => {
  let error = req.flash("error")[0];
  res.render('verifyEmail', { error });
});

//process email varification
router.post('/verifyEmail', (req, res, next) => {
  let { passcode } = req.body;
  let email = req.session.email1;
  console.log(email)
  User.findOne({ email }, (err, user) => {
    if (err) return next(err);
    console.log(user.random,1)
    console.log(passcode,2)

    if (passcode == user.random) {
      req.body = { isVerified: true };
      User.findByIdAndUpdate(user.id, req.body, (err, user) => {
        if (err) return next(err);
        return res.redirect('/users/login');
      })

    } else {
      req.flash('error', 'The Verification code entered is not correct. Enter the correct one.');
      res.redirect('/users/verifyEmail');
    }
  })
});

//render forgot password page
router.get('/login/forgotPassword', (req, res, next) => {
  let error = req.flash('error')[0];
  let info = req.flash('info')[0];
  res.render('forgotPassword', { error, info });
});

//process forgot password
router.post('/login/forgotPassword', (req, res, next) => {
  let { email } = req.body;
  req.body.random = random();
  console.log(req.body.random);
  User.findOneAndUpdate({ email }, req.body, (err, user) => {
    if (err) return next(err);
    console.log(user);
    if (!user) {
      req.flash('error', 'The Email entered is not Registered, Please entered the registered Email');
      return res.redirect('/users/login/forgotPassword');
    }
    const transporter = nodemailer.createTransport({
      port: 465,
      host: "smtp.gmail.com",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
      },
      secure: true
    });

    const mailData = {
      from: 'priyabadatiya@gmail.com',
      to: email,
      subject: 'Verification Email',
      html: `<h1>${req.body.random}</h1>
              <h2>Please Copy above 6 digit number and click this link http://localhost:3000/users/login/resetpassword/verify </h2>`

    };

    transporter.sendMail(mailData, (err, info) => {
      if (err) return next(err);
      req.flash("info", "A password rest code is send to your email");
      req.session.email = email;
      res.redirect('/users/login/forgotPassword');
    })
  })
});

//render reset password verification code page
router.get('/login/resetpassword/verify', (req, res, next) => {
  let error = req.flash('error')[0];
  res.render('resetPasswordVerificationCode', { error });
});


//process verification code
router.post('/login/resetpassword/verify', (req, res, next) => {
  let email = req.session.email;
  let { passcode } = req.body;
  User.findOne({ email }, (err, user) => {
    if (err) return next(err);
    if (passcode == user.random) {
      return res.redirect('/users/login/resetpassword');
    } else {
      req.flash('error', "Enter the correct verification code");
      res.redirect('/users/login/resetpassword/verify');
    }
  })
});


//render reset password page
router.get('/login/resetpassword', (req, res, next) => {
  let error = req.flash("error")[0];
  res.render('resetPassword', { error });
});

//reset password
router.post('/login/resetpassword', (req, res, next) => {
  let { newPassword1, newPassword2 } = req.body;
  let email = req.session.email;
  if (newPassword1 === newPassword2) {
    User.findOne({ email }, (err, user) => {
      if (err) return next(user);
      bcrypt.hash(newPassword1, 10, (err, hashed) => {
        if (err) return next(err);
        req.body.password = hashed;
        User.findOneAndUpdate({ email }, req.body, (err, user) => {
          if (err) return next(err);
          req.flash("info", ("Password is Successfully Changed"))
          return res.redirect('/users/login');
        })

      })
    })
  } else {
    req.flash("error", ("Password does not match"));
    res.redirect('/users/login/resetpassword');
  }
});

//logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});



module.exports = router;

