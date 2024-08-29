const express = require("express");
const app = express();
const router = express.Router();
const auth = require("../middleware/auth");
const { profile, sales, sales_return, purchases, purchases_return, categories, product, suppliers, customer, master_shop, transfers, adjustment, purchases_finished, sales_finished, adjustment_finished, transfers_finished, staff, sales_sa, sales_order } = require("../models/all_models");
const users = require("../public/language/languages.json");


router.get("/index", auth, async(req, res) => {
    try {
        
        const {username, email, role} = req.user
        const role_data = req.user
        const master = await master_shop.find()
        const profile_data = await profile.findOne({email : role_data.email})
        // const staff_data = await staff.findOne({ email: role_data.email })
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
        // res.json(role_data)
        // return
        if(role_data.account_category == "wm"){

            var cnt;
            if(role_data.warehouse_category == "Raw Materials"){
                const prod = await product.find({ product_category: "Raw Materials" });
                cnt = prod.length
            }else if(role_data.warehouse_category == "Finished Goods") {
                const prod = await product.find({ product_category: "Finished Goods" });
                cnt = prod.length
            }else{
                const prod = await product.find();
                cnt = prod.length
            }
            // res.json(role_data);
            // return
            
    
            
            
            const sale_data = await sales.aggregate([
                {
                    $group: {
                        _id: null,
                        total_price: {$sum: "$total_price"},
                    }
                }
            ])
            
            const sale_data_QTY = await sales.aggregate([
               {
                $unwind: "$sale_product" 
              },
              {
                $group: {
                  _id: null,
                  totalQuantity: { $sum: "$sale_product.quantity" } // Sum the quantities
                }
              }
            ])
            
               
            // console.log("11111", sale_data);
    
            const sales_return_data = await sales_return.aggregate([
                {
                    $group: {
                        _id: null,
                        total: {$sum: "$total_amount"},
                    }
                }
            ])
            
            
            const sales_return_data_QTY = await sales_return.aggregate([
               {
                $unwind: "$return_sale" 
              },
              {
                $group: {
                  _id: null,
                  totalQuantity: { $sum: "$return_sale.sale_qty" } // Sum the quantities
                }
              }
            ])
    // res.status(200).send(sales_return_data_QTY)
            const purchases_data = await purchases.aggregate([
                {
                    $group: {
                        _id: null,
                        total_amount: {$sum: "$total_amount"},
                    }
                }
            ])
    
            const purchases_return_data = await purchases_return.aggregate([
                {
                    $group: {
                        _id: null,
                        total: {$sum: "$total_amount"},
                    }
                }
            ])
            
            
            const purchases_return_data_QTY = await purchases_return.aggregate([
               {
                $unwind: "$return_product" 
              },
              {
                $group: {
                  _id: null,
                  totalQuantity: { $sum: "$return_product.return_qty" } // Sum the quantities
                }
              }
            ])
            
            const purchases_data_QTY = await purchases.aggregate([
               {
                $unwind: "$product" 
              },
              {
                $group: {
                  _id: null,
                  totalQuantity: { $sum: "$product.quantity" } // Sum the quantities
                }
              }
            ])
    
    
            const purchases_table_data = await purchases.aggregate([
                {
                    $sort: {
                        'invoice':-1
                    }
                },
                { $limit : 5 },
                {
                    $sort: {
                        'invoice':1
                    }
                },
            ])
    
    
            const sales_table_data = await sales.aggregate([
                {
                    $sort: {
                        'invoice':-1
                    }
                },
                { $limit : 5 },
                {
                    $sort: {
                        'invoice':1
                    }
                },
            ])
            
            
            
            const transfer_table_data = await transfers.aggregate([
                {
                    $unwind: "$product"
                },
                {
                    $group: {
                      _id: "$product.product_name",
                      fromWarehouse: { "$first" : "$from_warehouse" },
                      toWareHouse: { "$first" : "$to_warehouse" },
                      FromtotalQuantity: { $sum : '$product.from_quantity' },
                      TototalQuantity: { $sum : '$product.to_quantity' },
                      
                    }
                }
                
            ])
    // res.status(200).json(transfer_table_data)
            const categories_data = await categories.find()
    
            const product_data = await product.find()
            
            const suppliers_data = await suppliers.find()
            
            const customer_data = await customer.find()
    
    
            
             
            //  const checkdata = await purchases.find({"date" : "2023-12-28" });
            //  res.json(purchases_line_graph_data);
            //  return





            res.render("index", {
                success: req.flash('success'),
                errors: req.flash('errors'),
                role : role_data,
                profile : profile_data,
                sale: sale_data[0],
                sales_return: sales_return_data[0],
                purchases: purchases_data[0],
                purchases_return: purchases_return_data[0],
                purchases_table: purchases_table_data,
                sales_table: sales_table_data,
                categories: categories_data.length,
                product: product_data.length,
                suppliers: suppliers_data.length,
                customer: customer_data.length,
                master_shop : master,
                language : lan_data,
                sale_QTY: sale_data_QTY[0],
                purchases_QTY: purchases_data_QTY[0],
                sales_return_QTY: sales_return_data_QTY[0],
                purchases_return_QTY: purchases_return_data_QTY[0],
                transfer_table: transfer_table_data,
                product_cnt : cnt,
            })
        }else if(role_data.account_category == "sa"){
            const staff_data = await staff.findOne({ email: role_data.email });
            const sales_sa_data = await sales_sa.find({ sales_staff_id : staff_data._id });

            const paid_true = await sales_sa.find({ sales_staff_id : staff_data._id, paid: "True" });
            const paid_false = await sales_sa.find({ sales_staff_id : staff_data._id, paid: "False" });
            // console.log(staff_data)
            const sales_sa_my_inventory = await sales_sa.aggregate([
                {
                    $match : {
                        sales_staff_id : staff_data._id.valueOf(),
                    }
                },
                {
                    $unwind : "$sale_product"
                },
                {
                    $group: {
                      _id: null,
                      sumprice: { $sum: "$sale_product.price" } ,
                      count: { $sum: 1 }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        sumprice: 1,
                        averageprice: { $round: [{ $divide: ["$sumprice", "$count"] }, 2] } // Calculate the average price
                    }
                }
            ])

            // res.json(role_data)
            const sales_sa_data_count = await staff.aggregate([
                {
                    $match: {
                        email: role_data.email 
                    }
                },
                {
                    $unwind: "$product_list"
                },
                {
                    $group: {
                        _id: null,
                        totalQTY: { $sum: "$product_list.product_stock" } ,
                    }
                }
            ]);
            res.render("index_sa", {
                success: req.flash('success'),
                errors: req.flash('errors'),
                role : role_data,
                profile : profile_data,
                master_shop : master,
                language : lan_data,
                cntPaid : paid_true,
                cntNotPaid : paid_false,
                avg_price: sales_sa_my_inventory[0],
                my_stock: sales_sa_data_count[0],
                staff_arr: staff_data
            })
        }else if(role_data.account_category == "acc"){
            const staff_data = await staff.findOne({ email: role_data.email });


            res.render("index_acc", {
                success: req.flash('success'),
                errors: req.flash('errors'),
                role : role_data,
                profile : profile_data,
                master_shop : master,
                language : lan_data,
            })

            res.json(staff_data)
        }else{
            var cnt;
            if(role_data.warehouse_category == "Raw Materials"){
                const prod = await product.find({ product_category: "Raw Materials" });
                cnt = prod.length
            }else if(role_data.warehouse_category == "Finished Goods") {
                const prod = await product.find({ product_category: "Finished Goods" });
                cnt = prod.length
            }else{
                const prod = await product.find();
                cnt = prod.length
            }
            // res.json(role_data);
            // return
            
    
            
            
            const sale_data = await sales.aggregate([
                {
                    $group: {
                        _id: null,
                        total_price: {$sum: "$total_price"},
                    }
                }
            ])
            
            const sale_data_QTY = await sales.aggregate([
               {
                $unwind: "$sale_product" 
              },
              {
                $group: {
                  _id: null,
                  totalQuantity: { $sum: "$sale_product.quantity" } // Sum the quantities
                }
              }
            ])
            
               
            // console.log("11111", sale_data);
    
            const sales_return_data = await sales_return.aggregate([
                {
                    $group: {
                        _id: null,
                        total: {$sum: "$total_amount"},
                    }
                }
            ])
            
            
            const sales_return_data_QTY = await sales_return.aggregate([
               {
                $unwind: "$return_sale" 
              },
              {
                $group: {
                  _id: null,
                  totalQuantity: { $sum: "$return_sale.sale_qty" } // Sum the quantities
                }
              }
            ])
    // res.status(200).send(sales_return_data_QTY)
            const purchases_data = await purchases.aggregate([
                {
                    $group: {
                        _id: null,
                        total_amount: {$sum: "$total_amount"},
                    }
                }
            ])
    
            const purchases_return_data = await purchases_return.aggregate([
                {
                    $group: {
                        _id: null,
                        total: {$sum: "$total_amount"},
                    }
                }
            ])
            
            
            const purchases_return_data_QTY = await purchases_return.aggregate([
               {
                $unwind: "$return_product" 
              },
              {
                $group: {
                  _id: null,
                  totalQuantity: { $sum: "$return_product.return_qty" } // Sum the quantities
                }
              }
            ])
            
            const purchases_data_QTY = await purchases.aggregate([
               {
                $unwind: "$product" 
              },
              {
                $group: {
                  _id: null,
                  totalQuantity: { $sum: "$product.quantity" } // Sum the quantities
                }
              }
            ])
    
    
            const purchases_table_data = await purchases.aggregate([
                {
                    $sort: {
                        'invoice':-1
                    }
                },
                { $limit : 5 },
                {
                    $sort: {
                        'invoice':1
                    }
                },
            ])
    
    
            const sales_table_data = await sales.aggregate([
                {
                    $sort: {
                        'invoice':-1
                    }
                },
                { $limit : 5 },
                {
                    $sort: {
                        'invoice':1
                    }
                },
            ])
            
            
            
            const transfer_table_data = await transfers.aggregate([
                {
                    $unwind: "$product"
                },
                {
                    $group: {
                      _id: "$product.product_name",
                      fromWarehouse: { "$first" : "$from_warehouse" },
                      toWareHouse: { "$first" : "$to_warehouse" },
                      FromtotalQuantity: { $sum : '$product.from_quantity' },
                      TototalQuantity: { $sum : '$product.to_quantity' },
                      
                    }
                }
                
            ])

            const categories_data = await categories.find()
    
            const product_data = await product.find()
            
            const suppliers_data = await suppliers.find()
            
            const customer_data = await customer.find()

            res.render("index", {
                success: req.flash('success'),
                errors: req.flash('errors'),
                role : role_data,
                profile : profile_data,
                sale: sale_data[0],
                sales_return: sales_return_data[0],
                purchases: purchases_data[0],
                purchases_return: purchases_return_data[0],
                purchases_table: purchases_table_data,
                sales_table: sales_table_data,
                categories: categories_data.length,
                product: product_data.length,
                suppliers: suppliers_data.length,
                customer: customer_data.length,
                master_shop : master,
                language : lan_data,
                sale_QTY: sale_data_QTY[0],
                purchases_QTY: purchases_data_QTY[0],
                sales_return_QTY: sales_return_data_QTY[0],
                purchases_return_QTY: purchases_return_data_QTY[0],
                transfer_table: transfer_table_data,
                product_cnt : cnt,
            })
        }
       
    } catch (error) {
        console.log(error);
    }
})


router.get("/pending_data_table", auth, async(req, res) => {
    try {
        const role_data = req.user
        const staff_data = await staff.findOne({ email: role_data.email });
        // const paid_true = await sales_sa.find({ sales_staff_id : staff_data._id, paid: "True" });
        // const paid_false = await sales_sa.find({ sales_staff_id : staff_data._id, paid: "False" });
        const paid_false = await sales_sa.aggregate([
            { 
                $match: {
                    sales_staff_id : staff_data._id.valueOf(),
                     paid: "False"
                }
            },
            {
                $limit : 4
            },
            {
                $sort : { invoice : -1 }
            }
        ]);
        res.json(paid_false);

    } catch (error) {
        res.json(error);
    }
})

router.get("/pending_data", auth, async(req, res) => {
    try {
        const role_data = req.user
        const staff_data = await staff.findOne({ email: role_data.email });
        // const paid_true = await sales_sa.find({ sales_staff_id : staff_data._id, paid: "True" });
        const paid_false = await sales_sa.find({ sales_staff_id : staff_data._id, paid: "False" });
        res.json(paid_false);

    } catch (error) {
        res.json(error);
    }
})


router.post("/get_count", auth, async(req, res) => {
    try {
        const { sttaff_id, warehouse, account_category } = req.user;

        const data_user = await sales_order.aggregate([
            {
                $match: {
                    accounting_account_id : sttaff_id,
                    accounting_account_confirm : "false",
                }
            }
        ])
        res.json(data_user)
    } catch (error) {
        
    }
})



router.get("/paid_data_table", auth, async(req, res) => {
    try {
        const role_data = req.user
        const staff_data = await staff.findOne({ email: role_data.email });
        const paid_true = await sales_sa.find({ sales_staff_id : staff_data._id, paid: "True" });
     

        res.json(paid_true);

    } catch (error) {
        res.json(error);
    }
})



router.get("/paid_data", auth, async(req, res) => {
    try {
        const role_data = req.user
        const staff_data = await staff.findOne({ email: role_data.email });
        // const paid_true = await sales_sa.find({ sales_staff_id : staff_data._id, paid: "True" });
        const paid_true = await sales_sa.aggregate([
            { 
                $match: {
                    sales_staff_id : staff_data._id.valueOf(),
                     paid: "True"
                }
            },
            {
                $limit : 4
            },
            {
                $sort : { invoice : -1 }
            }
        ]);

        res.json(paid_true);

    } catch (error) {
        res.json(error);
    }
})


router.post("/update_data", auth, async(req, res) => {
    try {

        const { id, price } = req.body
        // res.json(req.body);
        // return;
        const salesData = await  sales_sa.findById(id);
        salesData.paid = "True";
        salesData.collection_price = parseFloat(price)
        const new_data = await salesData.save()
        res.json(new_data)

    } catch (error) {
        res.json(error);
    }
})



router.get("/pending_data", auth, async(req, res) => {
    try {
        const role_data = req.user
        const staff_data = await staff.findOne({ email: role_data.email });
        // const paid_true = await sales_sa.find({ sales_staff_id : staff_data._id, paid: "True" });
        const paid_false = await sales_sa.find({ sales_staff_id : staff_data._id, paid: "False" });
        res.json(paid_false);

    } catch (error) {
        res.json(error);
    }
})


router.get("/avg_data", auth, async(req, res) => {
    try {
        const role_data = req.user
        const staff_data = await staff.findOne({ email: role_data.email });
        // const paid_true = await sales_sa.find({ sales_staff_id : staff_data._id, paid: "True" });
        const sales_sa_my_inventory = await sales_sa.aggregate([
            {
                $match : {
                    sales_staff_id : staff_data._id.valueOf(),
                }
            },
            {
                $unwind : "$sale_product"
            },
            {
                $group: {
                  _id: null,
                  sumprice: { $sum: "$sale_product.price" } ,
                  count: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    sumprice: 1,
                    averageprice: { $round: [{ $divide: ["$sumprice", "$count"] }, 2] } // Calculate the average price
                }
            }
        ])
        res.json(sales_sa_my_inventory);

    } catch (error) {
        res.json(error);
    }
})



router.get("/my_inv", auth, async(req, res) => {
    try {
        const role_data = req.user
        const staff_data = await staff.findOne({ email: role_data.email });
        // const paid_true = await sales_sa.find({ sales_staff_id : staff_data._id, paid: "True" });
        const sales_sa_data_count = await staff.aggregate([
            {
                $match: {
                    email: role_data.email
                    
                }
            },
            {
                $unwind: "$product_list"
            },
            {
                $match:{
                    "product_list.isConfirm": "true"
                }
            },
            {
                $group: {
                    _id: null,
                    totalQTY: { $sum: "$product_list.product_stock" } ,
                }
            }
        ]);
        res.json(sales_sa_data_count);

    } catch (error) {
        res.json(error);
    }
})



router.get("/sales_chart", auth, async(req, res) => {
    try {
        const role_data = req.user
        const staff_data = await staff.findOne({ email: role_data.email });
        const sales_chart = await sales_sa.aggregate([
            {
                $match : {
                    sales_staff_id : staff_data._id.valueOf(),
                }
            },
            {
                $unwind: "$sale_product" 
            },
            {
                $group: {
                
                _id: "$date",
                totalQuantity: { $sum: "$sale_product.quantity" },
                date: { $first: "$date" },
                
                }
            },
            {
                $sort: { date: 1 } // Sort by date in ascending order
            }
        ])
        res.json(sales_chart);

    } catch (error) {
        res.json(error);
    }
})


router.get("/price_chart", auth, async(req, res) => {
    try {
        const role_data = req.user
        const staff_data = await staff.findOne({ email: role_data.email });
        const sales_chart = await sales_sa.aggregate([
            {
                $match : {
                    sales_staff_id : staff_data._id.valueOf(),
                }
            },
            {
                $unwind: "$sale_product" 
            },
            {
                $group: {
                
                _id: "$date",
                totalPrice: { $sum: "$sale_product.totalprice" },
                date: { $first: "$date" },
                
                }
            },
            {
                $sort: { date: 1 } // Sort by date in ascending order
            }
        ])
        res.json(sales_chart);

    } catch (error) {
        res.json(error);
    }
})







module.exports = router;