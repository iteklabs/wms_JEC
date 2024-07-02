const express = require("express");
const app = express();
const router = express.Router();
const auth = require("../middleware/auth");
const { profile, sales, sales_return, purchases, purchases_return, categories, product, suppliers, customer, master_shop, transfers, adjustment, purchases_finished, sales_finished, adjustment_finished, transfers_finished, staff, sales_sa, sales_order, approver_acct, warehouse } = require("../models/all_models");
const users = require("../public/language/languages.json");


router.get("/setup", auth, async(req, res) => {
    try {


        const role_data = req.user
        const master = await master_shop.find()
        const profile_data = await profile.findOne({email : role_data.email})
        const so_data = await approver_acct.aggregate([
            {
                $addFields: {
                    accounting_account_id: { $toObjectId: "$head_id_staff" }
                }
            },

            {
                $addFields: {
                    wms_account_id: { $toObjectId: "$warehouse_staff_id" }
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
        ]);

        // res.json(so_data);
        // return;
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

        res.render("so_approver_all", {
            success: req.flash('success'),
            errors: req.flash('errors'),
            role : role_data,
            profile : profile_data,
            master_shop : master,
            language : lan_data,
            data: so_data
        })
    } catch (error) {

    }
})



router.get("/add", auth, async(req, res) => {
    try {
        const role_data = req.user;
        const master = await master_shop.find();
        const profile_data = await profile.findOne({email : role_data.email});

        const accounting_account = await staff.find({ account_category: "acc"});
        const wm_account = await staff.find({ account_category: "wm"});
        const sales_account = await staff.find({ account_category: "sa"});

        const warehouse_loc = await warehouse.aggregate([
            {
                $group:{
                    _id: "$name"
                }
            }
        ])

        // res.json(warehouse_loc);
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

        res.render("so_approver_add", {
            success: req.flash('success'),
            errors: req.flash('errors'),
            role : role_data,
            profile : profile_data,
            master_shop : master,
            language : lan_data,
            accounting: accounting_account,
            warehouse_acct: wm_account,
            sales_acct: sales_account,
            warehouse_loc: warehouse_loc
            // data: so_data
        })
    } catch (error) {
        
    }
});


router.post("/add/", auth, async(req, res) => {
    try {
        const { accounting_account_id, warehouse_account_id, staff_id, warehouse_loc } = req.body;
        
        if(typeof staff_id == "string"){
            var staff_id_aaray = [req.body.staff_id]
            var name_accounting_array = [req.body.name_accounting]
        }else{
            var staff_id_aaray = [...req.body.staff_id]
            var name_accounting_array = [...req.body.name_accounting]
        }


        const newproduct = staff_id_aaray.map((value)=>{
            
            return  value  = {
                        id_member : value,
                    }   
            });

            name_accounting_array.forEach((value,i) => {
                newproduct[i].name = value
            });


            const data = new approver_acct({  head_id_staff: accounting_account_id, warehouse_staff_id: warehouse_account_id, warehouse_name: warehouse_loc, members: newproduct  });
            const approver = await data.save();

            req.flash("success", "Approver Add successfully")
            res.redirect("/so_approvers/preview/"+approver._id)


        // res.json(req.body)
    } catch (error) {
        
    }
})


router.post("/get_sales_data", auth, async(req, res) => {
    try {
        const { id_staff } = req.body;
        const staff_data = await staff.findById(id_staff)
        res.json(staff_data);
    } catch (error) {
        
    }
})


router.get("/preview/:id", auth, async(req, res) => {
    try {
        const role_data = req.user;
        const _id = req.params.id
        const master = await master_shop.find();
        const profile_data = await profile.findOne({email : role_data.email});

        const accounting_account = await staff.find({ account_category: "acc"});
        const wm_account = await staff.find({ account_category: "wm"});
        const sales_account = await staff.find({ account_category: "sa"});

        const warehouse_loc = await warehouse.aggregate([
            {
                $group:{
                    _id: "$name"
                }
            }
        ])
;
        const data =  await approver_acct.findById(_id);
        // res.json(data);
        // return
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
        // console.log(data)
        res.render("view_so_approvers", {
            success: req.flash('success'),
            errors: req.flash('errors'),
            role : role_data,
            profile : profile_data,
            master_shop : master,
            language : lan_data,
            accounting: accounting_account,
            warehouse_acct: wm_account,
            sales_acct: sales_account,
            warehouse_loc: warehouse_loc,
            data: data
        })



    } catch (error) {
        
    }
})

module.exports = router;