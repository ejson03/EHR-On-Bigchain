const {Router} = require("express")
const {getAsset} = require("../utils/bigchain")
const {createRecord, getAssetHistory} = require('../utils/stuff.js')



app.get('/list', function(req, res) {
    (async() => {
        try {
            let result = await getAsset('doctor');
            result.filter((data) => {
                return data['data']
            });
            res.render('patientaccdoclist.ejs', { 'docs': result, 'email': req.session.email });
        } catch (err) {
            console.error(err);
            return res.sendStatus(404);
        }
    })();
})

app.get('/history', function(req, res) {
    (async() => {
        try {
            let data = req.session.user.records;
            console.log(data)
            res.render('patientmedhistory.ejs', { 'doc': data, 'email': req.session.email });
        } catch (err) {
            console.error(err);
            return res.sendStatus(404);
        }

    })();

});

app.post('/access', function(req, res) {
    req.session.demail = req.body.value;
    (async() => {
        try {
            let data = await showAccess(req.session.demail, req.session.user.records)
            res.render('patientaccesstrans.ejs', { 'doc': data, 'email': req.session.email });
        } catch (err) {
            console.error(err);
            return res.sendStatus(404);
        }

    })();

})
app.post('/revoke', function(req, res) {
    req.session.demail = req.body.value;
    (async() => {
        try {
            let data = await showRevoke(req.session.demail, req.session.user.records)
                // console.log("revoke data is....", data)
            res.render('patientrevoketrans.ejs', { 'doc': data, 'email': req.session.email });
        } catch (err) {
            console.error(err);
            return res.sendStatus(404);
        }
    })()
})


app.get('/home', function(req, res) {
    res.render('patientaddrec.ejs', { 'email': req.session.email });
})

app.post('/check', function(req, res) {
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
            await createAccess(data, req.session.key.publicKey, req.session.key.privateKey, req.session.demail, req.session.user.secret_key)
            res.redirect("/user/home")
        } catch (err) {
            console.error(err);
            return res.sendStatus(404);
        }
    })();


})

app.post('/uncheck', function(req, res) {

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
            await revokeAccess(data, req.session.key.publicKey, req.session.key.privateKey, req.session.demail)
            res.redirect("/user/home")
        } catch (err) {
            console.error(err);
            return res.sendStatus(404);
        }
    })();
})

app.post('/viewpres', function(req, res) {
    let demail = req.body.demail;
    console.log(demail);
    let data = [];
    (async() => {
        try {
            let assets = await conn.searchAssets(demail)
            console.log(assets.length)
            for (const id in assets) {
                let inter = await conn.searchAssets(assets[id].data.assetID)
                if (inter[0].data.email == encrypt(req.session.email)) {
                    data.push({
                        'prescription': assets[0].data.prescription,
                        'file': decrypt(inter[0].data.file)
                    })
                }
            }
            console.log(data)
            res.render('patientpresc.ejs', { 'doc': data, 'email': req.session.email });
        } catch (err) {
            console.error(err);
            return res.sendStatus(404);
        }
    })();

});

app.post('/history', function(req, res) {
    let assetid = req.body.history;
    let data = []
    (async() => {
        try {
            let transactions = await listTransactions(assetid)
            for (index in transactions) {
                int = []
                int = {
                    'operation': transactions[index].operation,
                    'date': transactions[index].metadata.datetime,
                    'doctor': []
                }
                if (transactions[index].operation == "TRANSFER") {
                    if (transactions[index].metadata.doclist.length > 0) {
                        for (doc in transactions[index].metadata.doclist) {
                            console.log(decrypt(transactions[index].metadata.doclist[doc].email))
                            int['doctor'].push(decrypt(transactions[index].metadata.doclist[doc].email))
                        }
                    }
                    data.push(int)
                } else {
                    data.push(int)
                }
            }
            console.log(data)
            res.render("patientassethistory.ejs", { 'doc': data, 'email': req.session.email })
        } catch (err) {
            console.error(err);
            return res.sendStatus(404);
        }
    })();
});

app.post('/add', function(req, res) {
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
                let tx = await createRecord(data, req.session.email, fpath, req.session.key.publicKey, req.session.key.privateKey. req.session.user.secret_key)
                console.log('Transaction', tx.id, 'successfully posted.')
                res.redirect('/history')
            } catch (err) {
                console.error(err);
                return res.sendStatus(404);
            }
        })();
    });
});
