const express = require("express");
const app = express();
const router = express.Router();
const { profile, master_shop, categories, brands, units, product, warehouse_temporary , warehouse_validation_setup, warehouse, staff, customer, suppliers, purchases, purchases_return, suppliers_payment, s_payment_data, email_settings, purchases_finished, purchases_return_finished, supervisor_settings, invoice_for_incoming, purchases_logs, transfers_finished, datalogs, purchases_incoming, sales_sa } = require("../models/all_models");
const auth = require("../middleware/auth");
const nodemailer = require('nodemailer');
var ejs = require('ejs');
const path = require("path");
const users = require("../public/language/languages.json");
const { isNull } = require("util");


router.get("/index",auth, async (req, res) => {
    try {
        const role_data = req.user;
        const profile_data = await profile.findOne({email : role_data.email});
        const master = await master_shop.find();
        const all_stff = await staff.find({ account_category: "sa", type_of_acc_cat : "1" });
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


        res.render("all_invoice_admin", {
            success: req.flash('success'),
            errors: req.flash('errors'),
            role : role_data,
            profile : profile_data,
            master_shop : master,
            language : lan_data,
            staff_data: all_stff
        })
    } catch (error) {
        console.log(error)
    }
})

router.post("/getInvoice", auth, async (req, res) => {
    try {

        const data = await sales_sa.aggregate([
            {
                $addFields: {
                    sales_staff_id: { $toObjectId: "$sales_staff_id" }
                }
            },
            {
                $lookup: {
                    from: "staffs",
                    localField: "sales_staff_id",
                    foreignField: "_id",
                    as: "staff_docs"
                }
            },
            {
                $unwind: "$staff_docs"
            },
        ]);

        // console.log(data)
        res.json(data)
    } catch (error) {
        
    }
});

router.get("/view_sales/:id", auth, async(req, res) => {
    try {
        const role_data = req.user;
        const profile_data = await profile.findOne({email : role_data.email});
        const master = await master_shop.find();
        const _id = req.params.id
        const sales_data = await sales_sa.findById(_id);
        
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


        res.render("view_sales_sa_admin", {
            success: req.flash('success'),
            errors: req.flash('errors'),
            master_shop : master,
            profile : profile_data,
            role : role_data,
            language : lan_data,
            sales_sa: sales_data,
        })
    } catch (error) {
        console.log(error)
    }
})



module.exports = router;