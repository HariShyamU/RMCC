var express = require('express');
var app = express();
var cors = require("cors");
var bodyParser = require('body-parser');
var pg = require("pg");
var fs = require('fs');
var uniqid = require('uniqid');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var XLSX = require('xlsx');
var multer  = require('multer');
var upload = multer({ dest: 'uploads/' });
var wkhtmltopdf = require('wkhtmltopdf');
var debug =true;

var PORT = 8000;
// for parsing application/json
app.use(bodyParser.json());

// for parsing application/xwww-
app.use(bodyParser.urlencoded({ extended: true }));
//form-urlencoded

// for parsing multipart/form-data

var usid = 1;
var cuid = 0;
var unam = '';
var cauth;
var cwid;
var id = 2;


const config = {
    user: 'postgres',
    database: 'roshnibazaar',
    password: 'roshnipass',
    port: 5432,
    host: 'localhost'
};

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://52.66.197.231:"+PORT+"/");
    res.header("Access-Control-Allow-Headers","Access-Control-Allow-Credentials", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use(cors({
    credentials : true,
}));

app.use(require("body-parser").json());

app.use(cookieParser());

app.use(session({
    key: 'NMT_Key',
    secret: 'SecretKeyForNMT',
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: 600000
    }
}));

app.use('/assets', express.static(__dirname + '/assets'));

app.use((req, res, next) => {
    if (req.cookies.rb_sid && !req.session.user) {
        res.clearCookie('user_sid');
    }
    next();
});

app.route('/').get(
    (req,res) => {
        if(req.session.user_data){
            res.sendFile(__dirname + '/routes/user/index.html');
        }else {
            console.log(req.session);
            res.sendFile(__dirname + '/routes/guest/index.html');
        }
    }
);

app.route('/signup').get(
    (req,res) => {
        if(req.session.user_data){
            res.sendFile(__dirname + '/routes/user/dashboard.html');
        }else {
            console.log(req.session);
            res.sendFile(__dirname + '/routes/guest/signup.html');
        }
    }
);

app.route('/signin').get(
    (req,res) => {
        if(req.session.user_data){
            res.sendFile(__dirname + '/routes/user/dashboard.html');
        }else {
            console.log(req.session);
            res.sendFile(__dirname + '/routes/guest/signin.html');
        }
    }
);


app.route('/dashboard').get(
    (req,res) => {
        res.sendFile(__dirname + '/routes/user/dashboard.html');
    }
);

app.route('/careers').get(
    (req,res) => {
      if(req.session.user_data){
          res.sendFile(__dirname + '/routes/user/careers.html');
      }else {
          console.log(req.session);
          res.sendFile(__dirname + '/routes/guest/careers.html');
      }
    }
);

app.post('/auth',   function (req, res) {


    if(req.session.user_data){
        console.log("session saves");
        res.send(res.session.user_data);
    } else {
        request = {
            uname: req.body.UsIn,
            pass: req.body.PwIn
        };

        const pool = new pg.Pool(config);
        pool.query('SELECT * FROM users WHERE phone=$1 AND password=$2',
            [request.uname, request.pass], function (err, result) {
                if (err) {
                    console.log(err);
                    var obj = '{ "error":'+err+' }';
                    res.send(obj);
                } else if (result.rows[0] == undefined) {
                    var obj = '{ "error":"Incorrect credentials" }';
                    res.send(obj);
                } else {
                    test = result.rows;
                    req.session.user_data = test[0];
                    console.log("res - ",req.session);
                    var obj = '{ "id": "'+result.rows[0].userid+'" }';
                    console.log(obj);
                    res.send(obj);
                }
            });
    }


});

app.post('/registerstudent', upload.array(),   function (req, res) {

    request = {
        name: req.body.name,
        email: req.body.email,
        school: req.body.school,
        phone: req.body.phone,
        dob: req.body.dob,
        grade: req.body.grade
    };

    var pool = new pg.Pool(config);

    let userid = uniqid();

    pool.query('INSERT INTO users (userid, name, school, phone, grade, email, dob) VALUES ($1,$2,$3,1,$4,$5,$6,$7)',
    [userid, request.name, request.school, request.phone, request.grade, request.email, request.dob], function (err, result) {
        if (err) {
            console.log(err);
            // res.sendStatus(err);
            res.send(err);
        }
        else {                
            res.send(userid);
        }
    });
});

app.post('/registerparent', upload.array(),   function (req, res) {

    request = {
        userid: req.body.userid,
        name: req.body.name,
        email: req.body.email,
        school: req.body.school,
        phone: req.body.phone,
        dob: req.body.dob,
        grade: req.body.grade
    };

    var pool = new pg.Pool(config);

    pool.query('INSERT INTO parents (userid, fname, mname, fjob, mjob, email, phone) VALUES ($1,$2,$3,1,$4,$5,$6,$7)',
    [request.userid, request.fname, request.mname, request.fjob, request.mjob, request.email, request.phone], function (err, result) {
        if (err) {
            console.log(err);
            // res.sendStatus(err);
            res.send(err);
        }
        else {                
            res.send(true);
        }
    });
});

app.post('/updateuser', upload.array(),   function (req, res) {

    request = {
        userid: req.body.userid,
        address1: req.body.address1,
        address2: req.body.address2,
        address3: req.body.address3,
        password: req.body.password,
        batch: req.body.batch,
    };

    var pool = new pg.Pool(config);

    pool.query('UPDATE user SET address1=$1, address2=$2, address3=$3, password=$4, batch=$5 WHERE userid=$6',
    [request.address1, request.address2, request.address3, request.password, request.batch, request.userid, request.phone], function (err, result) {
        if (err) {
            console.log(err);
            // res.sendStatus(err);
            res.send(err);
        }
        else {                
            res.send(true);
        }
    });
});

app.get('/logout',   function (req, res) {

    console.log(req.session);

    req.session.destroy(function(err) {
        console.log('session destroyed')
        console.log(err);
      })

    res.redirect('/');
});

app.post('/userdata',   function (req, res) {

    request = {
        userid: req.body.data,
    };
    var pool = new pg.Pool(config);

    pool.query('SELECT * From users WHERE (userid=$1)',
        [request.userid], function (err, result) {
            if (err) {
                console.log(err);
                var obj = '{ "error":'+err +' }';
                console.log(JSON.parse(obj));
                res.send(obj);
            }
            // else if (JSON.stringify(result.rows)=="[]") {
            //   var obj = '{ "error":"Incorrect credentials" }';
            //   console.log(JSON.parse(obj));
            //   res.send(obj);
            //   console.log(request);
            //   console.log(request.pass);
            // }
            else {
                test =result.rows;
                res.send(test[0]);
            }
        });
});

app.post('/userauth',   function (req, res) {

    request = {
        userid: req.body.data,
    };
    var pool = new pg.Pool(config);

    pool.query('SELECT authid From users WHERE (userid=$1)',
        [request.userid], function (err, result) {
            if (err) {
                console.log(err);
                var obj = '{ "error":'+err +' }';
                console.log(JSON.parse(obj));
                res.send(obj);
            }
            else {
                if (result.rows[0]!=undefined) {
                  if (result.rows[0].authid == 1) {
                      console.log('user');
                      res.send(false);
                  } else {
                      res.send(true);
                      console.log('admin');
                  }
                } else {
                  res.send(false);
                }
            }
        });
});

// app.post('/createbid', upload.array(),  function (req, res) {
//
//     request = {
//         userid: req.body.id,
//         category: req.body.category,
//         quantity: req.body.quantity,
//         maxprice: req.body.maxprice,
//         images: req.body.images,
//         expiry: req.body.expiry,
//         reqdate: req.body.reqdate,
//         description: req.body.description
//     };
//
//     var pool = new pg.Pool(config);
//
//     pool.query('INSERT INTO bids (bidid, userid, category, images, description, quantity, maxprice, expiry, reqdate) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
//         [uniqid(), request.userid, request.category, request.images, request.description, request.quantity, request.maxprice, request.expiry, request.reqdate], function (err, result) {
//             if (err) {
//                 console.log(err);
//                 res.send(err);
//             }
//             else {
//                 res.send(true);
//             }
//         });
// });






app.listen(PORT, '0.0.0.0', function () {
    console.log("Started on PORT "+PORT);
});
