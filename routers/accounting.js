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


router.get("/:id", auth,  async(req, res) => {
    try{

        const master = await master_shop.find()
        const role_data = req.user
        const profile_data = await profile.findOne({email : role_data.email});
        const staff_data = await staff.findOne({email: role_data.email});
        const customer_data = await customer.find({ agent_id: staff_data._id })
        const ObjectId = mongoose.Types.ObjectId;
        const _id = req.params.id


       
        const sales_data = await sales_order.findById(_id);
        // res.json(sales_data);
        // return;
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

        
        res.render("accounting_approval", {
            success: req.flash('success'),
            errors: req.flash('errors'),
            master_shop : master,
            profile : profile_data,
            role : role_data,
            language : lan_data,
            customer: customer_data,
            sales_sa: sales_data,
            approvers: theapprovers[0],
            the_id: _id
        })
    }catch(error){
        console.log(error);
    }
})


router.post("/:id", auth,  async(req, res) => {
    try {
        const { accounting_discount, accounting_confirm, wms_confirm, the_id_val, invoice, prod_id } = req.body
        const data = await sales_order.findById(the_id_val);
        const role_data = req.user
        const staff_data = await staff.findOne({email: role_data.email});

        if (typeof prod_id == "string") {
            var prod_id_array = [req.body.prod_id];
            var accounting_discount_array = [req.body.accounting_discount];
        } else {
            var prod_id_array = [...req.body.prod_id];
            var accounting_discount_array = [...req.body.accounting_discount];
        }

        const data_approver = await approver_acct.aggregate([
            {
                $unwind: "$member"
            },
            {
                $match:{
                    head_id_staff : req.user.sttaff_id
                }
            },
            {
                $group: {
                    _id: {
                        id_member: "$member.id_member",
                        name: "$member.name"
                    },
                    warehouse_staff_id: { $first: "$warehouse_staff_id" }
                }
            },
            {
                $addFields: {
                    warehouse_staff_id: { $toObjectId: "$warehouse_staff_id" }
                }
            },
            {
                $lookup: {
                    from: "staffs",
                    localField: "warehouse_staff_id",
                    foreignField: "_id",
                    as: "warehouse_info"
                }
            },
            {
                $unwind: "$warehouse_info"
            }

            
        ])

// res.json(data_approver);
// return;
        if(data_approver.length == 0){
            req.flash("errors", `No Approvers Set Please contact admin to setup`)
            return res.redirect("back")
        }



        const newproduct = prod_id_array.map((value)=>{
            
            return  value  = {
                    prod_id : value,
                    }   
            })

            accounting_discount_array.forEach((value,i) => {
                newproduct[i].accounting_discount = value
            });

        for (let index = 0; index <= data.sale_product.length - 1; index++) {
            const element = data.sale_product[index];
            
            for (let a = 0; a <= newproduct.length -1; a++) {
                const post_data = newproduct[a];
                if(element._id.valueOf() == post_data.prod_id){


                    await sales_order.updateOne(
                        { 
                            _id: the_id_val,
                            "sale_product._id": post_data.prod_id,
                        },
                        { 
                            $set: { 
                                "sale_product.$.accounting_discount": post_data.accounting_discount // Replace updatedStockValue with the new stock value
                            } 
                        }
                    );

                }
            }
        }


        const today = new Date();
        const date = today.toLocaleDateString();


        data.accounting_account_confirm = accounting_confirm;
        data.accounting_account_date = date;
        data.wms_account_id = data_approver[0].warehouse_info._id;

        await data.save();

        

        const master = await master_shop.find();
        const email_data = await email_settings.findOne();

        let mailTransporter = nodemailer.createTransport({
            host: email_data.host,
            port: Number(email_data.port),
            secure: false,
            auth: {
                user: email_data.email,
                pass: email_data.password
            }
        });


        const baseURL = req.protocol+'://'+req.headers.host;


        var product_list = data.sale_product

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


        let mailDetails = {
            from: email_data.email,
            // to: data_approver[0].warehouse_info.email,
            to: 'christian.villamer@jakagroup.com',
            subject:'Approval for ' + data.invoice,
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
                            '<span> Dear <b>'+ data_approver[0].warehouse_info.name +'</b>, </span><br>'+
                        '</div>'+

                        '<div>'+
                            '<span> A product request has been submitted by the Sales Department and Approved by Accounting that requires your approval. Below are the details: </span> <br><br>'+
                        '</div>'+

                        '<div>'+
                            '<span> Request ID: <b>'+ data.invoice  +'</b></span> <br>'+
                            '<span> Requested By: <b>'+ staff_data.name +'</b></span> <br>'+
                            '<span> Request Date: <b>'+ data.date +'</b></span> <br><br>'+
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
                            '<a style="background-color: #007bff; color: #ffffff; border: none; padding: 10px 20px; border-radius: 5px;" href="'+ baseURL+'/warehouse_approval/'+data._id +'">Change Status</a>'+
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
        // res.json(data);
        // return;
        req.flash("success", `Sales Order is changed status`)
        res.redirect("/accounting_approval/view_sales_order/"+data._id)

       
    } catch (error) {
        
    }
})



router.get("/view_sales_order/:id", auth,  async(req, res) => {
    try{

        const master = await master_shop.find()
        const role_data = req.user
        const profile_data = await profile.findOne({email : role_data.email});
        const staff_data = await staff.findOne({email: role_data.email});
        const customer_data = await customer.find({ agent_id: staff_data._id })
        const ObjectId = mongoose.Types.ObjectId;
        const _id = req.params.id


       
        const sales_data = await sales_order.findById(_id);
        // res.json(sales_data);
        // return;
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
                $unwind: "$wms_data"
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

        
        res.render("view_accounting_approval", {
            success: req.flash('success'),
            errors: req.flash('errors'),
            master_shop : master,
            profile : profile_data,
            role : role_data,
            language : lan_data,
            customer: customer_data,
            sales_sa: sales_data,
            approvers: theapprovers[0],
            the_id: _id
        })
    }catch(error){
        console.log(error);
    }
})


router.get("/data/All", auth,  async(req, res) => {
     try {
        const { sttaff_id, email, warehouse } = req.user

        const master = await master_shop.find()
        const role_data = req.user
        const profile_data = await profile.findOne({email : role_data.email});


        const data = await sales_order.find({ accounting_account_id: sttaff_id });

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


        res.render("accounting_approval_All", {
            success: req.flash('success'),
            errors: req.flash('errors'),
            master_shop : master,
            profile : profile_data,
            role : role_data,
            language : lan_data,
            sales_order: data
        })
        // res.json(data)
     } catch (error) {
        
     }
})

module.exports = router;