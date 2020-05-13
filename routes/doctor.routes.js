app.get('/doclist', function(req, res) {
    (async() => {
        try {
            let data = await getDoctorFiles(encrypt(req.session.email))
            console.log(data)
            res.render('doctorasset.ejs', { 'doc': data, 'email': req.session.email });
        } catch (err) {
            console.error(err);
            return res.sendStatus(404);
        }

    })();
})

app.get('/docdetails', function(req, res) {
    let email = encrypt(req.session.email);
    let pass = encrypt(req.session.pass);
    (async() => {
        try {
            let data = await getSingleDoctor(email, pass, "details")
            console.log(data)
            res.render('docprofile.ejs', { 'data': data, 'email': req.session.email });
        } catch (err) {
            console.error(err);
            return res.sendStatus(404);
        }
    })();
})

app.post('/prescribe', function(req, res) {
    let id = req.body.id
    let description = req.body.description
    let pkey = req.body.pkey
    console.log(pkey)
    res.render('docprescribe.ejs', { 'email': req.session.email, 'id': id, 'description': description, 'pkey': pkey })
})

app.post('/addprescription', function(req, res) {
    let assetID = req.body.id
    let description = req.body.description
    let pkey = req.body.pkey
    let prescription = req.body.prescription
    let id = generateOTP();
    let data = {
        'email': encrypt(req.session.email),
        'assetID': assetID,
        'description': description,
        'prescription': prescription,
        'id': id
    };
    let metadata = {
        'email': encrypt(req.session.email),
        'datetime': new Date().toString(),
        'id': id
    };
    (async() => {
        try {
            let tx = await createPrescription(data, metadata, pkey, req.session.key.privateKey)
            console.log("Transction id :", tx.id)
            res.redirect('/docdetails')
        } catch (err) {
            console.error(err);
            return res.sendStatus(404);
        }
    })();

})
