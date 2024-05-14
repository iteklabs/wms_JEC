const express = require("express");
const app = express();
const router = express.Router();
const { profile, master_shop, categories, brands, units, product, warehouse, staff, customer, suppliers, purchases, purchases_return, suppliers_payment, s_payment_data } = require("../models/all_models");
const auth = require("../middleware/auth");
const users = require("../public/language/languages.json");


router.get("/view", auth, async (req, res) => {
    try {
        const {username, email, role} = req.user
        const role_data = req.user
        
        const profile_data = await profile.findOne({email : role_data.email})

        const master = await master_shop.find()
        console.log("master" , master);

        const all_data = await purchases_return.aggregate([
            {
                $lookup:
                {
                    from: "suppliers",
                    localField: "suppliers",
                    foreignField: "name",
                    as: "supplier_docs"
                }
            },
            {
                $unwind: "$return_product"
            },
            {
                $unwind: "$supplier_docs"
            },
            {
                $group: {
                    _id: "$_id",
                    invoice: { $first: "$invoice" },
                    date: { $first: "$date" },
                    suppliers: { $first: "$suppliers" }, 
                    warehouse_name: { $first: "$warehouse_name" }, 
                    product_name: { $first: "$return_product.product_name" }, 
                    return_qty: { $first: "$return_product.return_qty" }, 
                    price: { $first: "$return_product.price" }, 
                    total: { $sum: "$return_product.total" },
                    note: { $first: "$note" },
                    total_amount: { $first: "$total_amount" },
                    discount: { $first: "$discount" },
                    receivable: { $first: "$receivable" },
                    received: { $first: "$received" },
                    due_amount: { $first: "$due_amount" },
                    mobile: { $first: "$supplier_docs.mobile" },
                    email: { $first: "$supplier_docs.email" },
                    address: { $first: "$supplier_docs.address" },
                    return_sum_qty: { $sum: "$return_product.return_qty" },
                }
            },
        ])
        console.log(all_data);

        if (master[0].language == "English (US)") {
            var lan_data = users.English
            console.log(lan_data);
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

        res.render("purchases_return", {
            success: req.flash('success'),
            errors: req.flash('errors'),
            role : role_data,
            profile : profile_data,
            master_shop : master,
            user : all_data,
            language : lan_data
        })
    } catch (error) {
        console.log(error);
    }
})


router.get("/view/:id", auth, async (req, res) => {
    try {
        const {username, email, role} = req.user
        const role_data = req.user
        
        const profile_data = await profile.findOne({email : role_data.email})

        const product_data = await product.find({});

        const master = await master_shop.find()
        console.log("master" , master);

        console.log(req.body);
        const _id = req.params.id

        const user_id = await purchases_return.findById(_id);
        console.log(user_id);



        const stock_data = await warehouse.aggregate([
            {
                $match: { 
                    "name": user_id.warehouse_name,
                    "room": user_id.room 
                }
            },
            {
                $unwind: "$product_details"
            },
            {
                $group: {
                    _id: "$product_details._id",
                    name: { $first: "$product_details.product_name"},
                    product_stock: { $first: "$product_details.product_stock" },
                    bay: { $first: "$product_details.bay" },
                    bin: { $first: "$product_details.bin" },
                    type: { $first: "$product_details.type" },
                    floorlevel: { $first: "$product_details.floorlevel" },
                    primary_code: { $first: "$product_details.primary_code" },
                    secondary_code: { $first: "$product_details.secondary_code" },
                    product_code: { $first: "$product_details.product_code" },
                    storage: { $first: "$product_details.storage" },
                    rack: { $first: "$product_details.rack" },
                }
            },
        ])
        warehouse_data = await warehouse.aggregate([
            {
                $match: { 
                    "status": 'Enabled',
                    "name": "Return Goods",
                    "warehouse_category" : "Raw Materials"
                }
            },
            {
                $group: {
                    _id: "$name",
                    name: { $first: "$name" }
                }
            },
            {
                $sort: {
                    name: 1 // 1 for ascending order, -1 for descending order
                }
            }
        ]);


        console.log("stock_data", stock_data);

        if (master[0].language == "English (US)") {
            var lan_data = users.English
            console.log(lan_data);
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

        res.render("return_purchase_edit", {
            success: req.flash('success'),
            errors: req.flash('errors'),
            role : role_data,
            master_shop : master,
            profile : profile_data,
            user: user_id,
            stock: stock_data,
            product: product_data,
            language : lan_data,
            warehouse: warehouse_data
        })
    } catch (error) {
        console.log(error);
    }
})

router.post("/view/:id", auth, async (req, res) => {
    try {
        const _id = req.params.id
        console.log(_id);

        const old_data = await purchases_return.findOne({invoice : req.body.invoice})
        console.log("old_data" , old_data);
   
        const old_warehouse_data = await warehouse.findOne({ name: old_data.to_warehouse_name, room: old_data.to_room });
        console.log("old_warehouse_data", old_warehouse_data);


        const { invoice, suppliers, date, warehouse_name, product_name, purchase_quantity, stocks, return_qty, note, Room_name, level, isle, pallet, to_warehouse_name, to_Room_name} = req.body

        if(typeof product_name == "string"){
            var product_name_array = [req.body.product_name]
            var quantity_array = [req.body.purchase_quantity]
            var stock_quantity_array = [req.body.stocks]
            var return_qty_array = [req.body.return_qty]
            var level_array = [req.body.level]
            var isle_array = [req.body.isle]
            var pallet_array = [req.body.pallet]
            var types_array = [req.body.types]
            var product_code_hide_array = [req.body.product_code_hide]
            var primary_code_hide_array = [req.body.primary_code_hide]
            var secondary_code_hide_array = [req.body.secondary_code_hide]
        }else{
            var product_name_array = [...req.body.product_name]
            var quantity_array = [...req.body.purchase_quantity]
            var stock_quantity_array = [...req.body.stocks]
            var return_qty_array = [...req.body.return_qty]
            var level_array = [...req.body.level]
            var isle_array = [...req.body.isle]
            var pallet_array = [...req.body.pallet]
            var product_code_hide_array = [...req.body.product_code_hide]
            var primary_code_hide_array = [...req.body.primary_code_hide]
            var secondary_code_hide_array = [...req.body.secondary_code_hide]
            var types_array = [...req.body.types]
        } 
        
        const newproduct = product_name_array.map((value)=>{
            
            return  value  = {
                        product_name : value,
                    }   
            })
                    
        quantity_array.forEach((value,i) => {
            newproduct[i].purchase_quantity = value
        });

        stock_quantity_array.forEach((value,i) => {
            newproduct[i].stock_quantity = value
        });
        
        return_qty_array.forEach((value, i) => {
            newproduct[i].return_qty = value
        })
        

        level_array.forEach((value, i) => {
            newproduct[i].bay = value
        })

        isle_array.forEach((value, i) => {
            newproduct[i].bin = value
        })

        pallet_array.forEach((value, i) => {
            newproduct[i].floorlevel = value
        })


        product_code_hide_array.forEach((value, i) => {
            newproduct[i].product_code = value
        })


        primary_code_hide_array.forEach((value, i) => {
            newproduct[i].primary_code = value
        })


        secondary_code_hide_array.forEach((value, i) => {
            newproduct[i].secondary_code = value
        })


        types_array.forEach((value, i) => {
            newproduct[i].type = value
        })

        



        var error = 0
        newproduct.forEach(data => {
            console.log("foreach newproduct", data);
            if (parseInt(data.purchase_quantity) < parseInt(data.return_qty) || parseInt(data.stock_quantity) < parseInt(data.return_qty) || parseInt(data.return_qty) == 0 ) {
                
                error++
            }
        })
        if (error != 0) {
            
            req.flash("errors", `Must not be greater than Purchase/Stock Qty`)
            return res.redirect("back")
        }



        old_data.return_product.forEach(product_details => {
            // console.log("if product_details", product_details);



            const match_data = old_warehouse_data.product_details.map((data) => {
                // console.log("map", data);

                if (data.product_name == product_details.product_name && data.floorlevel == product_details.floorlevel && data.type == product_details.type && data.bin == product_details.bin && data.bay == product_details.bay) {
                    data.product_stock = parseInt(data.product_stock) + parseInt(product_details.return_qty)
                    
                }

            })
        })
        console.log("old_warehouse_data", old_warehouse_data);
        await old_warehouse_data.save()





        
        old_data.invoice = invoice
        old_data.suppliers = suppliers
        old_data.date = date
        old_data.warehouse_name = warehouse_name
        old_data.return_product = newproduct
        old_data.note = note
        old_data.room = Room_name
        old_data.to_warehouse_name = to_warehouse_name
        old_data.to_room = to_Room_name
        
        const purchases_return_data = await old_data.save()
        // console.log(data);
        

        const new_data = await purchases_return.findOne({invoice : req.body.invoice})
        // console.log("new_data" , new_data);


        // ---------- warehouse ------- //

        const new_warehouse_data = await warehouse.findOne({ name: req.body.to_warehouse_name, room: req.body.to_Room_name });
        // console.log("new_warehouse_data", new_warehouse_data);

        new_data.return_product.forEach(new_product_details => {
            // console.log("if product_details", product_details);


            new_warehouse_data.product_details.map((data) => {
                // console.log("map", data);

                if (data.product_name == new_product_details.product_name && data.pallet == new_product_details.pallet) {
                    data.product_stock = parseInt(data.product_stock) - parseInt(new_product_details.return_qty)
                    console.log("product_details.return_qtyproduct_details.return_qty", new_product_details.return_qty);
                }

            })
        })
        
        console.log("final", new_warehouse_data);
        await new_warehouse_data.save()

        // ---------- warehouse end ------- //


        // -------- supplier payment ------- //

        const s_payment = await s_payment_data.findOne({invoice : req.body.invoice , reason : "Purchase Return"})


        await s_payment.save()

        // -------- supplier payment end ------- //


        

        req.flash("success", `purchase return successfully`)
        res.redirect("/purchases_return/view")
    } catch (error) {
        console.log(error);
        res.status(200).json({ message: error.message })
    }
})


router.get("/invoice/:id", auth, async (req, res) => {
    try {
        const {username, email, role} = req.user
        const role_data = req.user

        const profile_data = await profile.findOne({email : role_data.email})

        const master = await master_shop.find()
        console.log("master" , master);

        const _id = req.params.id

        const user_id = await purchases_return.findById(_id);
        console.log(user_id);
        
        const suppliers_data = await suppliers.findOne({ name : user_id.suppliers });
        console.log(suppliers_data);

        if (master[0].language == "English (US)") {
            var lan_data = users.English
            console.log(lan_data);
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
        res.render("return_purchase_invoice", {
            success: req.flash('success'),
            errors: req.flash('errors'),
            role : role_data,
            profile : profile_data,
            master_shop : master,
            supplier : suppliers_data,
            purchase : user_id,
            language : lan_data
        })
    } catch (error) {
        console.log(error);
    }
})

// ========= Give Payment ============= //

router.post("/receive_payment/:id", auth, async (req, res) => {
    try {

        const _id = req.params.id;
        const { invoice, suppliers, receivable_amount, received_amount } = req.body
        
        const data = await purchases_return.findById(_id)
        console.log(data);

        var subtract = receivable_amount - received_amount
        console.log(received_amount);


        data.received = parseFloat(received_amount) + parseFloat(data.received)
        data.due_amount = subtract

        console.log(data);
        const new_data = await data.save();

        // -------- s_payment ------- //

        const s_payment = await s_payment_data.findOne({invoice : req.body.invoice , reason : "Purchase Return"})

        s_payment.amount = subtract


        await s_payment.save()

        // -------- s_payment end ------- //


        // -------- supplier payment ------- //

        let date_ob = new Date();
        let newdate = ("0" + date_ob.getDate()).slice(-2);
        let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
        let year = date_ob.getFullYear();
        let final_date = year + "-" + month + "-" + newdate
       
        const suppliers_payment_data = new suppliers_payment({invoice, date : year + "-" + month + "-" + newdate, suppliers, reason : "Received For Purchase Return", amount : received_amount})

        const new_suppliers_payment = await suppliers_payment_data.save()

        // -------- supplier payment end ------- //


        // console.log(new_data);
        req.flash('success', `payment successfull`)
        res.redirect("/purchases_return/view")
    } catch (error) {
        console.log(error);
    }
})


module.exports = router;    