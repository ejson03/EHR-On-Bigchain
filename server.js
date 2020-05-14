const path = require('path');
const express = require('express');
require('dotenv').config();

const bodyParser = require('body-parser');
const {common} = require("./routes/common.routes")
const {user} = require("./routes/user.routes")
const {doctor} = require("./routes/doctor.routes")
const app = express();
var cookieSession = require('cookie-session')
let session = require('express-session')
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'ssshhhhh',
    resave: false,
    saveUninitialized: true,
    credentials : 'include'
}));
// app.use(cookieSession({
//     name: 'session',
//     secret: 'ssshhhhh',
//     maxAge: 24 * 60 * 60 * 1000, // 24 hours,
//     credentials : 'include'
// }))


app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.engine('.html', require('ejs').renderFile);


//add the router
app.use('/', common);
app.use('/user', user)
app.use('/doctor', doctor)
app.listen(process.env.PORT || 8080,
    function() {
        console.log("App listening on port 8080.....")
    });