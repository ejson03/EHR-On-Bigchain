const {Router} = require("express")
const {getAsset} = require("../utils/bigchain")
const {createRecord, getAssetHistory, showAccess, showRevoke, createAccess, revokeAccess, getPrescription} = require('../utils/stuff.js')

const user = Router()
module.exports.user = user;

user.get('/doctorlist', function(req, res) {
    (async() => {
        try {
            let result = await getAsset('doctor');
            result.filter((data) => {
                return data['data']
            });
            res.render('patientaccdoclist.ejs', { 'docs': result});
        } catch (err) {
            console.error(err);
            return res.sendStatus(404);
        }
    })();
})

user.get('/medicalhistory', function(req, res) {
    (async() => {
        try {
            let data = req.session.user.records;
            console.log(data)
            res.render('patientmedhistory.ejs', { 'doc': data});
        } catch (err) {
            console.error(err);
            return res.sendStatus(404);
        }

    })();

});

user.post('/access', function(req, res) {
    req.session.demail = req.body.value;
    (async() => {
        try {
            let data = await showAccess(req.session.demail, req.session.user.records)
            res.render('patientaccesstrans.ejs', { 'doc': data});
        } catch (err) {
            console.error(err);
            return res.sendStatus(404);
        }

    })();

})
user.post('/revoke', function(req, res) {
    req.session.demail = req.body.value;
    (async() => {
        try {
            let data = await showRevoke(req.session.demail, req.session.user.records)
                // console.log("revoke data is....", data)
            res.render('patientrevoketrans.ejs', { 'doc': data});
        } catch (err) {
            console.error(err);
            return res.sendStatus(404);
        }
    })()
})


user.get('/home', function(req, res) {
    console.log(req.session.username)
    res.render('patientaddrec.ejs');
})

user.post('/check', function(req, res) {
    let count = Object.keys(req.body).length;
    let data = []
    for (i = 0; i < count; i++) {
        if (req.body[i] == undefined) {
            count++;
        } else {
            data.push(req.body[i])
        }
    };
    (async() => {
        try {
            await createAccess(data, req.session.user.bigchainKeys.publicKey, req.session.user.bigchainKeys.privateKey, req.session.demail, req.session.user.secretKey)
            res.redirect("/user/home")
        } catch (err) {
            console.error(err);
            return res.sendStatus(404);
        }
    })();


})

user.post('/uncheck', function(req, res) {

    let count = Object.keys(req.body).length;
    console.log(req.body)
    console.log("Objects checked is: ", count);
    let data = []
    for (i = 0; i < count; i++) {
        if (req.body[i] == undefined) {
            count++;
        } else {
            data.push(req.body[i])
        }
    };
    console.log(data);
    (async() => {
        try {
            await revokeAccess(data, req.session.user.bigchainKeys.publicKey, req.session.user.bigchainKeys.privateKey, req.session.demail)
            res.redirect("/user/home")
        } catch (err) {
            console.error(err);
            return res.sendStatus(404);
        }
    })();
})

user.post('/prescription', function(req, res) {
    let demail = req.body.demail;
    (async() => {
        try {
            let data = await getPrescription(demail);
            res.render('patientpresc.ejs', { 'doc': data});
        } catch (err) {
            console.error(err);
            return res.sendStatus(404);
        }
    })();

});

user.post('/assethistory', function(req, res) {
    let assetid = req.body.history;
    let data = [];
    (async() => {
        try {
            let data = getAssetHistory(assetid);
            console.log(data)
            res.render("patientassethistory.ejs", { 'doc': data})
        } catch (err) {
            console.error(err);
            return res.sendStatus(404);
        }
    })();
});

user.post('/add', function(req, res) {
    new formidable.IncomingForm().parse(req, (err, fields, files) => {
        if (err) {
            console.error('Error', err)
            throw err
        }
        let fpath = files.fileupload.path;

        let data = {
            'height': fields.height,
            'weight': fields.weight,
            'symptoms': fields.symptoms,
            'allergies': fields.allergies,
            'smoking': fields.smoking,
            'exercise': fields.exercise,
            'description': fields.d,
            'schema':'record'
        };
        (async() => {
            try {
                let tx = await createRecord(data, req.session.email, fpath, req.session.user.bigchainKeys.publicKey, req.session.user.bigchainKeys.privateKey, req.session.user.secretKey)
                console.log('Transaction', tx.id, 'successfully posted.')
                res.redirect('/user/medicalhistory')
            } catch (err) {
                console.error(err);
                return res.sendStatus(404);
            }
        })();
    });
});
