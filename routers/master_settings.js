const express = require("express");
const app = express();
const router = express.Router();
const multer  = require('multer');
const { profile, master_shop, email_settings, supervisor_settings, discount_volume_db, warehouse_validation_setup, warehouse, product } = require("../models/all_models");
const auth = require("../middleware/auth");
var timezones = require('timezones-list');
const users = require("../public/language/languages.json");
const mongoose = require("mongoose");
const PDFDocument = require('pdfkit-table');
const { Canvas } = require("canvas");
const JsBarcode = require('jsbarcode');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./public/upload")
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + file.originalname)

    }
})

const upload = multer({storage : storage});



router.get("/view", auth, async(req, res) => {
    try {
        const {username, email, role} = req.user
        const role_data = req.user

        const profile_data = await profile.findOne({email : role_data.email})

        const master = await master_shop.find()
        console.log("master" , master);

        const nDate = new Date().toLocaleString('en-US', {
            timeZone: master[0].timezone
        });
        console.log("timezone",nDate);

        if (master[0].language == "English (US)") {
            var lan_data = users.English
            console.log(lan_data);
        } else if(master[0].language == "Hindi") {
            var lan_data = users.Hindi

        }else if(master[0].language == "German") {
            var lan_data = users.German
        
        }else if(master[0].language == "Spanish") {
            var lan_data = users.Spanish
        
        }else if(master[0].language == "French") {
            var lan_data = users.French
        
        }else if(master[0].language == "Portuguese (BR)") {
            var lan_data = users.Portuguese
        
        }else if(master[0].language == "Chinese") {
            var lan_data = users.Chinese
        
        }else if(master[0].language == "Arabic (ae)") {
            var lan_data = users.Arabic
        }
        
        res.render("master_settings", {
            success: req.flash('success'),
            errors: req.flash('errors'),
            role : role_data,
            profile : profile_data,
            master_shop : master,
            timezones,
            language : lan_data
        }) 
    } catch (error) {
        console.log(error);
    }
})

router.get("/:id", auth, async(req, res) => {
    try {
        console.log("language");
        console.log(req.params.id);

        const master = await master_shop.findOne()

        master.language = req.params.id
        await master.save()
        console.log("master" , master); 

    } catch (error) {
        console.log(error);
    }
})


router.post("/view/edit_settings", auth, upload.single("image"), async(req, res) => {
    try {
        const {site_title, currency, currency_placement, timezone} = req.body;
        if (req.body.hidden == 0) {
            
            const master_shop_data = await master_shop.findOne()
            console.log("master_shop_data", master_shop_data);
            
            if (master_shop_data == "") {
                
                const data = new master_shop({ site_title, image, currency, currency_placement, timezone});
                const master_data = await data.save()
                
            } else {

                master_shop_data.site_title = site_title
                master_shop_data.currency = currency
                master_shop_data.currency_placement = currency_placement
                master_shop_data.timezone = timezone
                await master_shop_data.save()      
            }
            
        } else {
            
            const image = req.file.filename;
            const master_shop_data = await master_shop.findOne()
            console.log("2nd master_shop_data" , master_shop_data);
            
            if (master_shop_data == null) {
                console.log("1" , site_title);

                const data = new master_shop({ site_title, image, currency, currency_placement, timezone});
                const master_data = await data.save()
                
            } else {
                
                console.log("2" , site_title);
                master_shop_data.site_title = site_title
                master_shop_data.image = image
                master_shop_data.currency = currency
                master_shop_data.currency_placement = currency_placement
                master_shop_data.timezone = timezone

                await master_shop_data.save()  
            }

        }

           
        req.flash('success', `shop setting edit successfully`)
        res.redirect("/master_shop/view")
    } catch (error) {
        console.log(error);
    }
})


router.get("/view/email", auth, async(req, res) => {
    try {
        const {username, email, role} = req.user
        const role_data = req.user

        const profile_data = await profile.findOne({email : role_data.email})

        const master = await master_shop.find()
        console.log("master" , master);

        const email_data = await email_settings.findOne()
        console.log("master settings email_data", email_data);

        if (master[0].language == "English (US)") {
            var lan_data = users.English
            console.log(lan_data);
        } else if(master[0].language == "Hindi") {
            var lan_data = users.Hindi

        }else if(master[0].language == "German") {
            var lan_data = users.German
        
        }else if(master[0].language == "Spanish") {
            var lan_data = users.Spanish
        
        }else if(master[0].language == "French") {
            var lan_data = users.French
        
        }else if(master[0].language == "Portuguese (BR)") {
            var lan_data = users.Portuguese
        
        }else if(master[0].language == "Chinese") {
            var lan_data = users.Chinese
        
        }else if(master[0].language == "Arabic (ae)") {
            var lan_data = users.Arabic
        }

        res.render("email_settings", {
            success: req.flash('success'),
            errors: req.flash('errors'),
            role : role_data,
            profile : profile_data,
            master_shop : master,
            email : email_data,
            language : lan_data
        })
    } catch (error) {
        console.log(error);
    }
})


router.post("/view/email/edit_settings", auth, async(req, res) => {
    try {
        const {host, port, email, password} = req.body

        const email_data = await email_settings.findOne()

        if (email_data == null) {
            
            const data = new email_settings({host, port, email, password})
            await data.save()
            
        } else {
            
            email_data.host = host
            email_data.port = port
            email_data.email = email
            email_data.password = password
            
            await email_data.save()
        }


        req.flash('success', `shop setting edit successfully`)
        res.redirect("/master_shop/view/email")
    } catch (error) {
        console.log(error);
    }
})



router.get("/view/supervisors", auth, async(req, res) => {
    try {
        const {username, email, role} = req.user
        const role_data = req.user

        const supervisor_data = await supervisor_settings.find()
        const profile_data = await profile.findOne({email : role_data.email})
        
        const master = await master_shop.find()

        const nDate = new Date().toLocaleString('en-US', {
            timeZone: master[0].timezone
        });


        if (master[0].language == "English (US)") {
            var lan_data = users.English
            console.log(lan_data);
        } else if(master[0].language == "Hindi") {
            var lan_data = users.Hindi

        }else if(master[0].language == "German") {
            var lan_data = users.German
        
        }else if(master[0].language == "Spanish") {
            var lan_data = users.Spanish
        
        }else if(master[0].language == "French") {
            var lan_data = users.French
        
        }else if(master[0].language == "Portuguese (BR)") {
            var lan_data = users.Portuguese
        
        }else if(master[0].language == "Chinese") {
            var lan_data = users.Chinese
        
        }else if(master[0].language == "Arabic (ae)") {
            var lan_data = users.Arabic
        }
        
        res.render("supervisor_settings", {
            success: req.flash('success'),
            errors: req.flash('errors'),
            role : role_data,
            profile : profile_data,
            master_shop : master,
            supervisor_data: supervisor_data[0],
            timezones,
            language : lan_data
        })
    } catch (error) {
        console.log(error);
    }
})


router.post("/view/supervisors", auth,  async(req, res) => {
    try {
        const { rm_name, fg_name, rm_email,  fg_email, rm_mobilenum, fg_number} = req.body

        const supervisor_data = await supervisor_settings.findOne();

        if(supervisor_data == null){
            const data = new supervisor_settings({RMSName : rm_name, RMSEmail : rm_email, RMSnumber : rm_mobilenum, FGSName: fg_name , FGSEmail: fg_email , FGSnumber: fg_number})
            await data.save()
        } else {
            supervisor_data.RMSName = rm_name
            supervisor_data.RMSEmail = rm_email
            supervisor_data.RMSnumber = rm_mobilenum
            supervisor_data.FGSName = fg_name
            supervisor_data.FGSEmail = fg_email
            supervisor_data.FGSnumber = fg_number

            await supervisor_data.save();
        }

        
              
        req.flash('success', `shop setting edit successfully`)
        res.redirect("/master_shop/view/supervisors")
    } catch (error) {
        console.log(error);
    }
})


router.get("/view_data/volume_set", auth, async (req, res) => {
    try {

        const role_data = req.user
        const supervisor_data = await supervisor_settings.find()
        const profile_data = await profile.findOne({email : role_data.email})
        const master = await master_shop.find();
        const data_volume = await discount_volume_db.findOne();
        if (master[0].language == "English (US)") {
            var lan_data = users.English
            console.log(lan_data);
        } else if(master[0].language == "Hindi") {
            var lan_data = users.Hindi

        }else if(master[0].language == "German") {
            var lan_data = users.German
        
        }else if(master[0].language == "Spanish") {
            var lan_data = users.Spanish
        
        }else if(master[0].language == "French") {
            var lan_data = users.French
        
        }else if(master[0].language == "Portuguese (BR)") {
            var lan_data = users.Portuguese
        
        }else if(master[0].language == "Chinese") {
            var lan_data = users.Chinese
        
        }else if(master[0].language == "Arabic (ae)") {
            var lan_data = users.Arabic
        }

        res.render("setup_volume_discount", {
            success: req.flash('success'),
            errors: req.flash('errors'),
            role : role_data,
            profile : profile_data,
            master_shop : master,
            supervisor_data: supervisor_data[0],
            language : lan_data,
            data: data_volume
        })

    } catch (error) {
        
    }
});



router.post("/view_data/edit_volume_set", auth, async (req, res) => {
    try {

        const { min_car_edit } = req.body
        
        const data_volume = await discount_volume_db.findOne();

        if(typeof min_car_edit == "string"){
            var min_car_array = [req.body.min_car_edit];
            var max_car_array = [req.body.max_car_edit];
            var discount_price_array = [req.body.discount_price_edit]
        }else{
            var min_car_array = [...req.body.min_car_edit];
            var max_car_array = [...req.body.max_car_edit];
            var discount_price_array = [...req.body.discount_price_edit]
        }

        const newproduct = min_car_array.map((value)=>{
            
            return  value  = {
                        min_car : value,
                    }
        });

        max_car_array.forEach((value,i) => {
            newproduct[i].max_car = value
        });

        discount_price_array.forEach((value,i) => {
            newproduct[i].discount_price = value
        });


        if(data_volume == null){
            const data = new discount_volume_db({volume_discount : newproduct})
            await data.save()
        } else {
            data_volume.volume_discount = newproduct

            await data_volume.save();
        }

        req.flash('success', `Volume Discount modified successfully`)
        res.redirect("/master_shop/view_data/volume_set")
    } catch (error) {
        
    }
})


router.get("/view_data/warehouse_valid", auth, async (req, res) => {
    try {

        const role_data = req.user
        const supervisor_data = await supervisor_settings.find()
        const profile_data = await profile.findOne({email : role_data.email})
        const master = await master_shop.find();
        const warehouse_validation = await warehouse_validation_setup.find();
        // res.json(warehouse_validation);
        // return
        if (master[0].language == "English (US)") {
            var lan_data = users.English
        } else if(master[0].language == "Hindi") {
            var lan_data = users.Hindi

        }else if(master[0].language == "German") {
            var lan_data = users.German
        
        }else if(master[0].language == "Spanish") {
            var lan_data = users.Spanish
        
        }else if(master[0].language == "French") {
            var lan_data = users.French
        
        }else if(master[0].language == "Portuguese (BR)") {
            var lan_data = users.Portuguese
        
        }else if(master[0].language == "Chinese") {
            var lan_data = users.Chinese
        
        }else if(master[0].language == "Arabic (ae)") {
            var lan_data = users.Arabic
        }

        res.render("setup_warehouse_bin", {
            success: req.flash('success'),
            errors: req.flash('errors'),
            role : role_data,
            profile : profile_data,
            master_shop : master,
            supervisor_data: supervisor_data[0],
            language : lan_data,
            data: warehouse_validation
        })

    } catch (error) {
        
    }
});

router.get("/view_data/warehouse_valid/add", auth, async (req, res) => {
    try {

        const role_data = req.user
        const supervisor_data = await supervisor_settings.find()
        const profile_data = await profile.findOne({email : role_data.email})
        const master = await master_shop.find();
        const warehouse_validation = await warehouse_validation_setup.find();

        const warehouse_data = await warehouse.aggregate([
            {
                $match: { 
                    "status" : 'Enabled',
                }
            },
            {
                $group: {
                    _id: "$name",
                    name: { $first: "$name"}
                }
            },
            {
                $sort:{
                    name: 1
                }
            }
        ])
        if (master[0].language == "English (US)") {
            var lan_data = users.English
        } else if(master[0].language == "Hindi") {
            var lan_data = users.Hindi

        }else if(master[0].language == "German") {
            var lan_data = users.German
        
        }else if(master[0].language == "Spanish") {
            var lan_data = users.Spanish
        
        }else if(master[0].language == "French") {
            var lan_data = users.French
        
        }else if(master[0].language == "Portuguese (BR)") {
            var lan_data = users.Portuguese
        
        }else if(master[0].language == "Chinese") {
            var lan_data = users.Chinese
        
        }else if(master[0].language == "Arabic (ae)") {
            var lan_data = users.Arabic
        }

        res.render("setup_warehouse_bin_add", {
            success: req.flash('success'),
            errors: req.flash('errors'),
            role : role_data,
            profile : profile_data,
            master_shop : master,
            supervisor_data: supervisor_data[0],
            language : lan_data,
            data: warehouse_validation,
            warehouse: warehouse_data
        })

    } catch (error) {
        
    }
});



router.post("/view_data/warehouse_valid/add", auth, async (req, res) => {
    try {
        const { warehouse_name, room_name, prod_code} = req.body
        var the_data = room_name.split("~");
        var room = the_data[0];
        var warehouse_id = the_data[1];

        if(typeof prod_code == "string"){
            var prod_code_array = [req.body.prod_code];
            var prod_name_array = [req.body.prod_name];
            var bay_array = [req.body.bay];
            var min_data_array = [req.body.min_data];
            var max_data_array = [req.body.max_data];
            var product_id_array = [req.body.product_id];
        }else{
            var prod_name_array = [...req.body.prod_name];
            var prod_code_array = [...req.body.prod_code];
            var bay_array = [...req.body.bay];
            var min_data_array = [...req.body.min_data];
            var max_data_array = [...req.body.max_data];
            var product_id_array = [...req.body.product_id];
        }


        const newproduct = prod_code_array.map((value)=>{
            
            return  value  = {
                        product_code : value,
                    }   
        });
        prod_name_array.forEach((value,i) => {
            newproduct[i].product_name = value
        });

        bay_array.forEach((value,i) => {
            var letter = value.match(/[A-Za-z]+/)[0]; // Extracts the letter(s)
            var number = parseInt(value.match(/\d+/)[0]);

            newproduct[i].bay = letter
            newproduct[i].bin = number
        });


        min_data_array.forEach((value,i) => {
            newproduct[i].min = value
        });

        max_data_array.forEach((value,i) => {
            newproduct[i].max = value
        });


        product_id_array.forEach((value,i) => {
            newproduct[i].product_id = value
        });
        // res.json(newproduct)


        const data = new warehouse_validation_setup({ warehouse_id: warehouse_id, warehouse_name: warehouse_name, room: room, product_data : newproduct });
        const purchases_data = await data.save();

        req.flash('success', `Bin validation success`)
        res.redirect("/master_shop/view_data/edit/"+purchases_data._id)
    } catch (error) {
        console.log(error)
    }
});
router.post("/room", auth, async (req, res) => {
    try {
        const ObjectId = mongoose.Types.ObjectId;
        const { warehouse_name } = req.body

        const data_temp = await warehouse_validation_setup.aggregate([
            {
                $group: {
                    _id: "$_id",
                    warehouse_id: { $first: "$warehouse_id"}
                }
            },
        ]);
        let array_data = [];
        for (let index = 0; index <= data_temp.length-1; index++) {
            const elemetent_data_temp = data_temp[index];
            // console.log(elemetent_data_temp.warehouse_id)
            array_data.push(ObjectId(elemetent_data_temp.warehouse_id))
            
        }
        const excludedArray = array_data;
        // console.log(array_data)
        const warehouse_data = await warehouse.aggregate([
            {
                $match: { 
                    "name": warehouse_name,
                    "status" : 'Enabled',
                    "_id": { $nin: excludedArray }
                }
            },
            {
                $group: {
                    _id: "$_id",
                    room_name: { $first: "$room"}
                }
            },
            {
                $sort: {
                  room_name: 1 // 1 for ascending order, -1 for descending order
                }
          }
        ])

        res.json(warehouse_data)
    } catch (error) {
        res.json(error)
    }
});


router.post("/product_list", auth, async (req, res) => {
    try {
        const product_data = await product.find();
        res.json(product_data)
    } catch (error) {
        res.json(error)
    }
});


router.post("/get_product", auth, async (req, res) => {
    try {
        const { product_id } = req.body

        const product_data = await product.findById(product_id);
        res.json(product_data)
    } catch (error) {
        res.json(error)
    }
});




router.get("/view_data/edit/:id", auth, async (req, res) => {
    try {

        const role_data = req.user
        const supervisor_data = await supervisor_settings.find()
        const profile_data = await profile.findOne({email : role_data.email})
        const master = await master_shop.find();

        const _id_data = req.params.id
        const warehouse_validation = await warehouse_validation_setup.findById(_id_data);
        // res.json(warehouse_validation)
        const warehouse_data = await warehouse.aggregate([
            {
                $match: { 
                    "status" : 'Enabled',
                }
            },
            {
                $group: {
                    _id: "$name",
                    name: { $first: "$name"}
                }
            },
            {
                $sort:{
                    name: 1
                }
            }
        ])
        if (master[0].language == "English (US)") {
            var lan_data = users.English
        } else if(master[0].language == "Hindi") {
            var lan_data = users.Hindi

        }else if(master[0].language == "German") {
            var lan_data = users.German
        
        }else if(master[0].language == "Spanish") {
            var lan_data = users.Spanish
        
        }else if(master[0].language == "French") {
            var lan_data = users.French
        
        }else if(master[0].language == "Portuguese (BR)") {
            var lan_data = users.Portuguese
        
        }else if(master[0].language == "Chinese") {
            var lan_data = users.Chinese
        
        }else if(master[0].language == "Arabic (ae)") {
            var lan_data = users.Arabic
        }
        // console.log(warehouse_validation)
        res.render("setup_warehouse_bin_edit", {
            success: req.flash('success'),
            errors: req.flash('errors'),
            role : role_data,
            profile : profile_data,
            master_shop : master,
            supervisor_data: supervisor_data[0],
            language : lan_data,
            data: warehouse_validation,
            warehouse: warehouse_data
        })

    } catch (error) {
        
    }
});

router.post("/room_edit", auth, async (req, res) => {
    try {
        const ObjectId = mongoose.Types.ObjectId;
        const { warehouse_name } = req.body

        const data_temp = await warehouse_validation_setup.aggregate([
            {
                $group: {
                    _id: "$_id",
                    warehouse_id: { $first: "$warehouse_id"}
                }
            },
        ]);
        let array_data = [];
        for (let index = 0; index <= data_temp.length-1; index++) {
            const elemetent_data_temp = data_temp[index];
            // console.log(elemetent_data_temp.warehouse_id)
            array_data.push(ObjectId(elemetent_data_temp.warehouse_id))
            
        }
        const excludedArray = array_data;
        // console.log(array_data)
        const warehouse_data = await warehouse.aggregate([
            {
                $match: { 
                    "name": warehouse_name,
                    "status" : 'Enabled',
                    // "_id": { $nin: excludedArray }
                }
            },
            {
                $group: {
                    _id: "$_id",
                    room_name: { $first: "$room"}
                }
            },
            {
                $sort: {
                  room_name: 1 // 1 for ascending order, -1 for descending order
                }
          }
        ])

        res.json(warehouse_data)
    } catch (error) {
        res.json(error)
    }
});


router.post("/view_data/edit/:id", auth, async (req, res) => {
    try {
        const { prod_code } = req.body
        const _id_data = req.params.id
        const warehouse_validation = await warehouse_validation_setup.findById(_id_data);

        if(typeof prod_code == "string"){
            var prod_code_array = [req.body.prod_code];
            var prod_name_array = [req.body.prod_name];
            var bay_array = [req.body.bay];
            var min_data_array = [req.body.min_data];
            var max_data_array = [req.body.max_data];
            var product_id_array = [req.body.product_id];
        }else{
            var prod_name_array = [...req.body.prod_name];
            var prod_code_array = [...req.body.prod_code];
            var bay_array = [...req.body.bay];
            var min_data_array = [...req.body.min_data];
            var max_data_array = [...req.body.max_data];
            var product_id_array = [...req.body.product_id];
        }

        const newproduct = prod_code_array.map((value)=>{
            
            return  value  = {
                        product_code : value,
                    }   
        });
        prod_name_array.forEach((value,i) => {
            newproduct[i].product_name = value
        });

        bay_array.forEach((value,i) => {
            var letter = value.match(/[A-Za-z]+/)[0]; // Extracts the letter(s)
            var number = parseInt(value.match(/\d+/)[0]);

            newproduct[i].bay = letter
            newproduct[i].bin = number
        });


        min_data_array.forEach((value,i) => {
            newproduct[i].min = value
        });

        max_data_array.forEach((value,i) => {
            newproduct[i].max = value
        });


        product_id_array.forEach((value,i) => {
            newproduct[i].product_id = value
        });

        warehouse_validation.product_data = newproduct


        const warehouse_valid_data = await warehouse_validation.save()

        

        req.flash('success', `Bin Location Validation update successfully`)
        res.redirect("/master_shop/view_data/edit/"+warehouse_valid_data._id)
        // res.json(newproduct)
    } catch (error) {
        res.json(error)
    }
});



router.post("/view_data/print", auth, async (req, res) => {
    try {
        const { warehouse_id } = req.body
        const warehouose_data = await warehouse_validation_setup.findById(warehouse_id);


        const inchesToPoints = inches => inches * 72; // Convert inches to points (1 inch = 72 points)

        const sizeInInches = { width: 3, height: 1 }; // Size in inches
        // Create PDF document
        const doc = new PDFDocument({
            margin: inchesToPoints(0.75), // 0.75 inches margin on all sides (30 mm)
            size: [inchesToPoints(sizeInInches.width), inchesToPoints(sizeInInches.height)], // Set document size to 3 inches wide and 1 inch tall
            bufferPages: true
        });


        const intdata = warehouose_data.product_data.length;

        for(let i = 0; i <= intdata -1; i++){
            var data = warehouose_data.product_data[i];
            var the_data_need = warehouose_data.warehouse_name+"~"+warehouose_data.room+"~"+data.bay+"~"+data.bin;
            const imageSize = { width: 400, height: 150 }; // Size of the barcode image
            const pdfPageSize = { width: inchesToPoints(sizeInInches.width), height: inchesToPoints(sizeInInches.height) }; // Size of the PDF page
            const canvas = new Canvas();

            JsBarcode(canvas, the_data_need, {
                format: "CODE128",
                height: imageSize.height,
                displayValue: true,
                text: the_data_need
            });


            const imageBuffer = canvas.toBuffer();


             // Calculate scaling factors for width and height
             const scaleFactorWidth = pdfPageSize.width / imageSize.width;
             const scaleFactorHeight = pdfPageSize.height / imageSize.height;
 
             // Choose the smaller scaling factor to ensure the image fits within the page
             const scaleFactor = Math.min(scaleFactorWidth, scaleFactorHeight);
 
             // Calculate new dimensions based on the scaling factor
             const newWidth = imageSize.width * scaleFactor;
             const newHeight = imageSize.height * scaleFactor;
 
             // Calculate position to center the image on the page
             const xPosition = (pdfPageSize.width - newWidth) / 2;
             const yPosition = (pdfPageSize.height - newHeight) / 2;
 
             doc.image(imageBuffer, xPosition, yPosition, { width: newWidth, height: newHeight });
 
             if (i != intdata) {
                 doc.addPage();
             }


            console.log(the_data_need)
        }


        const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                // const pdfBlob = new Blob([pdfData], { type: 'application/pdf' });
                // const pdfUrl = URL.createObjectURL(pdfBlob);
                // // res.json({ pdfUrl: pdfUrl }); // Sending back the URL to the client-side
                // res.json({ pdfContent: pdfData.toString('base64') });

                const pdfBase64 = pdfData.toString('base64');
                res.json({ pdfContent: pdfBase64 });
            });

            doc.end();

        // res.json(warehouose_data)
    } catch (error) {
        res.json(error)
    }
})

module.exports = router