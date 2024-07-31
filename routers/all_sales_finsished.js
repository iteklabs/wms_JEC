const express = require("express");
const app = express();
const router = express.Router();
const { profile, master_shop, categories, brands, units, product, warehouse, staff, customer, suppliers, purchases, purchases_return, sales, sales_return, suppliers_payment, customer_payment, c_payment_data, email_settings, sales_finished, sales_return_finished, supervisor_settings, invoice_for_outgoing, sales_logs } = require("../models/all_models");
const auth = require("../middleware/auth");
const nodemailer = require('nodemailer');
const users = require("../public/language/languages.json");



router.get("/view", auth, async (req, res) => {
    try {
        const {username, email, role} = req.user
        const role_data = req.user

        const profile_data = await profile.findOne({email : role_data.email})

        const master = await master_shop.find()
        let all_data
        if(role_data.role == "staff"){
            const staff_data = await staff.findOne({ email: role_data.email })
            // all_data = await sales.find({ warehouse_name : staff_data.warehouse});

            all_data = await sales_finished.aggregate([
                // {
                //   $lookup: {
                //     from: "customers",
                //     localField: "customer",
                //     foreignField: "name",
                //     as: "customers_docs"
                //   }
                // },
                // {
                //   $unwind: "$customers_docs"
                // },
                {
                    $match: {
                        typeOfProducts: "own"
                    }
                },
                {
                  $unwind: "$sale_product"
                },
                {
                  $group: {
                    _id: "$_id",
                    invoice: { $first: "$invoice" },
                    customers: { $first: "$customer" },
                    date: { $first: "$date" },
                    warehouse_name: { $first: "$warehouse_name" },
                    sale_product: { $push: "$sale_product" },
                    note: { $first: "$note" },
                    return_data: { $first: "$return_data" },
                    customers_docs: { $first: "$customers_docs" },
                    total_saleproduct_quantity: { $sum: "$sale_product.quantity" },
                    level: { $addToSet: "$sale_product.bay" },
                    isle: { $addToSet: "$sale_product.bin" },
                    type: { $addToSet: "$sale_product.type" },
                    pallet: { $addToSet: "$sale_product.floorlevel" },
                    finalize: { $first: "$finalize" }
                  }
                  
                },
                {
                  $project: {
                    _id: 1,
                    invoice: 1,
                    customers: 1,
                    date: 1,
                    warehouse_name: 1,
                    sale_product: 1,
                    note: 1,
                    return_data: 1,
                    customers_docs: 1,
                    total_saleproduct_quantity: 1,
                    level: 1,
                    isle: 1,
                    type:1,
                    pallet: 1,
                    finalize: 1
                    
                  }
               }
            ]);

        }else{
            // all_data = await sales.find();

            all_data = await sales_finished.aggregate([
                // {
                //   $lookup: {
                //     from: "customers",
                //     localField: "customer",
                //     foreignField: "name",
                //     as: "customers_docs"
                //   }
                // },
                // {
                //   $unwind: "$customers_docs"
                // },
                {
                    $match: {
                        typeOfProducts: "own"
                    }
                },
                {
                  $unwind: "$sale_product"
                },
                {
                  $group: {
                    _id: "$_id",
                    invoice: { $first: "$invoice" },
                    customers: { $first: "$customer" },
                    date: { $first: "$date" },
                    warehouse_name: { $first: "$warehouse_name" },
                    sale_product: { $push: "$sale_product" },
                    note: { $first: "$note" },
                    return_data: { $first: "$return_data" },
                    customers_docs: { $first: "$customers_docs" },
                    total_saleproduct_quantity: { $sum: "$sale_product.quantity" },
                    level: { $addToSet: "$sale_product.bay" },
                    isle: { $addToSet: "$sale_product.bin" },
                    type: { $addToSet: "$sale_product.type" },
                    pallet: { $addToSet: "$sale_product.floorlevel" },
                    finalize: { $first: "$finalize" }
                  }
                  
                },
                {
                  $project: {
                    _id: 1,
                    invoice: 1,
                    customers: 1,
                    date: 1,
                    warehouse_name: 1,
                    sale_product: 1,
                    note: 1,
                    return_data: 1,
                    customers_docs: 1,
                    total_saleproduct_quantity: 1,
                    level: 1,
                    isle: 1,
                    type:1,
                    pallet: 1,
                    finalize: 1
                    
                  }
               }
            ]);     
        }
    

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

        res.render("all_sales_finished", {
            success: req.flash('success'),
            errors: req.flash('errors'),
            sales: all_data,
            profile : profile_data,
            role : role_data,
            master_shop : master,
            language : lan_data
        })
    } catch (error) {
        console.log(error);
    }
})


router.get("/view_log", auth, async (req, res) => {
    try {
        const {username, email, role} = req.user
        const role_data = req.user

        const profile_data = await profile.findOne({email : role_data.email})

        const master = await master_shop.find()
        let all_data
        if(role_data.role == "staff"){
            const staff_data = await staff.findOne({ email: role_data.email })
            // all_data = await sales.find({ warehouse_name : staff_data.warehouse});

            all_data = await sales_finished.aggregate([
                // {
                //   $lookup: {
                //     from: "customers",
                //     localField: "customer",
                //     foreignField: "name",
                //     as: "customers_docs"
                //   }
                // },
                // {
                //   $unwind: "$customers_docs"
                // },
                {
                    $match: {
                        typeOfProducts: "logs"
                    }
                },
                {
                  $unwind: "$sale_product"
                },
                {
                  $group: {
                    _id: "$_id",
                    invoice: { $first: "$invoice" },
                    customers: { $first: "$customer" },
                    date: { $first: "$date" },
                    warehouse_name: { $first: "$warehouse_name" },
                    sale_product: { $push: "$sale_product" },
                    note: { $first: "$note" },
                    return_data: { $first: "$return_data" },
                    customers_docs: { $first: "$customers_docs" },
                    total_saleproduct_quantity: { $sum: "$sale_product.quantity" },
                    level: { $addToSet: "$sale_product.bay" },
                    isle: { $addToSet: "$sale_product.bin" },
                    type: { $addToSet: "$sale_product.type" },
                    pallet: { $addToSet: "$sale_product.floorlevel" },
                    finalize: { $first: "$finalize" }
                  }
                  
                },
                {
                  $project: {
                    _id: 1,
                    invoice: 1,
                    customers: 1,
                    date: 1,
                    warehouse_name: 1,
                    sale_product: 1,
                    note: 1,
                    return_data: 1,
                    customers_docs: 1,
                    total_saleproduct_quantity: 1,
                    level: 1,
                    isle: 1,
                    type:1,
                    pallet: 1,
                    finalize: 1
                    
                  }
               }
            ]);

        }else{
            // all_data = await sales.find();

            all_data = await sales_finished.aggregate([
                // {
                //   $lookup: {
                //     from: "customers",
                //     localField: "customer",
                //     foreignField: "name",
                //     as: "customers_docs"
                //   }
                // },
                // {
                //   $unwind: "$customers_docs"
                // },
                {
                    $match: {
                        typeOfProducts: "logs"
                    }
                },
                {
                  $unwind: "$sale_product"
                },
                {
                  $group: {
                    _id: "$_id",
                    invoice: { $first: "$invoice" },
                    customers: { $first: "$customer" },
                    date: { $first: "$date" },
                    warehouse_name: { $first: "$warehouse_name" },
                    sale_product: { $push: "$sale_product" },
                    note: { $first: "$note" },
                    return_data: { $first: "$return_data" },
                    customers_docs: { $first: "$customers_docs" },
                    total_saleproduct_quantity: { $sum: "$sale_product.quantity" },
                    level: { $addToSet: "$sale_product.bay" },
                    isle: { $addToSet: "$sale_product.bin" },
                    type: { $addToSet: "$sale_product.type" },
                    pallet: { $addToSet: "$sale_product.floorlevel" },
                    finalize: { $first: "$finalize" }
                  }
                  
                },
                {
                  $project: {
                    _id: 1,
                    invoice: 1,
                    customers: 1,
                    date: 1,
                    warehouse_name: 1,
                    sale_product: 1,
                    note: 1,
                    return_data: 1,
                    customers_docs: 1,
                    total_saleproduct_quantity: 1,
                    level: 1,
                    isle: 1,
                    type:1,
                    pallet: 1,
                    finalize: 1
                    
                  }
               }
            ]);     
        }
    

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

        res.render("all_sales_finished_logs", {
            success: req.flash('success'),
            errors: req.flash('errors'),
            sales: all_data,
            profile : profile_data,
            role : role_data,
            master_shop : master,
            language : lan_data
        })
    } catch (error) {
        console.log(error);
    }
})


async function getRandom8DigitNumber() {
    const min = 10000000;
    const max = 99999999; 
    
    const random = Math.floor(Math.random() * (max - min + 1)) + min;
    var IDInvoice;


    const new_purchase = await sales_finished.findOne({ invoice: "OUTF-"+random });
    if (new_purchase && new_purchase.length > 0) {
        IDInvoice = "OUTF-"+random;
    }else{
        IDInvoice = "OUTF-"+random; 
    }
    return IDInvoice ;
}

router.get("/view/add_sales", auth, async (req, res) => {
    try {
        const {username, email, role} = req.user
        const role_data = req.user

        const profile_data = await profile.findOne({email : role_data.email})

        const master = await master_shop.find()
        const customer_data = await customer.find({})
        let warehouse_data
        if(role_data.role == "staff"){
            const staff_data = await staff.findOne({ email: role_data.email })
            // warehouse_data = await warehouse.find({status : 'Enabled', name: staff_data.warehouse });
            warehouse_data = await warehouse.aggregate([
                {
                    $match: { 
                        "status" : 'Enabled',
                        "name" : staff_data.warehouse,
                        // "warehouse_category" : "Finished Goods",
                        // "name": { $ne: "QA Warehouse" }
                    }
                },
                {
                    $group: {
                        _id: "$name",
                        name: { $first: "$name"}
                    }
                },
                {
                    $sort: {
                        name: 1 // 1 for ascending order, -1 for descending order
                    }
                }
            ])
        }else{
            // warehouse_data = await warehouse.find({status : 'Enabled'});
            warehouse_data = await warehouse.aggregate([
                {
                    $match: { 
                        "status": 'Enabled',
                        // "warehouse_category" : "Finished Goods",
                        // "name": { $ne: "QA Warehouse" }
                    }
                },
                {
                    $group: {
                        _id: "$name",
                        name: { $first: "$name" }
                    }
                },
                {
                    $sort: {
                        name: 1 // 1 for ascending order, -1 for descending order
                    }
                }
            ]);
            
        }
        
        const product_data = await product.find({})
        var rooms = ["Ambient","Enclosed"]

        const sales_data = await sales_finished.find({})
        const invoice_noint = sales_data.length + 1
        const invoice_no = "OUTF-" + invoice_noint.toString().padStart(5, "0")

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
        const randominv = getRandom8DigitNumber();

        randominv.then(invoicedata => {
            res.render("add_sales_finished", {
                success: req.flash('success'),
                errors: req.flash('errors'),
                role : role_data,
                profile : profile_data,
                customer: customer_data,
                warehouse: warehouse_data,
                product: product_data,
                invoice: invoicedata,
                master_shop : master,
                language : lan_data,
                rooms_data : rooms 
            })
        }).catch(error => {
            req.flash('errors', `There's a error in this transaction`)
            res.redirect("/all_sales_finished/view");
        })
    } catch (error) {
        console.log(error);
    }
})



router.get("/view/add_sales_logs", auth, async (req, res) => {
    try {
        const {username, email, role} = req.user
        const role_data = req.user

        const profile_data = await profile.findOne({email : role_data.email})

        const master = await master_shop.find()
        const customer_data = await customer.find({})
        let warehouse_data
        if(role_data.role == "staff"){
            const staff_data = await staff.findOne({ email: role_data.email })
            // warehouse_data = await warehouse.find({status : 'Enabled', name: staff_data.warehouse });
            warehouse_data = await warehouse.aggregate([
                {
                    $match: { 
                        "status" : 'Enabled',
                        "name" : staff_data.warehouse,
                        // "warehouse_category" : "Finished Goods",
                        // "name": { $ne: "QA Warehouse" }
                    }
                },
                {
                    $group: {
                        _id: "$name",
                        name: { $first: "$name"}
                    }
                },
                {
                    $sort: {
                        name: 1 // 1 for ascending order, -1 for descending order
                    }
                }
            ])
        }else{
            // warehouse_data = await warehouse.find({status : 'Enabled'});
            warehouse_data = await warehouse.aggregate([
                {
                    $match: { 
                        "status": 'Enabled',
                        // "warehouse_category" : "Finished Goods",
                        // "name": { $ne: "QA Warehouse" }
                    }
                },
                {
                    $group: {
                        _id: "$name",
                        name: { $first: "$name" }
                    }
                },
                {
                    $sort: {
                        name: 1 // 1 for ascending order, -1 for descending order
                    }
                }
            ]);
            
        }
        
        const product_data = await product.find({})
        var rooms = ["Ambient","Enclosed"]

        const sales_data = await sales_finished.find({})
        const invoice_noint = sales_data.length + 1
        const invoice_no = "OUTF-" + invoice_noint.toString().padStart(5, "0")

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
        const randominv = getRandom8DigitNumber();

        randominv.then(invoicedata => {
            res.render("add_sales_finished_logs", {
                success: req.flash('success'),
                errors: req.flash('errors'),
                role : role_data,
                profile : profile_data,
                customer: customer_data,
                warehouse: warehouse_data,
                product: product_data,
                invoice: invoicedata,
                master_shop : master,
                language : lan_data,
                rooms_data : rooms 
            })
        }).catch(error => {
            req.flash('errors', `There's a error in this transaction`)
            res.redirect("/all_sales_finished/view");
        })
    } catch (error) {
        console.log(error);
    }
})

router.post("/view/add_sales_logs", auth, async (req, res) => {
    try {
        const { invoice, date, warehouse_name, product_name, note, room, primary_code, secondary_code, prod_code,  SCRN, ReqBy, dateofreq, PO_number, typeservicesData,  typevehicle, destination, deliverydate, driver, plate, van, DRSI, TSU, TFU, mode_transpo, name_driver, type_of_products } = req.body
       
        if(typeof product_name == "string"){
            var product_name_array = [req.body.product_name]
            var stock_array = [req.body.stock]
            var quantity_array = [req.body.carton]
            var primary_code_array = [req.body.primary_code]
            var secondary_code_array = [req.body.secondary_code]
            var prod_code_array = [req.body.prod_code]
            var level_array = [req.body.level2]
            var unit_array = [req.body.primary_unit]
            var secondaryUnit_array = [req.body.secondary_unit]
            var batchcode_array = [req.body.batch_code]
            var expiry_date_array = [req.body.expiry_date]
            var product_date_array = [req.body.product_date]
            var max_per_unit_array = [req.body.max_per_unit]
            var prod_cat_array = [req.body.prod_cat]
            var RoomAssigned_array = [req.body.RoomAssigned]
            var prod_invoice_array = [req.body.prod_invoice]
            var id_transaction_from_array = [req.body.id_transaction_from]
            // var agentSelected_array = [req.body.agentSelected]
            var uuid_array = [req.body.uuid]
            var gross_price_array = [req.body.gross_price]
        }else{
            var product_name_array = [...req.body.product_name]
            var stock_array = [...req.body.stock]
            var quantity_array = [...req.body.carton]
            var primary_code_array = [...req.body.primary_code]
            var secondary_code_array = [...req.body.secondary_code]
            var prod_code_array = [...req.body.prod_code]
            var level_array = [...req.body.level2]
            var unit_array = [...req.body.primary_unit]
            var secondaryUnit_array = [...req.body.secondary_unit]
            var batchcode_array = [...req.body.batch_code]
            var expiry_date_array = [...req.body.expiry_date]
            var product_date_array = [...req.body.product_date]
            var max_per_unit_array = [...req.body.max_per_unit]
            var prod_cat_array = [...req.body.prod_cat]
            var RoomAssigned_array = [...req.body.RoomAssigned]
            var prod_invoice_array = [...req.body.prod_invoice]
            var id_transaction_from_array = [...req.body.id_transaction_from]
            // var agentSelected_array = [...req.body.agentSelected]
            var uuid_array = [...req.body.uuid]
            var gross_price_array = [...req.body.gross_price]
        } 
        const newproduct = product_name_array.map((value)=>{
            
            return  value  = {
                        product_name : value,
                    }   
            })
        stock_array.forEach((value,i) => {
            newproduct[i].stock = value
        });
        quantity_array.forEach((value,i) => {
            newproduct[i].quantity = Math.abs(value)
        });
        product_name_array.forEach((value,i) => {
            newproduct[i].agent_id = req.body.sales
        })

        gross_price_array.forEach((value,i) => {
            newproduct[i].gross_price = value
        })


        uuid_array.forEach((value,i) => {
            newproduct[i].uuid = value
        })
        id_transaction_from_array.forEach((value,i) => {
            newproduct[i].id_transaction_from = value
        });
        primary_code_array.forEach((value,i) => {
            newproduct[i].primary_code = value
        });
        secondary_code_array.forEach((value,i) => {
            newproduct[i].secondary_code = value
        });
        prod_code_array.forEach((value,i) => {
            newproduct[i].product_code = value
        });
        level_array.forEach((value,i) => {
            var letter = value.match(/[A-Za-z]+/)[0]; // Extracts the letter(s)
            var number = parseInt(value.match(/\d+/)[0]);


            // console.log(value)
            newproduct[i].bay = number
            newproduct[i].level = letter
        });
        unit_array.forEach((value,i) => {
            newproduct[i].unit = value
        });
        secondaryUnit_array.forEach((value,i) => {
            newproduct[i].secondary_unit = value
        });
        batchcode_array.forEach((value,i) => {
            newproduct[i].batch_code = value
        });
        expiry_date_array.forEach((value, i) => {
            newproduct[i].expiry_date = value
        })
        product_date_array.forEach((value, i) => {
            newproduct[i].production_date = value
        })
        max_per_unit_array.forEach((value, i) => {
            newproduct[i].maxperunit = value
        })
        prod_cat_array.forEach((value, i) =>{
            newproduct[i].prod_cat = value
        })
        RoomAssigned_array.forEach((value, i) =>{
            newproduct[i].room_name = value
        })
        prod_invoice_array.forEach((value, i) =>{
            newproduct[i].invoice = value
            newproduct[i].date_data = date
        })

        const Invoice_out = new sales_logs();
        await Invoice_out.save();


        prod_invoice_array.forEach((value, i) =>{
            newproduct[i].outgoing_invoice = "LOG-OUT-" + Invoice_out.invoice_init.toString().padStart(8, '0')
        })

        var error = 0
        newproduct.forEach(data => {
            // console.log(parseFloat(data.stock) + "<" + parseFloat(data.quantity) + "&&" + parseFloat(data.quantity) + ">" + parseFloat(data.stock));
            if (parseFloat(data.stock) < parseFloat(data.quantity) && parseFloat(data.quantity) > parseFloat(data.stock)) {
                console.log(data.stock + " <> " + data.quantity)
                error++
            }
        })
        if (error != 0) {
            
            req.flash("errors", `Must not be greater or less than stock Qty`)
            return res.redirect("back")
        }
        const Newnewproduct = newproduct.filter(obj => obj.quantity !== "0" && obj.quantity !== "");
        
        const data = new sales_finished({ invoice: "LOG-OUT-" + Invoice_out.invoice_init.toString().padStart(8, '0'), sales_data: req.body.sales, customer: req.body.customer, date, warehouse_name, sale_product:Newnewproduct, note, room, primary_code, secondary_code, prod_code, SCRN, finalize: "False", mode_transpo,name_driver, ReqBy, dateofreq, PO_number, typeservicesData, typevehicle, destination, deliverydate, driver, plate, van, DRSI, TSU, TFU, typeOfProducts: type_of_products })
        const purchases_data = await data.save()
        const new_sales = await sales_finished.findOne({ invoice: invoice });
        req.flash("success", "Sales Add successfully")
        res.redirect("/all_sales_finished/preview/"+purchases_data._id)
    } catch (error) {
        console.log(error);
    }
})

// ======= product ajax router ========= //

router.get("/view/add_sales/:id", auth, async (req, res) => {
    try {
        const warehouse = req.params.id
        console.log(warehouse);
        const product_data = await product.find()

        const purchases_data = await purchases.aggregate([
            {
                $match: { "warehouse_name": warehouse }
            },
            {
                $unwind: "$product"
            },
            {
                $group: {
                    _id: "$product.product_name", 
                }
            },
        ])
        console.log("purchases_data" , purchases_data);

        res.status(200).json({ purchases_data, product_data })
    } catch (error) {
        console.log(error);
    }
})

// ======= product ajax router end ========= //


router.post("/view/add_sale/product", auth, async (req, res) => {   
    try {
        const { warehouse_data, product_data } = req.body
        console.log(req.body.product_data);;

        const master = await master_shop.find()
        console.log("master" , master);

        const new_product = await product.findOne({name : product_data})
        console.log("product", new_product);

        const stock_data = await warehouse.aggregate([
            {
                $match: { "name": warehouse_data }
            },
            {
                $unwind: "$product_details"
            },
            {
                $match: { "product_details.product_name": product_data }
            },
            {
                $group: {
                    _id: "$product_details.product_name",
                    product_stock: { $first: "$product_details.product_stock" }
                }
            },
        ])
        console.log("stock_data", stock_data);
            
        
        res.status(200).json({master, new_product, stock_data})
    } catch (error) {
        console.log(error);
    }
})


router.post("/view/add_sales", auth, async (req, res) => {
    try {
        const { invoice, date, warehouse_name, product_name, note, room, primary_code, secondary_code, prod_code,  SCRN, ReqBy, dateofreq, PO_number, typeservicesData,  typevehicle, destination, deliverydate, driver, plate, van, DRSI, TSU, TFU, mode_transpo, name_driver, pull_out_date, actual_delivery_date } = req.body
       
        if(typeof product_name == "string"){
            var product_name_array = [req.body.product_name]
            var stock_array = [req.body.stock]
            var quantity_array = [req.body.carton]
            var primary_code_array = [req.body.primary_code]
            var secondary_code_array = [req.body.secondary_code]
            var prod_code_array = [req.body.prod_code]
            var level_array = [req.body.level2]
            var unit_array = [req.body.primary_unit]
            var secondaryUnit_array = [req.body.secondary_unit]
            var batchcode_array = [req.body.batch_code]
            var expiry_date_array = [req.body.expiry_date]
            var product_date_array = [req.body.product_date]
            var max_per_unit_array = [req.body.max_per_unit]
            var prod_cat_array = [req.body.prod_cat]
            var RoomAssigned_array = [req.body.RoomAssigned]
            var prod_invoice_array = [req.body.prod_invoice]
            var id_transaction_from_array = [req.body.id_transaction_from]
            // var agentSelected_array = [req.body.agentSelected]
            var uuid_array = [req.body.uuid]
            var gross_price_array = [req.body.gross_price]
        }else{
            var product_name_array = [...req.body.product_name]
            var stock_array = [...req.body.stock]
            var quantity_array = [...req.body.carton]
            var primary_code_array = [...req.body.primary_code]
            var secondary_code_array = [...req.body.secondary_code]
            var prod_code_array = [...req.body.prod_code]
            var level_array = [...req.body.level2]
            var unit_array = [...req.body.primary_unit]
            var secondaryUnit_array = [...req.body.secondary_unit]
            var batchcode_array = [...req.body.batch_code]
            var expiry_date_array = [...req.body.expiry_date]
            var product_date_array = [...req.body.product_date]
            var max_per_unit_array = [...req.body.max_per_unit]
            var prod_cat_array = [...req.body.prod_cat]
            var RoomAssigned_array = [...req.body.RoomAssigned]
            var prod_invoice_array = [...req.body.prod_invoice]
            var id_transaction_from_array = [...req.body.id_transaction_from]
            // var agentSelected_array = [...req.body.agentSelected]
            var uuid_array = [...req.body.uuid]
            var gross_price_array = [...req.body.gross_price]
        } 
        const newproduct = product_name_array.map((value)=>{
            
            return  value  = {
                        product_name : value,
                    }   
            })
        stock_array.forEach((value,i) => {
            newproduct[i].stock = value
        });
        quantity_array.forEach((value,i) => {
            newproduct[i].quantity = Math.abs(value)
        });
        product_name_array.forEach((value,i) => {
            newproduct[i].agent_id = req.body.sales
        })

        gross_price_array.forEach((value,i) => {
            newproduct[i].gross_price = value
        })


        uuid_array.forEach((value,i) => {
            newproduct[i].uuid = value
        })
        id_transaction_from_array.forEach((value,i) => {
            newproduct[i].id_transaction_from = value
        });
        primary_code_array.forEach((value,i) => {
            newproduct[i].primary_code = value
        });
        secondary_code_array.forEach((value,i) => {
            newproduct[i].secondary_code = value
        });
        prod_code_array.forEach((value,i) => {
            newproduct[i].product_code = value
        });
        level_array.forEach((value,i) => {
            var letter = value.match(/[A-Za-z]+/)[0]; // Extracts the letter(s)
            var number = parseInt(value.match(/\d+/)[0]);


            // console.log(value)
            newproduct[i].bay = number
            newproduct[i].level = letter
        });
        unit_array.forEach((value,i) => {
            newproduct[i].unit = value
        });
        secondaryUnit_array.forEach((value,i) => {
            newproduct[i].secondary_unit = value
        });
        batchcode_array.forEach((value,i) => {
            newproduct[i].batch_code = value
        });
        expiry_date_array.forEach((value, i) => {
            newproduct[i].expiry_date = value
        })
        product_date_array.forEach((value, i) => {
            newproduct[i].production_date = value
        })
        max_per_unit_array.forEach((value, i) => {
            newproduct[i].maxperunit = value
        })
        prod_cat_array.forEach((value, i) =>{
            newproduct[i].prod_cat = value
        })
        RoomAssigned_array.forEach((value, i) =>{
            newproduct[i].room_name = value
        })
        prod_invoice_array.forEach((value, i) =>{
            newproduct[i].invoice = value
            newproduct[i].date_data = date
        })

        const Invoice_out = new invoice_for_outgoing();
        await Invoice_out.save();


        prod_invoice_array.forEach((value, i) =>{
            newproduct[i].outgoing_invoice = "OUT-" + Invoice_out.invoice_init.toString().padStart(8, '0')
        })



        

        

        var error = 0
        newproduct.forEach(data => {
            // console.log(parseFloat(data.stock) + "<" + parseFloat(data.quantity) + "&&" + parseFloat(data.quantity) + ">" + parseFloat(data.stock));
            if (parseFloat(data.stock) < parseFloat(data.quantity) && parseFloat(data.quantity) > parseFloat(data.stock)) {
                console.log(data.stock + " <> " + data.quantity)
                error++
            }
        })
        if (error != 0) {
            
            req.flash("errors", `Must not be greater or less than stock Qty`)
            return res.redirect("back")
        }
        const Newnewproduct = newproduct.filter(obj => obj.quantity !== "0" && obj.quantity !== "");
        
        const data = new sales_finished({ invoice: "OUT-" + Invoice_out.invoice_init.toString().padStart(8, '0'), sales_data: req.body.sales, customer: req.body.customer, date, warehouse_name, sale_product:Newnewproduct, note, room, primary_code, secondary_code, prod_code, SCRN, finalize: "False", mode_transpo,name_driver, ReqBy, dateofreq, PO_number, typeservicesData, typevehicle, destination, deliverydate, driver, plate, van, DRSI, TSU, TFU, pullout_date: pull_out_date, actualdelivery_date: actual_delivery_date, typeOfProducts: "own" })
        const purchases_data = await data.save()
        const new_sales = await sales_finished.findOne({ invoice: invoice });
        req.flash("success", "Sales Add successfully")
        res.redirect("/all_sales_finished/preview/"+purchases_data._id)
    } catch (error) {
        console.log(error);
    }
})

//View Only for Pre finalize
router.get("/preview/:id", auth , async (req, res) => {
    try {
        const {username, email, role} = req.user
        const role_data = req.user

        const profile_data = await profile.findOne({email : role_data.email})

        const master = await master_shop.find()
        // console.log("master" , master);

        const _id = req.params.id

        const user_id = await sales_finished.findById(_id);
        
         const stock_data = await warehouse.aggregate([
            {
                $match: { 
                    "name": user_id.warehouse_name,
                    // "room": user_id.room 
                }
            },
            {
                $unwind: "$product_details"
            },
            {
                $group: {
                    _id: "$product_details._id",
                    name: { $first: "$product_details.product_name"},
                    product_stock: { $first: "$product_details.product_stock" },
                    bay: { $first: "$product_details.bay" },
                    bin: { $first: "$product_details.bin" },
                    type: { $first: "$product_details.type" },
                    floorlevel: { $first: "$product_details.floorlevel" },
                    primary_code: { $first: "$product_details.primary_code" },
                    secondary_code: { $first: "$product_details.secondary_code" },
                    product_code: { $first: "$product_details.product_code" },
                    storage: { $first: "$product_details.storage" },
                    rack: { $first: "$product_details.rack" },
                    expiry_date : { $first: "$product_details.expiry_date" },
                    production_date: { $first: "$product_details.production_date" },
                    batch_code : { $first: "$product_details.batch_code" },
                    room: { $first: "$room" },
                    room_data: {$first: "$product_details.room_name" }
                   
                }
            },
        ])


        // const RoomAll = user_id.sale_product;
        
        // const results = [];
        // async function fetchStockData(value) {
        //     // console.log(value)
        //     const stock_data1 = await warehouse.aggregate([
        //         {
        //             $match: { 
        //                 "name": user_id.warehouse_name,
        //                 "room": value ,
        //                 "warehouse_category": "Finished Goods"
        //             }
        //         },
        //         {
        //             $unwind: "$product_details"
        //         },
        //         {
        //             $group: {
        //                 _id: "$product_details._id",
        //                 name: { $first: "$product_details.product_name"},
        //                 product_stock: { $first: "$product_details.product_stock" },
        //                 bay: { $first: "$product_details.bay" },
        //                 primary_code: { $first: "$product_details.primary_code" },
        //                 secondary_code: { $first: "$product_details.secondary_code" },
        //                 product_code: { $first: "$product_details.product_code" },
        //                 storage: { $first: "$product_details.storage" },
        //                 rack: { $first: "$product_details.rack" },
        //                 expiry_date : { $first: "$product_details.expiry_date" },
        //                 production_date: { $first: "$product_details.production_date" },
        //                 batch_code : { $first: "$product_details.batch_code" },
        //                 roomNamed: {$first : "$room" }
        //             }
        //         },
        //     ])
        //     results.push(stock_data1);
        // }

        // // res.json(RoomAll)
        // // return
        // const promises = RoomAll.map((value) => fetchStockData(value.room_name));
        // await Promise.all(promises);
        
// res.json(results)

        const customer_data = await customer.find({})
        // console.log("customer_data", customer_data);
        // const warehouse_data = await warehouse.find({status : 'Enabled'})
        let warehouse_data
        if(role_data.role == "staff"){
            const staff_data = await staff.findOne({ email: role_data.email })
            // warehouse_data = await warehouse.find({status : 'Enabled', name: staff_data.warehouse });
            warehouse_data = await warehouse.aggregate([
                {
                    $match: { 
                        "status" : 'Enabled', 
                        "name": staff_data.warehouse 
                    }
                },
                {
                    $group: {
                        _id: "$name",
                        name: { $first: "$name"}
                    }
                },
            ])
        }else{
            warehouse_data = await warehouse.aggregate([
                {
                    $match: { 
                        "status" : 'Enabled'
                    }
                },
                {
                    $group: {
                        _id: "$name",
                        name: { $first: "$name"}
                    }
                },
            ])
        }

        const product_data = await product.find({})

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

        res.render("edit_sales_finished_view", {
            success: req.flash('success'),
            errors: req.flash('errors'),
            role : role_data,
            profile : profile_data,
            customer: customer_data,
            warehouse: warehouse_data,
            product: stock_data,
            user: user_id,
            master_shop : master,
            unit: product_data,
            language : lan_data,
        
            
        })
    } catch (error) {
        console.log(error);
    }
})


async function dataUpdate(id_warehouse, detl_id, value){

    await warehouse.updateOne(
        { 
            _id: id_warehouse, // Warehouse ID
            "product_details._id": detl_id // Product detail ID
        },
        { 
            $set: { 
                "product_details.$.product_stock": value // Replace updatedStockValue with the new stock value
            } 
        }
    );


    return await warehouse.findById(id_warehouse);

}

router.post("/preview/:id", auth , async (req, res) => {
    try {
        const _id = req.params.id

        
        const { invoice, warehouse_name, room } = req.body
       
         // --------- warehouse ------- //
        const new_sales = await sales_finished.findOne({ invoice: invoice });
        // res.json(new_sales);
        // return
        for (let index = 0; index <= new_sales.sale_product.length-1; index++) {
            const element = new_sales.sale_product[index];
            var warehouse_data = await warehouse.findOne({ name: warehouse_name, room: element.room_name });
            var totalstock = 0;
            // deduct in warehouse
            for (let a = 0; a <= warehouse_data.product_details.length-1; a++) {
                const warehouse_detl = warehouse_data.product_details[a];
                if (warehouse_detl._id == element.id_transaction_from && warehouse_detl.uuid == element.uuid) {
                    totalstock = Math.max(0, Math.abs(warehouse_detl.product_stock) - Math.abs(element.quantity))
                    await warehouse.updateOne(
                        { 
                            _id: warehouse_data._id.valueOf(),
                            "product_details._id": warehouse_detl._id.valueOf(),
                            "product_details.uuid": element.uuid
                        },
                        { 
                            $set: { 
                                "product_details.$.product_stock": totalstock // Replace updatedStockValue with the new stock value
                            } 
                        }
                    );
                }
                
            }
            // add in sales
           
            
            console.log(typeof element.agent_id)
            if(typeof element.agent_id !== "undefined"){
                var to_sales_data = await staff.findById(element.agent_id);
                console.log("here")
                var c = 0;
                for (let b = 0; b <= to_sales_data.product_list.length-1; b++) {
                    const staff_data = to_sales_data.product_list[b];
                    console.log(element.id_transaction_from + " == " + staff_data.warehouse_id + " && " + element._id + " == " + element._id)
                    if(element.id_transaction_from == staff_data.warehouse_id && element._id == 1){
                        staff_data.product_stock = Math.abs(staff_data.product_stock) + Math.abs(element.quantity)
                        c++;
                    }
                    
                }

                console.log("int",c)
                if (c == "0") {
                    to_sales_data.product_list = to_sales_data.product_list.concat({ 
                        product_name: element.product_name, 
                        product_stock: element.quantity, 
                        bay: element.bay, 
                        level: element.level, 
                        product_code: element.product_code, 
                        primary_code: element.primary_code, 
                        secondary_code: element.secondary_code, 
                        expiry_date: element.expiry_date,
                        production_date: element.production_date,
                        maxProducts: element.maxProducts,
                        batch_code: element.batch_code,
                        secondary_unit: element.secondary_unit,
                        unit: element.unit,
                        maxProducts: element.maxProducts,
                        maxPerUnit: element.maxperunit,
                        invoice: element.invoice,
                        warehouse_id: element.id_transaction_from,
                        id_incoming: element._id,
                        uuid: element.uuid, 
                        gross_price: element.gross_price,
                        date_incoming: element.date_data,
                        outgoing_invoice: element.outgoing_invoice
                    })
                    await to_sales_data.save();
                }
            }
            
        }
                new_sales.finalize = "True"
                const sales_data = await new_sales.save()
                const master = await master_shop.find()
                const email_data = await email_settings.findOne()
                const supervisor_data = await supervisor_settings.find();
                var product_list = new_sales.sale_product
                var arrayItems = "";
                var n;

                for (n in product_list) {
                    arrayItems +=  '<tr>'+
                                        '<td style="border: 1px solid black;">' + product_list[n].product_name + '</td>' +
                                        '<td style="border: 1px solid black;">' + product_list[n].product_code + '</td>' +  
                                        '<td style="border: 1px solid black;">' + product_list[n].quantity + '</td>' +
                                        '<td style="border: 1px solid black;">' + product_list[n].unit + '</td>' +
                                        '<td style="border: 1px solid black;">' + product_list[n].secondary_unit + '</td>' +
                                        '<td style="border: 1px solid black;">' + new_sales.warehouse_name + '</td>' +
                                        '<td style="border: 1px solid black;">' + product_list[n].room_name + '</td>' +
                                        '<td style="border: 1px solid black;">' + product_list[n].bay+ '</td>'
                }

            // if(email_data.length > 0){
            //     let mailTransporter = nodemailer.createTransport({
            //         host: email_data.host,
            //         port: Number(email_data.port),
            //         secure: false,
            //         auth: {
            //             user: email_data.email,
            //             pass: email_data.password
            //         }
            //     });
            //     let mailDetails = {
            //         from: email_data.email,
            //         to: supervisor_data[0].FGSEmail,
            //         subject:'Sales Mail',
            //         attachments: [{
            //             filename: 'Logo.png',
            //             path: __dirname + '/../public' +'/upload/'+master[0].image,
            //             cid: 'logo'
            //         }],
            //         html:'<!DOCTYPE html>'+
            //             '<html><head><title></title>'+
            //             '</head><body>'+
            //                 '<div>'+
            //                     '<div style="display: flex; align-items: center; justify-content: center;">'+
            //                         '<div>'+
            //                             '<img src="cid:logo" class="rounded" width="66.5px" height="66.5px"></img>'+
            //                         '</div>'+
                                
            //                         '<div>'+
            //                             '<h2> '+ master[0].site_title +' </h2>'+
            //                         '</div>'+
            //                     '</div>'+
            //                     '<hr class="my-3">'+
            //                     '<div>'+
            //                         '<h5 style="text-align: left;">'+
            //                             ' Order Number : '+ new_sales.invoice +' '+
            //                             '<span style="float: right;">'+
            //                                 ' Order Date : '+ new_sales.date +' '+
            //                             '</span>'+
                                        
            //                         '</h5>'+
            //                     '</div>'+
            //                     '<table style="width: 100% !important;">'+
            //                         '<thead style="width: 100% !important;">'+
            //                             '<tr>'+
            //                                 '<th style="border: 1px solid black;"> Product Name </th>'+
            //                                 '<th style="border: 1px solid black;"> Product Code </th>'+
            //                                 '<th style="border: 1px solid black;"> Product Quantity </th>'+
            //                                 '<th style="border: 1px solid black;"> Unit </th>'+
            //                                 '<th style="border: 1px solid black;"> Secondary Unit </th>'+
            //                                 '<th style="border: 1px solid black;"> Warehouse</th>'+
            //                                 '<th style="border: 1px solid black;"> Room</th>'+
            //                                 '<th style="border: 1px solid black;"> Location </th>'+
            //                             '</tr>'+
            //                         '</thead>'+
            //                         '<tbody style="text-align: center;">'+
            //                             ' '+ arrayItems +' '+
            //                         '</tbody>'+
            //                     '</table>'+
                            
            //                     '<div>'+
            //                         '<strong> Regards </strong>'+
            //                         '<h5>'+ master[0].site_title +'</h5>'+
            //                     '</div>'+
            //                 '</div>'+
            //             '</body></html>'
            //     };
            //     mailTransporter.sendMail(mailDetails, function(err, data) {
            //         if(err) {
            //             console.log(err);
            //             console.log('Error Occurs');
            //         } else {
            //             console.log('Email sent successfully');
            //         }
            //     });
            // }
                req.flash("success", `Sales Update successfully`)
                res.redirect("/picking_list/pdf/"+_id)
    } catch (error) {
        console.log(error);
    }
})

//end




router.get("/view/:id", auth , async (req, res) => {
    try {
        const {username, email, role} = req.user
        const role_data = req.user

        const profile_data = await profile.findOne({email : role_data.email})

        const master = await master_shop.find()
        // console.log("master" , master);

        const _id = req.params.id

        const user_id = await sales_finished.findById(_id);
        let expiry_date = new Date(user_id.expiry_date)
        let ed_day = ('0' + expiry_date.getDate()).slice(-2)
        let ed_month = ('0' + (expiry_date.getMonth() + 1)).slice(-2)
        let ed_year = expiry_date.getFullYear()
        let ed_fullDate = `${ed_year}-${ed_month}-${ed_day}`
        
        // console.log("user_id", user_id);
         var rooms = ["Ambient","Enclosed"]
         const stock_data = await warehouse.aggregate([
            {
                $match: { 
                    "name": user_id.warehouse_name,
                    "room": user_id.room 
                }
            },
            {
                $unwind: "$product_details"
            },
            {
                $group: {
                    _id: "$product_details._id",
                    name: { $first: "$product_details.product_name"},
                    product_stock: { $first: "$product_details.product_stock" },
                    bay: { $first: "$product_details.bay" },
                    bin: { $first: "$product_details.bin" },
                    type: { $first: "$product_details.type" },
                    floorlevel: { $first: "$product_details.floorlevel" },
                    primary_code: { $first: "$product_details.primary_code" },
                    secondary_code: { $first: "$product_details.secondary_code" },
                    product_code: { $first: "$product_details.product_code" },
                    storage: { $first: "$product_details.storage" },
                    rack: { $first: "$product_details.rack" },
                }
            },
        ])

        


        const customer_data = await customer.find({})
        // console.log("customer_data", customer_data);
        // const warehouse_data = await warehouse.find({status : 'Enabled'})
        let warehouse_data
        if(role_data.role == "staff"){
            const staff_data = await staff.findOne({ email: role_data.email })
            // warehouse_data = await warehouse.find({status : 'Enabled', name: staff_data.warehouse });
            warehouse_data = await warehouse.aggregate([
                {
                    $match: { 
                        "status" : 'Enabled', 
                        "name": staff_data.warehouse 
                    }
                },
                {
                    $group: {
                        _id: "$name",
                        name: { $first: "$name"}
                    }
                },
            ])
        }else{
            warehouse_data = await warehouse.aggregate([
                {
                    $match: { 
                        "status" : 'Enabled'
                    }
                },
                {
                    $group: {
                        _id: "$name",
                        name: { $first: "$name"}
                    }
                },
            ])
        }

        const product_data = await product.find({})

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

        res.render("edit_sales_finished", {
            success: req.flash('success'),
            errors: req.flash('errors'),
            role : role_data,
            profile : profile_data,
            customer: customer_data,
            warehouse: warehouse_data,
            product: stock_data,
            user: user_id,
            master_shop : master,
            unit: product_data,
            language : lan_data,
            rooms_data: rooms,
            ed_fullDate
            
        })
    } catch (error) {
        console.log(error);
    }
})

router.post("/view/:id", auth , async (req, res) => {
    try {
        const _id = req.params.id

        const old_sales = await sales_finished.findOne({ _id: req.params.id })
        const old_warehouse_data = await warehouse.findOne({ name: old_sales.warehouse_name, room: req.body.room, warehouse_category: "Finished Goods"  });

        
        const { invoice, customer, date, warehouse_name, product_name, stock, adjust_qty, note, room, primary_code, secondary_code, prod_code, level,isle, pallet, expiry_date } = req.body

        // res.status(200).send(req.body)
        if(typeof product_name == "string"){
            var product_name_array = [req.body.product_name]
            var stock_array = [req.body.stock]
            var quantity_array = [req.body.adjust_qty]
            var primary_code_array = [req.body.primary_code]
            var secondary_code_array = [req.body.secondary_code]
            var prod_code_array = [req.body.prod_code]
            var level_array = [req.body.level]
            var expiry_date_array = [req.body.expiry_date]
            
        }else{
            var product_name_array = [...req.body.product_name]
            var stock_array = [...req.body.stock]
            var quantity_array = [...req.body.adjust_qty]
            var primary_code_array = [...req.body.primary_code]
            var secondary_code_array = [...req.body.secondary_code]
            var prod_code_array = [...req.body.prod_code]
            var level_array = [...req.body.level]
            var expiry_date_array = [...req.body.expiry_date]

        } 
        
        const newproduct = product_name_array.map((value)=>{
            
            return  value  = {
                        product_name : value,
                    }   
            })
             
        stock_array.forEach((value,i) => {
            newproduct[i].stock = value
        });

        quantity_array.forEach((value,i) => {
            newproduct[i].quantity = value
        });
        
        
        primary_code_array.forEach((value,i) => {
            newproduct[i].primary_code = value
        });
        
        
        secondary_code_array.forEach((value,i) => {
            newproduct[i].secondary_code = value
        });
        
        prod_code_array.forEach((value,i) => {
            newproduct[i].product_code = value
        });

        level_array.forEach((value,i) => {
            newproduct[i].level = value
        });

        expiry_date_array.forEach((value, i) => {
            newproduct[i].expiry_date = value
        })

        var error = 0
        newproduct.forEach(data => {
            console.log("foreach newproduct", data);
            if (parseInt(data.stock) < parseInt(data.quantity) || parseInt(data.quantity) == 0 ) {
                
                error++
            }
        })
        if (error != 0) {
            
            req.flash("errors", `Must not be greater than stock Qty`)
            return res.redirect("back")
        }


        old_sales.sale_product.forEach(product_details => {

            const match_data = old_warehouse_data.product_details.map((data) => {

                // if (data.product_name == product_details.product_name && product_details.pallet == data.pallet) {
                if (data.product_name == product_details.product_name &&  data.bay == product_details.bay) {
                    data.product_stock = parseInt(data.product_stock) + parseInt(product_details.quantity)
                
                }

            })
        })

        await old_warehouse_data.save()


        const Newnewproduct = newproduct.filter(obj => obj.quantity !== "0" && obj.quantity !== "");

        old_sales.invoice = invoice
        old_sales.customer = customer
        old_sales.date = date
        old_sales.warehouse_name = warehouse_name
        old_sales.sale_product = Newnewproduct
        old_sales.note = note
        old_sales.room = room

        
        const new_data = await old_sales.save()

        
        const new_sales_data = await sales_finished.findOne({ _id: req.params.id });

        const new_warehouse_data = await warehouse.findOne({ name: warehouse_name, room: room, warehouse_category: "Finished Goods"  });

        new_sales_data.sale_product.forEach(product_details => {

            const match_data = new_warehouse_data.product_details.map((data) => {

                // if (data.product_name == product_details.product_name && product_details.pallet == data.pallet ) {
                if (data.product_name == product_details.product_name  && data.bay == product_details.bay ) {
                    data.product_stock = parseInt(data.product_stock) - parseInt(product_details.quantity)   
                }

            })
        })
        
        console.log("final", new_warehouse_data);
        await new_warehouse_data.save()


        // -------- supplier payment ------- //

        const c_payment = await c_payment_data.findOne({invoice : req.body.invoice})

        c_payment.suppliers = req.body.suppliers


        await c_payment.save()

        // -------- supplier payment end ------- //

        req.flash("success", `Sales Update successfully`)
        res.redirect("/all_sales_finished/view")

    } catch (error) {
        console.log(error);
    }
})

// ========= Give Payment ============= //

router.post("/give_payment/:id", auth , async (req, res) => {
    try {
        const _id = req.params.id;
        const { invoice, customer, receivable_amount, received_amount } = req.body

        const data = await sales.findById(_id)
        console.log(data);

        var subtract = receivable_amount - received_amount
        console.log(received_amount);

        data.received_amount = parseFloat(received_amount) + parseFloat(data.received_amount)
        data.due_amount = subtract

        console.log(data);
        const new_data = await data.save();


        // -------- c_payment ------- //

        const c_payment = await c_payment_data.findOne({invoice : invoice})
        c_payment.amount = subtract

        await c_payment.save()

        // -------- c_payment end ------- //


        // -------- supplier payment ------- //

        let date_ob = new Date();
        let newdate = ("0" + date_ob.getDate()).slice(-2);
        let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
        let year = date_ob.getFullYear();
        let final_date = year + "-" + month + "-" + newdate
       
        const customer_payment_data = new customer_payment({invoice, date : year + "-" + month + "-" + newdate, customer, reason : "Received Payment For Sale", amount : received_amount})

        const new_customer_payment = await customer_payment_data.save()

        // -------- supplier payment end ------- //

        req.flash('success', `payment successfull`)
        res.redirect("/all_sales/view")
    } catch (error) {
        console.log(error);
    }
})

router.get("/invoice/:id", auth, async (req, res) => {
    try {
        const {username, email, role} = req.user
        const role_data = req.user

        const profile_data = await profile.findOne({email : role_data.email})

        const master = await master_shop.find()
        console.log("master" , master);

        const _id = req.params.id

        const user_id = await sales.findById(_id);
        console.log(user_id);
        
        const customer_data = await customer.findOne({ name : user_id.customer });
        console.log(customer_data);

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
        
        res.render("sales_invoice", {
            success: req.flash('success'),
            errors: req.flash('errors'),
            role : role_data,
            profile : profile_data,
            master_shop : master,
            customers : customer_data,
            sales : user_id,
            language : lan_data
        })
    } catch (error) {
        console.log(error);
    }
})

// ============ return sales ============= //

router.get("/view/return_sales/:id", auth , async (req, res) => {
    try {
        const {username, email, role} = req.user
        const role_data = req.user

        const profile_data = await profile.findOne({email : role_data.email})

        const master = await master_shop.find()
        // console.log("master" , master);

        const _id = req.params.id
        // console.log(_id);

        const user_id = await sales_finished.findById(_id);
        // console.log("user_id" , user_id);
        // res.status(200).json({ message: user_id })
        const stock_data = await warehouse.aggregate([
            {
                $match: { 
                    "name": user_id.warehouse_name,
                }
            },
            {
                $unwind: "$product_details"
            },
            {
                $group: {
                    _id: "$product_details._id",
                    name: { $first: "$product_details.product_name"},
                    product_stock: { $first: "$product_details.product_stock" },
                    bay: { $first: "$product_details.bay" },
                    bin: { $first: "$product_details.bin" },
                    type: { $first: "$product_details.type" },
                    floorlevel: { $first: "$product_details.floorlevel" },
                    primary_code: { $first: "$product_details.primary_code" },
                    secondary_code: { $first: "$product_details.secondary_code" },
                    product_code: { $first: "$product_details.product_code" },
                    storage: { $first: "$product_details.storage" },
                    rack: { $first: "$product_details.rack" },
                    expiry_date : { $first: "$product_details.expiry_date" },
                    production_date : { $first: "$product_details.production_date" },
                    unit : { $first: "$product_details.unit" },
                    secondary_unit : { $first: "$product_details.secondary_unit" },
                    maxProducts : { $first: "$product_details.maxProducts" },
                    batch_code : { $first: "$product_details.batch_code" },
                    maxPerUnit : { $first: "$product_details.maxPerUnit" }
                }
            },
        ])
        // res.status(200).json({ message: stock_data })
        // console.log("stock_data", stock_data);

        const product_data = await product.find({})


        // const warehouse_data = await warehouse.find()
        const warehouse_data = await warehouse.aggregate([
            {
                $match: { 
                    "status": 'Enabled',
                    "warehouse_category": "Finished Goods",
                    "name": { $ne: "Return Goods", $ne: "Quality Inspection" }
                }
            },
            {
                $group: {
                    _id: "$name",
                    name: { $first: "$name" }
                }
            },
            {
                $sort: {
                    name: 1 // 1 for ascending order, -1 for descending order
                }
            }
        ]);
        var rooms = ["Return Rooms"]


        const warehouse_data_QA = await warehouse.aggregate([
            {
                $match: { 
                    "status": 'Enabled',
                    "name": "Quality Inspection",
                }
            },
            {
                $group: {
                    _id: "$name",
                    name: { $first: "$name" }
                }
            },
            {
                $sort: {
                    name: 1 // 1 for ascending order, -1 for descending order
                }
            }
        ]);

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

        res.render("return_sale_finished", {
            success: req.flash('success'),
            errors: req.flash('errors'),
            role : role_data,
            profile : profile_data,
            user: user_id,
            stock: stock_data,
            master_shop : master,
            unit: product_data,
            language : lan_data,
            warehouses: warehouse_data,
            rooms: rooms,
            warehouse_QA: warehouse_data_QA
        })
    } catch (error) {
        console.log(error);
        res.status(200).json({ message: error.message })
    }
})

router.post("/view/return_sales/:id", auth , async (req, res) => {

    // res.json(req.body)
    // return
    if(req.body.for_categorize == "QA"){
        try {
            const { invoice, date, warehouse_name, product_name, primary_code, secondary_code, product_code, sales_quantity, stocks, return_qty, Room_name, to_warehouse_name_QA, to_Room_name_QA, note, for_categorize, product_name_QA1 } = req.body
    
            if(typeof product_name_QA1 == "string"){
                var product_name_array = [req.body.product_name_QA1]
                var primary_code_array = [req.body.primary_code_QA]
                var secondary_code_array = [req.body.secondary_code_QA]
                var product_code_array = [req.body.product_code_QA]
                var purchase_quantity_array = [req.body.sales_quantity_QA]
                var stocks_array = [req.body.stocks_QA]
                var return_qty_array = [req.body.return_qty_QA]
                
                var maxPerUnit_QA_array = [req.body.maxPerUnit_QA]
                var maxProducts_QA_array = [req.body.maxProducts_QA]
                var batch_code_QA_array = [req.body.batch_code_QA]
                var secondary_unit_QA_array = [req.body.secondary_unit_QA]
                var unit_QA_array = [req.body.unit_QA]
                var production_date_QA_array = [req.body.production_date_QA]
                var expiry_date_QA_array = [req.body.expiry_date_QA]


                
                
            }else{
        
                var product_name_array = [...req.body.product_name_QA1]
                var primary_code_array = [...req.body.primary_code_QA]
                var secondary_code_array = [...req.body.secondary_code_QA]
                var product_code_array = [...req.body.product_code_QA]
                var purchase_quantity_array = [...req.body.sales_quantity_QA]
                var stocks_array = [...req.body.stocks_QA]
                var return_qty_array = [...req.body.return_qty_QA]
                
                var maxPerUnit_QA_array = [...req.body.maxPerUnit_QA]
                var maxProducts_QA_array = [...req.body.maxProducts_QA]
                var batch_code_QA_array = [...req.body.batch_code_QA]
                var secondary_unit_QA_array = [...req.body.secondary_unit_QA]
                var unit_QA_array = [...req.body.unit_QA]
                var production_date_QA_array = [...req.body.production_date_QA]
                var expiry_date_QA_array = [...req.body.expiry_date_QA]
    
            } 
            
            const newproduct = product_name_array.map((value)=>{
                
                return  value  = {
                            product_name : value,
                        }   
            })
                        
            primary_code_array.forEach((value, i) => {
                newproduct[i].primary_code = value
            })
            
    
            secondary_code_array.forEach((value, i) => {
                newproduct[i].secondary_code = value
            })
    
            product_code_array.forEach((value, i) => {
                newproduct[i].product_code = value
            })
    
            purchase_quantity_array.forEach((value, i) => {
                newproduct[i].sale_qty = value
            })
    
            stocks_array.forEach((value, i) => {
                newproduct[i].stock = value
            })
    
            return_qty_array.forEach((value, i) => {
                newproduct[i].return_qty = value
            })


            maxPerUnit_QA_array.forEach((value, i) => {
                newproduct[i].maxPerUnit = value
            })

            maxProducts_QA_array.forEach((value, i) => {
                newproduct[i].maxProducts = value
            })

            batch_code_QA_array.forEach((value, i) => {
                newproduct[i].batch_code = value
            })

            secondary_unit_QA_array.forEach((value, i) => {
                newproduct[i].secondary_unit = value
            })

            unit_QA_array.forEach((value, i) => {
                newproduct[i].unit = value
            })

            production_date_QA_array.forEach((value, i) => {
                newproduct[i].production_date = value
            })

            expiry_date_QA_array.forEach((value, i) => {
                newproduct[i].expiry_date = value
            })
    
            
        
    
    
            const old_data = await sales_finished.findOne({ invoice: invoice });
           
            old_data.return_data = "True"
            
            const sales_data = await old_data.save()
            
            const data = new sales_return_finished({ invoice, customer: req.body.customer, date, warehouse_name, room: Room_name, ToWarehouse: to_warehouse_name_QA, ToRoom: to_Room_name_QA, return_sale_QA:newproduct, note, warehouse_cat: for_categorize })
            const sale_return_data = await data.save()
    
            const new_sales_return = await sales_return_finished.findOne({ invoice: invoice });
    
            
    
            const warehouse_data = await warehouse.findOne({ name: to_warehouse_name_QA, room: to_Room_name_QA });
            
            new_sales_return.return_sale_QA.forEach(product_details1 => {
                var x = 0
                const match_data = warehouse_data.product_details.map((data) => {

                    if (data.product_name == product_details1.product_name  && data.expiry_date == product_details1.expiry_date  && data.production_date == product_details1.production_date && data.batch_code == product_details1.batch_code ) {
                        data.product_stock = parseInt(data.product_stock) + parseInt(product_details1.return_qty)
                        x++
                    }
    
                })
    
                if (x == "0") {
                    warehouse_data.product_details = warehouse_data.product_details.concat({ 
                        product_name: product_details1.product_name, 
                        product_stock: product_details1.return_qty, 
                        primary_code: product_details1.primary_code, 
                        secondary_code: product_details1.secondary_code, 
                        product_code: product_details1.product_code, 
                        batch_code: product_details1.batch_code,
                        maxPerUnit: product_details1.maxPerUnit,
                        production_date: product_details1.production_date,
                        expiry_date: product_details1.expiry_date,
                        secondary_unit: product_details1.secondary_unit,
                        unit: product_details1.unit,
                        maxProducts: product_details1.maxProducts,
                        bay: product_details1.bay
                    })
                }

            })
            // res.json({ message: warehouse_data, theBody: new_sales_return })
            // return
            await warehouse_data.save()
    
    
            // -------- supplier payment ------- //
            const c_payment = new c_payment_data({invoice : invoice, customer : req.body.customer , reason : "Sale Return" })
    
            await c_payment.save()
    
            // -------- supplier payment end ------- //
    
    
            // ------------- email ------------- //
            
            const master = await master_shop.find()
            const email_data = await email_settings.findOne()
            const customer_data = await customer.findOne({name : req.body.customer})
            if (master[0].currency_placement == 1) {
                right_currency = master[0].currency
                left_currency = ""
            } else {
                right_currency = ""
                left_currency = master[0].currency
            }
    
            var product_list = product_name_array
            var return_qty_list = return_qty_array
    
            var arrayItems = "";
            var n;
    
            for (n in product_list) {
                arrayItems +=   '<tr>'+
                                    '<td style="border: 1px solid black;">' + product_list[n] + '</td>' +
                                    '<td style="border: 1px solid black;">' + return_qty_list[n] + '</td>' +
                                '</tr>'
            }
            
            console.log("product_list", arrayItems);
            
    
            let mailTransporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: email_data.email,
                    pass: email_data.password
                }
            });
    
            let mailDetails = {
                from: email_data.email,
                to: customer_data.email,
                subject:'Sale Return Mail',
                attachments: [{
                    filename: 'Logo.png',
                    path: __dirname + '/../public' +'/upload/'+master[0].image,
                    cid: 'logo'
               }],
                html:'<!DOCTYPE html>'+
                    '<html><head><title></title>'+
                    '</head><body>'+
                        '<div>'+
                            '<div style="display: flex; align-items: center; justify-content: center;">'+
                                '<div>'+
                                    '<img src="cid:logo" class="rounded" width="66.5px" height="66.5px"></img>'+
                                '</div>'+
                            
                                '<div>'+
                                    '<h2> '+ master[0].site_title +' </h2>'+
                                '</div>'+
                            '</div>'+
                            '<hr class="my-3">'+
                            '<div>'+
                                '<h5 style="text-align: left;">'+
                                    ' Order Number : '+ invoice +' '+
                                    '<span style="float: right;">'+
                                        ' Order Date : '+ date +' '+
                                    '</span>'+
                                    
                                '</h5>'+
                            '</div>'+
                            '<table style="width: 100% !important;">'+
                                '<thead style="width: 100% !important;">'+
                                    '<tr>'+
                                        '<th style="border: 1px solid black;"> Product Name </th>'+
                                        '<th style="border: 1px solid black;"> Return Quantity </th>'+
                                        '<th style="border: 1px solid black;"> Price </th>'+
                                        '<th style="border: 1px solid black;"> Total </th>'+
                                    '</tr>'+
                                '</thead>'+
                                '<tbody style="text-align: center;">'+
                                    ' '+ arrayItems +' '+
                                '</tbody>'+
                            '</table>'+
                            '<div>'+
                                '<strong> Regards </strong>'+
                                '<h5>'+ master[0].site_title +'</h5>'+
                            '</div>'+
                        '</div>'+
                    '</body></html>'
            };
            
            mailTransporter.sendMail(mailDetails, function(err, data) {
                if(err) {
                    console.log(err);
                    console.log('Error Occurs');
                } else {
                    console.log('Email sent successfully');
                }
            });
    
            // ------------- email end ------------- //
    
            req.flash('success', `sales item return successfull`)
            res.redirect("/all_sales_finished/view")
        } catch (error) {
            res.status(200).json({ message1: error.message })
        }
    }else if(req.body.for_categorize == "GS"){
        try {
            const { invoice, date, warehouse_name, product_name, primary_code, secondary_code, product_code, sales_quantity, stocks, return_qty, Room_name, to_warehouse_name, to_Room_name, note, level, isle, pallet , for_categorize} = req.body
            
            // res.json(req.body)
            // return
            if(typeof product_name == "string"){
                var product_name_array = [req.body.product_name]
                var primary_code_array = [req.body.primary_code]
                var secondary_code_array = [req.body.secondary_code]
                var product_code_array = [req.body.product_code]
                var purchase_quantity_array = [req.body.sales_quantity]
                // var stocks_array = [req.body.stocks]
                var return_qty_array = [req.body.return_qty]
                var level_array = [req.body.bay]

                
                var maxPerUnit_QA_array = [req.body.maxPerUnit]
                var maxProducts_QA_array = [req.body.maxProducts]
                var batch_code_QA_array = [req.body.batch_code]
                var secondary_unit_QA_array = [req.body.secondary_unit]
                var unit_QA_array = [req.body.unit]
                var production_date_QA_array = [req.body.production_date]
                var expiry_date_QA_array = [req.body.expiry_date]


                
            }else{
                var product_name_array = [...req.body.product_name]
                var primary_code_array = [...req.body.primary_code]
                var secondary_code_array = [...req.body.secondary_code]
                var product_code_array = [...req.body.product_code]
                var purchase_quantity_array = [...req.body.sales_quantity]
                // var stocks_array = [...req.body.stocks]
                var return_qty_array = [...req.body.return_qty]
                var level_array = [...req.body.bay]
                

                
                var maxPerUnit_QA_array = [...req.body.maxPerUnit]
                var maxProducts_QA_array = [...req.body.maxProducts]
                var batch_code_QA_array = [...req.body.batch_code]
                var secondary_unit_QA_array = [...req.body.secondary_unit]
                var unit_QA_array = [...req.body.unit]
                var production_date_QA_array = [...req.body.production_date]
                var expiry_date_QA_array = [...req.body.expiry_date]
    
            } 
            
            const newproduct = product_name_array.map((value)=>{
                
                return  value  = {
                            product_name : value,
                        }   
            })
                        
            primary_code_array.forEach((value, i) => {
                newproduct[i].primary_code = value
            })
            
    
            secondary_code_array.forEach((value, i) => {
                newproduct[i].secondary_code = value
            })
    
            product_code_array.forEach((value, i) => {
                newproduct[i].product_code = value
            })
    
            purchase_quantity_array.forEach((value, i) => {
                newproduct[i].sale_qty = value
            })
    
            // stocks_array.forEach((value, i) => {
            //     newproduct[i].stock = value
            // })
    
            return_qty_array.forEach((value, i) => {
                newproduct[i].return_qty = value
            })
    
            level_array.forEach((value, i) => {
                newproduct[i].bay = value
            })


            maxPerUnit_QA_array.forEach((value, i) => {
                newproduct[i].maxPerUnit = value
            })

            maxProducts_QA_array.forEach((value, i) => {
                newproduct[i].maxProducts = value
            })

            batch_code_QA_array.forEach((value, i) => {
                newproduct[i].batch_code = value
            })

            secondary_unit_QA_array.forEach((value, i) => {
                newproduct[i].secondary_unit = value
            })

            unit_QA_array.forEach((value, i) => {
                newproduct[i].unit = value
            })

            production_date_QA_array.forEach((value, i) => {
                newproduct[i].production_date = value
            })

            expiry_date_QA_array.forEach((value, i) => {
                newproduct[i].expiry_date = value
            })

            // res.json(newproduct)
            // return
          
            var error = 0
            newproduct.forEach(data => {
                // console.log("foreach newproduct", data);
                if (parseInt(data.sale_qty) < parseInt(data.return_qty) || (parseInt(data.stock) < parseInt(data.return_qty) && parseInt(data.sale_qty) > parseInt(data.return_qty)) || parseInt(data.return_qty) == 0 ) {
                    // res.status(200).json({ saleqty: data.sale_qty, returnQTY: data.return_qty, stocks: data.stock })
                    error++
                }
            })
            if (error != 0) {
                
                req.flash("errors", `Must not be greater than sale Qty`)
                return res.redirect("back")
            }
    
    
            const old_data = await sales_finished.findOne({ invoice: invoice });
    
            old_data.return_data = "True"
            
            const sales_data = await old_data.save()
            
            const data = new sales_return_finished({ invoice, customer: req.body.customer, date, warehouse_name, room: Room_name, ToWarehouse: to_warehouse_name, ToRoom: to_Room_name, return_sale:newproduct, note, warehouse_cat: for_categorize })
            const sale_return_data = await data.save()
    
    
            const new_sales_return = await sales_return_finished.findOne({ invoice: invoice });
    
            
    
            const warehouse_data = await warehouse.findOne({ name: to_warehouse_name, room: to_Room_name, warehouse_category: "Finished Goods" });
            
            // res.status(200).json(new_sales_return)
            // console.log(new_sales_return)
            new_sales_return.return_sale.forEach(product_details1 => {
                var x = 0
                
                const match_data = warehouse_data.product_details.map((data) => {
                   
                    if (data.product_name == product_details1.product_name && data.bay == product_details1.bay && data.expiry_date == product_details1.expiry_date  && data.production_date == product_details1.production_date && data.batch_code == product_details1.batch_code) {
                        data.product_stock = parseInt(data.product_stock) + parseInt(product_details1.return_qty)
                        
                        x++
                    }
    
                })
    
                if (x == "0") {
                    
                    warehouse_data.product_details = warehouse_data.product_details.concat({ 
                        
                        product_name: product_details1.product_name, 
                        product_stock: product_details1.return_qty, 
                        primary_code: product_details1.primary_code, 
                        secondary_code: product_details1.secondary_code, 
                        product_code: product_details1.product_code, 
                        bay: product_details1.bay,
                        batch_code: product_details1.batch_code,
                        maxPerUnit: product_details1.maxPerUnit,
                        production_date: product_details1.production_date,
                        expiry_date: product_details1.expiry_date,
                        secondary_unit: product_details1.secondary_unit,
                        unit: product_details1.unit,
                        maxProducts: product_details1.maxProducts,
                    })
                }
            })
        
            await warehouse_data.save()
    
    
            // -------- supplier payment ------- //
            console.log(req.body);
            const c_payment = new c_payment_data({invoice : invoice, customer : req.body.customer , reason : "Sale Return" })
    
            await c_payment.save()
    
            // -------- supplier payment end ------- //
    
    
            // ------------- email ------------- //
            
            const master = await master_shop.find()
            console.log("add post", master[0].image);
    
            const email_data = await email_settings.findOne()
          
            // res.status(200).json({email_data})
            const customer_data = await customer.findOne({name : req.body.customer})
            console.log("customer_data", customer_data);
            // res.status(200).json({ message: email_data, cutomer: customer_data, customerdata: req.body.customer })
            if (master[0].currency_placement == 1) {
                right_currency = master[0].currency
                left_currency = ""
            } else {
                right_currency = ""
                left_currency = master[0].currency
            }
    
            var product_list = product_name_array
            var return_qty_list = return_qty_array
    
            var arrayItems = "";
            var n;
    
            for (n in product_list) {
                arrayItems +=   '<tr>'+
                                    '<td style="border: 1px solid black;">' + product_list[n] + '</td>' +
                                    '<td style="border: 1px solid black;">' + return_qty_list[n] + '</td>' +
                                '</tr>'
            }
            
            console.log("product_list", arrayItems);
            
    
            let mailTransporter = nodemailer.createTransport({
                // host: email_data.host,
                // port: Number(email_data.port),
                // secure: false,
                service: 'gmail',
                auth: {
                    user: email_data.email,
                    pass: email_data.password
                }
            });
    
            let mailDetails = {
                from: email_data.email,
                to: customer_data.email,
                subject:'Sale Return Mail',
                attachments: [{
                    filename: 'Logo.png',
                    path: __dirname + '/../public' +'/upload/'+master[0].image,
                    cid: 'logo'
               }],
                html:'<!DOCTYPE html>'+
                    '<html><head><title></title>'+
                    '</head><body>'+
                        '<div>'+
                            '<div style="display: flex; align-items: center; justify-content: center;">'+
                                '<div>'+
                                    '<img src="cid:logo" class="rounded" width="66.5px" height="66.5px"></img>'+
                                '</div>'+
                            
                                '<div>'+
                                    '<h2> '+ master[0].site_title +' </h2>'+
                                '</div>'+
                            '</div>'+
                            '<hr class="my-3">'+
                            '<div>'+
                                '<h5 style="text-align: left;">'+
                                    ' Order Number : '+ invoice +' '+
                                    '<span style="float: right;">'+
                                        ' Order Date : '+ date +' '+
                                    '</span>'+
                                    
                                '</h5>'+
                            '</div>'+
                            '<table style="width: 100% !important;">'+
                                '<thead style="width: 100% !important;">'+
                                    '<tr>'+
                                        '<th style="border: 1px solid black;"> Product Name </th>'+
                                        '<th style="border: 1px solid black;"> Return Quantity </th>'+
                                        '<th style="border: 1px solid black;"> Price </th>'+
                                        '<th style="border: 1px solid black;"> Total </th>'+
                                    '</tr>'+
                                '</thead>'+
                                '<tbody style="text-align: center;">'+
                                    ' '+ arrayItems +' '+
                                '</tbody>'+
                            '</table>'+
                            '<div>'+
                                '<strong> Regards </strong>'+
                                '<h5>'+ master[0].site_title +'</h5>'+
                            '</div>'+
                        '</div>'+
                    '</body></html>'
            };
            
            mailTransporter.sendMail(mailDetails, function(err, data) {
                if(err) {
                    console.log(err);
                    console.log('Error Occurs');
                } else {
                    console.log('Email sent successfully');
                }
            });
    
            // ------------- email end ------------- //
    
            req.flash('success', `sales item return successfull`)
            res.redirect("/all_sales_finished/view")
        } catch (error) {
            console.log(error);
            res.status(200).json({ message1: error.message })
        }
    }
    
})

// =============== Barcode ================//

router.get("/barcode/:id", auth, async (req, res) => {
    try {
        const {username, email, role} = req.user
        const role_data = req.user
        
        const profile_data = await profile.findOne({email : role_data.email})

        const master = await master_shop.find()
        console.log("barcode Product master" , master);
        
        const _id = req.params.id
        
        const user_id = await sales.findById(_id)
        
        console.log("barcode user_id", user_id);

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
        
        res.render("all_sales_barcode", {
            success: req.flash('success'),
            errors: req.flash('errors'),
            role : role_data,
            profile : profile_data,
            alldata: user_id,
            master_shop : master,
            language : lan_data
        })

    } catch (error) {
        console.log(error);
    }
})


router.post("/barcode_scanner", async (req, res) => {
    const { product_code, warehouse_name, rooms_data, Roomslist, sales_category } = req.body;
    const RoomAll = Roomslist.split(",");
    const results = [];
    
    
    // Define a function to fetch stock data asynchronously
    async function fetchStockData(value) {
        const stock_data = await warehouse.aggregate([
            {
                $match: { "name": warehouse_name, "room" : value }
            },
            {
                $unwind: "$product_details"
            },
            {
                $match: { 
                    "product_details.primary_code": product_code,
                    // "product_details.sales_category": sales_category,
                }
            },
            {
                $group: {
                    _id: "$product_details._id",
                    name: { $first: "$product_details.product_name" },
                    product_stock: { $first: "$product_details.product_stock" },
                    primary_code: { $first: "$product_details.primary_code" },
                    secondary_code: {$first: "$product_details.secondary_code" },
                    product_code: { $first: "$product_details.product_code" },
                    level: { $first: "$product_details.level" },
                    bay: { $first: "$product_details.bay" },
                    type: { $first: "$product_details.type" },
                    pallet: { $first: "$product_details.floorlevel" },
                    unit: { $first: "$product_details.unit" },
                    secondary_unit: { $first: "$product_details.secondary_unit" },
                    storage: { $first: "$product_details.storage" },
                    rack: { $first: "$product_details.rack" },
                    expiry_date: { $first: "$product_details.expiry_date" },
                    production_date: { $first: "$product_details.production_date" },
                    maxPerUnit: { $first: "$product_details.maxPerUnit" },
                    batch_code: { $first: "$product_details.batch_code" },
                    product_cat:{ $first: "$product_details.product_cat" },
                    computeUsed : { $first: "P" },
                    roomNamed : { $first: "$room" },
                    invoice : { $first: "$product_details.invoice" },
                    uuid : { $first: "$product_details.uuid" },
                    gross_price: { $first: "$product_details.gross_price" },
                    sales_category: { $first: "$product_details.sales_category" }
                   
                }
            },
        ]);

        const stock_data2 = await warehouse.aggregate([
            
            {
                $match: { "name": warehouse_name, "room" : value }
            },
            {
                $unwind: "$product_details"
            },
            {
                $match: { 
                    "product_details.secondary_code": product_code,
                    // "product_details.sales_category": sales_category,
                }
            },
            {
                $group: {
                    _id: "$product_details._id",
                    name: { $first: "$product_details.product_name" },
                    product_stock: { $first: "$product_details.product_stock" },
                    primary_code: { $first: "$product_details.primary_code" },
                    secondary_code: {$first: "$product_details.secondary_code" },
                    product_code: { $first: "$product_details.product_code" },
                    level: { $first: "$product_details.bay" },
                    isle: { $first: "$product_details.bin" },
                    type: { $first: "$product_details.type" },
                    pallet: { $first: "$product_details.floorlevel" },
                    unit: { $first: "$product_details.unit" },
                    secondary_unit: { $first: "$product_details.secondary_unit" },
                    storage: { $first: "$product_details.storage" },
                    rack: { $first: "$product_details.rack" },
                    expiry_date: { $first: "$product_details.expiry_date" },
                    production_date: { $first: "$product_details.production_date" },
                    maxPerUnit: { $first: "$product_details.maxPerUnit" },
                    batch_code: { $first: "$product_details.batch_code" },
                    product_cat:{ $first: "$product_details.product_cat" },
                    computeUsed : { $first: "S" },
                    roomNamed : { $first: "$room" },
                    invoice : { $first: "$product_details.invoice" },
                    uuid : { $first: "$product_details.uuid" },
                    gross_price: { $first: "$product_details.gross_price" },
                    sales_category: { $first: "$product_details.sales_category" }
                }
            },
        ]);

        if (stock_data.length > 0) {
            results.push(stock_data);
        } else if (stock_data2.length > 0) {
            results.push(stock_data2);
        }
    }

    // Create an array of promises for each value
    const promises = RoomAll.map((value) => fetchStockData(value));

    // Wait for all promises to resolve before sending the response
    await Promise.all(promises);

    res.json(results);
});


router.post("/barcode_scanner_logs", async (req, res) => {
    const { product_code, warehouse_name, rooms_data, Roomslist, sales_category } = req.body;
    const RoomAll = Roomslist.split(",");
    const results = [];
    
    
    // Define a function to fetch stock data asynchronously
    async function fetchStockData(value) {
        const stock_data = await warehouse.aggregate([
            {
                $match: { "name": warehouse_name, "room" : value }
            },
            {
                $unwind: "$product_details"
            },
            {
                $match: { 
                    "product_details.primary_code": product_code,
                    "product_details.sales_category": sales_category,
                    "product_details.type_products": "log",
                }
            },
            {
                $group: {
                    _id: "$product_details._id",
                    name: { $first: "$product_details.product_name" },
                    product_stock: { $first: "$product_details.product_stock" },
                    primary_code: { $first: "$product_details.primary_code" },
                    secondary_code: {$first: "$product_details.secondary_code" },
                    product_code: { $first: "$product_details.product_code" },
                    level: { $first: "$product_details.level" },
                    bay: { $first: "$product_details.bay" },
                    type: { $first: "$product_details.type" },
                    pallet: { $first: "$product_details.floorlevel" },
                    unit: { $first: "$product_details.unit" },
                    secondary_unit: { $first: "$product_details.secondary_unit" },
                    storage: { $first: "$product_details.storage" },
                    rack: { $first: "$product_details.rack" },
                    expiry_date: { $first: "$product_details.expiry_date" },
                    production_date: { $first: "$product_details.production_date" },
                    maxPerUnit: { $first: "$product_details.maxPerUnit" },
                    batch_code: { $first: "$product_details.batch_code" },
                    product_cat:{ $first: "$product_details.product_cat" },
                    computeUsed : { $first: "P" },
                    roomNamed : { $first: "$room" },
                    invoice : { $first: "$product_details.invoice" },
                    uuid : { $first: "$product_details.uuid" },
                    gross_price: { $first: "$product_details.gross_price" },
                    sales_category: { $first: "$product_details.sales_category" },
                    type_products: { $first: "$product_details.type_products" }
                   
                }
            },
        ]);
console.log( "log" + " <> " + product_code + " <> " + sales_category )
        const stock_data2 = await warehouse.aggregate([
            
            {
                $match: { "name": warehouse_name, "room" : value }
            },
            {
                $unwind: "$product_details"
            },
            {
                $match: { 
                    "product_details.secondary_code": product_code,
                    "product_details.sales_category": sales_category,
                    "product_details.type_products": "log",
                }
            },
            {
                $group: {
                    _id: "$product_details._id",
                    name: { $first: "$product_details.product_name" },
                    product_stock: { $first: "$product_details.product_stock" },
                    primary_code: { $first: "$product_details.primary_code" },
                    secondary_code: {$first: "$product_details.secondary_code" },
                    product_code: { $first: "$product_details.product_code" },
                    level: { $first: "$product_details.bay" },
                    isle: { $first: "$product_details.bin" },
                    type: { $first: "$product_details.type" },
                    pallet: { $first: "$product_details.floorlevel" },
                    unit: { $first: "$product_details.unit" },
                    secondary_unit: { $first: "$product_details.secondary_unit" },
                    storage: { $first: "$product_details.storage" },
                    rack: { $first: "$product_details.rack" },
                    expiry_date: { $first: "$product_details.expiry_date" },
                    production_date: { $first: "$product_details.production_date" },
                    maxPerUnit: { $first: "$product_details.maxPerUnit" },
                    batch_code: { $first: "$product_details.batch_code" },
                    product_cat:{ $first: "$product_details.product_cat" },
                    computeUsed : { $first: "S" },
                    roomNamed : { $first: "$room" },
                    invoice : { $first: "$product_details.invoice" },
                    uuid : { $first: "$product_details.uuid" },
                    gross_price: { $first: "$product_details.gross_price" },
                    sales_category: { $first: "$product_details.sales_category" },
                    type_products: { $first: "$product_details.type_products" }
                }
            },
        ]);

        if (stock_data.length > 0) {
            results.push(stock_data);
        } else if (stock_data2.length > 0) {
            results.push(stock_data2);
        }
    }

    // Create an array of promises for each value
    const promises = RoomAll.map((value) => fetchStockData(value));

    // Wait for all promises to resolve before sending the response
    await Promise.all(promises);

    res.json(results);
});

module.exports = router;