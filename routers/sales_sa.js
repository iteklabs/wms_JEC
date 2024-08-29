const express = require("express");
const app = express();
const router = express.Router();
const { profile, master_shop, categories, brands, units, product, warehouse, staff, customer, customer_payment, c_payment_data, sing_up, invoice_sa, sales_sa, discount_volume_db} = require("../models/all_models");
const auth = require("../middleware/auth");
const users = require("../public/language/languages.json");
const excelJS = require("exceljs");
const xlsx = require('xlsx');
const mongoose = require("mongoose");


router.get("/", auth,  async(req, res) => {
    try{

        const master = await master_shop.find()
        const role_data = req.user
        const profile_data = await profile.findOne({email : role_data.email});
        const staff_data = await staff.findOne({email: role_data.email});
        const sales_data = await sales_sa.find({ sales_staff_id : staff_data._id });
    
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

        
        res.render("all_sales_sa", {
            success: req.flash('success'),
            errors: req.flash('errors'),
            master_shop : master,
            profile : profile_data,
            role : role_data,
            language : lan_data,
            product_list: staff_data.product_list,
            sales_mine: sales_data,
            staff_arr: staff_data
        })
    }catch(error){
        console.log(error);
    }
})


router.get("/add_sales", auth,  async(req, res) => {
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

        
        res.render("add_sales_sa", {
            success: req.flash('success'),
            errors: req.flash('errors'),
            master_shop : master,
            profile : profile_data,
            role : role_data,
            language : lan_data,
            customer: customer_data,
            staff_arr: staff_data
        })
    }catch(error){
        console.log(error);
    }
})

router.get("/view_sales/:id", auth,  async(req, res) => {
    try{

        const master = await master_shop.find()
        const role_data = req.user
        const profile_data = await profile.findOne({email : role_data.email});
        const staff_data = await staff.findOne({email: role_data.email});
        const customer_data = await customer.find({ agent_id: staff_data._id })

        const _id = req.params.id
        const sales_data = await sales_sa.findById(_id)

  
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

        
        res.render("view_sales_sa", {
            success: req.flash('success'),
            errors: req.flash('errors'),
            master_shop : master,
            profile : profile_data,
            role : role_data,
            language : lan_data,
            customer: customer_data,
            sales_sa: sales_data,
            staff_arr: staff_data
        })
    }catch(error){
        console.log(error);
    }
})

router.post("/add_sales", auth,  async(req, res) => {
    try {
        const {customer, date, prod_code, note, paid_status,DSI} = req.body
        
        if(typeof prod_code == "string"){
            var prod_code_array = [req.body.prod_code];
            var prod_name_array = [req.body.prod_name];
            var primary_code_array = [req.body.primary_code];
            // var batch_code_array = [req.body.batch_code];
            // var production_date_array = [req.body.production_date];
            // var expiry_date_array = [req.body.expiry_date];
            // var stock_qty_array = [req.body.stock_qty];
            var quantity_array = [req.body.quantity];
            var UOM_array = [req.body.UOM];
            var price_array = [req.body.price];
            var totalPrice_array = [req.body.totalPrice];
            var id_transaction_array = [req.body.id_transaction];
            var dicount_price_array = [req.body.dicount_price];
            var adj_dicount_price_array = [req.body.adj_dicount_price];
            var tmpisFG_array = [req.body.tmpisFG];
        }else{
            var prod_code_array = [...req.body.prod_code];
            var prod_name_array = [...req.body.prod_name];
            var primary_code_array = [...req.body.primary_code];
            // var batch_code_array = [...req.body.batch_code];
            // var production_date_array = [...req.body.production_date];
            // var expiry_date_array = [...req.body.expiry_date];
            // var stock_qty_array = [...req.body.stock_qty];
            var quantity_array = [...req.body.quantity];
            var UOM_array = [...req.body.UOM];
            var price_array = [...req.body.price];
            var totalPrice_array = [...req.body.totalPrice];
            var id_transaction_array = [...req.body.id_transaction];
            var dicount_price_array = [...req.body.dicount_price];
            var adj_dicount_price_array = [...req.body.adj_dicount_price];
            var tmpisFG_array = [...req.body.tmpisFG];
        }
        const newproduct = prod_code_array.map((value)=>{
            
            return  value  = {
                        product_code : value,
                    }   
            })
        prod_name_array.forEach((value,i) => {
            newproduct[i].product_name = value
        });
        primary_code_array.forEach((value,i) => {
            newproduct[i].primary_code = value
        });
        // batch_code_array.forEach((value,i) => {
        //     newproduct[i].batch_code = value
        // });
        // production_date_array.forEach((value,i) => {
        //     newproduct[i].production_date = value
        // });
        // expiry_date_array.forEach((value,i) => {
        //     newproduct[i].expiry_date = value
        // });
        // stock_qty_array.forEach((value,i) => {
        //     newproduct[i].stock = value
        // });
        quantity_array.forEach((value,i) => {
            newproduct[i].quantity = value
        });
        UOM_array.forEach((value,i) => {
            newproduct[i].unit = value
        });
        price_array.forEach((value,i) => {
            newproduct[i].price = value
        });
        totalPrice_array.forEach((value,i) => {
            newproduct[i].totalprice = value
        });
        id_transaction_array.forEach((value,i) => {
            newproduct[i].id_transaction_from = value
        });
        
        dicount_price_array.forEach((value, i) => {
            newproduct[i].discount = value
        });

        adj_dicount_price_array.forEach((value, i) => {
            newproduct[i].adj_discount = value
        });

        tmpisFG_array.forEach((value, i) => {
            newproduct[i].isFG = value
        });


        // res.json(newproduct);
        // return;
        const invoice = new invoice_sa();
        await invoice.save();
        // res.json(invoice);
        // return
        const role_data = req.user
        const staff_data = await staff.findOne({email: role_data.email});


        const data = new sales_sa({ invoice: invoice.invoice_starts.toString().padStart(8, '0'), customer: customer, date, sale_product:newproduct, note, sales_staff_id: staff_data._id.valueOf(), paid: paid_status, dsi:DSI });
        const sales_data = await data.save()

        console.log('Invoice created with incremented start value:', invoice.invoice_starts.toString().padStart(8, '0'));
        const ObjectId = mongoose.Types.ObjectId;
        
        // for(let x= 0; x <= sales_data.sale_product.length - 1; x++){
        //     var dataDetl = sales_data.sale_product[x];
        //     var totalstock = 0;
        //     for (let index = 0; index <= staff_data.product_list.length - 1; index++) {
        //         const element =  staff_data.product_list[index];
        //         console.log(dataDetl.id_transaction_from + " == " + element._id.valueOf())
        //         if(dataDetl.id_transaction_from == element._id.valueOf()){
        //             totalstock = Math.max(0, Math.abs(element.product_stock) - Math.abs(dataDetl.quantity));
        //             await staff.updateOne(
        //                 { 
        //                     _id:  ObjectId(staff_data._id.valueOf()),
        //                     "product_list._id": ObjectId(dataDetl.id_transaction_from)
        //                 },
        //                 { 
        //                     $set: { 
        //                         "product_list.$.product_stock": totalstock 
        //                     } 
        //                 }
        //             );
        //             console.log(staff_data._id.valueOf() + " <> " + dataDetl.id_transaction_from)
        //         }
        //     }
        // }
        req.flash("success", `Sales add successfully`)
        res.redirect("/sales_sa/view_sales/"+sales_data._id)

    } catch (error) {
        console.log(error)
    }
})

router.post("/product_list", auth, async(req, res) => {
    try {
        const role_data = req.user
        
        const profile_data = await profile.findOne({email : role_data.email});
        // const staff_data = await staff.findOne({email: role_data.email});
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
                    "product_list.isConfirm": "true",
                }
            }
        ]);
        // console.log(staff_data)

        res.json(staff_data)


    } catch (error) {
        
    }
})


router.post("/customer_data", auth, async(req, res) => {
    try {
        const { customer_name } = req.body
        const sutomer_data = await customer.findOne({ name: customer_name})
        res.json(sutomer_data);
        // console.log(sutomer_data)
    } catch (error) {
        
    }
})

router.post("/product_data", auth, async(req, res) => {
    try {
        const role_data = req.user
        const { id_data } = req.body
        const profile_data = await profile.findOne({email : role_data.email});
        // const staff_data = await staff.findOne({email: role_data.email});
        const ObjectId = mongoose.Types.ObjectId;
        console.log(ObjectId(id_data))
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
                    "product_list.isConfirm": "true",
                    "product_list._id": obj_ids,
                }
            }
        ]);

        

        res.json(staff_data)


    } catch (error) {
        
    }
})


router.post("/volume_setup", auth, async(req, res) => {
    try {
        const the_volume = await discount_volume_db.findOne();
        res.json(the_volume);
    } catch (error) {
        
    }
})


router.post("/getProductData", auth, async(req, res) => {
    try {
        const the_volume = await product.find();
        res.json(the_volume);
    } catch (error) {
        
    }
})


router.post("/product_data_id", auth, async(req, res) => {
    try {
        const { id_data } = req.body
        const the_volume = await product.findById(id_data);
        res.json(the_volume);
    } catch (error) {
        
    }
})







module.exports = router;