const express = require("express");
const app = express();
const router = express.Router();
const { profile, master_shop, categories, brands, units, product, warehouse, staff, customer, customer_payment, c_payment_data, sales_sa, sales_order} = require("../models/all_models");
const auth = require("../middleware/auth");
const users = require("../public/language/languages.json");
const excelJS = require("exceljs");
const xlsx = require('xlsx');
const multer = require('multer');
const mongoose = require("mongoose");
// Booking
router.get("/view", auth,  async(req, res) => {
    try{

        const master = await master_shop.find()
        const role_data = req.user
        const profile_data = await profile.findOne({email : role_data.email});
        const staff_data = await staff.findOne({email: role_data.email, type_of_acc_cat: "2"});
        // const sales_data = await sales_sa.find({ sales_staff_id : staff_data._id });

        let sales_data = [];
        if(staff_data != null){
            sales_data = await sales_order.find({ sales_staff_id : staff_data._id });
        }
    
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

        
        res.render("collection", {
            success: req.flash('success'),
            errors: req.flash('errors'),
            master_shop : master,
            profile : profile_data,
            role : role_data,
            language : lan_data,
            // product_list: staff_data.product_list,
            sales_mine: sales_data,
            staff_arr: staff_data
        })
    }catch(error){
        console.log(error);
    }
})


router.get("/view/:id", auth, async(req, res) => {
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

        
        res.render("view_collections", {
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

router.post("/view/:id", auth, async(req, res) => {
    try{
        const _id = req.params.id;

        // res.json(req.body);
        // return;


        // console.log(_id)
        const data = await sales_sa.findById(_id);
        const {collection, invoicemoney, collectionnumber, typeofpayment, cashdate, id_detl} = req.body;
        res.json(data);
        return;

        if(typeof id_detl == "string"){
            var id_detl_array = [req.body.id_detl]
            var ewt_array = [req.body.ewt]
            var spwp_array = [req.body.spwp]
            var fin_disc_array = [req.body.fin_disc]
            var vol_deals_array = [req.body.vol_deals]
            var bo_disc_array = [req.body.bo_disc]
            var totalNewPrice_array = [req.body.totalNewPrice]
        }else{
            var id_detl_array = [...req.body.id_detl]
            var ewt_array = [...req.body.ewt]
            var spwp_array = [...req.body.spwp]
            var fin_disc_array = [...req.body.fin_disc]
            var vol_deals_array = [...req.body.vol_deals]
            var bo_disc_array = [...req.body.bo_disc]
            var totalNewPrice_array = [...req.body.totalNewPrice]
        }


        const newproduct = id_detl_array.map((value)=>{
            return  value  = {
                id_detl : value,
            }  
        });

        ewt_array.forEach((value,i) => {
            newproduct[i].ewt = value
        });

        spwp_array.forEach((value,i) => {
            newproduct[i].spwp = value
        });


        fin_disc_array.forEach((value,i) => {
            newproduct[i].fin_disc = value
        });

        vol_deals_array.forEach((value,i) => {
            newproduct[i].vol_deals = value
        });

        bo_disc_array.forEach((value,i) => {
            newproduct[i].bo_disc = value
        });

        totalNewPrice_array.forEach((value,i) => {
            newproduct[i].totalcollection = value
        });

        
        data.collection_price = collection
        data.collectionnumber = collectionnumber
        data.type_of_payment = typeofpayment
        data.cash_date = cashdate
        data.paid = "True"

        const new_data = await data.save();

        

        if(new_data.paid == "True"){

            // console.log(new_data.sale_product.length);
            for (let index = 0; index <= newproduct.length - 1; index++) {
                const element = newproduct[index];
                // console.log(element)

                const ObjectId = mongoose.Types.ObjectId;
                console.log(element)
                   const new_data2 =  await sales_sa.updateOne(
                        {
                            _id: ObjectId(_id.valueOf()),
                            "sale_product._id": ObjectId(element.id_detl.valueOf()),
                        },
                        {
                            $set: {
                                "sale_product.$.ewt": element.ewt,
                                "sale_product.$.spwp": element.spwp,
                                "sale_product.$.fin_disc": element.fin_disc,
                                "sale_product.$.vol_deals": element.vol_deals,
                                "sale_product.$.bo_disc": element.bo_disc,
                                "sale_product.$.totalprice": parseFloat(element.totalcollection)
                       
                            }
                        }
                );
                // console.log(ObjectId(_id) + " <> " + ObjectId(element.id_detl))
                // console.log(new_data2)
            }
        }
        // res.json(new_data);
        // return;
        
        req.flash('success', `Collection Update successfully`)
        res.redirect("/collection/view/"+_id)
    }catch(error){
        console.log(error);
    }   
})




router.get("/x_so", auth,  async(req, res) => {
    try{

        const master = await master_shop.find()
        const role_data = req.user
        const profile_data = await profile.findOne({email : role_data.email});
        const staff_data = await staff.findOne({email: role_data.email, type_of_acc_cat: "2" });

       
        let sales_data = [];
        if(staff_data != null){
            sales_data = await sales_order.find({ sales_staff_id : staff_data._id });
        }
        
        console.log(sales_data)
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

        
        res.render("collection_sox", {
            success: req.flash('success'),
            errors: req.flash('errors'),
            master_shop : master,
            profile : profile_data,
            role : role_data,
            language : lan_data,
            // product_list: staff_data.product_list,
            sales_mine: sales_data,
            staff_arr: staff_data
        })
    }catch(error){
        console.log(error);
    }
})


router.get("/view_sox/:id", auth, async(req, res) => {
    try{

        const master = await master_shop.find()
        const role_data = req.user
        const profile_data = await profile.findOne({email : role_data.email});
        const staff_data = await staff.findOne({email: role_data.email});
        const customer_data = await customer.find({ agent_id: staff_data._id })

        const _id = req.params.id
        const sales_data = await sales_order.findById(_id)

  
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

        
        res.render("view_collections_sox", {
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

// ex truck


//sales invoice
router.get("/view_x", auth,  async(req, res) => {
    try{

        const master = await master_shop.find()
        const role_data = req.user
        const profile_data = await profile.findOne({email : role_data.email});
        const staff_data = await staff.findOne({email: role_data.email, type_of_acc_cat: "1"});
        // const sales_data = await sales_sa.find({ sales_staff_id : staff_data._id });

        let sales_data = [];
        if(staff_data != null){
            sales_data = await sales_sa.find({ sales_staff_id : staff_data._id });
        }
    
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

        
        res.render("collection_xt", {
            success: req.flash('success'),
            errors: req.flash('errors'),
            master_shop : master,
            profile : profile_data,
            role : role_data,
            language : lan_data,
            // product_list: staff_data.product_list,
            sales_mine: sales_data,
            staff_arr: staff_data
        })
    }catch(error){
        console.log(error);
    }
})


router.get("/view_xt/:id", auth, async(req, res) => {
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

        
        res.render("view_collections_xt", {
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

router.post("/view_xt/:id", auth, async(req, res) => {
    try{
        const _id = req.params.id;

        // res.json(req.body);
        // return;


        // console.log(_id)
        const data = await sales_sa.findById(_id);
        const {collection, invoicemoney, collectionnumber, typeofpayment, cashdate, id_detl} = req.body;
        // res.json(req.body);
        // return;

        if(typeof id_detl == "string"){
            var id_detl_array = [req.body.id_detl]
            var ewt_array = [req.body.ewt]
            var spwp_array = [req.body.spwp]
            var fin_disc_array = [req.body.fin_disc]
            var vol_deals_array = [req.body.vol_deals]
            var bo_disc_array = [req.body.bo_disc]
            var totalNewPrice_array = [req.body.totalNewPrice]
        }else{
            var id_detl_array = [...req.body.id_detl]
            var ewt_array = [...req.body.ewt]
            var spwp_array = [...req.body.spwp]
            var fin_disc_array = [...req.body.fin_disc]
            var vol_deals_array = [...req.body.vol_deals]
            var bo_disc_array = [...req.body.bo_disc]
            var totalNewPrice_array = [...req.body.totalNewPrice]
        }


        const newproduct = id_detl_array.map((value)=>{
            return  value  = {
                id_detl : value,
            }  
        });

        ewt_array.forEach((value,i) => {
            newproduct[i].ewt = value
        });

        spwp_array.forEach((value,i) => {
            newproduct[i].spwp = value
        });


        fin_disc_array.forEach((value,i) => {
            newproduct[i].fin_disc = value
        });

        vol_deals_array.forEach((value,i) => {
            newproduct[i].vol_deals = value
        });

        bo_disc_array.forEach((value,i) => {
            newproduct[i].bo_disc = value
        });

        totalNewPrice_array.forEach((value,i) => {
            newproduct[i].totalcollection = value
        });

        
        data.collection_price = collection
        data.collectionnumber = collectionnumber
        data.type_of_payment = typeofpayment
        data.cash_date = cashdate
        data.paid = "True"
        data.typeofprocess = "1";

        const new_data = await data.save();

        

        if(new_data.paid == "True"){

            // console.log(new_data.sale_product.length);
            for (let index = 0; index <= newproduct.length - 1; index++) {
                const element = newproduct[index];
                // console.log(element)

                const ObjectId = mongoose.Types.ObjectId;
                console.log(element)
                   const new_data2 =  await sales_sa.updateOne(
                        {
                            _id: ObjectId(_id.valueOf()),
                            "sale_product._id": ObjectId(element.id_detl.valueOf()),
                        },
                        {
                            $set: {
                                "sale_product.$.ewt": element.ewt,
                                "sale_product.$.spwp": element.spwp,
                                "sale_product.$.fin_disc": element.fin_disc,
                                "sale_product.$.vol_deals": element.vol_deals,
                                "sale_product.$.bo_disc": element.bo_disc,
                                "sale_product.$.totalprice": parseFloat(element.totalcollection)
                       
                            }
                        }
                );
                // console.log(ObjectId(_id) + " <> " + ObjectId(element.id_detl))
                // console.log(new_data2)
            }
        }
        // res.json(new_data);
        // return;
        
        req.flash('success', `Collection Update successfully`)
        res.redirect("/collection/view/"+_id)
    }catch(error){
        console.log(error);
    }   
})


//sales_order

router.get("/so_x", auth,  async(req, res) => {
    try{

        const master = await master_shop.find()
        const role_data = req.user
        const profile_data = await profile.findOne({email : role_data.email});
        const staff_data = await staff.findOne({email: role_data.email, type_of_acc_cat: "1"});
        // const sales_data = await sales_sa.find({ sales_staff_id : staff_data._id });

        let sales_data = [];
        if(staff_data != null){
            sales_data = await sales_order.find({ sales_staff_id : staff_data._id });
        }
    
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

        
        res.render("collection_so_xt", {
            success: req.flash('success'),
            errors: req.flash('errors'),
            master_shop : master,
            profile : profile_data,
            role : role_data,
            language : lan_data,
            // product_list: staff_data.product_list,
            sales_mine: sales_data,
            staff_arr: staff_data
        })
    }catch(error){
        console.log(error);
    }
})

router.get("/view_so_xt/:id", auth, async(req, res) => {
    try{

        const master = await master_shop.find()
        const role_data = req.user
        const profile_data = await profile.findOne({email : role_data.email});
        const staff_data = await staff.findOne({email: role_data.email});
        const customer_data = await customer.find({ agent_id: staff_data._id })

        const _id = req.params.id
        const sales_data = await sales_order.findById(_id)

  
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

        
        res.render("view_collections_so_xt", {
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

router.post("/view_so_xt/:id", auth, async(req, res) => {
    try{
        const _id = req.params.id;

        // res.json(req.body);
        // return;


        // console.log(_id)
        const data = await sales_order.findById(_id);
        const {collection, invoicemoney, collectionnumber, typeofpayment, cashdate, id_detl} = req.body;
        

        // if(typeof id_detl == "string"){
        //     var id_detl_array = [req.body.id_detl]
        //     var ewt_array = [req.body.ewt]
        //     var spwp_array = [req.body.spwp]
        //     var fin_disc_array = [req.body.fin_disc]
        //     var vol_deals_array = [req.body.vol_deals]
        //     var bo_disc_array = [req.body.bo_disc]
        //     var totalNewPrice_array = [req.body.totalNewPrice]
        // }else{
        //     var id_detl_array = [...req.body.id_detl]
        //     var ewt_array = [...req.body.ewt]
        //     var spwp_array = [...req.body.spwp]
        //     var fin_disc_array = [...req.body.fin_disc]
        //     var vol_deals_array = [...req.body.vol_deals]
        //     var bo_disc_array = [...req.body.bo_disc]
        //     var totalNewPrice_array = [...req.body.totalNewPrice]
        // }


        // const newproduct = id_detl_array.map((value)=>{
        //     return  value  = {
        //         id_detl : value,
        //     }  
        // });

        // ewt_array.forEach((value,i) => {
        //     newproduct[i].ewt = value
        // });

        // spwp_array.forEach((value,i) => {
        //     newproduct[i].spwp = value
        // });


        // fin_disc_array.forEach((value,i) => {
        //     newproduct[i].fin_disc = value
        // });

        // vol_deals_array.forEach((value,i) => {
        //     newproduct[i].vol_deals = value
        // });

        // bo_disc_array.forEach((value,i) => {
        //     newproduct[i].bo_disc = value
        // });

        // totalNewPrice_array.forEach((value,i) => {
        //     newproduct[i].totalcollection = value
        // });

        
        data.collection_price = collection
        // data.collectionnumber = collectionnumber
        data.type_of_payment = typeofpayment
        data.cash_date = cashdate
        data.paid = "True"
        data.typeofprocess = "1";
// res.json(data);
//         return;
        const new_data = await data.save();

        

        // if(new_data.paid == "True"){

        //     // console.log(new_data.sale_product.length);
        //     for (let index = 0; index <= newproduct.length - 1; index++) {
        //         const element = newproduct[index];
        //         // console.log(element)

        //         const ObjectId = mongoose.Types.ObjectId;
        //         console.log(element)
        //            const new_data2 =  await sales_sa.updateOne(
        //                 {
        //                     _id: ObjectId(_id.valueOf()),
        //                     "sale_product._id": ObjectId(element.id_detl.valueOf()),
        //                 },
        //                 {
        //                     $set: {
        //                         "sale_product.$.ewt": element.ewt,
        //                         "sale_product.$.spwp": element.spwp,
        //                         "sale_product.$.fin_disc": element.fin_disc,
        //                         "sale_product.$.vol_deals": element.vol_deals,
        //                         "sale_product.$.bo_disc": element.bo_disc,
        //                         "sale_product.$.totalprice": parseFloat(element.totalcollection)
                       
        //                     }
        //                 }
        //         );
        //         // console.log(ObjectId(_id) + " <> " + ObjectId(element.id_detl))
        //         // console.log(new_data2)
        //     }
        // }
        // res.json(new_data);
        // return;
        
        req.flash('success', `Collection Update successfully`)
        res.redirect("/collection/view_so_xt/"+_id)
    }catch(error){
        console.log(error);
    }   
})
module.exports = router;