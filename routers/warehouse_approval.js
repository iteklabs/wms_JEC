const express = require("express");
const app = express();
const router = express.Router();
const { profile, master_shop, categories, brands, units, product, warehouse, staff, customer, invoice_for_outgoing, customer_payment, c_payment_data, sales_order, invoice_sa, sales_sa, invoice_for_sales_order, approver_acct, email_settings, sales_finished } = require("../models/all_models");
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
        
        res.render("warehouse_approval", {
            success: req.flash('success'),
            errors: req.flash('errors'),
            master_shop : master,
            profile : profile_data,
            role : role_data,
            language : lan_data,
            customer: customer_data,
            sales_sa: sales_data,
            approvers: theapprovers[0],
            the_id: _id,

        })
    }catch(error){
        console.log(error);
    }
})


router.post("/:id", auth,  async(req, res) => {
    try {
        const { date, invoice_data, wms_confirm, the_id_val, prod_id, SCRN, ReqBy, dateofreq, PO_number, warehouse_name, typeservicesData, typevehicle, destination, deliverydate, driver, plate, van, DRSI, TSU, TFU, note } = req.body

        

        const data = await sales_order.findById(the_id_val);

        // res.json(req.body);
        // return;
        // const role_data = req.user
        // const staff_data = await staff.findOne({email: role_data.email});

        // res.json(data);
        // return;

        if (typeof prod_id == "string") {
            var prod_id_array = [req.body.prod_id];
            var qty_array = [req.body.qty];
            var data_bin_array = [req.body.data_loc];
        } else {
            var prod_id_array = [...req.body.prod_id];
            var qty_array = [...req.body.qty];
            var data_bin_array = [...req.body.data_loc];
        }

        // if(data_approver.length == 0){
        //     req.flash("errors", `No Approvers Set Please contact admin to setup`)
        //     return res.redirect("back")
        // }



        const newproduct = prod_id_array.map((value)=>{
            
            return  value  = {
                    prod_id : value,
                }
        });

            data_bin_array.forEach((value, i) => {
                var theData_val = value.split("~")
                // console.log(theData_val)
                newproduct[i].warehouse_id = theData_val[0]
                newproduct[i].warehouse_detl = theData_val[1]
            });

            qty_array.forEach((value, i) => {
                newproduct[i].request_qty = value
            });

        // rechecking qty
            // var product_array = [];
            var product_name_array = [];
            var stock_array = [];
            var quantity_array = [];
            var primary_code_array = [];
            var secondary_code_array = [];
            var prod_code_array = [];
            var level_array = [];
            var bay_array = [];
            var unit_array = [];
            var secondaryUnit_array = [];
            var batchcode_array = [];
            var expiry_date_array = [];
            var product_date_array = [];
            var max_per_unit_array = [];
            var prod_cat_array = [];
            var RoomAssigned_array = [];
            var prod_invoice_array = [];
            var id_transaction_from_array = [];
            var uuid_array = [];
            var gross_price_array = [];

            for (let a = 0; a <= newproduct.length -1; a++) {
                const post_data = newproduct[a];
                // console.log(post_data);
                const ObjectId = mongoose.Types.ObjectId;
                var warehouse_data = await warehouse.aggregate([
                    {
                        $match: {
                            _id: ObjectId(post_data.warehouse_id)
                        }
                    },
                    {
                        $unwind: "$product_details"
                    },
                    {
                        $match:{
                            "product_details._id" : ObjectId(post_data.warehouse_detl)
                        }
                    }
                ]);
                var p = 0 ;
                for(let b = 0; b <= warehouse_data.length - 1; b++){
                    var warehouse_checker = warehouse_data[b];
                    if(warehouse_checker.product_details.product_stock < post_data.request_qty){
                        // console.log(warehouse_checker.product_details.product_stock + " <> " + post_data.request_qty);
                        p++;
                    }
                }

                if(p > 0){
                    req.flash("errors", `Must not be greater than stock Qty`)
                    return res.redirect("back")
                }
                var l=0;
                for(let c = 0; c <= warehouse_data.length - 1; c++){
                    var warehouse_checker = warehouse_data[c];

                    // console.log(warehouse_checker)
                    if(warehouse_checker.product_details.product_stock > post_data.request_qty){


                        product_name_array.push(warehouse_checker.product_details.product_name);
                        stock_array.push(warehouse_checker.product_details.product_stock);
                        quantity_array.push(post_data.request_qty);
                        primary_code_array.push(warehouse_checker.product_details.primary_code);
                        secondary_code_array.push(warehouse_checker.product_details.secondary_code);
                        prod_code_array.push(warehouse_checker.product_details.product_code);
                        level_array.push(warehouse_checker.product_details.level);
                        bay_array.push(warehouse_checker.product_details.bay);
                        unit_array.push(warehouse_checker.product_details.unit);
                        secondaryUnit_array.push(warehouse_checker.product_details.secondary_unit);
                        batchcode_array.push(warehouse_checker.product_details.batch_code);
                        expiry_date_array.push(warehouse_checker.product_details.expiry_date);
                        product_date_array.push(warehouse_checker.product_details.production_date);
                        max_per_unit_array.push(warehouse_checker.product_details.maxPerUnit);
                        prod_cat_array.push(warehouse_checker.product_details.product_cat);
                        RoomAssigned_array.push(warehouse_checker.room);
                        prod_invoice_array.push(warehouse_checker.product_details.invoice);
                        id_transaction_from_array.push(warehouse_checker.product_details._id);
                        uuid_array.push(warehouse_checker.product_details.uuid);
                        gross_price_array.push(warehouse_checker.product_details.gross_price);
                        l++;
                    }
                }
            }

        const sales_detl_data = product_name_array.map((value)=>{
            
            return  value  = {
                product_name : value,
                }
            });
            stock_array.forEach((value,i) => {
                sales_detl_data[i].stock = value
            });
            quantity_array.forEach((value,i) => {
                sales_detl_data[i].quantity = Math.abs(value)
            });
            // product_name_array.forEach((value,i) => {
            //     sales_detl_data[i].agent_id = value
            // })
    
            gross_price_array.forEach((value,i) => {
                sales_detl_data[i].gross_price = value
            })
    
    
            uuid_array.forEach((value,i) => {
                sales_detl_data[i].uuid = value
            })
            id_transaction_from_array.forEach((value,i) => {
                sales_detl_data[i].id_transaction_from = value
            });
            primary_code_array.forEach((value,i) => {
                sales_detl_data[i].primary_code = value
            });
            secondary_code_array.forEach((value,i) => {
                sales_detl_data[i].secondary_code = value
            });
            prod_code_array.forEach((value,i) => {
                sales_detl_data[i].product_code = value
            });
            level_array.forEach((value,i) => {
                sales_detl_data[i].level = value
            });

            bay_array.forEach((value,i) => {
                sales_detl_data[i].bay = value
            })
            unit_array.forEach((value,i) => {
                sales_detl_data[i].unit = value
            });
            secondaryUnit_array.forEach((value,i) => {
                sales_detl_data[i].secondary_unit = value
            });
            batchcode_array.forEach((value,i) => {
                sales_detl_data[i].batch_code = value
            });
            expiry_date_array.forEach((value, i) => {
                sales_detl_data[i].expiry_date = value
            })
            product_date_array.forEach((value, i) => {
                sales_detl_data[i].production_date = value
            })
            max_per_unit_array.forEach((value, i) => {
                sales_detl_data[i].maxperunit = value
            })
            prod_cat_array.forEach((value, i) =>{
                sales_detl_data[i].prod_cat = value
            })
            RoomAssigned_array.forEach((value, i) =>{
                sales_detl_data[i].room_name = value
            })
            prod_invoice_array.forEach((value, i) =>{
                sales_detl_data[i].invoice = value
                sales_detl_data[i].date_data = date
            })

            
            const Invoice_out = new invoice_for_outgoing();
            await Invoice_out.save();

            
            prod_invoice_array.forEach((value, i) =>{
                sales_detl_data[i].outgoing_invoice = "OUT-" + Invoice_out.invoice_init.toString().padStart(8, '0')
            })


            

            const Newnewproduct = sales_detl_data.filter(obj => obj.quantity !== "0" && obj.quantity !== "");
            // res.json(Newnewproduct);
            // return;
            const sales_theFinsihed = new sales_finished({ 
                invoice: "OUT-" + Invoice_out.invoice_init.toString().padStart(8, '0'),
                date,
                warehouse_name,
                sale_product:Newnewproduct,
                note,
                SCRN,
                finalize: "False",
                ReqBy,
                dateofreq,
                PO_number,
                typeservicesData,
                typevehicle,
                destination,
                deliverydate,
                driver,
                plate,
                van,
                DRSI,
                TSU,
                TFU
            
            });
            const data_sales_outgoing = await sales_theFinsihed.save();
           
            
            const today = new Date();
            const date_data = today.toLocaleDateString();
            data.wms_account_confirm = wms_confirm;
            data.wms_account_date = date_data;
            data.document_number_out = "OUT-" + Invoice_out.invoice_init.toString().padStart(8, '0');
            data.outgoing_id = data_sales_outgoing._id
            
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
                subject:'Email for Customer',
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
                                // '<span> Dear <b>'+ data_approver[0].warehouse_info.name +'</b>, </span><br>'+
                            '</div>'+
    
                            '<div>'+
                                '<span> A product request has been submitted by the Sales Department and Approved by Accounting that requires your approval. Below are the details: </span> <br><br>'+
                            '</div>'+
    
                            '<div>'+
                                '<span> Request ID: <b>'+ data.invoice  +'</b></span> <br>'+
                                // '<span> Requested By: <b>'+ staff_data.name +'</b></span> <br>'+
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
                                // '<br><br><span> The total quantity for these items is <b>'+total+'</b>. These products are essential to improve our warehouse efficiency and ensure smooth operations. </span>'+
    
                                '<span> lease review the request and approve it if it aligns with our operational needs. If you have any questions or require further information, please feel free to reach out to the Sales Department. </span>'+
                                
                                '<span> Thank you for your prompt attention to this matter. </span>'+
                                '<br><br><br>'+
                            '</div>'+
                            
                            // '<div style="text-align: center;">'+
                            //     '<a style="background-color: #007bff; color: #ffffff; border: none; padding: 10px 20px; border-radius: 5px;" href="'+ baseURL+'/warehouse_approval/'+data._id +'">Change Status</a>'+
                            //     '<br><br>'+
                            // '</div>'+
    
                            
                
            
    
                            
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


            // res.json(product_list);
            // return;

            // let mailDetails2 = {
            //     from: email_data.email,
            //     // to: data_approver[0].warehouse_info.email,
            //     to: 'christian.villamer@jakagroup.com',
            //     subject:'Email for Sales',
            //     attachments: [{
            //         filename: 'Logo.png',
            //         path: __dirname + '/../public' +'/upload/'+master[0].image,
            //         cid: 'logo'
            //     }],
            //     html:'<!DOCTYPE html>'+
            //         '<html><head><title></title>'+
            //         '<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">'+
            //         '</head><body>'+
            //             '<div>'+
            //                 '<div style="display: flex; align-items: center; justify-content: center;">'+
            //                     '<div>'+
            //                         '<img src="cid:logo" class="rounded" width="66.5px" height="66.5px"></img>'+
            //                     '</div>'+
                            
            //                     '<div>'+
            //                         '<h2> JEC SMS </h2>'+
            //                     '</div>'+
            //                 '</div>'+
            //                 '<hr class="my-3">'+
            //                 '<div>'+
            //                     // '<span> Dear <b>'+ data_approver[0].warehouse_info.name +'</b>, </span><br>'+
            //                 '</div>'+
    
            //                 '<div>'+
            //                     '<span> A product request has been submitted by the Sales Department and Approved by Accounting that requires your approval. Below are the details: </span> <br><br>'+
            //                 '</div>'+
    
            //                 '<div>'+
            //                     '<span> Request ID: <b>'+ data.invoice  +'</b></span> <br>'+
            //                     // '<span> Requested By: <b>'+ staff_data.name +'</b></span> <br>'+
            //                     '<span> Request Date: <b>'+ data.date +'</b></span> <br><br>'+
            //                 '</div>'+
    
    
            //                 '<table style="width: 100% !important;">'+
            //                     '<thead style="width: 100% !important;">'+
            //                         '<tr>'+
            //                             '<th style="border: 1px solid black;"> Product Name </th>'+
            //                             '<th style="border: 1px solid black;"> Product Code </th>'+
            //                             '<th style="border: 1px solid black;"> Product Quantity </th>'+
            //                             '<th style="border: 1px solid black;"> Unit </th>'+
            //                         '</tr>'+
            //                     '</thead>'+
            //                     '<tbody style="text-align: center;">'+
            //                         ' '+ arrayItems +' '+
            //                     '</tbody>'+
            //                 '</table>'+
    
    
            //                 '<div>'+
            //                     // '<br><br><span> The total quantity for these items is <b>'+total+'</b>. These products are essential to improve our warehouse efficiency and ensure smooth operations. </span>'+
    
            //                     '<span> lease review the request and approve it if it aligns with our operational needs. If you have any questions or require further information, please feel free to reach out to the Sales Department. </span>'+
                                
            //                     '<span> Thank you for your prompt attention to this matter. </span>'+
            //                     '<br><br><br>'+
            //                 '</div>'+
                            
            //                 // '<div style="text-align: center;">'+
            //                 //     '<a style="background-color: #007bff; color: #ffffff; border: none; padding: 10px 20px; border-radius: 5px;" href="'+ baseURL+'/warehouse_approval/'+data._id +'">Change Status</a>'+
            //                 //     '<br><br>'+
            //                 // '</div>'+
    
                            
                
            
    
                            
            //                 '<div>'+
            //                     '<strong> Regards </strong>'+
            //                     '<h5> JEC SMS </h5>'+
            //                 '</div>'+
            //             '</div>'+
            //             '<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>' + 
            //         '</body></html>'
            // };


            // mailTransporter.sendMail(mailDetails2, function(err, data) {
            //     if(err) {
            //         console.log(err);
            //         console.log('Error Occurs');
            //     } else {
            //         console.log('Email sent successfully');
            //     }
            // });

            req.flash("success", "Sales Add successfully")
            res.redirect("/all_sales_finished/preview/"+data_sales_outgoing._id)
        res.json(Newnewproduct);
        return;

        
        // // res.json(data);
        // // return;
        // req.flash("success", `Sales Order is changed status`)
        // res.redirect("/accounting_approval/view_sales_order/"+data._id)

       
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


router.post("/data/data_rack", auth, async(req, res) => {
    try {
        const { warehouse_name, product_code } = req.body

        const warehouse_data = await warehouse.aggregate([
            {
                $match:{
                    name: warehouse_name
                }
            },
            {
                $unwind: "$product_details"
            },
            {
                $match:{
                    "product_details.product_code" : product_code
                }
            },
            {
                $group: {
                    _id: {
                        room:  "$room",
                        _id: "$_id"
                    }
                }
            }
        ])
        res.json(warehouse_data)
    } catch (error) {
        
    }
});

router.post("/data/data_loc", auth, async(req, res) => {
    try {
        const { warehouse_name, product_code, room_name } = req.body
        console.log(req.body)
        const warehouse_data = await warehouse.aggregate([
            {
                $match:{
                    name: warehouse_name,
                    room: room_name
                }
            },
            {
                $unwind: "$product_details"
            },
            {
                $match:{
                    "product_details.product_code" : product_code
                }
            },
            {
                $group: {
                    _id: {
                        main_id: "$_id",
                        detl_id: "$product_details._id",
                        product_name: "$product_details.product_name",
                        product_code: "$product_details.product_code",
                        level: "$product_details.level",
                        bay: "$product_details.bay",
                        stocks: "$product_details.product_stock",
                    }
                }
            }
        ])
        res.json(warehouse_data)
    } catch (error) {
        
    }
});

router.get("/data/All", auth,  async(req, res) => {
    try {
       const { sttaff_id, email, warehouse } = req.user

       const master = await master_shop.find()
       const role_data = req.user
       const profile_data = await profile.findOne({email : role_data.email});


       const data = await sales_order.find({ wms_account_id: sttaff_id });

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


       res.render("warehouse_approval_All", {
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