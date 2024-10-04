const express = require("express");
const app = express();
const router = express.Router();
const { warehouse_validation_setup, master_shop, profile, warehouse, warehouse_temporary } = require("../models/all_models");
const auth = require("../middleware/auth");
const nodemailer = require('nodemailer');
var ejs = require('ejs');
const path = require("path");
const users = require("../public/language/languages.json");



router.get("/view/", auth, async (req, res) => {
    try {
        const {username, email, role} = req.user
        const role_data = req.user
        const profile_data = await profile.findOne({email : role_data.email})
        const master = await master_shop.find();


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


        res.render("warehouse_checking",{
            success: req.flash('success'),
            errors: req.flash('errors'),
            // user: find_data, 
            profile : profile_data,  
            master_shop : master,
            role : role_data,
            language : lan_data,
        })
    } catch (error) {
        console.log(error)
    }
})

router.post("/check_to_confirm", auth, async (req, res) => {
    try {
        const { product_code, type_of_process } = req.body
        var data_show = product_code.split("~");
        const warehouse_name = data_show[0];
        const rack = data_show[1];
        const bay = data_show[2];
        const bin = data_show[3];
        // console.log("test")
        const data_warehouse = await warehouse_temporary.find({ warehouse: warehouse_name, room_name : rack,  level: bay, bay : bin, data_type: type_of_process, isConfirm: "false" });
        res.json(data_warehouse)
    } catch (error) {
        console.log(error)
    }
})


router.post("/confirm_data", auth, async (req, res) => {
    try {
        const { id_data } = req.body
        const data_warehouse = await warehouse_temporary.find({ _id: id_data});
        const role_data = req.user
        // const warehouse_data = await warehouse.findOne({ name: data_warehouse.warehouse, room: data_warehouse.room_name });
        // console.log(warehouse_data.product_details.length)   
        // var keyCount  = JSON.parse(data_warehouse).length;
        const now = new Date();
        for (let index = 0; index <= data_warehouse.length - 1; index++) {
            const element = data_warehouse[index];
           
            var x = 0;
            
            if(element.data_type == "inc"){
                var warehouse_data = await warehouse.findOne({ name: element.warehouse, room: element.room_name });
                const match_data = warehouse_data.product_details.map((data) => {
                    if (data.product_name == element.product_name && 
                        data.primary_code == element.primary_code && 
                        data.secondary_code == element.secondary_code && 
                        data.product_code == element.product_code && 
                        data.bay == element.bay && 
                        data.level == element.level && 
                        data.date_recieved == element.date_recieved
                        ) {
                        data.product_stock = parseInt(data.product_stock) + parseInt(element.product_stock)
                        x++
                    }

                })


                if (x == "0") {
                    warehouse_data.product_details = warehouse_data.product_details.concat({ 
                        product_name: element.product_name, 
                        product_stock: element.product_stock, 
                        primary_code: element.primary_code, 
                        secondary_code: element.secondary_code, 
                        product_code: element.product_code,
                        bay: element.bay,  
                        level: element.level, 
                        maxProducts: element.maxStocks, 
                        unit: element.unit, 
                        secondary_unit: element.secondary_unit, 
                        maxPerUnit: element.maxperunit,
                        alertQTY: element.alertQTY,
                        production_date: element.production_date,
                        expiry_date: element.expiry_date, 
                        batch_code: element.batch_code,
                        invoice: element.invoice,
                        product_cat: element.product_cat,
                        uuid: element.uuid,
                        gross_price: element.gross_price,
                        date_recieved: element.date_recieved,
                        isAvailable: "true",
                        isUsed: "false",
                        warehouse_id_temp_inc: element._id

                    })
                }
                // console.log(warehouse_data)
                data_warehouse[index].isConfirm = "true"
                data_warehouse[index].confirm_by = role_data.email
                data_warehouse[index].date_time = now

                await data_warehouse[index].save();
                await warehouse_data.save();
            }else if(element.data_type == "out"){

                var warehouse_data = await warehouse.findOne({ name: element.warehouse, room: element.room_name });

                const match_data = warehouse_data.product_details.map((data) => {
                    if (data.product_name == element.product_name && 
                        data.primary_code == element.primary_code && 
                        data.secondary_code == element.secondary_code && 
                        data.product_code == element.product_code && 
                        data._id == element.warehouse_id_detl
                        ) {
                        data.product_stock = parseInt(data.product_stock) - parseInt(element.product_stock)

                        if(data.product_stock == 0){
                            data.isAvailable = "false"
                            data_warehouse[index].isAvailable = "false"
                            data_warehouse[index].isUsed = "true"
                        }else{
                            data_warehouse[index].isUsed = "false"
                        }
                            data.isUsed = "false"
                        // console.log(data.product_stock)
                        // data.isUsed = "false"
                        x++
                    }

                })

                data_warehouse[index].isConfirm = "true"
                data_warehouse[index].confirm_by = role_data.email
                data_warehouse[index].date_time = now
                

                await data_warehouse[index].save();
                await warehouse_data.save();
                
            }
            
        }

        
        // console.log(data_warehouse)
        res.json({ data_main: data_warehouse, data_warehouse: warehouse_data})
    } catch (error) {
        console.log(error)
    }
})


router.post("/cancel_data", auth, async (req, res) => {
    try {
        const { id_data } = req.body
        const data_warehouse = await warehouse_temporary.find({ _id: id_data});
        // const warehouse_data = await warehouse.findOne({ name: data_warehouse.warehouse, room: data_warehouse.room_name });
        // console.log(warehouse_data.product_details.length)   
        // var keyCount  = JSON.parse(data_warehouse).length;
            const role_data = req.user
            const now = new Date();
        for (let index = 0; index <= data_warehouse.length - 1; index++) {
            const element = data_warehouse[index];
           
            var x = 0;
            
            if(element.data_type == "out"){

                var warehouse_data = await warehouse.findOne({ name: element.warehouse, room: element.room_name });

                const match_data = warehouse_data.product_details.map((data) => {
                    if (data.product_name == element.product_name && 
                        data.primary_code == element.primary_code && 
                        data.secondary_code == element.secondary_code && 
                        data.product_code == element.product_code && 
                        data._id == element.warehouse_id_detl
                        ) {
                        // data.product_stock = parseInt(data.product_stock) - parseInt(element.product_stock)

                        // if(data.product_stock == 0){
                            data.isAvailable = "true"
                            data_warehouse[index].isAvailable = "cancel"
                            data_warehouse[index].isUsed = "true"
                            data_warehouse[index].confirm_by = role_data.email
                            data_warehouse[index].date_time = now
                        // }else{
                        //     data_warehouse[index].isUsed = "false"
                        // }
                            data.isUsed = "false"
                        // console.log(data.product_stock)
                        // data.isUsed = "false"
                        x++
                    }

                })

                data_warehouse[index].isConfirm = "true"
                
                

                await data_warehouse[index].save();
                await warehouse_data.save();
                
            }
            
        }

        
        // console.log(data_warehouse)
        res.json({ data_main: data_warehouse, data_warehouse: warehouse_data})
    } catch (error) {
        console.log(error)
    }
})


router.post("/view_data_all", auth, async (req, res) => {
    try {
        const { data_show } = req.body

        if(data_show == "All"){
            const data_all = await warehouse_temporary.find({ isConfirm: "true" });
            res.json(data_all)
        }else{
            const data_all = await warehouse_temporary.find({ isConfirm: data_show })
            res.json(data_all)
        }

       
        // console.log(data_warehouse)
        
    } catch (error) {
        console.log(error)
    }
})





module.exports = router;