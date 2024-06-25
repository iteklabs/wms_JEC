const express = require("express");
const app = express();
const router = express.Router();
const { profile, master_shop, categories, brands, units, product, warehouse, staff, customer, customer_payment, c_payment_data, sing_up} = require("../models/all_models");
const auth = require("../middleware/auth");
const users = require("../public/language/languages.json");
const excelJS = require("exceljs");
const xlsx = require('xlsx');



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

        
        res.render("main_inventory", {
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



router.post("/table", async(req, res) => {
    try {
       const { isbool } = req.body
        const role_data = req.user
        // const warehouse_data = await staff.aggregate([
        //     {
        //         $match: {
        //             "email" : role_data.email
        //         }
        //     },
        //     {
        //         $unwind: "$product_list"
        //     },
        //     {
        //         $match: {
        //             "product_list.isConfirm" : isbool
        //         }
        //     }

        // ]);
        // const warehouse_data = await warehouse.find()
        // console.log(req.user)
        
        const warehouse_data = await warehouse.aggregate([
            {
                $unwind: "$product_details"
            },
            {
                $group: {
                    _id: {
                        "name": "$name",
                        // "room": "$room",
                        "product_code": "$product_details.product_code"
                    },
                    product_name: { $first: "$product_details.product_name"},
                    product_stock: { $sum: "$product_details.product_stock" }
                }
            },
            {
                $sort: {
                    "_id.name": 1,
                    // "_id.room": 1,
                }
            }
        ])
        // console.log(staff_data1)
        res.json(warehouse_data)
        
    } catch (error) {
        res.json({ isConfirm: false, error: error})
    }
})
module.exports = router;