const express = require("express");
const app = express();
const router = express.Router();
const { profile, master_shop, categories, brands, units, product, warehouse, staff, customer, customer_payment, c_payment_data, sales_order, invoice_sa, sales_sa, invoice_for_sales_order, approver_acct, email_settings} = require("../models/all_models");
const auth = require("../middleware/auth");
const users = require("../public/language/languages.json");
const excelJS = require("exceljs");
const xlsx = require('xlsx');
const mongoose = require("mongoose");
const { ObjectId } = require('mongodb');
const nodemailer = require('nodemailer');


router.get("/", auth,  async(req, res) => {
    try{

        const master = await master_shop.find()
        const role_data = req.user
        const profile_data = await profile.findOne({email : role_data.email});
        const staff_data = await staff.findOne({email: role_data.email});
        // const sales_data = await sales_order.find({ sales_staff_id : staff_data._id });
        const sales_data = await sales_order.aggregate([
            { 
                $match: {
                    sales_staff_id : staff_data._id.valueOf()
                }
            },
            {
                $unwind: "$sale_product"
            },
            {
                $group: {
                    _id: "$_id",
                    invoice: { $first: "$invoice"},
                    customer: { $first: "$customer"},
                    date: { $first: "$date"},
                    JD: { $first: "$JD"},
                    accounting_account_confirm: { $first: "$accounting_account_confirm"},
                    wms_account_confirm: { $first: "$wms_account_confirm"},
                    totalQTY: { $sum: "$sale_product.quantity" },
                }
            }
        ]);

        // res.json(sales_data)
        // return;
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

        
        res.render("all_sales_order", {
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

        
        res.render("add_sales_order", {
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
        const ObjectId = mongoose.Types.ObjectId;
        const _id = req.params.id
        const sales_data = await sales_order.findById(_id)
        const theapprovers = await sales_order.aggregate([
            {
                $match:{
                    _id: ObjectId(_id)
                }
            },
            {
                $addFields: {
                    accounting_account_id: { $toObjectId: "$accounting_account_id" }
                }
            },

            {
                $addFields: {
                    wms_account_id: { $toObjectId: "$wms_account_id" }
                }
            },
            {
                $lookup: {
                    from: "staffs",
                    localField: "accounting_account_id",
                    foreignField: "_id",
                    as: "account_data"
                }
            },
            {
                $unwind: "$account_data"
            },
            {
                $lookup: {
                    from: "staffs",
                    localField: "wms_account_id",
                    foreignField: "_id",
                    as: "wms_data"
                }
            },
            {
                $unwind: {
                    path: "$wms_data",
                    preserveNullAndEmptyArrays: true
                }
            },
            // {
            //     $group:{

            //     }
            // }
        ])
        // res.json(theapprovers);
        // return;
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

        
        res.render("view_sales_order", {
            success: req.flash('success'),
            errors: req.flash('errors'),
            master_shop : master,
            profile : profile_data,
            role : role_data,
            language : lan_data,
            customer: customer_data,
            sales_sa: sales_data,
            approvers: theapprovers[0],
            staff_arr: staff_data
        })
    }catch(error){
        console.log(error);
    }
})

router.post("/add_sales", auth,  async(req, res) => {
    try {
        const {customer, date, prod_code, note, paid_status,JD, po_number, desire_date} = req.body
        // res.json(req.body)
        // return;
        if(typeof prod_code == "string"){
            var prod_code_array = [req.body.prod_code];
            var prod_name_array = [req.body.prod_name];
            var primary_code_array = [req.body.primary_code];
            var quantity_array = [req.body.quantity];
            var UOM_array = [req.body.UOM];
            var product_id_array = [req.body.product_id];
            var price_array = [req.body.price];
            var totalPrice_array = [req.body.totalPrice];
            var dicount_price_array = [req.body.dicount_price];
            var tmpisFG_array = [req.body.tmpisFG];
            var dicount_price_adjust_array = [req.body.dicount_price_adjust];
        }else{
            var prod_code_array = [...req.body.prod_code];
            var prod_name_array = [...req.body.prod_name];
            var primary_code_array = [...req.body.primary_code];
            var quantity_array = [...req.body.quantity];
            var UOM_array = [...req.body.UOM];
            var product_id_array = [...req.body.product_id];
            var price_array = [...req.body.price];
            var totalPrice_array = [...req.body.totalPrice];
            var dicount_price_array = [...req.body.dicount_price];
            var tmpisFG_array = [...req.body.tmpisFG];
            var dicount_price_adjust_array = [...req.body.dicount_price_adjust];
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
        quantity_array.forEach((value,i) => {
            newproduct[i].quantity = value
        });
        UOM_array.forEach((value,i) => {
            newproduct[i].unit = value
        });
        product_id_array.forEach((value,i) => {
            newproduct[i].product_id = value
        });

        dicount_price_adjust_array.forEach((value,i) => {
            newproduct[i].adjustment_discount = value
        });


        price_array.forEach((value,i) => {
            newproduct[i].price = value
        });
        totalPrice_array.forEach((value,i) => {
            newproduct[i].totalprice = value
        });

        dicount_price_array.forEach((value, i) => {
            newproduct[i].discount = value
        })


        tmpisFG_array.forEach((value, i) => {
            newproduct[i].isFG = value
        });
       
        const data_approver = await approver_acct.aggregate([
            {
                $unwind: "$member"
            },
            {
                $match:{
                    "member.id_member": req.user.sttaff_id
                }
            },
            {
                $group: {
                    _id: {
                        id_member: "$member.id_member",
                        name: "$member.name"
                    },
                    head_id_staff: { $first: "$head_id_staff" }
                }
            },
            {
                $addFields: {
                    head_id_staff_id: { $toObjectId: "$head_id_staff" }
                }
            },
            {
                $lookup: {
                    from: "staffs",
                    localField: "head_id_staff_id",
                    foreignField: "_id",
                    as: "head_staff_info"
                }
            },
            {
                $unwind: "$head_staff_info"
            }

            
        ])
        

        // if(data_approver.length == 0){
        //     req.flash("errors", `No Approvers Set Please contact admin to setup`)
        //     return res.redirect("back")
        // }
        
        const invoice = new invoice_for_sales_order();
        await invoice.save();
        // res.json(data_approver[0].head_staff_info);
        // return
        const role_data = req.user
        const staff_data = await staff.findOne({email: role_data.email});
       

        // const data = new sales_order({ invoice: invoice.invoice_init.toString().padStart(8, '0'), customer: customer, date: date, sale_product:newproduct, note, sales_staff_id: staff_data._id.valueOf(), JD:JD, accounting_account_id: data_approver[0].head_id_staff, po_number: po_number, desired_delivery: desire_date });
        const data = new sales_order({ invoice: invoice.invoice_init.toString().padStart(8, '0'), customer: customer, date: date, sale_product:newproduct, note, sales_staff_id: staff_data._id.valueOf(), JD:JD, accounting_account_id: data_approver[0].head_id_staff, po_number: po_number, desired_delivery: desire_date,wms_account_confirm: "true", accounting_account_confirm: "true" });
        const sales_data = await data.save();
        

        var product_list = sales_data.sale_product

        var arrayItems = "";
        var n;
        var total = 0;
        for (n in product_list) {
            arrayItems +=  '<tr>'+
                                '<td style="border: 1px solid black;">' + product_list[n].product_name + '</td>' +
                                '<td style="border: 1px solid black;">' + product_list[n].product_code + '</td>' +  
                                '<td style="border: 1px solid black;">' + product_list[n].quantity + '</td>' +
                                '<td style="border: 1px solid black;">' + product_list[n].unit + '</td>' +
                            '</tr>'

                            total += parseInt(product_list[n].quantity);
        }

        
        /// for email notifications
        const master = await master_shop.find();
        const email_data = await email_settings.findOne();

        let mailTransporter = nodemailer.createTransport({
            // host: email_data.host,
            port: Number(email_data.port),
            secure: false,
            auth: {
                user: email_data.email,
                pass: email_data.password
            }
        });

        

        const baseURL = req.protocol+'://'+req.headers.host;
       
        let mailDetails = {
            from: email_data.email,
            to: data_approver[0].head_staff_info.email + ";christian.villamer@jakagroup.com",
            // to: 'christian.villamer@jakagroup.com',
            subject:'Approval for ' + sales_data.invoice,
            attachments: [{
                filename: 'Logo.png',
                path: __dirname + '/../public' +'/upload/'+master[0].image,
                cid: 'logo'
           }],
            html:'<!DOCTYPE html>'+
                '<html><head><title></title>'+
                '<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">'+
                '</head><body>'+
                    '<div>'+
                        '<div style="display: flex; align-items: center; justify-content: center;">'+
                            '<div>'+
                                '<img src="cid:logo" class="rounded" width="66.5px" height="66.5px"></img>'+
                            '</div>'+
                        
                            '<div>'+
                                '<h2> JEC SMS </h2>'+
                            '</div>'+
                        '</div>'+
                        '<hr class="my-3">'+
                        '<div>'+
                            '<span> Dear <b>'+ data_approver[0].head_staff_info.name +'</b>, </span><br>'+
                        '</div>'+

                        '<div>'+
                            '<span> A product request has been submitted by the Sales Department that requires your approval. Below are the details: </span> <br><br>'+
                        '</div>'+

                        '<div>'+
                            '<span> Request ID: <b>'+ sales_data.invoice  +'</b></span> <br>'+
                            '<span> Requested By: <b>'+ staff_data.name +'</b></span> <br>'+
                            '<span> Request Date: <b>'+ sales_data.date +'</b></span> <br><br>'+
                        '</div>'+


                        '<table style="width: 100% !important;">'+
                            '<thead style="width: 100% !important;">'+
                                '<tr>'+
                                    '<th style="border: 1px solid black;"> Product Name </th>'+
                                    '<th style="border: 1px solid black;"> Product Code </th>'+
                                    '<th style="border: 1px solid black;"> Product Quantity </th>'+
                                    '<th style="border: 1px solid black;"> Unit </th>'+
                                '</tr>'+
                            '</thead>'+
                            '<tbody style="text-align: center;">'+
                                ' '+ arrayItems +' '+
                            '</tbody>'+
                        '</table>'+


                        '<div>'+
                            '<br><br><span> The total quantity for these items is <b>'+total+'</b>. These products are essential to improve our warehouse efficiency and ensure smooth operations. </span>'+

                            '<span> lease review the request and approve it if it aligns with our operational needs. If you have any questions or require further information, please feel free to reach out to the Sales Department. </span>'+
                            
                            '<span> Thank you for your prompt attention to this matter. </span>'+
                            '<br><br><br>'+
                        '</div>'+
                        
                        '<div style="text-align: center;">'+
                            '<a style="background-color: #007bff; color: #ffffff; border: none; padding: 10px 20px; border-radius: 5px;" href="'+ baseURL+'/accounting_approval/'+sales_data._id +'">Change Status</a>'+
                            '<br><br>'+
                        '</div>'+

                        
                        '<div>'+
                            '<strong> Regards </strong>'+
                            '<h5> JEC SMS </h5>'+
                        '</div>'+
                    '</div>'+
                    '<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>' + 
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
        // res.json(sales_data);
        // return;
        req.flash("success", `Sales Order is ongoing`)
        res.redirect("/sales_order/view_sales/"+sales_data._id)

    } catch (error) {
        
    }
})

router.post("/product_list", auth, async(req, res) => {
    try {
        const role_data = req.user
        
        const profile_data = await profile.findOne({email : role_data.email});
        const staff_data = await product.find({sales_category: role_data.sales_category});

        // console.log(staff_data)

        res.json(staff_data)


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
        // console.log(ObjectId(id_data))
        var obj_ids = ObjectId(id_data);
        // const staff_data = await staff.aggregate([
        //     {
        //         $match: {
        //             email: role_data.email
        //         }
        //     },
        //     {
        //         $unwind: "$product_list"
        //     },
        //     {
        //         $match: {
        //             "product_list.isConfirm": "true",
        //             "product_list._id": obj_ids,
        //         }
        //     }
        // ]);

        // const staff_data = await product.findById(obj_ids);
        
        const staff_data = await product.find( { _id : obj_ids });
        res.json(staff_data)


    } catch (error) {
        
    }
})


module.exports = router;