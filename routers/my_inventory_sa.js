const express = require("express");
const app = express();
const router = express.Router();
const { profile, master_shop, categories, brands, units, product, warehouse, staff, customer, customer_payment, c_payment_data, sing_up, sales_finished, invoice_for_inventory, sales_inv_data, sales_sa} = require("../models/all_models");
const auth = require("../middleware/auth");
const users = require("../public/language/languages.json");
const excelJS = require("exceljs");
const xlsx = require('xlsx');
const mongoose = require("mongoose");


router.get("/view", auth,  async(req, res) => {
    try{
        const master = await master_shop.find()
        const role_data = req.user
        const profile_data = await profile.findOne({email : role_data.email});
        const staff_data = await staff.findOne({email: role_data.email});
        if (master[0].language == "English (US)") {
            var lan_data = users.English
            // console.log(lan_data);
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

        res.render("my_inventory", {
            success: req.flash('success'),
            errors: req.flash('errors'),
            master_shop : master,
            profile : profile_data,
            role : role_data,
            language : lan_data,
            product_list: staff_data.product_list
        })
    }catch(error){
        console.log(error);
    }
})


router.post("/confirmation", auth,  async(req, res) => {
    try {
        const { product_id } = req.body
        const role_data = req.user
        const staff_data_index = await staff.findOne({email: role_data.email});

        await staff.updateOne(
            { 
                _id: staff_data_index._id.valueOf(), 
                "product_list._id": product_id.valueOf()
            },
            { 
                $set: { 
                    "product_list.$.isConfirm": "true" 
                } 
            }
        );

        console.log(product_id.valueOf())
        res.json({data: staff, isConfirm: true})
        
    } catch (error) {
        res.json({ isConfirm: false, error: error})
    }
})


router.post("/table", auth, async(req, res) => {
    try {
       const { isbool } = req.body
        const role_data = req.user
        const staff_data1 = await staff.aggregate([
            {
                $match: {
                    "email" : role_data.email
                }
            },
            {
                $unwind: "$product_list"
            },
            {
                $match: {
                    "product_list.isConfirm" : isbool
                }
            },
            {
                $group: {
                    _id: {
                        product_name: "$product_list.product_name",
                        product_code: "$product_list.product_code",
                    },
                    sumqty: { $sum: "$product_list.product_stock" }
                }
            },
            {
                $sort: {
                    "_id.product_name" : 1
                }
            }

        ]);
        console.log(staff_data1)
        res.json(staff_data1)
        
    } catch (error) {
        res.json({ isConfirm: false, error: error})
    }
})


router.post("/incoming", auth, async(req, res) => {
    try {
       const { isbool } = req.body
        const role_data = req.user
        const staff_data1 = await staff.aggregate([
            {
                $match: {
                    "email" : role_data.email
                }
            },
            {
                $unwind: "$product_list"
            },
            {
                $match: {
                    "product_list.isConfirm" : "false"
                }
            },
            {
                $group: {
                    _id: {
                        outgoing_invoice: "$product_list.outgoing_invoice",
                        date_incoming: "$product_list.date_incoming"
                    },
                }
            },
            {
                $sort: {
                    "_id.product_name" : 1
                }
            }

        ]);
        console.log(staff_data1)
        res.json(staff_data1)
        
    } catch (error) {
        res.json({ isConfirm: false, error: error})
    }
})

router.post("/product_list", auth, async(req, res) => {
    try {
        const role_data = req.user
        const profile_data = await profile.findOne({email : role_data.email});
        const staff_data = await staff.findOne({email: role_data.email});

        const sales_data_finish = await sales_finished.aggregate([
            {
                $match:{
                    isRecieved: "false",
                    finalize: "True",
                    sales_data: staff_data._id.valueOf()
                }
            },
            
        ])

        // console.log(sales_data_finish);

        res.json(sales_data_finish)
    } catch (error) {
        
    }
})

router.post("/product_data", auth, async(req, res) => {
    try {
        const role_data = req.user
        const { id_data } = req.body
        const ObjectId = mongoose.Types.ObjectId;
        console.log(id_data)
        // var obj_ids = ObjectId(id_data);
        const staff_data = await staff.aggregate([
            {
                $match: {
                    email: role_data.email
                }
            },
            {
                $unwind: "$product_list"
            },
            {
                $match: {
                    "product_list.isConfirm": "false",
                    "product_list.outgoing_invoice": id_data,
                }
            }
        ]);
        

        // const outgoing_data = await sales_finished.findById(id_data);

        // console.log(outgoing_data)
        // console.log(staff_data)
        res.json(staff_data)


    } catch (error) {
        res.json(error)
    }
})

router.get("/add_transaction", auth, async(req, res) => {
    try{

        const master = await master_shop.find()
        const role_data = req.user
        const profile_data = await profile.findOne({email : role_data.email});
        const staff_data = await staff.findOne({email: role_data.email});
        const customer_data = await customer.find({ agent_id: staff_data._id })
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

        
        res.render("add_document_inventory", {
            success: req.flash('success'),
            errors: req.flash('errors'),
            master_shop : master,
            profile : profile_data,
            role : role_data,
            language : lan_data,
            customer: customer_data
        })
    }catch(error){
        console.log(error);
    }
})

router.post("/product_data", auth, async(req, res) => {
    try {
        const role_data = req.user
        const { id_data } = req.body
        const profile_data = await profile.findOne({email : role_data.email});
        // const staff_data = await staff.findOne({email: role_data.email});
        const ObjectId = mongoose.Types.ObjectId;
        // console.log(ObjectId(id_data))
        var obj_ids = ObjectId(id_data);
        const staff_data = await staff.aggregate([
            {
                $match: {
                    email: role_data.email
                }
            },
            {
                $unwind: "$product_list"
            },
            {
                $match: {
                    "product_list.isConfirm": "false",
                    "product_list._id": obj_ids,
                }
            }
        ]);

        

        res.json(staff_data)


    } catch (error) {
        
    }
})

router.post("/add_transaction", auth, async(req, res) => {
    try {
        const { date, prod_name, note } = req.body

        const role_data = req.user
        const profile_data = await profile.findOne({email : role_data.email});
        const staff_data = await staff.findOne({email: role_data.email});

        if(typeof prod_name == "string"){
            var prod_code_array = [req.body.prod_code];
            var prod_name_array = [req.body.prod_name];
            var stock_qty_array = [req.body.stock_qty];
            var UOM_array = [req.body.UOM];
            var price_array = [req.body.price];
            var expiry_date_array = [req.body.expiry_date];
            var production_date_array = [req.body.production_date];
            var batch_code_array = [req.body.batch_code];
            var primary_code_array = [req.body.primary_code];
            var id_transaction_array = [req.body.id_transaction];
            var outgoing_invoice_array = [req.body.outgoing_invoice]
        }else{
            var prod_code_array = [...req.body.prod_code];
            var prod_name_array = [...req.body.prod_name];
            var stock_qty_array = [...req.body.stock_qty];
            var UOM_array = [...req.body.UOM];
            var price_array = [...req.body.price];
            var expiry_date_array = [...req.body.expiry_date];
            var production_date_array = [...req.body.production_date];
            var batch_code_array = [...req.body.batch_code];
            var primary_code_array = [...req.body.primary_code];
            var id_transaction_array = [...req.body.id_transaction];
            var outgoing_invoice_array = [...req.body.outgoing_invoice]
        }
        const newproduct = prod_code_array.map((value)=>{
            return  value  = {
                product_code : value,
            }
        })

        prod_name_array.forEach((value,i) => {
            newproduct[i].product_name = value
        });

        stock_qty_array.forEach((value,i) => {
            newproduct[i].stock = value
        });


        outgoing_invoice_array.forEach((value,i) => {
            newproduct[i].outgoing_invoice = value
        });

        UOM_array.forEach((value,i) => {
            newproduct[i].unit = value
        });

        price_array.forEach((value,i) => {
            newproduct[i].price = value
        });

        expiry_date_array.forEach((value,i) => {
            newproduct[i].expiry_date = value
        });

        production_date_array.forEach((value,i) => {
            newproduct[i].production_date = value
        });

        batch_code_array.forEach((value,i) => {
            newproduct[i].batch_code = value
        });

        primary_code_array.forEach((value,i) => {
            newproduct[i].primary_code = value
        });


        id_transaction_array.forEach((value,i) => {
            newproduct[i].id_transaction = value
        });

        const invoice = new invoice_for_inventory();
        await invoice.save();

        const data_sales =  new sales_inv_data({ invoice: "INC-" + invoice.invoice_init.toString().padStart(8, '0'), date: date, sales_staff_id : staff_data._id,  sale_product:newproduct, note: note });
        const sales_data = await data_sales.save();
       
        const ObjectId = mongoose.Types.ObjectId;
        for(let x= 0; x <= sales_data.sale_product.length - 1; x++){
            var dataDetl = sales_data.sale_product[x];
            for (let index = 0; index <= staff_data.product_list.length - 1; index++) {
                const element =  staff_data.product_list[index];
                console.log(dataDetl.id_transaction + " == " + element._id.valueOf())
                if(dataDetl.id_transaction == element._id.valueOf()){
                    await staff.updateOne(
                        { 
                            _id:  ObjectId(staff_data._id.valueOf()),
                            "product_list._id": ObjectId(dataDetl.id_transaction.valueOf())
                        },
                        { 
                            $set: { 
                                "product_list.$.isConfirm": "true" ,
                                "product_list.$.date_confirm": date
                            } 
                        }
                    );
                    // const now = new Date();
                    const data_sales_wms = await sales_finished.findOne({ invoice: element.outgoing_invoice });
                    data_sales_wms.isRecieved = "true";
                    data_sales_wms.RecievedDate = date;
                    await data_sales_wms.save();

                    
                }
            }
        }


        req.flash("success", `Sales add successfully`)
        res.redirect("/my_inventory/view_inv/"+sales_data._id)
        // res.json(sales_data);
        return;
    } catch (error) {

    }
})


router.get("/view_inv/:id", auth,  async(req, res) => {
    try{

        const master = await master_shop.find()
        const role_data = req.user
        const profile_data = await profile.findOne({email : role_data.email});
        const staff_data = await staff.findOne({email: role_data.email});
        const customer_data = await customer.find({ agent_id: staff_data._id })

        const _id = req.params.id
        const sales_data = await sales_inv_data.findById(_id)

  
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

        
        res.render("view_sales_inv", {
            success: req.flash('success'),
            errors: req.flash('errors'),
            master_shop : master,
            profile : profile_data,
            role : role_data,
            language : lan_data,
            customer: customer_data,
            sales_sa: sales_data
        })
    }catch(error){
        console.log(error);
    }
})




router.get("/confirm", auth,  async(req, res) => {
    try{

        const master = await master_shop.find()
        const role_data = req.user
        const profile_data = await profile.findOne({email : role_data.email});
        const staff_data = await staff.findOne({email: role_data.email});
        const sales_data = await sales_inv_data.find({ sales_staff_id : staff_data._id });

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

        
        res.render("all_sales_sa_inv", {
            success: req.flash('success'),
            errors: req.flash('errors'),
            master_shop : master,
            profile : profile_data,
            role : role_data,
            language : lan_data,
            product_list: staff_data.product_list,
            sales_mine: sales_data
        })
    }catch(error){
        console.log(error);
    }
})


module.exports = router;