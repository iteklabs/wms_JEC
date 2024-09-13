const express = require("express");
const res = require("express/lib/response");
const app = express();
const router = express.Router();
const multer = require('multer');
const { profile, master_shop, categories, brands, units, product, purchases, warehouse, sales_finished, sales, transfers_finished, adjustment_finished, purchases_finished, sales_return_finished, adjustment, transfers, sales_sa, staff, sales_inv_data, Reference } = require("../models/all_models");
const auth = require("../middleware/auth");
const users = require("../public/language/languages.json");
const excelJS = require("exceljs");
const XLSX = require('xlsx');
const PDFDocument = require('pdfkit-table');
const fs = require('fs');
const blobStream  = require('blob-stream');
const JsBarcode = require('jsbarcode');
const { Canvas } = require("canvas");
const pdf = require('html-pdf');
const path = require('path');
const mongoose = require("mongoose");
const cheerio = require('cheerio');


router.get("/balance/view", auth, async (req, res) => {
    try {
        const {username, email, role} = req.user
        const role_data = req.user
        
        const profile_data = await profile.findOne({email : role_data.email})
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const master = await master_shop.find()
        console.log("Products master" , master);

        const find_data = await product.find();
        console.log("Products find_data", find_data);


        const warehouse_data = await warehouse.aggregate([
            {
                $unwind: "$product_details"
            },
            {
                $lookup:
                {
                    from: "products",
                    localField: "product_details.product_name",
                    foreignField: "name",
                    as: "product_docs"
                }
            },
            {
                $unwind: "$product_docs"
            },
            {
                $project: 
                {
                    product_name: '$product_details.product_name',
                    product_stock: '$product_details.product_stock',
                }
            },
            {
                $group: {
                    _id: "$product_name",
                    product_stock: { $sum: "$product_stock" }
                }
            },
        ])
        console.log("Products warehouse_data", warehouse_data);


        warehouse_data.forEach(product_details => {

            const match_data = find_data.map((data) => {

                if (data.name == product_details._id) {
                    data.stock = parseInt(data.stock) + parseInt(product_details.product_stock)
                    
                }

            })
        })
        console.log("Products find_data", find_data);

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

        res.render("balanced", { 
            success: req.flash('success'),
            errors: req.flash('errors'),
            alldata: find_data,
            profile : profile_data,
            master_shop : master,
            role : role_data,
            product_stock : warehouse_data,
            language : lan_data
			
        })
    } catch (error) {
        
    }
})

async function dataCheck(from, to){
    const product_data = await product.aggregate([
        {
            $group: {
                _id: {
                    brand: "$brand",
                    category: "$category"
                },
                products:{
                    $push: {
                        name: "$name",
                        product_code: "$product_code"
                    }
                }

            }
        },
        {
            $sort: {
                
                "_id.category": -1, // Sort by category in ascending order
                "_id.brand": 1,  // Sort by brand in ascending order
            }
        }
    ])
    var array_data = [];
    array_data["cat_brand"] = [];
    for (let index = 0; index <= product_data.length -1; index++) {
        const element = product_data[index];
        array_data["cat_brand"].push(element)
        // array_data["cat_brand"].push(element)
        
        
    }


    const product_cat= await product.aggregate([
        {
            $group: {
                _id: {
                    category: "$category"
                },
                products:{
                    $push: {
                        brand: "$brand",
                        product_code: "$product_code",
                        product_name: "$name"
                    }
                }

            }
        },
        {
            $sort: {
                
                "_id.category": -1, // Sort by category in ascending order
            }
        }
    ])

    const begBal = await purchases_finished.aggregate([
        {
            $match: {
                date: {
                    $gte: from,
                    $lte: to
                }
            }
        },
        {
            $unwind: "$product"
        },
        {
            $group: {
                _id: {
                    product_name: "$product.product_name",
                    product_code: "$product.product_code"
                },
                totalQTY:{
                    $sum: "$product.quantity"
                }
            }
        }
    ]);
    array_data["beg_bal"] = [];
    for (let i = 0; i <= begBal.length-1; i++) {
        const element = begBal[i];
        array_data["beg_bal"].push(element)
        
    }


   
    const salesbkg = await sales_sa.aggregate([
        {
            $match:{
                date: {
                    $gte: from,
                    $lte: to
                }
            }
        },
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
                as: "sales_info"
            }
        },
        {
            $unwind: "$sales_info"
        },
        {
            $unwind: "$sale_product"
        },
        {
            $match:{
                "sales_info.account_category" : "sa",
                "sales_info.type_of_acc_cat" : "2",
            }
        },
        {
            $group:{
                _id:{
                    product_name: "$sale_product.product_name",
                    product_code: "$sale_product.product_code",
                },
                totalQTY: { $sum: "$sale_product.quantity"}
            }
        }
        
    ])


    console.log(salesbkg[0])
    array_data["sales_bkg"] = [];
    for (let p = 0; p <= salesbkg.length - 1; p++) {
        const element = salesbkg[p];
        array_data["sales_bkg"].push(element)
    
    }

    const salesext = await sales_sa.aggregate([
        {
            $match:{
                date: {
                    $gte: from,
                    $lte: to
                }
            }
        },
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
                as: "sales_info"
            }
        },
        {
            $unwind: "$sales_info"
        },
        {
            $unwind: "$sale_product"
        },
        {
            $match:{
                "sales_info.account_category" : "sa",
                "sales_info.type_of_acc_cat" : "1",
                "sale_product.isFG" : "false",
            }
        },
        {
            $group:{
                _id:{
                    product_name: "$sale_product.product_name",
                    product_code: "$sale_product.product_code",
                },
                totalQTY: { $sum: "$sale_product.real_qty_unit_val"}
            }
        }
        
    ])
    array_data["sales_ext"] = [];
    for (let o = 0; o <= salesext.length - 1; o++) {
        const element = salesext[o];
        array_data["sales_ext"].push(element)
    
    }


    let htmlContent = "";
    for(let a = 0; a <= product_cat.length -1; a++){
        const thdata = product_cat[a];
        

        htmlContent += `<tr>`;
        htmlContent += `<td colspan="7" class="cat_data">`+thdata._id.category+`</td>`;
        htmlContent += `</tr>`;

        for (let b = 0; b < array_data["cat_brand"].length; b++) {
            const element = array_data["cat_brand"][b];

            if(element._id.category == thdata._id.category){
                // console.log(element.products.length + " <> " + element._id.category + " <> " + element._id.brand)
                let sum=[];
                let xsum=[];
                let bsum=[];
                sum[element._id.brand] = [];
                xsum[element._id.brand] = [];
                bsum[element._id.brand] = [];
                var totalqty = 0;
                var xtotalqty = 0;
                var btotalqty = 0;
                for (let c = 0; c < element.products.length; c++) {
                    const detlt = element.products[c];
                    
                    for (let d = 0; d <= array_data["beg_bal"].length -1; d++) {
                        const beg_data = array_data["beg_bal"][d];

                        if(beg_data._id.product_name == detlt.name && beg_data._id.product_code == detlt.product_code){
                            // console.log(beg_data._id.product_name)

                            totalqty += parseInt(beg_data.totalQTY,10);
                            
                        }
                         
                    }


                    for (let e = 0; e <= array_data["sales_ext"].length -1; e++) {
                        const x_data = array_data["sales_ext"][e];

                        if(x_data._id.product_name == detlt.name && x_data._id.product_code == detlt.product_code){
                            // console.log(beg_data._id.product_name)

                            xtotalqty += parseFloat(x_data.totalQTY,10).toFixed(2);
                            
                        }
                         
                    }



                    for (let f = 0; f <= array_data["sales_bkg"].length -1; f++) {
                        const b_data = array_data["sales_bkg"][f];

                        if(b_data._id.product_name == detlt.name && b_data._id.product_code == detlt.product_code){
                            // console.log(beg_data._id.product_name)

                            btotalqty += parseInt(b_data.totalQTY,10);
                            
                        }
                         
                    }
                   
                }
                const numberFormatter = new Intl.NumberFormat('en-US');
                var numberdata = numberFormatter.format(totalqty);
                sum[element._id.brand].push(numberdata);
                xsum[element._id.brand].push(numberFormatter.format(xtotalqty));
                bsum[element._id.brand].push(numberFormatter.format(btotalqty));
                // console.log(xsum[element._id.brand][0])


                var EndingBal = numberFormatter.format((totalqty-(btotalqty+xtotalqty)));
                
                htmlContent += `<tr>`;
                htmlContent += `<td class="row_data"></td>`;
                htmlContent += `<td class="row_data">`+element._id.brand+`</td>`;
                htmlContent += `<td class="row_data">`+sum[element._id.brand][0]+`</td>`;
                htmlContent += `<td class="row_data">0</td>`;
                htmlContent += `<td class="row_data">`+bsum[element._id.brand][0]+`</td>`;
                htmlContent += `<td class="row_data">`+xsum[element._id.brand][0]+`</td>`;
                htmlContent += `<td class="row_data">`+EndingBal+`</td>`;
                htmlContent += `</tr>`;
            }
            
            
        }

    }
    console.log(array_data["sales_bkg"])
    return htmlContent;
}

router.post('/balance/pdf', auth, async (req, res) => {

    const {from_date, to_date} = req.body

    const datatest = await dataCheck(from_date, to_date);
    // res.send(datatest);
    // return;
{/* <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css"> */}
    let htmlContent = `
    
        <style>
            body {
                font-family: Arial, sans-serif;
            }
            p {
                font-size: 14px;
                margin-bottom: 10px;
            }
            table {
                border-collapse: collapse;
                width: 80%;
                margin-left: auto; 
                margin-right: auto;
            }
            th {
                border: 1px solid black;
                padding: 8px;
                text-align: center;
            }
            

            .cat_data {
                border: 1px solid black;
                padding: 8px;
            }

            .row_data {
                border: 1px solid black;
                padding: 8px;
                text-align: center;
            }
            th {
                background-color: #d0cece;
                color: black;
            }
            
        </style>
    `;
    var from_string_date = new Date(from_date);
    var to_string_date = new Date(to_date);

    const options3 = { 
        // weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
    const from_formattedDate = new Intl.DateTimeFormat('en-US', options3).format(from_string_date);
    const to_formattedDate = new Intl.DateTimeFormat('en-US', options3).format(to_string_date);
      
    htmlContent += `<h1>JAKA EQUITIES CORP</h1>`;
    htmlContent += `<p>FINISHED GOODS INVENTORY</p>`;
    htmlContent += `<p>${from_formattedDate} - ${to_formattedDate}</p>`;
    htmlContent += `<div class="row">`;
    htmlContent += `<div class="col-sm-11">`;
    htmlContent += `<table>`;
    htmlContent += `<tr>`;

    htmlContent += `<th rowspan='2'>Category</th>`;
    htmlContent += `<th rowspan='2'>Products</th>`;
    htmlContent += `<th rowspan='2'>Beginning Balance<br>${from_formattedDate}</th>`;
    htmlContent += `<th rowspan='2'>Production</th>`;
    htmlContent += `<th colspan='2'>SOLD</th>`;
    htmlContent += `<th rowspan='2'>Ending Balance<br>${to_formattedDate}</th>`;
    htmlContent += `</tr>`;
    htmlContent += `<tr>`;
    htmlContent += `<th>Booking</th>`;
    htmlContent += `<th>X-Truck</th>`;
    htmlContent += `</tr>`;
    htmlContent += datatest;
    

    htmlContent += `</table>`;
    htmlContent += `</div>`;
    htmlContent += `</div>`;

    // res.send(htmlContent);
    // return;
    const options = {
        format: 'Letter', // Set size to Letter
        orientation: 'landscape' // Set orientation to landscape
    };
    
    pdf.create(htmlContent, options).toStream(function(err, stream) {
        if (err) {
            res.status(500).send('Error generating PDF');
            return;
        }
        res.setHeader('Content-Type', 'application/pdf');
        stream.pipe(res);
    });
});


router.get("/agent/view", auth, async (req, res) => {
    try {
        const {username, email, role} = req.user
        const role_data = req.user
        
        const profile_data = await profile.findOne({email : role_data.email})
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const master = await master_shop.find()

        const find_data = await product.find();


        const warehouse_data = await warehouse.aggregate([
            {
                $unwind: "$product_details"
            },
            {
                $lookup:
                {
                    from: "products",
                    localField: "product_details.product_name",
                    foreignField: "name",
                    as: "product_docs"
                }
            },
            {
                $unwind: "$product_docs"
            },
            {
                $project: 
                {
                    product_name: '$product_details.product_name',
                    product_stock: '$product_details.product_stock',
                }
            },
            {
                $group: {
                    _id: "$product_name",
                    product_stock: { $sum: "$product_stock" }
                }
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

        res.render("agent_sales", { 
            success: req.flash('success'),
            errors: req.flash('errors'),
            alldata: find_data,
            profile : profile_data,
            master_shop : master,
            role : role_data,
            product_stock : warehouse_data,
            language : lan_data
			
        })
    } catch (error) {
        
    }
})



async function agentsdataCheck(from, to){
    const product_data = await product.aggregate([
        {
            $group: {
                _id: {
                    brand: "$brand",
                    category: "$category"
                },
                products:{
                    $push: {
                        name: "$name",
                        product_code: "$product_code"
                    }
                }

            }
        },
        {
            $sort: {
                
                "_id.category": -1, // Sort by category in ascending order
                "_id.brand": 1,  // Sort by brand in ascending order
            }
        }
    ])
    var array_data = [];
    array_data["cat_brand"] = [];
    for (let index = 0; index <= product_data.length -1; index++) {
        const element = product_data[index];
        array_data["cat_brand"].push(element)
        // array_data["cat_brand"].push(element)
        
        
    }


    const product_cat= await product.aggregate([
        {
            $group: {
                _id: {
                    category: "$category"
                },
                products:{
                    $push: {
                        brand: "$brand",
                        product_code: "$product_code",
                        product_name: "$name"
                    }
                }

            }
        },
        {
            $sort: {
                
                "_id.category": -1, // Sort by category in ascending order
            }
        }
    ])



  



    


    const product_cnt = await product.aggregate([
        {
            $group: {
                _id: {
                    category: "$category",
                    brand: "$brand"
                }
            }
        },
        {
            $group: {
                _id: "$_id.category",
                brandCount: { $sum: 1 }
            }
        },
        {
            $sort: {
                _id: -1 // Sort by category in descending order (use 1 for ascending order)
            }
        }
    ]);

    const sales_data = await sales_sa.aggregate([
        {
            $match:{
                date: {
                    $gte: from,
                    $lte: to
                }
            }
        },
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
                as: "sales_info"
            }
        },
        {
            $unwind: "$sales_info"
        },
        {
            $unwind: "$sale_product"
        },
        {
            $match:{
                "sales_info.account_category" : "sa",
                "sale_product.isFG" : "false",
            }
        },
        {
            $lookup: {
                from: "products",
                localField: "sale_product.product_code",
                foreignField: "product_code",
                as: "product_info"
            }
        },
        {
            $unwind: "$product_info"
        },
        {
            $group:{
                _id:{
                  
                    sales_id: "$sales_info._id",
                    category: "$product_info.category",
                    brand: "$product_info.brand",
                    // product_code: "$product_info.product_code",
                },
                salesman_data:{ $first: "$sales_info.name"},
                totalQTY: { $sum: "$sale_product.real_qty_unit_val"},
                products:{
                    $push:{
                        qty: "$sale_product.real_qty_unit_val",
                        product_details: {
                            prod_name: "$product_info.name",
                            product_code: "$product_info.product_code",
                            category: "$product_info.category",
                            brand: "$product_info.brand",
                        }
                    }
                }
            }
        }
        
    ])

    


    let htmlContent = "";
    htmlContent += `<tr>`;
    htmlContent += `<td colspan="15" class="cat_data">QUANTITY SOLD</td>`;
    htmlContent += `</tr>`;
    htmlContent += `<tr>`;
    htmlContent += `<td class="cat_data"></td>`;
    for(let a = 0; a <= product_cat.length -1; a++){
        const thdata = product_cat[a];
        for (let b = 0; b < product_cnt.length; b++) {
            const element2 = product_cnt[b];
            if(element2._id == thdata._id.category){
                htmlContent += `<td colspan="`+element2.brandCount+`" class="cat_data">`+thdata._id.category+`</td>`;
            }
        }
    }
    
    htmlContent += `<td class="cat_data"></td>`;
    htmlContent += `</tr>`;
    htmlContent += `<tr>`;
    htmlContent += `<td colspan="1" class="cat_data">Salesman Name</td>`;
    for(let a = 0; a <= product_cat.length -1; a++){
        const thdata = product_cat[a];

        for (let b = 0; b < array_data["cat_brand"].length; b++) {
            const element = array_data["cat_brand"][b];

            if(element._id.category == thdata._id.category){
                htmlContent += `<td class="cat_data">`+element._id.brand+`</td>`;
            }
        }
        
       
    }
    htmlContent += `<td class="cat_data">TOTAL QTY</td>`;
    htmlContent += `</tr>`;

    let arrdata = {
        name: [],
        dataqty: {}
    };
    
    for (let a = 0; a < array_data["cat_brand"].length; a++) {
        const element = array_data["cat_brand"][a];
        const brand = element._id.brand;
        const category = element._id.category;
    
        if (!arrdata["dataqty"][brand]) {
            arrdata["dataqty"][brand] = {};
        }
        
        if (!arrdata["dataqty"][brand][category]) {
            arrdata["dataqty"][brand][category] = [];
        }
    
        for (let b = 0; b < sales_data.length; b++) {
            const thedata = sales_data[b];
            
            if (brand === thedata._id.brand && category === thedata._id.category) {
                const dataname = thedata.salesman_data;
                if (!arrdata["dataqty"][brand][category][dataname]) {
                    arrdata["dataqty"][brand][category][dataname] = [];
                }
                // console.log(thedata.totalQTY);
                arrdata["dataqty"][brand][category][dataname].push(thedata.totalQTY);
                
                if (!arrdata["name"].includes(dataname)) {
                    arrdata["name"].push(dataname);
                }
            }
        }
    }
    // console.log(arrdata["dataqty"])
    htmlContent += `<tr>`;
    for (let index = 0; index <= arrdata["name"].length-1; index++) {
        const element = arrdata["name"][index];
        // console.log(element)
        htmlContent += `<td class="row_data">${element}</td>`;
        var totalQTY = 0
        var totalQTYperBrand = 0;
        for (let a = 0; a <= array_data["cat_brand"].length-1; a++) {
            const element1 = array_data["cat_brand"][a];
            // console.log(element1._id.brand)

            // console.log(arrdata["dataqty"][element1._id.brand][element1._id.category][element])
            var totalData = 0;
            if(arrdata["dataqty"][element1._id.brand][element1._id.category][element]){
                // console.log(element1._id.brand + " <> " + element1._id.category)
                totalData = arrdata["dataqty"][element1._id.brand][element1._id.category][element][0];
                htmlContent += `<td class="row_data">${formatNumber(totalData.toFixed(2))}</td>`;
            }else{
                totalData = 0;
                htmlContent += `<td class="row_data">${totalData}</td>`;
            }
            totalQTY += totalData;
        }

        htmlContent += `<td class="row_data">${formatNumber(totalQTY.toFixed(2))}</td>`;
    }
    htmlContent += `</tr>`;

    // htmlContent += `<tr>`;
    // htmlContent += `<td class="row_data">TOTAL: </td>`;
    // htmlContent += `<td class="row_data">${totalQTYperBrand}</td>`;
    // htmlContent += `<td class="row_data">${totalQTYperBrand}</td>`;
    // htmlContent += `<td class="row_data">${totalQTYperBrand}</td>`;
    // htmlContent += `<td class="row_data">${totalQTYperBrand}</td>`;
    // htmlContent += `<td class="row_data">${totalQTYperBrand}</td>`;
    // htmlContent += `<td class="row_data">${totalQTYperBrand}</td>`;
    // htmlContent += `<td class="row_data">${totalQTYperBrand}</td>`;
    // htmlContent += `<td class="row_data">${totalQTYperBrand}</td>`;
    // htmlContent += `</tr>`;
    return htmlContent;
}

router.post('/agent/pdf', auth, async (req, res) => {

    const {from_date, to_date} = req.body

    const datatest = await agentsdataCheck(from_date, to_date);
    // res.send(datatest);
    // return;
{/* <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css"> */}
    let htmlContent = `
    
        <style>
            body {
                font-family: Arial, sans-serif;
            }
            p {
                font-size: 14px;
                margin-bottom: 10px;
            }
            table {
                border-collapse: collapse;
                width: 80%;
                margin-left: auto; 
                margin-right: auto;
            }
            th {
                border: 1px solid black;
                padding: 8px;
                text-align: center;
            }
            

            .cat_data {
                border: 1px solid black;
                padding: 8px;
                text-align: center;
            }

            .row_data {
                border: 1px solid black;
                padding: 8px;
                text-align: center;
            }
            th {
                background-color: #d0cece;
                color: black;
            }
            
        </style>
    `;
    var from_string_date = new Date(from_date);
    var to_string_date = new Date(to_date);

    const options3 = { 
        // weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
    const from_formattedDate = new Intl.DateTimeFormat('en-US', options3).format(from_string_date);
    const to_formattedDate = new Intl.DateTimeFormat('en-US', options3).format(to_string_date);
      
    htmlContent += `<h1>JAKA EQUITIES CORP</h1>`;
    htmlContent += `<p>SALES REPORTS</p>`;
    htmlContent += `<p>${from_formattedDate} - ${to_formattedDate}</p>`;
    htmlContent += `<div class="row">`;
    htmlContent += `<div class="col-sm-11">`;
    htmlContent += `<table>`;
    htmlContent += datatest;
    htmlContent += `</table>`;
    htmlContent += `</div>`;
    htmlContent += `</div>`;

    // res.send(htmlContent);
    // return;
    const options = {
        format: 'Letter', // Set size to Letter
        orientation: 'landscape' // Set orientation to landscape
    };
    
    pdf.create(htmlContent, options).toStream(function(err, stream) {
        if (err) {
            res.status(500).send('Error generating PDF');
            return;
        }
        res.setHeader('Content-Type', 'application/pdf');
        stream.pipe(res);
    });
});

router.get("/agent_reports/sales_ad", auth, async (req, res) => {
    try {
        const {username, email, role} = req.user
        const role_data = req.user
        
        const profile_data = await profile.findOne({email : role_data.email})
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const master = await master_shop.find()
        const staff_data = await staff.findOne({email: role_data.email})
        const find_data = await product.find();


        const warehouse_data = await warehouse.aggregate([
            {
                $unwind: "$product_details"
            },
            {
                $lookup:
                {
                    from: "products",
                    localField: "product_details.product_name",
                    foreignField: "name",
                    as: "product_docs"
                }
            },
            {
                $unwind: "$product_docs"
            },
            {
                $project: 
                {
                    product_name: '$product_details.product_name',
                    product_stock: '$product_details.product_stock',
                }
            },
            {
                $group: {
                    _id: "$product_name",
                    product_stock: { $sum: "$product_stock" }
                }
            },
        ])
        

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

        res.render("dsi_sales_admin", { 
            success: req.flash('success'),
            errors: req.flash('errors'),
            alldata: find_data,
            profile : profile_data,
            master_shop : master,
            role : role_data,
            product_stock : warehouse_data,
            language : lan_data,
            staff_arr: staff_data,
            staff_data_all: all_stff
			
        })
    } catch (error) {
        res.json(error)
    }
})

async function agentsdataDSICheck_admin(from, to, staff_id, isExcel){
    const product_data = await product.aggregate([
        {
            $group: {
                _id: {
                    brand: "$brand",
                    category: "$category"
                },
                products:{
                    $push: {
                        name: "$name",
                        product_code: "$product_code"
                    }
                }

            }
        },
        {
            $sort: {
                
                "_id.category": -1, // Sort by category in ascending order
                "_id.brand": 1,  // Sort by brand in ascending order
            }
        }
    ])
    var array_data = [];
    array_data["cat_brand"] = [];
    for (let index = 0; index <= product_data.length -1; index++) {
        const element = product_data[index];
        array_data["cat_brand"].push(element)
        // array_data["cat_brand"].push(element)
        
        
    }

    const product_cat= await product.aggregate([
        {
            $group: {
                _id: {
                    category: "$category"
                },
                products:{
                    $push: {
                        brand: "$brand",
                        product_code: "$product_code",
                        product_name: "$name"
                    }
                }

            }
        },
        {
            $sort: {
                
                "_id.category": -1, // Sort by category in ascending order
            }
        }
    ])

    const product_cnt = await product.aggregate([
        {
            $group: {
                _id: {
                    category: "$category",
                    brand: "$brand"
                }
            }
        },
        {
            $group: {
                _id: "$_id.category",
                brandCount: { $sum: 1 }
            }
        },
        {
            $sort: {
                _id: -1 // Sort by category in descending order (use 1 for ascending order)
            }
        }
    ]);

   
    // const sales_sa_data = await sales_sa.aggregate([
    //     {
    //         $match: {
    //             date: {
    //                 $gte: from,
    //                 $lte: to
    //             },
    //             sales_staff_id: staff_id,
    //              "sale_product.isFG": "false"
    //         }
    //     },
    //     {
    //         $unwind: "$sale_product"
    //     },
    //     {
    //         $match: {
    //             "sale_product.isFG": "false"
    //         }
    //     },
    //     {
    //         $lookup: {
    //             from: "products",
    //             localField: "sale_product.product_code",
    //             foreignField: "product_code",
    //             as: "product_info"
    //         }
    //     },
    //     {
    //         $unwind: "$product_info"
    //     },
    //     {
    //         $group: {
    //             _id: {
    //                 dsi: "$dsi",
    //                 date: "$date",
    //                 customer: "$customer"
    //             },
    //             totalQty: { $sum: "$sale_product.real_qty_unit_val" },
    //             products: {
    //                 $push: {
    //                     qty: "$sale_product.real_qty_unit_val",
    //                     NetPrice: "$sale_product.totalprice",
    //                     discount: "$sale_product.discount",
    //                     adj_discount: "$sale_product.adj_discount",
    //                     product_details: {
    //                         prod_name: "$product_info.name",
    //                         product_code: "$product_info.product_code",
    //                         category: "$product_info.category",
    //                         brand: "$product_info.brand",
    //                         gross_price: "$product_info.gross_price",
                            
    //                     }
    //                 }
    //             }
    //         }
    //     },
    //     {
    //         $unwind: "$products"
    //     },
    //     {
    //         $group: {
    //             _id: {
    //                 dsi: "$_id.dsi",
    //                 date: "$_id.date",
    //                 customer: "$_id.customer",
    //                 category: "$products.product_details.category",
    //                 brand: "$products.product_details.brand"
    //             },
    //             totalQty: { $sum: "$products.qty" },
    //             totalGross: { $sum: "$products.product_details.gross_price" },
    //             NetPrice: { $sum: "$products.NetPrice" },
    //             discount: { $sum: "$products.discount"},
    //             adj_discount: { $sum: "$products.adj_discount"},
    //             product_details: { $first: "$products.product_details" }
    //         }
    //     },
    //     {
    //         $group: {
    //             _id: {
    //                 dsi: "$_id.dsi",
    //                 date: "$_id.date",
    //                 customer: "$_id.customer"
    //             },
    //             totalQty: { $sum: "$totalQty" },
    //             totalGross: { $multiply: [ "$totalQty","$totalGross"] },
    //             NetPrice: { $sum: "$NetPrice" },
    //             discount: { $sum: "$discount"},
    //             adj_discount: { $sum: "$adj_discount"},
    //             products: {
    //                 $push: {
    //                     qty: "$totalQty",
    //                     category: "$_id.category",
    //                     brand: "$_id.brand",
    //                     product_details: "$product_details"
    //                 }
    //             }
    //         }
    //     },
    //     {
    //         $sort: {
                
    //             "_id.dsi": -1, // Sort by category in ascending order
    //             "_id.date": 1,  // Sort by brand in ascending order
    //         }
    //     }
    // ]);
    
    
// res.json(sales_sa_data);
// return
// console.log(sales_sa_data)
// return
// let arrdata = {
//     dataqty: {}
// };

// for (let a = 0; a < array_data["cat_brand"].length; a++) {
//     const element = array_data["cat_brand"][a];
//     const brand = element._id.brand;
//     const category = element._id.category;
//     // console.log(element)
//     if (!arrdata["dataqty"][brand]) {
//         arrdata["dataqty"][brand] = {};
//     }
    
//     if (!arrdata["dataqty"][brand][category]) {
//         arrdata["dataqty"][brand][category] = [];
//     }

//     for (let b = 0; b <= sales_sa_data.length-1; b++) {
//         const thedata = sales_sa_data[b];

//         for(let l = 0; l <= thedata.products.length - 1; l++ ){
//             const data_detl = thedata.products[l];
            
//             // console.log(data_detl.qty)
//             if (brand == data_detl.brand && category == data_detl.category) {
//                 // console.log(data_detl.qty)
//                 if (!arrdata["dataqty"][brand][category][thedata._id.dsi]) {
//                     arrdata["dataqty"][brand][category][thedata._id.dsi] = [];
//                 }

//                 if (!arrdata["dataqty"][brand][category][thedata._id.dsi][thedata._id.date]) {
//                     arrdata["dataqty"][brand][category][thedata._id.dsi][thedata._id.date] = [];
//                 }

//                 if (!arrdata["dataqty"][brand][category][thedata._id.dsi][thedata._id.date][thedata._id.customer]) {
//                     arrdata["dataqty"][brand][category][thedata._id.dsi][thedata._id.date][thedata._id.customer] = [];
//                 }

//                 arrdata["dataqty"][brand][category][thedata._id.dsi][thedata._id.date][thedata._id.customer].push(data_detl.qty);
//             }
//         }
        
        
//     }
// }


//     let htmlContent = "";
//     htmlContent += `<tr>`;
//     htmlContent += `<td colspan="20" class="cat_data">QUANTITY SOLD</td>`;
//     htmlContent += `</tr>`;
//     htmlContent += `<tr>`;
//     htmlContent += `<td class="cat_data" colspan="3"></td>`;
  
//     for(let a = 0; a <= product_cat.length -1; a++){
//         const thdata = product_cat[a];
//         for (let b = 0; b < product_cnt.length; b++) {
//             const element2 = product_cnt[b];
//             if(element2._id == thdata._id.category){
//                 htmlContent += `<td colspan="`+element2.brandCount+`" class="cat_data">`+thdata._id.category+`</td>`;
//             }
//         }
//     }
    
//     htmlContent += `<td class="cat_data" colspan="4"></td>`;
//     htmlContent += `</tr>`;
//     htmlContent += `<tr>`;
//     htmlContent += `<td colspan="1" class="cat_data">DSI Number</td>`;
//     htmlContent += `<td colspan="1" class="cat_data" style="width:100px">Date</td>`;
//     htmlContent += `<td colspan="1" class="cat_data" style="width:100px">Customer</td>`;
//     for(let a = 0; a <= product_cat.length -1; a++){
//         const thdata = product_cat[a];

//         for (let b = 0; b < array_data["cat_brand"].length; b++) {
//             const element = array_data["cat_brand"][b];

//             if(element._id.category == thdata._id.category){
//                 htmlContent += `<td class="cat_data">`+element._id.brand+`</td>`;
//             }
//         }
        
       
//     }
//     htmlContent += `<td class="cat_data">TOTAL QTY</td>`;
//     htmlContent += `<td class="cat_data">GROSS SALES</td>`;
//     htmlContent += `<td class="cat_data">DISCOUNT</td>`;
//     htmlContent += `<td class="cat_data">NET SALES VALUE</td>`;
//     htmlContent += `</tr>`;





//     for (let z = 0; z < sales_sa_data.length; z++) {
//         const sales_data_element = sales_sa_data[z];
        
//         htmlContent += `<tr>`;
//         htmlContent += `<td class="row_data">${sales_data_element._id.dsi}</td>`;
//         htmlContent += `<td class="row_data">${sales_data_element._id.date}</td>`;
//         htmlContent += `<td class="row_data">${sales_data_element._id.customer}</td>`;
    
//         // Initialize an object to keep track of quantities for each brand-category pair
//         let quantities = {};
    
//         // Fill quantities with actual data
//         for (let p = 0; p < sales_data_element.products.length; p++) {
//             const data_final = sales_data_element.products[p];
//             // console.log(data_final)
//             quantities[`${data_final.brand}-${data_final.category}`] = data_final.qty;
//         }
    
//         // Iterate over all possible brand-category pairs
//         for (let a = 0; a < array_data["cat_brand"].length; a++) {
//             const data_brand = array_data["cat_brand"][a];
//             const key = `${data_brand._id.brand}-${data_brand._id.category}`;
//             if (quantities[key] !== undefined) {
//                 htmlContent += `<td class="row_data">${quantities[key]}</td>`;
//             } else {
//                 htmlContent += `<td class="row_data">0</td>`;
//             }
//         }
//         htmlContent += `<td class="row_data">${sales_data_element.totalQty}</td>`;
//         htmlContent += `<td class="row_data">${sales_data_element.totalGross}</td>`;
//         htmlContent += `<td class="row_data">${sales_data_element.discount}</td>`;
//         htmlContent += `<td class="row_data">${sales_data_element.NetPrice.toFixed(2)}</td>`;
//         htmlContent += `</tr>`;
//     }
    
    
//     return htmlContent;


const sales_sa_data = await sales_sa.aggregate([
    {
        $match: {
            date: {
                $gte: from,
                $lte: to
            },
            sales_staff_id: staff_id,
            "sale_product.isFG": "false"
        }
    },
    {
        $unwind: "$sale_product"
    },
    {
        $match: {
            "sale_product.isFG": "false"
        }
    },
    {
        $lookup: {
            from: "products",
            localField: "sale_product.product_code",
            foreignField: "product_code",
            as: "product_info"
        }
    },
    {
        $unwind: "$product_info"
    },
    {
        $group: {
            _id: {
                dsi: "$dsi",
                date: "$date",
                customer: "$customer"
            },
            totalQty: { $sum: "$sale_product.real_qty_unit_val" },
            products: {
                $push: {
                    qty: "$sale_product.real_qty_unit_val",
                    NetPrice: "$sale_product.totalprice",
                    discount: "$sale_product.discount",
                    adj_discount: "$sale_product.adj_discount",
                    product_details: {
                        prod_name: "$product_info.name",
                        product_code: "$product_info.product_code",
                        category: "$product_info.category",
                        brand: "$product_info.brand",
                        gross_price: "$product_info.gross_price",
                    }
                }
            }
        }
    },
    {
        $unwind: "$products"
    },
    {
        $group: {
            _id: {
                dsi: "$_id.dsi",
                date: "$_id.date",
                customer: "$_id.customer",
                category: "$products.product_details.category",
                brand: "$products.product_details.brand"
            },
            totalQty: { $sum: "$products.qty" },
            totalGross: { $sum: { $multiply: ["$products.qty", "$products.product_details.gross_price"] } },
            NetPrice: { $sum: "$products.NetPrice" },
            discount: { $sum: "$products.discount" },
            adj_discount: { $sum: "$products.adj_discount" },
            product_details: { $first: "$products.product_details" }
        }
    },
    {
        $group: {
            _id: {
                dsi: "$_id.dsi",
                date: "$_id.date",
                customer: "$_id.customer"
            },
            totalQty: { $sum: "$totalQty" },
            totalGross: { $sum: "$totalGross" },
            NetPrice: { $sum: "$NetPrice" },
            discount: { $sum: "$discount" },
            adj_discount: { $sum: "$adj_discount" },
            products: {
                $push: {
                    qty: "$totalQty",
                    category: "$_id.category",
                    brand: "$_id.brand",
                    product_details: "$product_details"
                }
            }
        }
    },
    {
        $sort: {
            "_id.dsi": -1, // Sort by category in ascending order
            "_id.date": 1,  // Sort by brand in ascending order
        }
    }
]);

let rows = [];
let totals = {};
let merged_totals = {};
let data_totals = {}
var sum = 0;
var netPay = 0;
var discountAll = 0
var discounttotal = 0;
var totalGrossAll = 0;
const rowsPerPage = 6;
for (let z = 0; z <= sales_sa_data.length -1; z++) {
    const sales_data_element = sales_sa_data[z];
    let row = `<tr>`;
    row += `<td class="row_data" style="border: 1px solid black; text-align: left;">${sales_data_element._id.dsi}</td>`;
    row += `<td class="row_data" style="border: 1px solid black; text-align: left;">${sales_data_element._id.date}</td>`;
    row += `<td class="row_data" style="border: 1px solid black; text-align: left;">${sales_data_element._id.customer}</td>`;
    
    let quantities = {};
    
    
    var x = 0;
    for (let p = 0; p <= sales_data_element.products.length -1; p++) {
        const data_final = sales_data_element.products[p];
        quantities[`${data_final.brand}-${data_final.category}`] = data_final.qty;
        const key = `${data_final.brand}-${data_final.category}`;

        if (!totals[key]) {
            totals[key] = 0;
        }

        if (!Array.isArray(data_totals[key])) {
            data_totals[key]= [];
        }

        if (!Array.isArray(data_totals[key])) {
            data_totals[key] = [];
        }

     

        totals[key] += data_final.qty;
        // data_totals[key] += data_final.qty ;

        
        data_totals[key].push(data_final.qty);
        x++;
    }

    
    console.log(sales_data_element)

    for (let a = 0; a <= array_data["cat_brand"].length-1; a++) {
        const data_brand = array_data["cat_brand"][a];
        const key = `${data_brand._id.brand}-${data_brand._id.category}`;
        row += `<td class="row_data" style="border: 1px solid black; text-align: right;">${quantities[key] !== undefined ? quantities[key].toFixed(2) : ""}</td>`;
    }
    discountAll = sales_data_element.discount + sales_data_element.adj_discount
    row += `<td class="row_data"  style="border: 1px solid black; text-align: right;">${formatNumber(parseFloat(sales_data_element.totalQty, 2).toFixed(2))}</td>`;
    row += `<td class="row_data"  style="border: 1px solid black; text-align: right;">${formatNumber(sales_data_element.totalGross.toFixed(2))}</td>`;
    row += `<td class="row_data"  style="border: 1px solid black; text-align: right;">${formatNumber(discountAll)}</td>`;
    row += `<td class="row_data"  style="border: 1px solid black; text-align: right;">${formatNumber(sales_data_element.NetPrice.toFixed(2))}</td>`;
    row += `</tr>`;
    sum += parseFloat(sales_data_element.totalQty.toFixed(2));
    netPay += parseFloat(sales_data_element.NetPrice.toFixed(2));
    discounttotal += discountAll;
    totalGrossAll += parseFloat(sales_data_element.totalGross.toFixed(2));
    if(z == (sales_sa_data.length -1)){
        row += `<tr>`;
        row += `<td colspan="3"><b>TOTAL<b>`;
        row += `</td>`;

        for (let a = 0; a <= array_data["cat_brand"].length-1; a++) {
            const data_brand = array_data["cat_brand"][a];
            const key = `${data_brand._id.brand}-${data_brand._id.category}`;
            const sum = data_totals[key].reduce((partialSum, a) => partialSum + a, 0)
            console.log("test",key)
            row += `<td class="row_data" style="border: 1px solid black; text-align: right;"><b>${sum !== undefined ? formatNumber(sum.toFixed(2)) : ""}</b></td>`;

            console.log(data_totals[key].reduce((partialSum, a) => partialSum + a, 0))
        }
       

        // row += `<td></td>`;
        // row += `<td></td>`;
        // row += `<td></td>`;
        // row += `<td></td>`;
        // row += `<td></td>`;
        // row += `<td></td>`;
        // row += `<td></td>`;
        row += `<td style="border: 1px solid black; text-align: right;"><b>${ formatNumber(sum.toFixed(2)) }</b></td>`;
        row += `<td style="border: 1px solid black; text-align: right;"><b>${ formatNumber(totalGrossAll) }</b></td>`;
        row += `<td style="border: 1px solid black; text-align: right;"><b>${ formatNumber(discounttotal) }</b></td>`;
        row += `<td style="border: 1px solid black; text-align: right;"><b>${ formatNumber(netPay) }</b></td>`;
        row += `</tr>`;
    }
   
    
    rows.push(row);
}


    
function paginateRows(rows, rowsPerPage) {
    const pages = [];
    for (let i = 0; i <= rows.length -1; i += rowsPerPage) {
        pages.push(rows.slice(i, i + rowsPerPage));
    }
    return pages;
}


const pages = paginateRows(rows, rowsPerPage);
// console.log(pages)
let htmlContent = "";
pages.forEach((page, pageIndex) => {
    if (pageIndex > 0) {
        htmlContent += `<div style="page-break-before: always;"></div>`;
    }
    htmlContent += `<table>`;
    htmlContent += `<thead>`;
    htmlContent += `<tr>`;
    htmlContent += `<td colspan="20" class="cat_data">QUANTITY SOLD</td>`;
    htmlContent += `</tr>`;
    htmlContent += `<tr>`;
    htmlContent += `<td class="cat_data" colspan="3"></td>`;
    for (let a = 0; a <= product_cat.length -1; a++) {
        const thdata = product_cat[a];
        for (let b = 0; b < product_cnt.length; b++) {
            const element2 = product_cnt[b];
            if (element2._id === thdata._id.category) {
                htmlContent += `<td colspan="${element2.brandCount}" class="cat_data">${thdata._id.category}</td>`;
            }
        }
    }
    htmlContent += `<td class="cat_data" colspan="4"></td>`;
    htmlContent += `</tr>`;
    htmlContent += `<tr>`;
    htmlContent += `<td colspan="1" class="cat_data">DSI Number</td>`;
    htmlContent += `<td colspan="1" class="cat_data" style="width:100px">Date</td>`;
    htmlContent += `<td colspan="1" class="cat_data" style="width:100px">Customer</td>`;
    for (let a = 0; a <= product_cat.length -1; a++) {
        const thdata = product_cat[a];
        for (let b = 0; b < array_data["cat_brand"].length; b++) {
            const element = array_data["cat_brand"][b];
            if (element._id.category === thdata._id.category) {
                htmlContent += `<td class="cat_data">${element._id.brand}</td>`;
            }
        }
    }
    htmlContent += `<td class="cat_data">TOTAL QTY</td>`;
    htmlContent += `<td class="cat_data">GROSS SALES</td>`;
    htmlContent += `<td class="cat_data">DISCOUNT</td>`;
    htmlContent += `<td class="cat_data">NET SALES</td>`;
    htmlContent += `</tr>`;
    htmlContent += `</thead>`;
    htmlContent += `<tbody>`;
    page.forEach(row => {
        htmlContent += row;
        

    });


    console.log(data_totals);

    
    htmlContent += `</tbody>`;
    htmlContent += `</table>`;
    // htmlContent += `<div style="page-break-after:always;"></div>`;
});


return htmlContent;
}


router.post('/agent_reports/pdf_admin', auth, async (req, res) => {

    const {from_date, to_date, isExcel, agent_id} = req.body
    const role_data = req.user
    const stff_data = await staff.findOne({ email: role_data.email })
    const image = await master_shop.find();
    // console.log(image[0].image);
    const datatest = await agentsdataDSICheck_admin(from_date, to_date, agent_id, isExcel);
    // res.send(req.body);
    // return;

    // let htmlContent = `
    
    //     <style>
    //         table {
    //             border-collapse: collapse;
    //         }
    //         th {
    //             border: 1px solid black;
    //             padding: 8px;
    //             text-align: center;
    //         }
            

    //         .cat_data {
    //             border: 1px solid black;
    //             padding: 8px;
    //             text-align: center;
    //         }

    //         .row_data {
    //             border: 1px solid black;
    //             text-align: center;
    //         }
    //         th {
    //             background-color: #d0cece;
    //             color: black;
    //         }
            
    //     </style>
    // `;
    let htmlContent = `
    <style>
        table {
            border-collapse: collapse;
            width: 100%; /* Ensure table uses the full width */
        }
        th, td {
            border: 1px solid black;
            text-align: center;
            font-size: 9pt;
        }
        th {
            background-color: #d0cece;
            padding: 8px;
            color: black;
        }
        @media print {
           table { page-break-inside: auto; }
            tr { page-break-inside: avoid; page-break-after: auto; }
            th { page-break-inside: avoid; page-break-after: auto; }
        }

        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
        body {
            font-family: 'Roboto', sans-serif;
            font-size: 12pt;
        }

        @media (max-width: 1024px) {
            table {
                display: block;
                overflow-x: auto;
            }
        }

        
            
    </style>
`;

    
    var from_string_date = new Date(from_date);
    var to_string_date = new Date(to_date);

    const options3 = { 
        // weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
    const from_formattedDate = new Intl.DateTimeFormat('en-US', options3).format(from_string_date);
    const to_formattedDate = new Intl.DateTimeFormat('en-US', options3).format(to_string_date);
      
    // htmlContent += `<h1>JAKA EQUITIES CORP</h1>`;
    // htmlContent += `<p>SALES REPORTS - EXTRUCK</p>`;
    // htmlContent += `<p>${from_formattedDate} - ${to_formattedDate}</p>`;
    htmlContent += `<div class="row">`;
    htmlContent += `<div  id="table-conatainer">`;
    htmlContent += `<table>`;
    htmlContent += datatest;
    htmlContent += `</table>`;
    htmlContent += `</div>`;
    htmlContent += `</div>`;

    // res.send(htmlContent);
    // return;
    // const options = {
    //     // format: 'Letter', // Set size to Letter
    //     width: '15in',  // Set custom width (e.g., 11 inches)
    //     height: '8.5in', // Set custom height (e.g., 8.5 inches)
    //     orientation: 'landscape' // Set orientation to landscape
    // };

    let dataImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxYxAAACD0S0HV4xFoAAAAAElFTkSuQmCC';
    const options = {
        width: '15in',  // Set custom width (e.g., 11 inches)
        height: '8.5in',
        orientation: 'landscape', // Landscape mode
        border: {
            top: "0.1in",
            right: "0.1in",
            bottom: "0.1in",
            left: "0.1in"
        },
        header: {
            height: "60mm", // Adjust header height
            contents: `
            <div style="text-align: center;">
                <img src="${dataImage}" style="max-width: 100%; height: auto;" />
                <h1>JAKA EQUITIES CORP</h1>
                <p>SALES REPORTS - EXTRUCK</p>
                <p>${from_formattedDate} - ${to_formattedDate}</p>
                <br><br><br><br><br><br><br><br><br><br>
            </div>
        `
        },
        footer: {
            height: "20mm", // Adjust footer height
            contents: {
                default: '<span style="color: #444;">{{page}}</span>/<span>{{pages}}</span>' // Page number
            }
        },
        dpi: 5,  // Set DPI for consistency
        zoomFactor: '1' // Ensure the same zoom level
    };
    

    if(isExcel == "on"){
        const $ = cheerio.load(htmlContent);

let data = [];
let merges = [];
let colSpans = []; // To track active column spans

$('table tr').each((i, row) => {
    let rowData = [];
    let colIndex = 0;

    // Adjust colIndex for any ongoing colspans from previous rows
    while (colSpans[colIndex]) {
        colSpans[colIndex]--;
        colIndex++;
    }

    $(row).find('td, th').each((j, cell) => {
        let cellText = $(cell).text().trim();

        // Attempt to convert cell text to a number if possible
        let cellValue = parseFloat(cellText.replace(/,/g, ''));

        // Use the cell text if it's not a valid number
        if (isNaN(cellValue)) {
            cellValue = cellText;
        }

        // Parse colspan and rowspan
        let colspan = parseInt($(cell).attr('colspan')) || 1;
        let rowspan = parseInt($(cell).attr('rowspan')) || 1;

        // Add the cell value to the rowData array at the correct column index
        rowData[colIndex] = cellValue;

        // Add merge information if colspan or rowspan is greater than 1
        if (colspan > 1 || rowspan > 1) {
            merges.push({
                s: { r: i, c: colIndex }, // start position
                e: { r: i + rowspan - 1, c: colIndex + colspan - 1 } // end position
            });
        }

        // Track colspans across rows (for correct placement in the next row)
        for (let k = 0; k < colspan; k++) {
            if (rowspan > 1) {
                colSpans[colIndex + k] = rowspan - 1; // Track how many rows this colspan affects
            }
        }

        // Move to the next column index, considering colspan
        colIndex += colspan;
    });

    data.push(rowData);
});

// Create the worksheet and add merge information
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet(data);

// Apply merges to the worksheet
if (merges.length > 0) {
    ws['!merges'] = merges;
}

// Optionally, set column widths or other formatting
ws['!cols'] = data[0].map(() => ({ wpx: 100 })); // Set a fixed width of 100 pixels for all columns

// Append the worksheet to the workbook
XLSX.utils.book_append_sheet(wb, ws, "Sales Report");

// Write the workbook to a buffer
const fileBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

// Send the file to the client as a download (if using Express.js)
res.setHeader('Content-Disposition', 'attachment; filename="sales_report.xlsx"');
res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
res.send(fileBuffer);

    }else{
        pdf.create(htmlContent, options).toStream(function(err, stream) {
            if (err) {
                res.status(500).send('Error generating PDF');
                return;
            }
            res.setHeader('Content-Type', 'application/pdf');
            stream.pipe(res);
        });
    }
    
    
});

router.get("/agent_reports/view", auth, async (req, res) => {
    try {
        const {username, email, role} = req.user
        const role_data = req.user
        
        const profile_data = await profile.findOne({email : role_data.email})
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const master = await master_shop.find()
        const staff_data = await staff.findOne({email: role_data.email})
        const find_data = await product.find();


        const warehouse_data = await warehouse.aggregate([
            {
                $unwind: "$product_details"
            },
            {
                $lookup:
                {
                    from: "products",
                    localField: "product_details.product_name",
                    foreignField: "name",
                    as: "product_docs"
                }
            },
            {
                $unwind: "$product_docs"
            },
            {
                $project: 
                {
                    product_name: '$product_details.product_name',
                    product_stock: '$product_details.product_stock',
                }
            },
            {
                $group: {
                    _id: "$product_name",
                    product_stock: { $sum: "$product_stock" }
                }
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

        res.render("dsi_sales", { 
            success: req.flash('success'),
            errors: req.flash('errors'),
            alldata: find_data,
            profile : profile_data,
            master_shop : master,
            role : role_data,
            product_stock : warehouse_data,
            language : lan_data,
            staff_arr: staff_data
			
        })
    } catch (error) {
        
    }
})

function formatNumber(number, locale = 'en-US', options = { minimumFractionDigits: 2 }) {
    // Create a NumberFormat object with the provided locale and options
    const formatter = new Intl.NumberFormat(locale, options);

    // Use the formatter to format the number
    return formatter.format(number);
}

async function agentsdataDSICheck(from, to, staff_id, isExcel){
    const product_data = await product.aggregate([
        {
            $group: {
                _id: {
                    brand: "$brand",
                    category: "$category"
                },
                products:{
                    $push: {
                        name: "$name",
                        product_code: "$product_code"
                    }
                }

            }
        },
        {
            $sort: {
                
                "_id.category": -1, // Sort by category in ascending order
                "_id.brand": 1,  // Sort by brand in ascending order
            }
        }
    ])
    var array_data = [];
    array_data["cat_brand"] = [];
    for (let index = 0; index <= product_data.length -1; index++) {
        const element = product_data[index];
        array_data["cat_brand"].push(element)
        // array_data["cat_brand"].push(element)
        
        
    }

    const product_cat= await product.aggregate([
        {
            $group: {
                _id: {
                    category: "$category"
                },
                products:{
                    $push: {
                        brand: "$brand",
                        product_code: "$product_code",
                        product_name: "$name"
                    }
                }

            }
        },
        {
            $sort: {
                
                "_id.category": -1, // Sort by category in ascending order
            }
        }
    ])

    const product_cnt = await product.aggregate([
        {
            $group: {
                _id: {
                    category: "$category",
                    brand: "$brand"
                }
            }
        },
        {
            $group: {
                _id: "$_id.category",
                brandCount: { $sum: 1 }
            }
        },
        {
            $sort: {
                _id: -1 // Sort by category in descending order (use 1 for ascending order)
            }
        }
    ]);

   
    // const sales_sa_data = await sales_sa.aggregate([
    //     {
    //         $match: {
    //             date: {
    //                 $gte: from,
    //                 $lte: to
    //             },
    //             sales_staff_id: staff_id,
    //              "sale_product.isFG": "false"
    //         }
    //     },
    //     {
    //         $unwind: "$sale_product"
    //     },
    //     {
    //         $match: {
    //             "sale_product.isFG": "false"
    //         }
    //     },
    //     {
    //         $lookup: {
    //             from: "products",
    //             localField: "sale_product.product_code",
    //             foreignField: "product_code",
    //             as: "product_info"
    //         }
    //     },
    //     {
    //         $unwind: "$product_info"
    //     },
    //     {
    //         $group: {
    //             _id: {
    //                 dsi: "$dsi",
    //                 date: "$date",
    //                 customer: "$customer"
    //             },
    //             totalQty: { $sum: "$sale_product.real_qty_unit_val" },
    //             products: {
    //                 $push: {
    //                     qty: "$sale_product.real_qty_unit_val",
    //                     NetPrice: "$sale_product.totalprice",
    //                     discount: "$sale_product.discount",
    //                     adj_discount: "$sale_product.adj_discount",
    //                     product_details: {
    //                         prod_name: "$product_info.name",
    //                         product_code: "$product_info.product_code",
    //                         category: "$product_info.category",
    //                         brand: "$product_info.brand",
    //                         gross_price: "$product_info.gross_price",
                            
    //                     }
    //                 }
    //             }
    //         }
    //     },
    //     {
    //         $unwind: "$products"
    //     },
    //     {
    //         $group: {
    //             _id: {
    //                 dsi: "$_id.dsi",
    //                 date: "$_id.date",
    //                 customer: "$_id.customer",
    //                 category: "$products.product_details.category",
    //                 brand: "$products.product_details.brand"
    //             },
    //             totalQty: { $sum: "$products.qty" },
    //             totalGross: { $sum: "$products.product_details.gross_price" },
    //             NetPrice: { $sum: "$products.NetPrice" },
    //             discount: { $sum: "$products.discount"},
    //             adj_discount: { $sum: "$products.adj_discount"},
    //             product_details: { $first: "$products.product_details" }
    //         }
    //     },
    //     {
    //         $group: {
    //             _id: {
    //                 dsi: "$_id.dsi",
    //                 date: "$_id.date",
    //                 customer: "$_id.customer"
    //             },
    //             totalQty: { $sum: "$totalQty" },
    //             totalGross: { $multiply: [ "$totalQty","$totalGross"] },
    //             NetPrice: { $sum: "$NetPrice" },
    //             discount: { $sum: "$discount"},
    //             adj_discount: { $sum: "$adj_discount"},
    //             products: {
    //                 $push: {
    //                     qty: "$totalQty",
    //                     category: "$_id.category",
    //                     brand: "$_id.brand",
    //                     product_details: "$product_details"
    //                 }
    //             }
    //         }
    //     },
    //     {
    //         $sort: {
                
    //             "_id.dsi": -1, // Sort by category in ascending order
    //             "_id.date": 1,  // Sort by brand in ascending order
    //         }
    //     }
    // ]);
    
    
// res.json(sales_sa_data);
// return
// console.log(sales_sa_data)
// return
// let arrdata = {
//     dataqty: {}
// };

// for (let a = 0; a < array_data["cat_brand"].length; a++) {
//     const element = array_data["cat_brand"][a];
//     const brand = element._id.brand;
//     const category = element._id.category;
//     // console.log(element)
//     if (!arrdata["dataqty"][brand]) {
//         arrdata["dataqty"][brand] = {};
//     }
    
//     if (!arrdata["dataqty"][brand][category]) {
//         arrdata["dataqty"][brand][category] = [];
//     }

//     for (let b = 0; b <= sales_sa_data.length-1; b++) {
//         const thedata = sales_sa_data[b];

//         for(let l = 0; l <= thedata.products.length - 1; l++ ){
//             const data_detl = thedata.products[l];
            
//             // console.log(data_detl.qty)
//             if (brand == data_detl.brand && category == data_detl.category) {
//                 // console.log(data_detl.qty)
//                 if (!arrdata["dataqty"][brand][category][thedata._id.dsi]) {
//                     arrdata["dataqty"][brand][category][thedata._id.dsi] = [];
//                 }

//                 if (!arrdata["dataqty"][brand][category][thedata._id.dsi][thedata._id.date]) {
//                     arrdata["dataqty"][brand][category][thedata._id.dsi][thedata._id.date] = [];
//                 }

//                 if (!arrdata["dataqty"][brand][category][thedata._id.dsi][thedata._id.date][thedata._id.customer]) {
//                     arrdata["dataqty"][brand][category][thedata._id.dsi][thedata._id.date][thedata._id.customer] = [];
//                 }

//                 arrdata["dataqty"][brand][category][thedata._id.dsi][thedata._id.date][thedata._id.customer].push(data_detl.qty);
//             }
//         }
        
        
//     }
// }


//     let htmlContent = "";
//     htmlContent += `<tr>`;
//     htmlContent += `<td colspan="20" class="cat_data">QUANTITY SOLD</td>`;
//     htmlContent += `</tr>`;
//     htmlContent += `<tr>`;
//     htmlContent += `<td class="cat_data" colspan="3"></td>`;
  
//     for(let a = 0; a <= product_cat.length -1; a++){
//         const thdata = product_cat[a];
//         for (let b = 0; b < product_cnt.length; b++) {
//             const element2 = product_cnt[b];
//             if(element2._id == thdata._id.category){
//                 htmlContent += `<td colspan="`+element2.brandCount+`" class="cat_data">`+thdata._id.category+`</td>`;
//             }
//         }
//     }
    
//     htmlContent += `<td class="cat_data" colspan="4"></td>`;
//     htmlContent += `</tr>`;
//     htmlContent += `<tr>`;
//     htmlContent += `<td colspan="1" class="cat_data">DSI Number</td>`;
//     htmlContent += `<td colspan="1" class="cat_data" style="width:100px">Date</td>`;
//     htmlContent += `<td colspan="1" class="cat_data" style="width:100px">Customer</td>`;
//     for(let a = 0; a <= product_cat.length -1; a++){
//         const thdata = product_cat[a];

//         for (let b = 0; b < array_data["cat_brand"].length; b++) {
//             const element = array_data["cat_brand"][b];

//             if(element._id.category == thdata._id.category){
//                 htmlContent += `<td class="cat_data">`+element._id.brand+`</td>`;
//             }
//         }
        
       
//     }
//     htmlContent += `<td class="cat_data">TOTAL QTY</td>`;
//     htmlContent += `<td class="cat_data">GROSS SALES</td>`;
//     htmlContent += `<td class="cat_data">DISCOUNT</td>`;
//     htmlContent += `<td class="cat_data">NET SALES VALUE</td>`;
//     htmlContent += `</tr>`;





//     for (let z = 0; z < sales_sa_data.length; z++) {
//         const sales_data_element = sales_sa_data[z];
        
//         htmlContent += `<tr>`;
//         htmlContent += `<td class="row_data">${sales_data_element._id.dsi}</td>`;
//         htmlContent += `<td class="row_data">${sales_data_element._id.date}</td>`;
//         htmlContent += `<td class="row_data">${sales_data_element._id.customer}</td>`;
    
//         // Initialize an object to keep track of quantities for each brand-category pair
//         let quantities = {};
    
//         // Fill quantities with actual data
//         for (let p = 0; p < sales_data_element.products.length; p++) {
//             const data_final = sales_data_element.products[p];
//             // console.log(data_final)
//             quantities[`${data_final.brand}-${data_final.category}`] = data_final.qty;
//         }
    
//         // Iterate over all possible brand-category pairs
//         for (let a = 0; a < array_data["cat_brand"].length; a++) {
//             const data_brand = array_data["cat_brand"][a];
//             const key = `${data_brand._id.brand}-${data_brand._id.category}`;
//             if (quantities[key] !== undefined) {
//                 htmlContent += `<td class="row_data">${quantities[key]}</td>`;
//             } else {
//                 htmlContent += `<td class="row_data">0</td>`;
//             }
//         }
//         htmlContent += `<td class="row_data">${sales_data_element.totalQty}</td>`;
//         htmlContent += `<td class="row_data">${sales_data_element.totalGross}</td>`;
//         htmlContent += `<td class="row_data">${sales_data_element.discount}</td>`;
//         htmlContent += `<td class="row_data">${sales_data_element.NetPrice.toFixed(2)}</td>`;
//         htmlContent += `</tr>`;
//     }
    
    
//     return htmlContent;


const sales_sa_data = await sales_sa.aggregate([
    {
        $match: {
            date: {
                $gte: from,
                $lte: to
            },
            sales_staff_id: staff_id,
            "sale_product.isFG": "false"
        }
    },
    {
        $unwind: "$sale_product"
    },
    {
        $match: {
            "sale_product.isFG": "false"
        }
    },
    {
        $lookup: {
            from: "products",
            localField: "sale_product.product_code",
            foreignField: "product_code",
            as: "product_info"
        }
    },
    {
        $unwind: "$product_info"
    },
    {
        $group: {
            _id: {
                dsi: "$dsi",
                date: "$date",
                customer: "$customer"
            },
            totalQty: { $sum: "$sale_product.real_qty_unit_val" },
            products: {
                $push: {
                    qty: "$sale_product.real_qty_unit_val",
                    NetPrice: "$sale_product.totalprice",
                    discount: "$sale_product.discount",
                    adj_discount: "$sale_product.adj_discount",
                    product_details: {
                        prod_name: "$product_info.name",
                        product_code: "$product_info.product_code",
                        category: "$product_info.category",
                        brand: "$product_info.brand",
                        gross_price: "$product_info.gross_price",
                    }
                }
            }
        }
    },
    {
        $unwind: "$products"
    },
    {
        $group: {
            _id: {
                dsi: "$_id.dsi",
                date: "$_id.date",
                customer: "$_id.customer",
                category: "$products.product_details.category",
                brand: "$products.product_details.brand"
            },
            totalQty: { $sum: "$products.qty" },
            totalGross: { $sum: { $multiply: ["$products.qty", "$products.product_details.gross_price"] } },
            NetPrice: { $sum: "$products.NetPrice" },
            discount: { $sum: "$products.discount" },
            adj_discount: { $sum: "$products.adj_discount" },
            product_details: { $first: "$products.product_details" }
        }
    },
    {
        $group: {
            _id: {
                dsi: "$_id.dsi",
                date: "$_id.date",
                customer: "$_id.customer"
            },
            totalQty: { $sum: "$totalQty" },
            totalGross: { $sum: "$totalGross" },
            NetPrice: { $sum: "$NetPrice" },
            discount: { $sum: "$discount" },
            adj_discount: { $sum: "$adj_discount" },
            products: {
                $push: {
                    qty: "$totalQty",
                    category: "$_id.category",
                    brand: "$_id.brand",
                    product_details: "$product_details"
                }
            }
        }
    },
    {
        $sort: {
            "_id.dsi": -1, // Sort by category in ascending order
            "_id.date": 1,  // Sort by brand in ascending order
        }
    }
]);

let rows = [];
let totals = {};
let merged_totals = {};
let data_totals = {}
var sum = 0;
var netPay = 0;
var discountAll = 0
var discounttotal = 0;
var totalGrossAll = 0;
const rowsPerPage = 6;
for (let z = 0; z <= sales_sa_data.length -1; z++) {
    const sales_data_element = sales_sa_data[z];
    let row = `<tr>`;
    row += `<td class="row_data" style="border: 1px solid black; text-align: left;">${sales_data_element._id.dsi}</td>`;
    row += `<td class="row_data" style="border: 1px solid black; text-align: left;">${sales_data_element._id.date}</td>`;
    row += `<td class="row_data" style="border: 1px solid black; text-align: left;">${sales_data_element._id.customer}</td>`;
    
    let quantities = {};
    
    
    var x = 0;
    for (let p = 0; p <= sales_data_element.products.length -1; p++) {
        const data_final = sales_data_element.products[p];
        quantities[`${data_final.brand}-${data_final.category}`] = data_final.qty;
        const key = `${data_final.brand}-${data_final.category}`;

        if (!totals[key]) {
            totals[key] = 0;
        }

        if (!Array.isArray(data_totals[key])) {
            data_totals[key]= [];
        }

        if (!Array.isArray(data_totals[key])) {
            data_totals[key] = [];
        }

     

        totals[key] += data_final.qty;
        // data_totals[key] += data_final.qty ;

        
        data_totals[key].push(data_final.qty);
        x++;
    }

    
    console.log(sales_data_element)

    for (let a = 0; a <= array_data["cat_brand"].length-1; a++) {
        const data_brand = array_data["cat_brand"][a];
        const key = `${data_brand._id.brand}-${data_brand._id.category}`;
        row += `<td class="row_data" style="border: 1px solid black; text-align: right;">${quantities[key] !== undefined ? quantities[key].toFixed(2) : ""}</td>`;
    }
    discountAll = sales_data_element.discount + sales_data_element.adj_discount
    row += `<td class="row_data"  style="border: 1px solid black; text-align: right;">${formatNumber(parseFloat(sales_data_element.totalQty, 2).toFixed(2))}</td>`;
    row += `<td class="row_data"  style="border: 1px solid black; text-align: right;">${formatNumber(sales_data_element.totalGross.toFixed(2))}</td>`;
    row += `<td class="row_data"  style="border: 1px solid black; text-align: right;">${formatNumber(discountAll)}</td>`;
    row += `<td class="row_data"  style="border: 1px solid black; text-align: right;">${formatNumber(sales_data_element.NetPrice.toFixed(2))}</td>`;
    row += `</tr>`;
    sum += parseFloat(sales_data_element.totalQty.toFixed(2));
    netPay += parseFloat(sales_data_element.NetPrice.toFixed(2));
    discounttotal += discountAll;
    totalGrossAll += parseFloat(sales_data_element.totalGross.toFixed(2));
    if(z == (sales_sa_data.length -1)){
        row += `<tr>`;
        row += `<td colspan="3"><b>TOTAL<b>`;
        row += `</td>`;

        for (let a = 0; a <= array_data["cat_brand"].length-1; a++) {
            const data_brand = array_data["cat_brand"][a];
            const key = `${data_brand._id.brand}-${data_brand._id.category}`;
            const sum = data_totals[key].reduce((partialSum, a) => partialSum + a, 0)
            row += `<td class="row_data" style="border: 1px solid black; text-align: right;"><b>${sum !== undefined ? formatNumber(sum.toFixed(2)) : ""}</b></td>`;

            console.log(data_totals[key].reduce((partialSum, a) => partialSum + a, 0))
        }
       

        // row += `<td></td>`;
        // row += `<td></td>`;
        // row += `<td></td>`;
        // row += `<td></td>`;
        // row += `<td></td>`;
        // row += `<td></td>`;
        // row += `<td></td>`;
        row += `<td style="border: 1px solid black; text-align: right;"><b>${ formatNumber(sum.toFixed(2)) }</b></td>`;
        row += `<td style="border: 1px solid black; text-align: right;"><b>${ formatNumber(totalGrossAll) }</b></td>`;
        row += `<td style="border: 1px solid black; text-align: right;"><b>${ formatNumber(discounttotal) }</b></td>`;
        row += `<td style="border: 1px solid black; text-align: right;"><b>${ formatNumber(netPay) }</b></td>`;
        row += `</tr>`;
    }
   
    
    rows.push(row);
}


    
function paginateRows(rows, rowsPerPage) {
    const pages = [];
    for (let i = 0; i <= rows.length -1; i += rowsPerPage) {
        pages.push(rows.slice(i, i + rowsPerPage));
    }
    return pages;
}


const pages = paginateRows(rows, rowsPerPage);
// console.log(pages)
let htmlContent = "";
pages.forEach((page, pageIndex) => {
    if (pageIndex > 0) {
        htmlContent += `<div style="page-break-before: always;"></div>`;
    }
    htmlContent += `<table>`;
    htmlContent += `<thead>`;
    htmlContent += `<tr>`;
    htmlContent += `<td colspan="20" class="cat_data">QUANTITY SOLD</td>`;
    htmlContent += `</tr>`;
    htmlContent += `<tr>`;
    htmlContent += `<td class="cat_data" colspan="3"></td>`;
    for (let a = 0; a <= product_cat.length -1; a++) {
        const thdata = product_cat[a];
        for (let b = 0; b < product_cnt.length; b++) {
            const element2 = product_cnt[b];
            if (element2._id === thdata._id.category) {
                htmlContent += `<td colspan="${element2.brandCount}" class="cat_data">${thdata._id.category}</td>`;
            }
        }
    }
    htmlContent += `<td class="cat_data" colspan="4"></td>`;
    htmlContent += `</tr>`;
    htmlContent += `<tr>`;
    htmlContent += `<td colspan="1" class="cat_data">DSI Number</td>`;
    htmlContent += `<td colspan="1" class="cat_data" style="width:100px">Date</td>`;
    htmlContent += `<td colspan="1" class="cat_data" style="width:100px">Customer</td>`;
    for (let a = 0; a <= product_cat.length -1; a++) {
        const thdata = product_cat[a];
        for (let b = 0; b < array_data["cat_brand"].length; b++) {
            const element = array_data["cat_brand"][b];
            if (element._id.category === thdata._id.category) {
                htmlContent += `<td class="cat_data">${element._id.brand}</td>`;
            }
        }
    }
    htmlContent += `<td class="cat_data">TOTAL QTY</td>`;
    htmlContent += `<td class="cat_data">GROSS SALES</td>`;
    htmlContent += `<td class="cat_data">DISCOUNT</td>`;
    htmlContent += `<td class="cat_data">NET SALES</td>`;
    htmlContent += `</tr>`;
    htmlContent += `</thead>`;
    htmlContent += `<tbody>`;
    page.forEach(row => {
        htmlContent += row;
        

    });


    console.log(data_totals);

    
    htmlContent += `</tbody>`;
    htmlContent += `</table>`;
    // htmlContent += `<div style="page-break-after:always;"></div>`;
});


return htmlContent;
}

async function agentsdataDSICheck_excel(from, to, staff_id, isExcel){
    const product_data = await product.aggregate([
        {
            $group: {
                _id: {
                    brand: "$brand",
                    category: "$category"
                },
                products:{
                    $push: {
                        name: "$name",
                        product_code: "$product_code"
                    }
                }

            }
        },
        {
            $sort: {
                
                "_id.category": -1, // Sort by category in ascending order
                "_id.brand": 1,  // Sort by brand in ascending order
            }
        }
    ])
    var array_data = [];
    array_data["cat_brand"] = [];
    for (let index = 0; index <= product_data.length -1; index++) {
        const element = product_data[index];
        array_data["cat_brand"].push(element)
        // array_data["cat_brand"].push(element)
        
        
    }

    const product_cat= await product.aggregate([
        {
            $group: {
                _id: {
                    category: "$category"
                },
                products:{
                    $push: {
                        brand: "$brand",
                        product_code: "$product_code",
                        product_name: "$name"
                    }
                }

            }
        },
        {
            $sort: {
                
                "_id.category": -1, // Sort by category in ascending order
            }
        }
    ])

    const product_cnt = await product.aggregate([
        {
            $group: {
                _id: {
                    category: "$category",
                    brand: "$brand"
                }
            }
        },
        {
            $group: {
                _id: "$_id.category",
                brandCount: { $sum: 1 }
            }
        },
        {
            $sort: {
                _id: -1 // Sort by category in descending order (use 1 for ascending order)
            }
        }
    ]);

   
    // const sales_sa_data = await sales_sa.aggregate([
    //     {
    //         $match: {
    //             date: {
    //                 $gte: from,
    //                 $lte: to
    //             },
    //             sales_staff_id: staff_id,
    //              "sale_product.isFG": "false"
    //         }
    //     },
    //     {
    //         $unwind: "$sale_product"
    //     },
    //     {
    //         $match: {
    //             "sale_product.isFG": "false"
    //         }
    //     },
    //     {
    //         $lookup: {
    //             from: "products",
    //             localField: "sale_product.product_code",
    //             foreignField: "product_code",
    //             as: "product_info"
    //         }
    //     },
    //     {
    //         $unwind: "$product_info"
    //     },
    //     {
    //         $group: {
    //             _id: {
    //                 dsi: "$dsi",
    //                 date: "$date",
    //                 customer: "$customer"
    //             },
    //             totalQty: { $sum: "$sale_product.real_qty_unit_val" },
    //             products: {
    //                 $push: {
    //                     qty: "$sale_product.real_qty_unit_val",
    //                     NetPrice: "$sale_product.totalprice",
    //                     discount: "$sale_product.discount",
    //                     adj_discount: "$sale_product.adj_discount",
    //                     product_details: {
    //                         prod_name: "$product_info.name",
    //                         product_code: "$product_info.product_code",
    //                         category: "$product_info.category",
    //                         brand: "$product_info.brand",
    //                         gross_price: "$product_info.gross_price",
                            
    //                     }
    //                 }
    //             }
    //         }
    //     },
    //     {
    //         $unwind: "$products"
    //     },
    //     {
    //         $group: {
    //             _id: {
    //                 dsi: "$_id.dsi",
    //                 date: "$_id.date",
    //                 customer: "$_id.customer",
    //                 category: "$products.product_details.category",
    //                 brand: "$products.product_details.brand"
    //             },
    //             totalQty: { $sum: "$products.qty" },
    //             totalGross: { $sum: "$products.product_details.gross_price" },
    //             NetPrice: { $sum: "$products.NetPrice" },
    //             discount: { $sum: "$products.discount"},
    //             adj_discount: { $sum: "$products.adj_discount"},
    //             product_details: { $first: "$products.product_details" }
    //         }
    //     },
    //     {
    //         $group: {
    //             _id: {
    //                 dsi: "$_id.dsi",
    //                 date: "$_id.date",
    //                 customer: "$_id.customer"
    //             },
    //             totalQty: { $sum: "$totalQty" },
    //             totalGross: { $multiply: [ "$totalQty","$totalGross"] },
    //             NetPrice: { $sum: "$NetPrice" },
    //             discount: { $sum: "$discount"},
    //             adj_discount: { $sum: "$adj_discount"},
    //             products: {
    //                 $push: {
    //                     qty: "$totalQty",
    //                     category: "$_id.category",
    //                     brand: "$_id.brand",
    //                     product_details: "$product_details"
    //                 }
    //             }
    //         }
    //     },
    //     {
    //         $sort: {
                
    //             "_id.dsi": -1, // Sort by category in ascending order
    //             "_id.date": 1,  // Sort by brand in ascending order
    //         }
    //     }
    // ]);
    
    
// res.json(sales_sa_data);
// return
// console.log(sales_sa_data)
// return
// let arrdata = {
//     dataqty: {}
// };

// for (let a = 0; a < array_data["cat_brand"].length; a++) {
//     const element = array_data["cat_brand"][a];
//     const brand = element._id.brand;
//     const category = element._id.category;
//     // console.log(element)
//     if (!arrdata["dataqty"][brand]) {
//         arrdata["dataqty"][brand] = {};
//     }
    
//     if (!arrdata["dataqty"][brand][category]) {
//         arrdata["dataqty"][brand][category] = [];
//     }

//     for (let b = 0; b <= sales_sa_data.length-1; b++) {
//         const thedata = sales_sa_data[b];

//         for(let l = 0; l <= thedata.products.length - 1; l++ ){
//             const data_detl = thedata.products[l];
            
//             // console.log(data_detl.qty)
//             if (brand == data_detl.brand && category == data_detl.category) {
//                 // console.log(data_detl.qty)
//                 if (!arrdata["dataqty"][brand][category][thedata._id.dsi]) {
//                     arrdata["dataqty"][brand][category][thedata._id.dsi] = [];
//                 }

//                 if (!arrdata["dataqty"][brand][category][thedata._id.dsi][thedata._id.date]) {
//                     arrdata["dataqty"][brand][category][thedata._id.dsi][thedata._id.date] = [];
//                 }

//                 if (!arrdata["dataqty"][brand][category][thedata._id.dsi][thedata._id.date][thedata._id.customer]) {
//                     arrdata["dataqty"][brand][category][thedata._id.dsi][thedata._id.date][thedata._id.customer] = [];
//                 }

//                 arrdata["dataqty"][brand][category][thedata._id.dsi][thedata._id.date][thedata._id.customer].push(data_detl.qty);
//             }
//         }
        
        
//     }
// }


//     let htmlContent = "";
//     htmlContent += `<tr>`;
//     htmlContent += `<td colspan="20" class="cat_data">QUANTITY SOLD</td>`;
//     htmlContent += `</tr>`;
//     htmlContent += `<tr>`;
//     htmlContent += `<td class="cat_data" colspan="3"></td>`;
  
//     for(let a = 0; a <= product_cat.length -1; a++){
//         const thdata = product_cat[a];
//         for (let b = 0; b < product_cnt.length; b++) {
//             const element2 = product_cnt[b];
//             if(element2._id == thdata._id.category){
//                 htmlContent += `<td colspan="`+element2.brandCount+`" class="cat_data">`+thdata._id.category+`</td>`;
//             }
//         }
//     }
    
//     htmlContent += `<td class="cat_data" colspan="4"></td>`;
//     htmlContent += `</tr>`;
//     htmlContent += `<tr>`;
//     htmlContent += `<td colspan="1" class="cat_data">DSI Number</td>`;
//     htmlContent += `<td colspan="1" class="cat_data" style="width:100px">Date</td>`;
//     htmlContent += `<td colspan="1" class="cat_data" style="width:100px">Customer</td>`;
//     for(let a = 0; a <= product_cat.length -1; a++){
//         const thdata = product_cat[a];

//         for (let b = 0; b < array_data["cat_brand"].length; b++) {
//             const element = array_data["cat_brand"][b];

//             if(element._id.category == thdata._id.category){
//                 htmlContent += `<td class="cat_data">`+element._id.brand+`</td>`;
//             }
//         }
        
       
//     }
//     htmlContent += `<td class="cat_data">TOTAL QTY</td>`;
//     htmlContent += `<td class="cat_data">GROSS SALES</td>`;
//     htmlContent += `<td class="cat_data">DISCOUNT</td>`;
//     htmlContent += `<td class="cat_data">NET SALES VALUE</td>`;
//     htmlContent += `</tr>`;





//     for (let z = 0; z < sales_sa_data.length; z++) {
//         const sales_data_element = sales_sa_data[z];
        
//         htmlContent += `<tr>`;
//         htmlContent += `<td class="row_data">${sales_data_element._id.dsi}</td>`;
//         htmlContent += `<td class="row_data">${sales_data_element._id.date}</td>`;
//         htmlContent += `<td class="row_data">${sales_data_element._id.customer}</td>`;
    
//         // Initialize an object to keep track of quantities for each brand-category pair
//         let quantities = {};
    
//         // Fill quantities with actual data
//         for (let p = 0; p < sales_data_element.products.length; p++) {
//             const data_final = sales_data_element.products[p];
//             // console.log(data_final)
//             quantities[`${data_final.brand}-${data_final.category}`] = data_final.qty;
//         }
    
//         // Iterate over all possible brand-category pairs
//         for (let a = 0; a < array_data["cat_brand"].length; a++) {
//             const data_brand = array_data["cat_brand"][a];
//             const key = `${data_brand._id.brand}-${data_brand._id.category}`;
//             if (quantities[key] !== undefined) {
//                 htmlContent += `<td class="row_data">${quantities[key]}</td>`;
//             } else {
//                 htmlContent += `<td class="row_data">0</td>`;
//             }
//         }
//         htmlContent += `<td class="row_data">${sales_data_element.totalQty}</td>`;
//         htmlContent += `<td class="row_data">${sales_data_element.totalGross}</td>`;
//         htmlContent += `<td class="row_data">${sales_data_element.discount}</td>`;
//         htmlContent += `<td class="row_data">${sales_data_element.NetPrice.toFixed(2)}</td>`;
//         htmlContent += `</tr>`;
//     }
    
    
//     return htmlContent;


const sales_sa_data = await sales_sa.aggregate([
    {
        $match: {
            date: {
                $gte: from,
                $lte: to
            },
            sales_staff_id: staff_id,
            "sale_product.isFG": "false"
        }
    },
    {
        $unwind: "$sale_product"
    },
    {
        $match: {
            "sale_product.isFG": "false"
        }
    },
    {
        $lookup: {
            from: "products",
            localField: "sale_product.product_code",
            foreignField: "product_code",
            as: "product_info"
        }
    },
    {
        $unwind: "$product_info"
    },
    {
        $group: {
            _id: {
                dsi: "$dsi",
                date: "$date",
                customer: "$customer"
            },
            totalQty: { $sum: "$sale_product.real_qty_unit_val" },
            products: {
                $push: {
                    qty: "$sale_product.real_qty_unit_val",
                    NetPrice: "$sale_product.totalprice",
                    discount: "$sale_product.discount",
                    adj_discount: "$sale_product.adj_discount",
                    product_details: {
                        prod_name: "$product_info.name",
                        product_code: "$product_info.product_code",
                        category: "$product_info.category",
                        brand: "$product_info.brand",
                        gross_price: "$product_info.gross_price",
                    }
                }
            }
        }
    },
    {
        $unwind: "$products"
    },
    {
        $group: {
            _id: {
                dsi: "$_id.dsi",
                date: "$_id.date",
                customer: "$_id.customer",
                category: "$products.product_details.category",
                brand: "$products.product_details.brand"
            },
            totalQty: { $sum: "$products.qty" },
            totalGross: { $sum: { $multiply: ["$products.qty", "$products.product_details.gross_price"] } },
            NetPrice: { $sum: "$products.NetPrice" },
            discount: { $sum: "$products.discount" },
            adj_discount: { $sum: "$products.adj_discount" },
            product_details: { $first: "$products.product_details" }
        }
    },
    {
        $group: {
            _id: {
                dsi: "$_id.dsi",
                date: "$_id.date",
                customer: "$_id.customer"
            },
            totalQty: { $sum: "$totalQty" },
            totalGross: { $sum: "$totalGross" },
            NetPrice: { $sum: "$NetPrice" },
            discount: { $sum: "$discount" },
            adj_discount: { $sum: "$adj_discount" },
            products: {
                $push: {
                    qty: "$totalQty",
                    category: "$_id.category",
                    brand: "$_id.brand",
                    product_details: "$product_details"
                }
            }
        }
    },
    {
        $sort: {
            "_id.dsi": -1, // Sort by category in ascending order
            "_id.date": 1,  // Sort by brand in ascending order
        }
    }
]);

let rows = [];
let totals = {};
let merged_totals = {};
let data_totals = {}
var sum = 0;
var netPay = 0;
var discountAll = 0
var discounttotal = 0;
var totalGrossAll = 0;
const rowsPerPage = 10000000000000;
for (let z = 0; z <= sales_sa_data.length -1; z++) {
    const sales_data_element = sales_sa_data[z];
    let row = `<tr>`;
    row += `<td class="row_data" style="border: 1px solid black; text-align: left;">${sales_data_element._id.dsi}</td>`;
    row += `<td class="row_data" style="border: 1px solid black; text-align: left;">${sales_data_element._id.date}</td>`;
    row += `<td class="row_data" style="border: 1px solid black; text-align: left;">${sales_data_element._id.customer}</td>`;
    
    let quantities = {};
    
    
    var x = 0;
    for (let p = 0; p <= sales_data_element.products.length -1; p++) {
        const data_final = sales_data_element.products[p];
        quantities[`${data_final.brand}-${data_final.category}`] = data_final.qty;
        const key = `${data_final.brand}-${data_final.category}`;

        if (!totals[key]) {
            totals[key] = 0;
        }

        if (!Array.isArray(data_totals[key])) {
            data_totals[key]= [];
        }

        if (!Array.isArray(data_totals[key])) {
            data_totals[key] = [];
        }

     

        totals[key] += data_final.qty;
        // data_totals[key] += data_final.qty ;

        
        data_totals[key].push(data_final.qty);
        x++;
    }

    
    console.log(sales_data_element)

    for (let a = 0; a <= array_data["cat_brand"].length-1; a++) {
        const data_brand = array_data["cat_brand"][a];
        const key = `${data_brand._id.brand}-${data_brand._id.category}`;
        row += `<td class="row_data" style="border: 1px solid black; text-align: right;">${quantities[key] !== undefined ? quantities[key].toFixed(2) : ""}</td>`;
    }
    discountAll = sales_data_element.discount + sales_data_element.adj_discount
    row += `<td class="row_data"  style="border: 1px solid black; text-align: right;">${formatNumber(parseFloat(sales_data_element.totalQty, 2).toFixed(2))}</td>`;
    row += `<td class="row_data"  style="border: 1px solid black; text-align: right;">${formatNumber(sales_data_element.totalGross.toFixed(2))}</td>`;
    row += `<td class="row_data"  style="border: 1px solid black; text-align: right;">${formatNumber(discountAll)}</td>`;
    row += `<td class="row_data"  style="border: 1px solid black; text-align: right;">${formatNumber(sales_data_element.NetPrice.toFixed(2))}</td>`;
    row += `</tr>`;
    sum += parseFloat(sales_data_element.totalQty.toFixed(2));
    netPay += parseFloat(sales_data_element.NetPrice.toFixed(2));
    discounttotal += discountAll;
    totalGrossAll += parseFloat(sales_data_element.totalGross.toFixed(2));
    if(z == (sales_sa_data.length -1)){
        row += `<tr>`;
        row += `<td colspan="3"><b>TOTAL<b>`;
        row += `</td>`;

        for (let a = 0; a <= array_data["cat_brand"].length-1; a++) {
            const data_brand = array_data["cat_brand"][a];
            const key = `${data_brand._id.brand}-${data_brand._id.category}`;
            const sum = data_totals[key].reduce((partialSum, a) => partialSum + a, 0)
            row += `<td class="row_data" style="border: 1px solid black; text-align: right;"><b>${sum !== undefined ? formatNumber(sum.toFixed(2)) : ""}</b></td>`;

            console.log(data_totals[key].reduce((partialSum, a) => partialSum + a, 0))
        }
       

        // row += `<td></td>`;
        // row += `<td></td>`;
        // row += `<td></td>`;
        // row += `<td></td>`;
        // row += `<td></td>`;
        // row += `<td></td>`;
        // row += `<td></td>`;
        row += `<td style="border: 1px solid black; text-align: right;"><b>${ formatNumber(sum.toFixed(2)) }</b></td>`;
        row += `<td style="border: 1px solid black; text-align: right;"><b>${ formatNumber(totalGrossAll) }</b></td>`;
        row += `<td style="border: 1px solid black; text-align: right;"><b>${ formatNumber(discounttotal) }</b></td>`;
        row += `<td style="border: 1px solid black; text-align: right;"><b>${ formatNumber(netPay) }</b></td>`;
        row += `</tr>`;
    }
   
    
    rows.push(row);
}


    
function paginateRows(rows, rowsPerPage) {
    const pages = [];
    for (let i = 0; i <= rows.length -1; i += rowsPerPage) {
        pages.push(rows.slice(i, i + rowsPerPage));
    }
    return pages;
}


const pages = paginateRows(rows, rowsPerPage);
// console.log(pages)
let htmlContent = "";
pages.forEach((page, pageIndex) => {
    if (pageIndex > 0) {
        htmlContent += `<div style="page-break-before: always;"></div>`;
    }
    htmlContent += `<table>`;
    htmlContent += `<thead>`;
    htmlContent += `<tr>`;
    htmlContent += `<td colspan="20" class="cat_data">QUANTITY SOLD</td>`;
    htmlContent += `</tr>`;
    htmlContent += `<tr>`;
    htmlContent += `<td class="cat_data" colspan="3"></td>`;
    for (let a = 0; a <= product_cat.length -1; a++) {
        const thdata = product_cat[a];
        for (let b = 0; b < product_cnt.length; b++) {
            const element2 = product_cnt[b];
            if (element2._id === thdata._id.category) {
                htmlContent += `<td colspan="${element2.brandCount}" class="cat_data">${thdata._id.category}</td>`;
            }
        }
    }
    htmlContent += `<td class="cat_data" colspan="4"></td>`;
    htmlContent += `</tr>`;
    htmlContent += `<tr>`;
    htmlContent += `<td colspan="1" class="cat_data">DSI Number</td>`;
    htmlContent += `<td colspan="1" class="cat_data" style="width:100px">Date</td>`;
    htmlContent += `<td colspan="1" class="cat_data" style="width:100px">Customer</td>`;
    for (let a = 0; a <= product_cat.length -1; a++) {
        const thdata = product_cat[a];
        for (let b = 0; b < array_data["cat_brand"].length; b++) {
            const element = array_data["cat_brand"][b];
            if (element._id.category === thdata._id.category) {
                htmlContent += `<td class="cat_data">${element._id.brand}</td>`;
            }
        }
    }
    htmlContent += `<td class="cat_data">TOTAL QTY</td>`;
    htmlContent += `<td class="cat_data">GROSS SALES</td>`;
    htmlContent += `<td class="cat_data">DISCOUNT</td>`;
    htmlContent += `<td class="cat_data">NET SALES</td>`;
    htmlContent += `</tr>`;
    htmlContent += `</thead>`;
    htmlContent += `<tbody>`;
    page.forEach(row => {
        htmlContent += row;
        

    });


    console.log(data_totals);

    
    htmlContent += `</tbody>`;
    htmlContent += `</table>`;
    // htmlContent += `<div style="page-break-after:always;"></div>`;
});


return htmlContent;
}

router.post('/agent_reports/pdf', auth, async (req, res) => {

    const {from_date, to_date, isExcel} = req.body
    const role_data = req.user
    const stff_data = await staff.findOne({ email: role_data.email })
    const image = await master_shop.find();
    console.log(image[0].image);
    const datatest = await agentsdataDSICheck(from_date, to_date, stff_data._id.valueOf(), isExcel);
    const datatest_excel = await agentsdataDSICheck_excel(from_date, to_date, stff_data._id.valueOf(), isExcel);
    // res.send(req.body);
    // return;

    // let htmlContent = `
    
    //     <style>
    //         table {
    //             border-collapse: collapse;
    //         }
    //         th {
    //             border: 1px solid black;
    //             padding: 8px;
    //             text-align: center;
    //         }
            

    //         .cat_data {
    //             border: 1px solid black;
    //             padding: 8px;
    //             text-align: center;
    //         }

    //         .row_data {
    //             border: 1px solid black;
    //             text-align: center;
    //         }
    //         th {
    //             background-color: #d0cece;
    //             color: black;
    //         }
            
    //     </style>
    // `;
    let htmlContent = `
    <style>
        table {
            border-collapse: collapse;
            width: 100%; /* Ensure table uses the full width */
            font-size: 9pt;
        }
        th, td {
            border: 1px solid black;
            text-align: center;
            font-size: 9pt;
            
        }
        th {
            background-color: #d0cece;
            padding: 8px;
            color: black;
        }
        @media print {
           table { page-break-inside: auto; }
            tr { page-break-inside: avoid; page-break-after: auto; }
            th { page-break-inside: avoid; page-break-after: auto; }
        }

        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
        body {
            font-family: 'Roboto', sans-serif;
            font-size: 12pt;
        }

        @media (max-width: 1024px) {
            table {
                display: block;
                overflow-x: auto;
            }
        }

        
            
    </style>
`;

    
    var from_string_date = new Date(from_date);
    var to_string_date = new Date(to_date);

    const options3 = { 
        // weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
    const from_formattedDate = new Intl.DateTimeFormat('en-US', options3).format(from_string_date);
    const to_formattedDate = new Intl.DateTimeFormat('en-US', options3).format(to_string_date);
      
    // htmlContent += `<h1>JAKA EQUITIES CORP</h1>`;
    // htmlContent += `<p>SALES REPORTS - EXTRUCK</p>`;
    // htmlContent += `<p>${from_formattedDate} - ${to_formattedDate}</p>`;
    htmlContent += `<div class="row">`;
    htmlContent += `<div  id="table-conatainer">`;
    htmlContent += `<table>`;
    htmlContent += datatest;
    htmlContent += `</table>`;
    htmlContent += `</div>`;
    htmlContent += `</div>`;

    let htmlContent_excel = `
    <style>
        table {
            border-collapse: collapse;
            width: 100%; /* Ensure table uses the full width */
            font-size: 9pt;
        }
        th, td {
            border: 1px solid black;
            text-align: center;
            font-size: 9pt;
            
        }
        th {
            background-color: #d0cece;
            padding: 8px;
            color: black;
        }
        @media print {
           table { page-break-inside: auto; }
            tr { page-break-inside: avoid; page-break-after: auto; }
            th { page-break-inside: avoid; page-break-after: auto; }
        }

        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
        body {
            font-family: 'Roboto', sans-serif;
            font-size: 12pt;
        }

        @media (max-width: 1024px) {
            table {
                display: block;
                overflow-x: auto;
            }
        }

        
            
    </style>
`;

    htmlContent_excel += `<div class="row">`;
    htmlContent_excel += `<div  id="table-conatainer">`;
    htmlContent_excel += `<table>`;
    htmlContent_excel += datatest_excel;
    htmlContent_excel += `</table>`;
    htmlContent_excel += `</div>`;
    htmlContent_excel += `</div>`;

    let dataImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxYxAAACD0S0HV4xFoAAAAAElFTkSuQmCC';
    const options = {
        width: '15in',  // Set custom width (e.g., 11 inches)
        height: '8.5in',
        orientation: 'landscape', // Landscape mode
        border: {
            top: "0.1in",
            right: "0.1in",
            bottom: "0.1in",
            left: "0.1in"
        },
        header: {
            height: "60mm", // Adjust header height
            contents: `
            <div style="text-align: center;">
                <img src="${dataImage}" style="max-width: 100%; height: auto;" />
                <h1>JAKA EQUITIES CORP</h1>
                <p>SALES REPORTS - EXTRUCK</p>
                <p>${from_formattedDate} - ${to_formattedDate}</p>
                <br><br><br><br><br><br><br><br><br><br>
            </div>
        `
        },
        footer: {
            height: "20mm", // Adjust footer height
            contents: {
                default: '<span style="color: #444;">{{page}}</span>/<span>{{pages}}</span>' // Page number
            }
        },
        dpi: 5,  // Set DPI for consistency
        zoomFactor: '1' // Ensure the same zoom level
    };
    

    if(isExcel == "on"){
        const $ = cheerio.load(htmlContent_excel);

        let data = [];
        let merges = [];
        let colSpans = []; // To track active column spans
        
        // Helper function to extract border styles from a cell's inline styles
        const getBorderStyle = (style) => {
            const borderStyle = {
                top: { style: 'thick', color: { rgb: '000000' } },
                bottom: { style: 'thick', color: { rgb: '000000' } },
                left: { style: 'thick', color: { rgb: '000000' } },
                right: { style: 'thick', color: { rgb: '000000' } }
            };
        
            // Extract border values from the inline style attribute if available
            if (style) {
                const styleObj = style.split(';').reduce((acc, rule) => {
                    const [property, value] = rule.split(':').map(str => str.trim());
                    acc[property] = value;
                    return acc;
                }, {});
        
                // Extract individual border styles (top, bottom, left, right)
                if (styleObj['border-top']) {
                    borderStyle.top.style = styleObj['border-top'].includes('thin') ? 'thin' : 'medium';
                }
                if (styleObj['border-bottom']) {
                    borderStyle.bottom.style = styleObj['border-bottom'].includes('thin') ? 'thin' : 'medium';
                }
                if (styleObj['border-left']) {
                    borderStyle.left.style = styleObj['border-left'].includes('thin') ? 'thin' : 'medium';
                }
                if (styleObj['border-right']) {
                    borderStyle.right.style = styleObj['border-right'].includes('thin') ? 'thin' : 'medium';
                }
            }
        
            return borderStyle;
        };
        
        $('table tr').each((i, row) => {
            let rowData = [];
            let colIndex = 0;
        
            // Adjust colIndex for any ongoing colspans from previous rows
            while (colSpans[colIndex]) {
                colSpans[colIndex]--;
                colIndex++;
            }
        
            $(row).find('td, th').each((j, cell) => {
                let cellText = $(cell).text().trim();
        
                // Attempt to convert cell text to a number if possible
                let cellValue = parseFloat(cellText.replace(/,/g, ''));
        
                // Use the cell text if it's not a valid number
                if (isNaN(cellValue)) {
                    cellValue = cellText;
                }
        
                // Parse colspan and rowspan
                let colspan = parseInt($(cell).attr('colspan')) || 1;
                let rowspan = parseInt($(cell).attr('rowspan')) || 1;
        
                // Get border style from inline style attribute in HTML
                const styleAttr = $(cell).attr('style');
                const borderStyle = getBorderStyle(styleAttr); // Extract border style from HTML
        
                // Add the cell value to the rowData array at the correct column index
                rowData[colIndex] = {
                    v: cellValue,
                    s: { border: borderStyle } // Apply the extracted border style
                };
        
                // Add merge information if colspan or rowspan is greater than 1
                if (colspan > 1 || rowspan > 1) {
                    merges.push({
                        s: { r: i, c: colIndex }, // start position
                        e: { r: i + rowspan - 1, c: colIndex + colspan - 1 } // end position
                    });
                }
        
                // Track colspans across rows (for correct placement in the next row)
                for (let k = 0; k < colspan; k++) {
                    if (rowspan > 1) {
                        colSpans[colIndex + k] = rowspan - 1; // Track how many rows this colspan affects
                    }
                }
        
                // Move to the next column index, considering colspan
                colIndex += colspan;
            });
        
            data.push(rowData);
        });
        
        // Create the worksheet and add merge information
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(data);
        
        // Apply merges to the worksheet
        if (merges.length > 0) {
            ws['!merges'] = merges;
        }
        
        // Optionally, set column widths or other formatting
        ws['!cols'] = data[0].map(() => ({ wpx: 100 })); // Set a fixed width of 100 pixels for all columns
        
        // Append the worksheet to the workbook
        XLSX.utils.book_append_sheet(wb, ws, "Sales Report");
        
        // Write the workbook to a buffer
        const fileBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
        
        // Send the file to the client as a download (if using Express.js)
        res.setHeader('Content-Disposition', 'attachment; filename="sales_report.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(fileBuffer);
        // res.json(data)
        // return
    }else{
        pdf.create(htmlContent, options).toStream(function(err, stream) {
            if (err) {
                res.status(500).send('Error generating PDF');
                return;
            }
            res.setHeader('Content-Type', 'application/pdf');
            stream.pipe(res);
        });
    }
    
    
});

router.get("/total_sales_reports/view", auth, async(req, res) => {
    try {
        const {username, email, role} = req.user
        const role_data = req.user
        
        const profile_data = await profile.findOne({email : role_data.email})
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const master = await master_shop.find()

        const find_data = await product.find();


        const warehouse_data = await warehouse.aggregate([
            {
                $unwind: "$product_details"
            },
            {
                $lookup:
                {
                    from: "products",
                    localField: "product_details.product_name",
                    foreignField: "name",
                    as: "product_docs"
                }
            },
            {
                $unwind: "$product_docs"
            },
            {
                $project: 
                {
                    product_name: '$product_details.product_name',
                    product_stock: '$product_details.product_stock',
                }
            },
            {
                $group: {
                    _id: "$product_name",
                    product_stock: { $sum: "$product_stock" }
                }
            },
        ])


        const staff_data = await staff.findOne({email: role_data.email})
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

        res.render("sales_reports", { 
            success: req.flash('success'),
            errors: req.flash('errors'),
            alldata: find_data,
            profile : profile_data,
            master_shop : master,
            role : role_data,
            product_stock : warehouse_data,
            language : lan_data,
            staff_arr: staff_data
			
        })
    } catch (error) {
        
    }
})

async function dataSalesReports(from, to, staff_id){
    let htmlContent = ``;

    const total_sales_data = await sales_sa.aggregate([
        {
            $match: {
                date: {
                    $gte: from,
                    $lte: to
                },
                sales_staff_id: staff_id
            }
        },
        {
            $unwind: "$sale_product"
        },
        {
            $match: {
                "sale_product.isFG": "false"
            }
        },
        {
            $group:{
                _id:{
                    product_name: "$sale_product.product_name",
                    product_code: "$sale_product.product_code",
                },
                sumqty: { $sum:"$sale_product.real_qty_unit_val" },
                totalPrice: { $sum:"$sale_product.totalprice" }
            }
        },
        {
            $sort :{
                "_id.product_name": 1,
            }
        }
    ])
    var qtytotal = 0;
    var pricetotal = 0;
    for (let index = 0; index <= total_sales_data.length-1; index++) {
        const element = total_sales_data[index];

        var totalPriceFixed = (element.totalPrice).toLocaleString(
            undefined, // leave undefined to use the visitor's browser 
                       // locale or a string like 'en-US' to override it.
            // { minimumFractionDigits: 2 }
          );

          var sumqtyfixed = (element.sumqty).toLocaleString(
            undefined, // leave undefined to use the visitor's browser 
                       // locale or a string like 'en-US' to override it.
            // { minimumFractionDigits: 2 }
          );

        
        htmlContent += `<tr>`;
        htmlContent += `<td class="row_data">${element._id.product_code}</td>`;
        htmlContent += `<td class="row_data">${element._id.product_name}</td>`;
        htmlContent += `<td class="row_data">${formatNumber(element.sumqty.toFixed(2))}</td>`;
        htmlContent += `<td class="row_data">${formatNumber(element.totalPrice.toFixed(2))}</td>`;
        htmlContent += `</tr>`;

        qtytotal += parseFloat(element.sumqty);
        pricetotal += parseFloat(element.totalPrice);
        // console.log(element)
        
    }


    var totalPriceFixedAll = (pricetotal).toLocaleString(
        undefined, // leave undefined to use the visitor's browser 
                   // locale or a string like 'en-US' to override it.
        // { minimumFractionDigits: 2 }
    );


    var sumqtyfixedAll = (qtytotal).toLocaleString(
        undefined, // leave undefined to use the visitor's browser 
                   // locale or a string like 'en-US' to override it.
        // { minimumFractionDigits: 2 }
    );

    htmlContent += `<tr>`;
    htmlContent += `<td class="row_data" colspan="2"><b>Total: </b></td>`;
    htmlContent += `<td class="row_data"><b>${formatNumber(qtytotal.toFixed(2))}</b></td>`;
    htmlContent += `<td class="row_data"><b>${formatNumber(pricetotal.toFixed(2))}</b></td>`;
    htmlContent += `</tr>`;
    
    return htmlContent;
}
router.post("/total_sales_reports/pdf", auth, async(req, res) => {
    try {

        const {from_date, to_date, isExcel} = req.body
        const role_data = req.user
        const stff_data = await staff.findOne({ email: role_data.email })

        let htmlContent = `
    
        <style>
            body {
                font-family: Arial, sans-serif;
            }
            p {
                font-size: 14px;
                margin-bottom: 10px;
            }
            table {
                border-collapse: collapse;
                width: 80%;
                margin-left: auto; 
                margin-right: auto;
            }
            th {
                border: 1px solid black;
                padding: 8px;
                text-align: center;
            }
            

            .cat_data {
                border: 1px solid black;
                padding: 8px;
                text-align: center;
            }

            .row_data {
                border: 1px solid black;
                padding: 8px;
                text-align: center;
            }
            th {
                color: black;
            }
            
        </style>
    `;
    var from_string_date = new Date(from_date);
    var to_string_date = new Date(to_date);

    const options3 = { 
        // weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
    const from_formattedDate = new Intl.DateTimeFormat('en-US', options3).format(from_string_date);
    const to_formattedDate = new Intl.DateTimeFormat('en-US', options3).format(to_string_date);
    var fataset = await dataSalesReports(from_date, to_date, stff_data._id.valueOf());

    htmlContent += `<div class="row">`;
    htmlContent += `<div class="col-sm-11">`;
    htmlContent += `<table>`;
    htmlContent += `<tr>`;
    htmlContent += `<th> ITEM CODE </th>`;
    htmlContent += `<th> ITEM DESCRIPTION </th>`;
    htmlContent += `<th> QTY SOLD </th>`;
    htmlContent += `<th> INVOICE AMOUNT </th>`;
    htmlContent += `<tr>`;
    htmlContent += fataset;
    htmlContent += `</tr>`;
    htmlContent += `</div>`;
    htmlContent += `</div>`;

    // res.send(htmlContent);
    // return;
    let dataImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxYxAAACD0S0HV4xFoAAAAAElFTkSuQmCC';
    const options = {
        width: '15in',  // Set custom width (e.g., 11 inches)
        height: '8.5in',
        orientation: 'landscape', // Landscape mode
        border: {
            top: "0.1in",
            right: "0.1in",
            bottom: "0.1in",
            left: "0.1in"
        },
        header: {
            height: "60mm", // Adjust header height
            contents: `
            <div style="text-align: center;">
                <img src="${dataImage}" style="max-width: 100%; height: auto;" />
                <h1>JAKA EQUITIES CORP</h1>
                <p><b>${stff_data.name}</b></p>
                <p>${from_formattedDate} - ${to_formattedDate}</p>
                <br><br><br><br><br><br><br><br><br><br>
            </div>
        `
        },
        footer: {
            height: "20mm", // Adjust footer height
            contents: {
                default: '<span style="color: #444;">{{page}}</span>/<span>{{pages}}</span>' // Page number
            }
        },
        dpi: 5,  // Set DPI for consistency
        zoomFactor: '1' // Ensure the same zoom level
    };
    
    if(isExcel == "on"){
        const $ = cheerio.load(htmlContent);

        let data = [];
        $('table tr').each((i, row) => {
            let rowData = [];
            $(row).find('td, th').each((j, cell) => {
                rowData.push($(cell).text().trim());
            });
            data.push(rowData);
        });

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, "Sales Report");

        // Write the workbook to a buffer
        const fileBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

        // Send the file to the client as a download
        res.setHeader('Content-Disposition', 'attachment; filename="sales_report.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(fileBuffer);
        // res.json(data)
        // return
    }else{
        pdf.create(htmlContent, options).toStream(function(err, stream) {
            if (err) {
                res.status(500).send('Error generating PDF');
                return;
            }
            res.setHeader('Content-Type', 'application/pdf');
            stream.pipe(res);
        });
    }
        
    } catch (error) {
        
    }
})


router.get("/inventory_sum/view", auth, async(req, res) => {
    try {
        const {username, email, role} = req.user
        const role_data = req.user
        
        const profile_data = await profile.findOne({email : role_data.email})
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const master = await master_shop.find()

        const find_data = await product.find();

        const warehouse_data = await warehouse.aggregate([
            {
                $unwind: "$product_details"
            },
            {
                $lookup:
                {
                    from: "products",
                    localField: "product_details.product_name",
                    foreignField: "name",
                    as: "product_docs"
                }
            },
            {
                $unwind: "$product_docs"
            },
            {
                $project: 
                {
                    product_name: '$product_details.product_name',
                    product_stock: '$product_details.product_stock',
                }
            },
            {
                $group: {
                    _id: "$product_name",
                    product_stock: { $sum: "$product_stock" }
                }
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

        res.render("inventory_sum", { 
            success: req.flash('success'),
            errors: req.flash('errors'),
            alldata: find_data,
            profile : profile_data,
            master_shop : master,
            role : role_data,
            product_stock : warehouse_data,
            language : lan_data
			
        })
    } catch (error) {
        
    }
})


async function dataInventoryReports(from, to, staff_id){
    

    const total_sales_data = await sales_sa.aggregate([
        {
            $match: {
                date: {
                    $gte: from,
                    $lte: to
                },
                sales_staff_id: staff_id
            }
        },
        {
            $unwind: "$sale_product"
        },
        {
            $group:{
                _id:{
                    product_name: "$sale_product.product_name",
                    product_code: "$sale_product.product_code",
                },
                sumqty: { $sum:"$sale_product.quantity" },
            }
        },
        {
            $sort :{
                "_id.product_name": 1,
            }
        }
    ])

    // console.log(total_sales_data.length)
    const ObjectId = mongoose.Types.ObjectId;

    const staff_data1 = await staff.aggregate([
        {
            $match: {
                "_id" : ObjectId(staff_id)
            }
        },
        {
            $unwind: "$product_list"
        },
        {
            $match: {
                "product_list.isConfirm" : "true"
            }
        },
        {
            $group: {
                _id: {
                    product_name: "$product_list.product_name",
                    product_code: "$product_list.product_code",
                },
                sumqty: { $sum: "$product_list.product_stock" }
            }
        },
        {
            $sort: {
                "_id.product_name" : 1
            }
        }

    ]);


    const inv_data = await sales_inv_data.aggregate([
        {
            $match: {
                date: {
                    $gte: from,
                    $lte: to
                },
                sales_staff_id: staff_id
            }
        },
        {
            $unwind: "$sale_product"
        },
        {
            $group: {
                _id: {
                    product_name: "$sale_product.product_name",
                    product_code: "$sale_product.product_code",
                },
                totalQTYsum : { $sum: "$sale_product.stock" }
            }
        }
    ])
    console.log(inv_data)
    let htmlContent = ``;
    // for(let p=0; p <= staff_data1.length-1; p++){
    //     const data_detl = staff_data1[p];
    //     htmlContent += `<tr>`;
    //     htmlContent += `<td class="row_data" style="width: 200px">${data_detl._id.product_code}</td>`;
    //     htmlContent += `<td class="row_data" style="width: 400px">${data_detl._id.product_name}</td>`;
    //     var totalData = 0;
    //     htmlContent += `<td class="row_data">1</td>`;
    //     for (let c = 0; c <= inv_data.length -1; c++) {
    //         const data_incoming = inv_data[c];
    //         // console.log(data_incoming)
            
    //         if (data_detl._id.product_code == data_incoming._id.product_code && data_detl._id.product_name == data_incoming._id.product_name) {
    //             htmlContent += `<td class="row_data">${data_incoming.totalQTYsum}</td>`;
    //         }
    //     }

    //     for (let index = 0; index <= total_sales_data.length-1; index++) {
    //         const element = total_sales_data[index];
    //         if (data_detl._id.product_code == element._id.product_code && data_detl._id.product_name == element._id.product_name) {
    //             htmlContent += `<td class="row_data">${element.sumqty}</td>`;
    //         }
    //     }
        
    //     htmlContent += `<td class="row_data">${data_detl.sumqty}</td>`;
    //     htmlContent += `</td>`;
    // }
    

    // var qtytotal = 0;
    // var pricetotal = 0;
    // for (let index = 0; index <= total_sales_data.length-1; index++) {
    //     const element = total_sales_data[index];

    //     var totalPriceFixed = (element.totalPrice).toLocaleString(
    //         undefined, // leave undefined to use the visitor's browser 
    //                    // locale or a string like 'en-US' to override it.
    //         // { minimumFractionDigits: 2 }
    //       );

    //       var sumqtyfixed = (element.sumqty).toLocaleString(
    //         undefined, // leave undefined to use the visitor's browser 
    //                    // locale or a string like 'en-US' to override it.
    //         // { minimumFractionDigits: 2 }
    //       );

        
    //     htmlContent += `<tr>`;
    //     htmlContent += `<td class="row_data">${element._id.product_code}</td>`;
    //     htmlContent += `<td class="row_data">${element._id.product_name}</td>`;
    //     htmlContent += `<td class="row_data">${sumqtyfixed}</td>`;
    //     htmlContent += `<td class="row_data">${totalPriceFixed}</td>`;
    //     htmlContent += `</tr>`;

    //     qtytotal += parseInt(element.sumqty);
    //     pricetotal += parseInt(element.totalPrice);
    //     console.log(element)
        
    // }


    // var totalPriceFixedAll = (pricetotal).toLocaleString(
    //     undefined, // leave undefined to use the visitor's browser 
    //                // locale or a string like 'en-US' to override it.
    //     // { minimumFractionDigits: 2 }
    // );


    // var sumqtyfixedAll = (qtytotal).toLocaleString(
    //     undefined, // leave undefined to use the visitor's browser 
    //                // locale or a string like 'en-US' to override it.
    //     // { minimumFractionDigits: 2 }
    // );

    // htmlContent += `<tr>`;
    // htmlContent += `<td class="row_data" colspan="2"><b>Total: </b></td>`;
    // htmlContent += `<td class="row_data">${sumqtyfixedAll}</td>`;
    // htmlContent += `<td class="row_data">${totalPriceFixedAll}</td>`;
    // htmlContent += `</tr>`;
    

var totalQTYALL = 0;
    for (let p = 0; p <= staff_data1.length - 1; p++) {
        const data_detl = staff_data1[p];
        htmlContent += `<tr>`;
        htmlContent += `<td class="row_data" style="width: 200px">${data_detl._id.product_code}</td>`;
        htmlContent += `<td class="row_data" style="width: 400px">${data_detl._id.product_name}</td>`;
        
        var endbal = data_detl.sumqty;
        var incomingqty = 0;
        for (let a = 0; a <= total_sales_data.length - 1; a++) {
            const element1 = total_sales_data[a];
            if (data_detl._id.product_code == element1._id.product_code && data_detl._id.product_name == element1._id.product_name) {
                incomingqty = element1.sumqty;
            }
        }

        var invqty = 0;
        for (let b = 0; b <= inv_data.length - 1; b++) {
            const data_incomingb = inv_data[b];
            if (data_detl._id.product_code == data_incomingb._id.product_code && data_detl._id.product_name == data_incomingb._id.product_name) {
                invqty = data_incomingb.totalQTYsum;
            }
        }
        totalQTYALL = (endbal-invqty) + incomingqty;
        htmlContent += `<td class="row_data">${totalQTYALL}</td>`;

        let invMatchFound = false;
        for (let c = 0; c <= inv_data.length - 1; c++) {
            const data_incoming = inv_data[c];
            if (data_detl._id.product_code == data_incoming._id.product_code && data_detl._id.product_name == data_incoming._id.product_name) {
                htmlContent += `<td class="row_data">${data_incoming.totalQTYsum}</td>`;
                invMatchFound = true;
                break;
            }
        }
        if (!invMatchFound) {
            htmlContent += `<td class="row_data">0</td>`;
        }
        let salesMatchFound = false;
        for (let index = 0; index <= total_sales_data.length - 1; index++) {
            const element = total_sales_data[index];
            if (data_detl._id.product_code == element._id.product_code && data_detl._id.product_name == element._id.product_name) {
                htmlContent += `<td class="row_data">${element.sumqty}</td>`;
                salesMatchFound = true;
                break;
            }
        }
    
        // If no match was found in total_sales_data, add 0
        if (!salesMatchFound) {
            htmlContent += `<td class="row_data">0</td>`;
        }
        
        htmlContent += `<td class="row_data">${data_detl.sumqty}</td>`;
        htmlContent += `</tr>`;
    }
    
    return htmlContent;
}
router.post("/inventory_sum/pdf", auth, async(req, res) => {
    try {

        const {from_date, to_date} = req.body
        const role_data = req.user
        const stff_data = await staff.findOne({ email: role_data.email })

        let htmlContent = `
    
        <style>
            body {
                font-family: Arial, sans-serif;
            }
            p {
                font-size: 14px;
                margin-bottom: 10px;
            }
            table {
                border-collapse: collapse;
                width: 80%;
                margin-left: auto; 
                margin-right: auto;
            }
            th {
                border: 1px solid black;
                padding: 8px;
                text-align: center;
            }
            

            .cat_data {
                border: 1px solid black;
                padding: 8px;
                text-align: center;
            }

            .row_data {
                border: 1px solid black;
                padding: 8px;
                text-align: center;
            }
            th {
                color: black;
            }
            
        </style>
    `;
    var from_string_date = new Date(from_date);
    var to_string_date = new Date(to_date);

    const options3 = { 
        // weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
    const from_formattedDate = new Intl.DateTimeFormat('en-US', options3).format(from_string_date);
    const to_formattedDate = new Intl.DateTimeFormat('en-US', options3).format(to_string_date);
    var fataset = await dataInventoryReports(from_date, to_date, stff_data._id.valueOf());
    // console.log("asd", fataset)
    htmlContent += `<h1>JAKA EQUITIES CORP</h1>`;
    htmlContent += `<p>INVENTORY SUMMARY</p>`;
    htmlContent += `<p>${from_formattedDate} - ${to_formattedDate}</p>`;
    htmlContent += `<div class="row">`;
    htmlContent += `<div class="col-sm-11">`;
    htmlContent += `<table>`;
    htmlContent += `<tr>`;
    htmlContent += `<th> ITEM CODE </th>`;
    htmlContent += `<th> ITEM DESCRIPTION </th>`;
    htmlContent += `<th> BEG BALANCE </th>`;
    htmlContent += `<th> INCOMING </th>`;
    htmlContent += `<th> SALES </th>`;
    htmlContent += `<th> ENDING BALANCE </th>`;
    htmlContent += `<tr>`;
    htmlContent += fataset;
    htmlContent += `</tr>`;
    htmlContent += `</div>`;
    htmlContent += `</div>`;

    // res.send(htmlContent);
    // return;
    const options = {
        format: 'Letter', // Set size to Letter
        orientation: 'landscape' // Set orientation to landscape
    };
    
    pdf.create(htmlContent, options).toStream(function(err, stream) {
        if (err) {
            res.status(500).send('Error generating PDF');
            return;
        }
        res.setHeader('Content-Type', 'application/pdf');
        stream.pipe(res);
    });
        
    } catch (error) {
        
    }
})


router.get("/dsrr/view", auth, async (req, res) => {
    try {
        const {username, email, role} = req.user
        const role_data = req.user
        
        const profile_data = await profile.findOne({email : role_data.email})
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const master = await master_shop.find()
        console.log("Products master" , master);

        const find_data = await product.find();
        console.log("Products find_data", find_data);


        const warehouse_data = await warehouse.aggregate([
            {
                $unwind: "$product_details"
            },
            {
                $lookup:
                {
                    from: "products",
                    localField: "product_details.product_name",
                    foreignField: "name",
                    as: "product_docs"
                }
            },
            {
                $unwind: "$product_docs"
            },
            {
                $project: 
                {
                    product_name: '$product_details.product_name',
                    product_stock: '$product_details.product_stock',
                }
            },
            {
                $group: {
                    _id: "$product_name",
                    product_stock: { $sum: "$product_stock" }
                }
            },
        ])
        console.log("Products warehouse_data", warehouse_data);


        warehouse_data.forEach(product_details => {

            const match_data = find_data.map((data) => {

                if (data.name == product_details._id) {
                    data.stock = parseInt(data.stock) + parseInt(product_details.product_stock)
                    
                }

            })
        })

        const staff_data = await staff.findOne({email: role_data.email})

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

        res.render("dssr_view", { 
            success: req.flash('success'),
            errors: req.flash('errors'),
            alldata: find_data,
            profile : profile_data,
            master_shop : master,
            role : role_data,
            product_stock : warehouse_data,
            language : lan_data,
            staff_arr: staff_data,
			
        })
    } catch (error) {
        
    }
})

async function agentsdataDSICheck_DSRR(from, staff_id, isExcel, number_data){
    let date = new Date(from);
    date.setDate(date.getDate() - 1);
    let formattedDate = date.toISOString().split('T')[0];
    // console.log(formattedDate)
    const product_data = await product.aggregate([
        {
            $group: {
                _id: {
                    brand: "$brand",
                    category: "$category"
                },
                products:{
                    $push: {
                        name: "$name",
                        product_code: "$product_code"
                    }
                }

            }
        },
        {
            $sort: {
                
                "_id.category": -1, // Sort by category in ascending order
                "_id.brand": 1,  // Sort by brand in ascending order
            }
        }
    ])
    var array_data = [];
    array_data["cat_brand"] = [];
    for (let index = 0; index <= product_data.length -1; index++) {
        const element = product_data[index];
        array_data["cat_brand"].push(element)
        // array_data["cat_brand"].push(element)
        
        
    }

    const product_cat= await product.aggregate([
        {
            $group: {
                _id: {
                    category: "$category"
                },
                products:{
                    $push: {
                        brand: "$brand",
                        product_code: "$product_code",
                        product_name: "$name"
                    }
                }

            }
        },
        {
            $sort: {
                
                "_id.category": -1, // Sort by category in ascending order
            }
        }
    ])

    const product_cnt = await product.aggregate([
        {
            $group: {
                _id: {
                    category: "$category",
                    brand: "$brand"
                }
            }
        },
        {
            $group: {
                _id: "$_id.category",
                brandCount: { $sum: 1 }
            }
        },
        {
            $sort: {
                _id: -1 // Sort by category in descending order (use 1 for ascending order)
            }
        }
    ]);

   
    // const sales_sa_data = await sales_sa.aggregate([
    //     {
    //         $match: {
    //             date: {
    //                 $gte: from,
    //                 $lte: to
    //             },
    //             sales_staff_id: staff_id,
    //              "sale_product.isFG": "false"
    //         }
    //     },
    //     {
    //         $unwind: "$sale_product"
    //     },
    //     {
    //         $match: {
    //             "sale_product.isFG": "false"
    //         }
    //     },
    //     {
    //         $lookup: {
    //             from: "products",
    //             localField: "sale_product.product_code",
    //             foreignField: "product_code",
    //             as: "product_info"
    //         }
    //     },
    //     {
    //         $unwind: "$product_info"
    //     },
    //     {
    //         $group: {
    //             _id: {
    //                 dsi: "$dsi",
    //                 date: "$date",
    //                 customer: "$customer"
    //             },
    //             totalQty: { $sum: "$sale_product.real_qty_unit_val" },
    //             products: {
    //                 $push: {
    //                     qty: "$sale_product.real_qty_unit_val",
    //                     NetPrice: "$sale_product.totalprice",
    //                     discount: "$sale_product.discount",
    //                     adj_discount: "$sale_product.adj_discount",
    //                     product_details: {
    //                         prod_name: "$product_info.name",
    //                         product_code: "$product_info.product_code",
    //                         category: "$product_info.category",
    //                         brand: "$product_info.brand",
    //                         gross_price: "$product_info.gross_price",
                            
    //                     }
    //                 }
    //             }
    //         }
    //     },
    //     {
    //         $unwind: "$products"
    //     },
    //     {
    //         $group: {
    //             _id: {
    //                 dsi: "$_id.dsi",
    //                 date: "$_id.date",
    //                 customer: "$_id.customer",
    //                 category: "$products.product_details.category",
    //                 brand: "$products.product_details.brand"
    //             },
    //             totalQty: { $sum: "$products.qty" },
    //             totalGross: { $sum: "$products.product_details.gross_price" },
    //             NetPrice: { $sum: "$products.NetPrice" },
    //             discount: { $sum: "$products.discount"},
    //             adj_discount: { $sum: "$products.adj_discount"},
    //             product_details: { $first: "$products.product_details" }
    //         }
    //     },
    //     {
    //         $group: {
    //             _id: {
    //                 dsi: "$_id.dsi",
    //                 date: "$_id.date",
    //                 customer: "$_id.customer"
    //             },
    //             totalQty: { $sum: "$totalQty" },
    //             totalGross: { $multiply: [ "$totalQty","$totalGross"] },
    //             NetPrice: { $sum: "$NetPrice" },
    //             discount: { $sum: "$discount"},
    //             adj_discount: { $sum: "$adj_discount"},
    //             products: {
    //                 $push: {
    //                     qty: "$totalQty",
    //                     category: "$_id.category",
    //                     brand: "$_id.brand",
    //                     product_details: "$product_details"
    //                 }
    //             }
    //         }
    //     },
    //     {
    //         $sort: {
                
    //             "_id.dsi": -1, // Sort by category in ascending order
    //             "_id.date": 1,  // Sort by brand in ascending order
    //         }
    //     }
    // ]);
    
    
// res.json(sales_sa_data);
// return
// console.log(sales_sa_data)
// return
// let arrdata = {
//     dataqty: {}
// };

// for (let a = 0; a < array_data["cat_brand"].length; a++) {
//     const element = array_data["cat_brand"][a];
//     const brand = element._id.brand;
//     const category = element._id.category;
//     // console.log(element)
//     if (!arrdata["dataqty"][brand]) {
//         arrdata["dataqty"][brand] = {};
//     }
    
//     if (!arrdata["dataqty"][brand][category]) {
//         arrdata["dataqty"][brand][category] = [];
//     }

//     for (let b = 0; b <= sales_sa_data.length-1; b++) {
//         const thedata = sales_sa_data[b];

//         for(let l = 0; l <= thedata.products.length - 1; l++ ){
//             const data_detl = thedata.products[l];
            
//             // console.log(data_detl.qty)
//             if (brand == data_detl.brand && category == data_detl.category) {
//                 // console.log(data_detl.qty)
//                 if (!arrdata["dataqty"][brand][category][thedata._id.dsi]) {
//                     arrdata["dataqty"][brand][category][thedata._id.dsi] = [];
//                 }

//                 if (!arrdata["dataqty"][brand][category][thedata._id.dsi][thedata._id.date]) {
//                     arrdata["dataqty"][brand][category][thedata._id.dsi][thedata._id.date] = [];
//                 }

//                 if (!arrdata["dataqty"][brand][category][thedata._id.dsi][thedata._id.date][thedata._id.customer]) {
//                     arrdata["dataqty"][brand][category][thedata._id.dsi][thedata._id.date][thedata._id.customer] = [];
//                 }

//                 arrdata["dataqty"][brand][category][thedata._id.dsi][thedata._id.date][thedata._id.customer].push(data_detl.qty);
//             }
//         }
        
        
//     }
// }


//     let htmlContent = "";
//     htmlContent += `<tr>`;
//     htmlContent += `<td colspan="20" class="cat_data">QUANTITY SOLD</td>`;
//     htmlContent += `</tr>`;
//     htmlContent += `<tr>`;
//     htmlContent += `<td class="cat_data" colspan="3"></td>`;
  
//     for(let a = 0; a <= product_cat.length -1; a++){
//         const thdata = product_cat[a];
//         for (let b = 0; b < product_cnt.length; b++) {
//             const element2 = product_cnt[b];
//             if(element2._id == thdata._id.category){
//                 htmlContent += `<td colspan="`+element2.brandCount+`" class="cat_data">`+thdata._id.category+`</td>`;
//             }
//         }
//     }
    
//     htmlContent += `<td class="cat_data" colspan="4"></td>`;
//     htmlContent += `</tr>`;
//     htmlContent += `<tr>`;
//     htmlContent += `<td colspan="1" class="cat_data">DSI Number</td>`;
//     htmlContent += `<td colspan="1" class="cat_data" style="width:100px">Date</td>`;
//     htmlContent += `<td colspan="1" class="cat_data" style="width:100px">Customer</td>`;
//     for(let a = 0; a <= product_cat.length -1; a++){
//         const thdata = product_cat[a];

//         for (let b = 0; b < array_data["cat_brand"].length; b++) {
//             const element = array_data["cat_brand"][b];

//             if(element._id.category == thdata._id.category){
//                 htmlContent += `<td class="cat_data">`+element._id.brand+`</td>`;
//             }
//         }
        
       
//     }
//     htmlContent += `<td class="cat_data">TOTAL QTY</td>`;
//     htmlContent += `<td class="cat_data">GROSS SALES</td>`;
//     htmlContent += `<td class="cat_data">DISCOUNT</td>`;
//     htmlContent += `<td class="cat_data">NET SALES VALUE</td>`;
//     htmlContent += `</tr>`;





//     for (let z = 0; z < sales_sa_data.length; z++) {
//         const sales_data_element = sales_sa_data[z];
        
//         htmlContent += `<tr>`;
//         htmlContent += `<td class="row_data">${sales_data_element._id.dsi}</td>`;
//         htmlContent += `<td class="row_data">${sales_data_element._id.date}</td>`;
//         htmlContent += `<td class="row_data">${sales_data_element._id.customer}</td>`;
    
//         // Initialize an object to keep track of quantities for each brand-category pair
//         let quantities = {};
    
//         // Fill quantities with actual data
//         for (let p = 0; p < sales_data_element.products.length; p++) {
//             const data_final = sales_data_element.products[p];
//             // console.log(data_final)
//             quantities[`${data_final.brand}-${data_final.category}`] = data_final.qty;
//         }
    
//         // Iterate over all possible brand-category pairs
//         for (let a = 0; a < array_data["cat_brand"].length; a++) {
//             const data_brand = array_data["cat_brand"][a];
//             const key = `${data_brand._id.brand}-${data_brand._id.category}`;
//             if (quantities[key] !== undefined) {
//                 htmlContent += `<td class="row_data">${quantities[key]}</td>`;
//             } else {
//                 htmlContent += `<td class="row_data">0</td>`;
//             }
//         }
//         htmlContent += `<td class="row_data">${sales_data_element.totalQty}</td>`;
//         htmlContent += `<td class="row_data">${sales_data_element.totalGross}</td>`;
//         htmlContent += `<td class="row_data">${sales_data_element.discount}</td>`;
//         htmlContent += `<td class="row_data">${sales_data_element.NetPrice.toFixed(2)}</td>`;
//         htmlContent += `</tr>`;
//     }
    
    
//     return htmlContent;


const sales_sa_data = await sales_sa.aggregate([
    {
        $match: {
            date: from,
            sales_staff_id: staff_id,
            "sale_product.isFG": "false"
        }
    },
    {
        $unwind: "$sale_product"
    },
    // {
    //     $match: {
    //         "sale_product.isFG": "false"
    //     }
    // },
    {
        $lookup: {
            from: "products",
            localField: "sale_product.product_code",
            foreignField: "product_code",
            as: "product_info"
        }
    },
    {
        $unwind: "$product_info"
    },
    {
        $group: {
            _id: {
                dsi: "$dsi",
                date: "$date",
                customer: "$customer"
            },
            totalQty: { $sum: "$sale_product.real_qty_unit_val" },
            cash: { $first: "$cash"  },
            amount: { $first: "$amount"  },
            bank: { $first: "$bank"  },
            check_no: { $first: "$check_no"  },
            due_date: { $first: "$due_date"  },
            products: {
                $push: {
                    qty: "$sale_product.real_qty_unit_val",
                    NetPrice: "$sale_product.totalprice",
                    discount: "$sale_product.discount",
                    adj_discount: "$sale_product.adj_discount",
                    
                    product_details: {
                        prod_name: "$product_info.name",
                        product_code: "$product_info.product_code",
                        category: "$product_info.category",
                        brand: "$product_info.brand",
                        gross_price: "$product_info.gross_price",
                        isFG: "$sale_product.isFG",
                        prod_cat: "$sale_product.prod_cat",
                        prod_id: "$sale_product._id",
                        
                    }
                }
            }
        }
    },
    {
        $unwind: "$products"
    },
    {
        $group: {
            _id: {
                dsi: "$_id.dsi",
                date: "$_id.date",
                customer: "$_id.customer",
                category: "$products.product_details.category",
                brand: "$products.product_details.brand",
                prod_id: "$products.product_details.prod_id",
            },
            totalQty: { $sum: "$products.qty" },
            totalGross: { $sum: { $multiply: ["$products.qty", "$products.product_details.gross_price"] } },
            NetPrice: { $sum: "$products.NetPrice" },
            discount: { $sum: "$products.discount" },
            adj_discount: { $sum: "$products.adj_discount" },
            cash: { $first: "$cash"  },
            amount: { $first: "$amount"  },
            bank: { $first: "$bank"  },
            check_no: { $first: "$check_no"  },
            due_date: { $first: "$due_date"  },
            product_details: { $first: "$products.product_details" }
        }
    },
    {
        $group: {
            _id: {
                dsi: "$_id.dsi",
                date: "$_id.date",
                customer: "$_id.customer"
            },
            totalQty: { $sum: "$totalQty" },
            totalGross: { $sum: "$totalGross" },
            NetPrice: { $sum: "$NetPrice" },
            discount: { $sum: "$discount" },
            adj_discount: { $sum: "$adj_discount" },
            cash: { $first: "$cash"  },
            amount: { $first: "$amount"  },
            bank: { $first: "$bank"  },
            check_no: { $first: "$check_no"  },
            due_date: { $first: "$due_date"  },
            products: {
                $push: {
                    qty: "$totalQty",
                    category: "$_id.category",
                    brand: "$_id.brand",
                    product_details: "$product_details"
                }
            }
        }
    },
    {
        $sort: {
            "_id.dsi": -1, // Sort by category in ascending order
            "_id.date": 1,  // Sort by brand in ascending order
        }
    }
]);


const sales_sa_data_kahapon = await sales_sa.aggregate([
    {
        $match: {
            date: formattedDate,
            sales_staff_id: staff_id,
            "sale_product.isFG": "false"
        }
    },
    {
        $unwind: "$sale_product"
    },
    // {
    //     $match: {
    //         "sale_product.isFG": "false"
    //     }
    // },
    {
        $lookup: {
            from: "products",
            localField: "sale_product.product_code",
            foreignField: "product_code",
            as: "product_info"
        }
    },
    {
        $unwind: "$product_info"
    },
    {
        $group: {
            _id: {
                dsi: "$dsi",
                date: "$date",
                customer: "$customer"
            },
            totalQty: { $sum: "$sale_product.real_qty_unit_val" },
            cash: { $first: "$cash"  },
            amount: { $first: "$amount"  },
            bank: { $first: "$bank"  },
            check_no: { $first: "$check_no"  },
            due_date: { $first: "$due_date"  },
            products: {
                $push: {
                    qty: "$sale_product.real_qty_unit_val",
                    NetPrice: "$sale_product.totalprice",
                    discount: "$sale_product.discount",
                    adj_discount: "$sale_product.adj_discount",
                    
                    product_details: {
                        prod_name: "$product_info.name",
                        product_code: "$product_info.product_code",
                        category: "$product_info.category",
                        brand: "$product_info.brand",
                        gross_price: "$product_info.gross_price",
                        isFG: "$sale_product.isFG",
                        prod_cat: "$sale_product.prod_cat",
                        prod_id: "$sale_product._id",
                        
                    }
                }
            }
        }
    },
    {
        $unwind: "$products"
    },
    {
        $group: {
            _id: {
                dsi: "$_id.dsi",
                date: "$_id.date",
                customer: "$_id.customer",
                category: "$products.product_details.category",
                brand: "$products.product_details.brand",
                prod_id: "$products.product_details.prod_id",
            },
            totalQty: { $sum: "$products.qty" },
            cash: { $first: "$cash"  },
            amount: { $first: "$amount"  },
            bank: { $first: "$bank"  },
            check_no: { $first: "$check_no"  },
            due_date: { $first: "$due_date"  },
            totalGross: { $sum: { $multiply: ["$products.qty", "$products.product_details.gross_price"] } },
            NetPrice: { $sum: "$products.NetPrice" },
            discount: { $sum: "$products.discount" },
            adj_discount: { $sum: "$products.adj_discount" },
            // isFG: { $first: "$products.isFG"},
            // prod_cat: { $first: "$products.prod_cat"},
            product_details: { $first: "$products.product_details" }
        }
    },
    {
        $group: {
            _id: {
                dsi: "$_id.dsi",
                date: "$_id.date",
                customer: "$_id.customer"
            },
            totalQty: { $sum: "$totalQty" },
            cash: { $first: "$cash"  },
            amount: { $first: "$amount"  },
            bank: { $first: "$bank"  },
            check_no: { $first: "$check_no"  },
            due_date: { $first: "$due_date"  },
            totalGross: { $sum: "$totalGross" },
            NetPrice: { $sum: "$NetPrice" },
            discount: { $sum: "$discount" },
            adj_discount: { $sum: "$adj_discount" },
            // isFG: { $first: "$isFG" },
            // prod_cat: { $first: "$prod_cat" },
            products: {
                $push: {
                    qty: "$totalQty",
                    category: "$_id.category",
                    brand: "$_id.brand",
                    product_details: "$product_details"
                }
            }
        }
    },
    {
        $sort: {
            "_id.dsi": -1, // Sort by category in ascending order
            "_id.date": 1,  // Sort by brand in ascending order
        }
    }
]);

// console.log(sales_sa_data_kahapon);


const stafff_data = await staff.findById(staff_id);
// console.log(stafff_data.name)
let rows = [];

let merged_totals = {};
let data_totals = {}
var sum = 0;
var netPay = 0;
var discountAll = 0
var discounttotal = 0;
var totalGrossAll = 0;
const rowsPerPage = 6;
var totalCashAll = 0;
var totalAmountAll = 0;
// let isProdCat2 = {};
for (let z = 0; z <= sales_sa_data.length -1; z++) {
    const sales_data_element = sales_sa_data[z];
    let row = `<tr>`;
    row += `<td class="row_data" style="border: 1px solid black; text-align: left;"></td>`;
    row += `<td class="row_data" style="border: 1px solid black; text-align: left;">${sales_data_element._id.customer}</td>`;
    row += `<td class="row_data" style="border: 1px solid black; text-align: left;">${sales_data_element._id.dsi}</td>`;
    
    
    
    let quantities = {};
    let isFGdata = {};
    let isProdCat = {};
    var totalPrimUnit = {};
    var totalSecUnit = {};
    var totalFG= {};

  
    
    var x = 0;
    for (let p = 0; p <= sales_data_element.products.length -1; p++) {
        const data_final = sales_data_element.products[p];
        quantities[`${data_final.brand}-${data_final.category}`] = data_final.qty;
        isFGdata[[`${data_final.brand}-${data_final.category}`]] = data_final.product_details.isFG ;
        isProdCat[[`${data_final.brand}-${data_final.category}`]] = data_final.product_details.prod_cat;
        // isProdCat2[[`${data_final.brand}-${data_final.category}`]] = data_final.product_details.prod_cat;
        const key = `${data_final.brand}-${data_final.category}`;


        if (!Array.isArray(data_totals[key])) {
            data_totals[key]= [];
        }

        if (!Array.isArray(data_totals[key])) {
            data_totals[key] = [];
        }
        data_totals[key].push(data_final.qty);



        if(data_final.product_details.prod_cat == "P"){
            if(data_final.product_details.isFG == "true"){

                if (!totalFG[key]) {
                    totalFG[key] = 0;
                }
    
                totalFG[key] = data_final.qty;
                
            }else{
                if (!totalPrimUnit[key]) {
                    totalPrimUnit[key] =0;
                }
                totalPrimUnit[key] = data_final.qty;
            }
        }else if(data_final.product_details.prod_cat == "S"){
            if(data_final.product_details.isFG == "true"){

                if (!totalFG[key]) {
                    totalFG[key] = 0;
                }
    
                totalFG[key]  = data_final.qty;

            }else{
                if (!totalSecUnit[key]) {
                    totalSecUnit[key] =0;
                }
                totalSecUnit[key]  = data_final.qty;

                
            }
        }
        x++;
    }

    for (let a = 0; a <= array_data["cat_brand"].length-1; a++) {
        const data_brand = array_data["cat_brand"][a];
        const key = `${data_brand._id.brand}-${data_brand._id.category}`;
        const dataisProdCat = isProdCat[key] !== undefined ? isProdCat[key] : "NA";
        // console.log(isProdCat)
        // if(dataisProdCat == "P"){
        //     const dataisFGdata = isFGdata[key] !== undefined ? isFGdata[key] : "NA";
        //     // console.log(dataisFGdata)
        //     if(dataisFGdata == "true"){
        //         row += `<td class="row_data" style="border: 1px solid black; text-align: right;"></td>`;
        //         row += `<td class="row_data" style="border: 1px solid black; text-align: right;"></td>`;
        //         row += `<td class="row_data" style="border: 1px solid black; text-align: right;" >${quantities[key] !== undefined ? quantities[key].toFixed(2) : ""}</td>`;


        //         row += `<input type="hidden" name="inCar" value="${quantities[key] !== undefined ? quantities[key].toFixed(2) : ""}">`;
                
        //         totalFG += quantities[key] !== undefined ? quantities[key].toFixed(2) : ""
        //     }else {
        //         row += `<td class="row_data" style="border: 1px solid black; text-align: right;">${quantities[key] !== undefined ? quantities[key].toFixed(2) : ""}</td>`;
        //         row += `<td class="row_data" style="border: 1px solid black; text-align: right;"></td>`;
        //         row += `<td class="row_data" style="border: 1px solid black; text-align: right;"></td>`;

        //         totalPrimUnit += quantities[key] !== undefined ? quantities[key].toFixed(2) : ""

                
        //     }
            
        // }else if(dataisProdCat == "S"){
      
        //     const dataisFGdata = isFGdata[key] !== undefined ? isFGdata[key] : "NA";
        //     if(dataisFGdata == "true"){
        //         row += `<td class="row_data" style="border: 1px solid black; text-align: right;"></td>`;
        //         row += `<td class="row_data" style="border: 1px solid black; text-align: right;"></td>`;
        //         row += `<td class="row_data" style="border: 1px solid black; text-align: right;">${quantities[key] !== undefined ? quantities[key].toFixed(2) : ""}</td>`;

        //         totalFG += quantities[key] !== undefined ? quantities[key].toFixed(2) : ""
        //     }else {
        //         row += `<td class="row_data" style="border: 1px solid black; text-align: right;"></td>`;
        //         row += `<td class="row_data" style="border: 1px solid black; text-align: right;">${quantities[key] !== undefined ? quantities[key].toFixed(2) : ""}</td>`;
        //         row += `<td class="row_data" style="border: 1px solid black; text-align: right;"></td>`;
        //         totalSecUnit += quantities[key] !== undefined ? quantities[key].toFixed(2) : ""

        //     }
        // }else{
        //     row += `<td class="row_data" style="border: 1px solid black; text-align: right;"></td>`; 
        //     row += `<td class="row_data" style="border: 1px solid black; text-align: right;"></td>`;
        //     row += `<td class="row_data" style="border: 1px solid black; text-align: right;"></td>`;
        // }
        var thePrime = totalPrimUnit[key] !== undefined ? totalPrimUnit[key].toFixed(2) : "";
        var theSec = totalSecUnit[key] !== undefined ? totalSecUnit[key].toFixed(2) : "";
        var theFGdata = totalFG[key] !== undefined ? totalFG[key].toFixed(2) : "";

        row += `<td class="row_data" style="border: 1px solid black; text-align: right;">${thePrime}</td>`; 
        row += `<td class="row_data" style="border: 1px solid black; text-align: right;">${theSec}</td>`;
        row += `<td class="row_data" style="border: 1px solid black; text-align: right;">${theFGdata}</td>`;
    }
    var cash = formatNumber(parseFloat(sales_data_element.cash));
    var amount = formatNumber(parseFloat(sales_data_element.amount));

    if(isNaN(amount)){
        amount = 0;
    }
    // if(isNaN(cash)){
    //     cash = 0;
    // }
    row += `<td class="row_data" style="border: 1px solid black; text-align: right;">${cash}</td>`;
    row += `<td class="row_data" style="border: 1px solid black; text-align: right;">${amount}</td>`;
    row += `<td class="row_data" style="border: 1px solid black; text-align: left;">${sales_data_element.bank}</td>`;
    row += `<td class="row_data" style="border: 1px solid black; text-align: left;">${sales_data_element.check_no}</td>`;
    row += `<td class="row_data" style="border: 1px solid black; text-align: left;">${sales_data_element.due_date}</td>`;
    discountAll = sales_data_element.discount + sales_data_element.adj_discount

    totalCashAll += parseFloat(sales_data_element.cash)

    
    totalAmountAll += parseFloat(amount)
    rows.push(row);
}

function paginateRows(rows, rowsPerPage) {
    const pages = [];
    for (let i = 0; i <= rows.length -1; i += rowsPerPage) {
        pages.push(rows.slice(i, i + rowsPerPage));
    }
    return pages;
}


const pages = paginateRows(rows, rowsPerPage);
// console.log(pages)
let htmlContent = "";
pages.forEach((page, pageIndex) => {
    if (pageIndex > 0) {
        htmlContent += `<div style="page-break-before: always;"></div>`;
    }
    // htmlContent += `<h1>JENNY JOY AMBRE</h1>`;
    htmlContent += `<table>`;
    htmlContent += `<thead>`;
    const dateUSed = new Date(from);
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        timeZone: 'Asia/Manila' 
    };
    const dateInWords = dateUSed.toLocaleDateString('en-US', options);
    htmlContent += `<tr>`;
    htmlContent += `<td colspan="29" class="cat_data" style="border: 1px solid black; text-align: right;" ><b>NO: ${number_data}</b></td>`;
    htmlContent += `</tr>`;
    htmlContent += `<tr>`;
    htmlContent += `<td colspan="5.5" class="cat_data" style="border: 1px solid black; text-align: left;" ><b>NAME:</b>  ${stafff_data.name}</td>`;
    htmlContent += `<td colspan="6" class="cat_data" style="border: 1px solid black; text-align: left;" ><b>DISTRICT NO: </b></td>`;
    htmlContent += `<td colspan="6" class="cat_data" style="border: 1px solid black; text-align: left;" ><b>KM RDG BEG: </b></td>`;
    htmlContent += `<td colspan="3" rowspan="3" style="border: 1px solid black; text-align: left;" ><b>TOTAL KMS <br> TRAVELLED  FOR THIS <br> MONTH ________ KMS</br></td>`;
    htmlContent += `<td colspan="1" rowspan="1" style="border: 1px solid black; text-align: left;" ></td>`;
    htmlContent += `<td colspan="1" rowspan="1" style="border: 1px solid black; text-align: left;" ><b>TODAY</b></td>`;
    htmlContent += `<td colspan="1" rowspan="1" style="border: 1px solid black; text-align: left;" ><b>TO DATE</b></td>`;
    htmlContent += `<td colspan="5" rowspan="3" style="border: 1px solid black; text-align: left;" ><b>NO OF WORKING DAYS <br> FOR THE MONTH _________ <br> <br> NO OF DAYS WORKED <br> TO DATE _________  </br></td>`;
    htmlContent += `<td colspan="1" rowspan="3" style="border: 1px solid black; text-align: left;" ><b>REPORT NO</b></td>`;
    htmlContent += `</tr>`;
    htmlContent += `<tr>`;
    htmlContent += `<td colspan="5.5" class="cat_data" style="border: 1px solid black; text-align: left;"><b>SIGNATURE: </b></td>`;
    htmlContent += `<td colspan="6" class="cat_data" style="border: 1px solid black; text-align: left;" ><b>DATE: </b> ${dateInWords}</td>`;
    htmlContent += `<td colspan="6" class="cat_data" style="border: 1px solid black; text-align: left;" ><b>KM RDG END: </b></td>`;
    htmlContent += `<td colspan="1" rowspan="1" style="border: 1px solid black; text-align: left;" ><b>TOTAL <br> CALLS</b></td>`;
    htmlContent += `<td colspan="1" rowspan="1" style="border: 1px solid black; text-align: left;" ><b></b></td>`;
    htmlContent += `<td colspan="1" rowspan="1" style="border: 1px solid black; text-align: left;" ><b></b></td>`;
    htmlContent += `</tr>`;
    htmlContent += `<tr>`;
    htmlContent += `<td colspan="11.5" class="cat_data" style="border: 1px solid black; text-align: left;"><b>AREA COVERED: </b></td>`;
    htmlContent += `<td colspan="6" class="cat_data" style="border: 1px solid black; text-align: left;" ><b>KM TRAVELLED: </b></td>`;
    htmlContent += `<td colspan="1" rowspan="1" style="border: 1px solid black; text-align: left;" ><b>TOTAL <BR> PRODUCTIVE</b></td>`;
    htmlContent += `<td colspan="1" rowspan="1" style="border: 1px solid black; text-align: left;" ><b></b></td>`;
    htmlContent += `<td colspan="1" rowspan="1" style="border: 1px solid black; text-align: left;" ><b></b></td>`;
    
    htmlContent += `</tr>`;


    htmlContent += `<tr>`;
    htmlContent += `<td height="20px" colspan="29" class="cat_data" style="width:100px"><b></b></td>`;
    htmlContent += `</tr>`;
    htmlContent += `<tr>`;
    htmlContent += `<td colspan="24" class="cat_data" style="width:100px"><b></b></td>`;
    htmlContent += `<td colspan="5" class="cat_data" style="width:200px"><b>MODE OF PAYMENT</b></td>`;
    htmlContent += `</tr>`;
    htmlContent += `<tr>`;
    htmlContent += `<td colspan="1" class="cat_data" style="width:20px"><b>#</b></td>`;
    htmlContent += `<td colspan="1" class="cat_data" style="width:200px"><b>CUSTOMER ADDRESS</b></td>`;
    htmlContent += `<td colspan="1" class="cat_data"><b>DSI#PR#</b></td>`;
    
    
    for (let a = 0; a <= product_cat.length -1; a++) {
        const thdata = product_cat[a];
        for (let b = 0; b < array_data["cat_brand"].length; b++) {
            const element = array_data["cat_brand"][b];
            if (element._id.category === thdata._id.category) {
                var theTitle = ""
                switch(thdata._id.category){
                    case "Standard":
                        theTitle = element._id.brand + " - STD"
                    break;
                    case "Household":
                        theTitle = element._id.brand + " - HH"
                    break;
                    default:
                        theTitle = element._id.brand
                    break;
                }
                htmlContent += `<td class="cat_data" colspan="3"><b>${theTitle}</b></td>`;
            }
        }
    }
    htmlContent += `<td colspan="1" rowspan="2" class="cat_data"><b>CASH</b></td>`;
    htmlContent += `<td colspan="1" rowspan="2" class="cat_data"><b>AMOUNT</b></td>`
    htmlContent += `<td colspan="3" rowspan="1" class="cat_data"><b>CHECK</b></td>`;
    htmlContent += `</tr>`;

    htmlContent += `<tr>`;
    htmlContent += `<td class="cat_data" colspan="3"></td>`;
    for (let index = 0; index <= array_data["cat_brand"].length -1 ; index++) {
        const element = array_data[index];
        htmlContent += `<td class="cat_data"><b>IN CAR</b></td>`;
        htmlContent += `<td class="cat_data"><b>IN PC</b></td>`;
        htmlContent += `<td class="cat_data"><b>FG</b></td>`;
        
    }

    htmlContent += `<td class="cat_data" colspan="1"><b>BANK</b></td>`;
    htmlContent += `<td class="cat_data" colspan="1"><b>CHECK #</b></td>`;
    htmlContent += `<td class="cat_data" colspan="1"><b>DUE DATE</b></td>`;
    htmlContent += `</tr>`;
    htmlContent += `</thead>`;
    htmlContent += `<tbody>`;
    page.forEach(row => {
        htmlContent += row;
    });

    let totalsP = {};
    let totalsS = {};
    let totalsFG = {};
    for (let n = 0; n <= sales_sa_data.length -1; n++) {
        const sales_data_element2 = sales_sa_data[n];
        var x = 0;
        for (let a = 0; a <= sales_data_element2.products.length -1; a++) {
            const data_final = sales_data_element2.products[a];
            const key = `${data_final.brand}-${data_final.category}`;
            if(data_final.product_details.prod_cat == "P"){
                if(data_final.product_details.isFG == "true"){

                    if (!totalsFG[key]) {
                        totalsFG[key] = 0;
                    }
        
                    totalsFG[key]  += data_final.qty;
                    
                }else{
                    if (!totalsP[key]) {
                        totalsP[key] =0;
                    }
                    totalsP[key]  += data_final.qty;
                }
            }else if(data_final.product_details.prod_cat == "S"){
                if(data_final.product_details.isFG == "true"){

                    if (!totalsFG[key]) {
                        totalsFG[key] = 0;
                    }
        
                    totalsFG[key]  += data_final.qty;
                    console.log(data_final.qty)
                }else{
                    if (!totalsS[key]) {
                        totalsS[key] =0;
                    }
                    totalsS[key]  += data_final.qty;

                    
                }
            }
            x++;
        }
    }


    let totalsPK = {};
    let totalsSK = {};
    let totalsFGK = {};
    var TotalPrevCash = 0;
    var TotalPrevAmount = 0;
    for (let o = 0; o <= sales_sa_data_kahapon.length -1; o++) {
        const sales_data_element2 = sales_sa_data_kahapon[o];

        var x = 0;
        // isProdCat2[x] = {}
        for (let a = 0; a <= sales_data_element2.products.length -1; a++) {
            const data_final = sales_data_element2.products[a];
            // console.log(sales_data_element2)
            
            const key = `${data_final.brand}-${data_final.category}`;

            if(data_final.product_details.prod_cat == "P"){

                if(data_final.product_details.isFG == "true"){

                    if (!totalsFGK[key]) {
                        totalsFGK[key] = 0;
                    }
        
                    totalsFGK[key]  += data_final.qty;
                    
                }else{
                    if (!totalsPK[key]) {
                        totalsPK[key] =0;
                    }
                    totalsPK[key]  += data_final.qty;
                }
               
            }else if(data_final.product_details.prod_cat == "S"){
                if(data_final.product_details.isFG == "true"){

                    if (!totalsFGK[key]) {
                        totalsFGK[key] = 0;
                    }
        
                    totalsFGK[key]  += data_final.qty;
                    
                }else{
                    if (!totalsSK[key]) {
                        totalsSK[key] =0;
                    }
                    totalsSK[key]  += data_final.qty;
                }
            }
            x++;
        }
        var cashtotal = parseFloat(sales_data_element2.cash);
        var amounttotal = parseFloat(sales_data_element2.amount);

        if(isNaN(amounttotal)){
            amounttotal = 0;
        }
        TotalPrevCash += cashtotal;
        TotalPrevAmount += amounttotal
        // console.log(TotalPrevAmount)
     
    }


    
//    console.log(totalsS)


    
    htmlContent += `<tr>`;
    htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: center;"><b></b></td>`;
    htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: left;"><b>SALES TODAY</b></td>`;
    htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: left;"></td>`;

    for (let m = 0; m <= array_data["cat_brand"].length-1; m++) {
        const data_brand = array_data["cat_brand"][m];
        const key1 = `${data_brand._id.brand}-${data_brand._id.category}`;
        var primaryData = totalsP[key1]!== undefined ? formatNumber(totalsP[key1].toFixed(2))  : "";
        var FGData = totalsFG[key1]!== undefined ? formatNumber(totalsFG[key1].toFixed(2))  : "";
        var secondaryData = totalsS[key1]!== undefined ? formatNumber(totalsS[key1].toFixed(2))  : "";
            
        htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: right;"><b>${primaryData}</b></td>`;
        htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: right;"><b>${secondaryData}</b></td>`;
        htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: right;"><b>${FGData}</b></td>`;
    }
    htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: right;"><b>${formatNumber(totalCashAll)}</b></td>`;
    htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: right;"><b>${formatNumber(totalAmountAll)}</b></td>`;
    htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: left;"></td>`;
    htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: left;"></td>`;
    htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: left;"></td>`;
    htmlContent += `</tr>`;

    htmlContent += `<tr>`;
    htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: center;"><b></b></td>`;
    htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: left;"><b>ADD: PREVIOUS</b></td>`;
    htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: left;"></td>`;
    // date used minus 1
    for (let m = 0; m <= array_data["cat_brand"].length-1; m++) {
        const data_brand = array_data["cat_brand"][m];
        const key1 = `${data_brand._id.brand}-${data_brand._id.category}`;
        var primaryData = totalsPK[key1]!== undefined ? formatNumber(totalsPK[key1].toFixed(2))  : "";
        var FGData = totalsFGK[key1]!== undefined ? formatNumber(totalsFGK[key1].toFixed(2))  : "";
        var secondaryData = totalsSK[key1]!== undefined ? formatNumber(totalsSK[key1].toFixed(2))  : "";
        htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: right;"><b>${primaryData}</b></td>`;
        htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: right;"><b>${secondaryData}</b></td>`;
        htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: right;"><b>${FGData}</b></td>`
    }
    htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: right;"><b>${formatNumber(TotalPrevCash)}</b></td>`;
    htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: right;"><b>${formatNumber(TotalPrevAmount)}</b></td>`;
    htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: left;"></td>`;
    htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: left;"></td>`;
    htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: left;"></td>`;
    htmlContent += `</tr>`;

    htmlContent += `<tr>`;
    htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: center;"><b></b></td>`;
    htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: left;"><b>TOTAL SALES TO DATE</b></td>`;
    htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: left;"></td>`;

    let PrimTotalAllData = 0
    let SecTotalAllData = 0
    let FGTotalAllData = 0

    for (let m = 0; m <= array_data["cat_brand"].length-1; m++) {
        const data_brand = array_data["cat_brand"][m];
        const key1 = `${data_brand._id.brand}-${data_brand._id.category}`;
        var primaryData5 = totalsP[key1]!== undefined ? totalsP[key1].toFixed(2)  : "0";
        var FGData5 = totalsFG[key1]!== undefined ? totalsFG[key1].toFixed(2)  : "0";
        var secondaryData5 = totalsS[key1]!== undefined ? totalsS[key1].toFixed(2)  : "0";



        var primaryData4 = totalsPK[key1]!== undefined ? totalsPK[key1].toFixed(2)  : "0";
        var FGData4 = totalsFGK[key1]!== undefined ? totalsFGK[key1].toFixed(2)  : "0";
        var secondaryData4 = totalsSK[key1]!== undefined ? totalsSK[key1].toFixed(2)  : "0";

        PrimTotalAllData = (parseFloat(primaryData5)+parseFloat(primaryData4));
        SecTotalAllData = (parseFloat(secondaryData5)+parseFloat(secondaryData4));
        FGTotalAllData = (parseFloat(FGData5)+parseFloat(FGData4));

        htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: right;"><b>${formatNumber(PrimTotalAllData.toFixed(2))}</b></td>`;
        htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: right;"><b>${formatNumber(SecTotalAllData.toFixed(2))}</b></td>`;
        htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: right;"><b>${formatNumber(FGTotalAllData.toFixed(2))}</b></td>`;
    }
    var CashAlltotal = formatNumber(totalCashAll+TotalPrevCash);
    var AmountAlltotal = formatNumber(totalAmountAll+TotalPrevAmount);
    /// the total All
    htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: right;"><b>${CashAlltotal}</b></td>`;
    htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: right;"><b>${AmountAlltotal}</b></td>`;
    htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: left;"></td>`;
    htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: left;"></td>`;
    htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: left;"></td>`;
    htmlContent += `</tr>`;

    htmlContent += `<tr>`;
    htmlContent += `<td height="50px" class="row_data" style="border: 1px solid black; text-align: center;" colspan="`+ ((array_data["cat_brand"].length*3) + 9) +`"><b></b></td>`;
    htmlContent += `</tr>`;
    //another table
    htmlContent += `<tr>`;
    htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: center;"><b></b></td>`;
    htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: left;"><b>BEGINNING INVENTORY</b></td>`;
    htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: left;"></td>`;

    for (let m = 0; m <= array_data["cat_brand"].length-1; m++) {
        const data_brand = array_data["cat_brand"][m];
        const key1 = `${data_brand._id.brand}-${data_brand._id.category}`;
        var primaryData5 = totalsP[key1]!== undefined ? totalsP[key1].toFixed(2)  : "0";
        var FGData5 = totalsFG[key1]!== undefined ? totalsFG[key1].toFixed(2)  : "0";
        var secondaryData5 = totalsS[key1]!== undefined ? totalsS[key1].toFixed(2)  : "0";



        var primaryData4 = totalsPK[key1]!== undefined ? totalsPK[key1].toFixed(2)  : "0";
        var FGData4 = totalsFGK[key1]!== undefined ? totalsFGK[key1].toFixed(2)  : "0";
        var secondaryData4 = totalsSK[key1]!== undefined ? totalsSK[key1].toFixed(2)  : "0";

        PrimTotalAllData = (parseFloat(primaryData5)+parseFloat(primaryData4));
        SecTotalAllData = (parseFloat(secondaryData5)+parseFloat(secondaryData4));
        FGTotalAllData = (parseFloat(FGData5)+parseFloat(FGData4));

        htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: right;"><b></b></td>`;
        htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: right;"><b></b></td>`;
        htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: right;"><b></b></td>`;
    }

    htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: left;"></td>`;
    htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: left;"></td>`;
    htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: left;"></td>`;
    htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: left;"></td>`;
    htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: left;"></td>`;
    htmlContent += `</tr>`



    htmlContent += `<tr>`;
    htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: center;"><b></b></td>`;
    htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: left;"><b>ADDITIONAL/WITHDRAWAL</b></td>`;
    htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: left;"></td>`;

    for (let m = 0; m <= array_data["cat_brand"].length-1; m++) {
        const data_brand = array_data["cat_brand"][m];
        const key1 = `${data_brand._id.brand}-${data_brand._id.category}`;
        var primaryData5 = totalsP[key1]!== undefined ? totalsP[key1].toFixed(2)  : "0";
        var FGData5 = totalsFG[key1]!== undefined ? totalsFG[key1].toFixed(2)  : "0";
        var secondaryData5 = totalsS[key1]!== undefined ? totalsS[key1].toFixed(2)  : "0";



        var primaryData4 = totalsPK[key1]!== undefined ? totalsPK[key1].toFixed(2)  : "0";
        var FGData4 = totalsFGK[key1]!== undefined ? totalsFGK[key1].toFixed(2)  : "0";
        var secondaryData4 = totalsSK[key1]!== undefined ? totalsSK[key1].toFixed(2)  : "0";

        PrimTotalAllData = (parseFloat(primaryData5)+parseFloat(primaryData4));
        SecTotalAllData = (parseFloat(secondaryData5)+parseFloat(secondaryData4));
        FGTotalAllData = (parseFloat(FGData5)+parseFloat(FGData4));

        htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: right;"><b></b></td>`;
        htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: right;"><b></b></td>`;
        htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: right;"><b></b></td>`;
    }

    htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: left;"></td>`;
    htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: left;"></td>`;
    htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: left;"></td>`;
    htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: left;"></td>`;
    htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: left;"></td>`;
    htmlContent += `</tr>`

    htmlContent += `<tr>`;
    htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: center;"><b></b></td>`;
    htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: left;"><b>TOTAL STOCK ON HAND</b></td>`;
    htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: left;"></td>`;

    for (let m = 0; m <= array_data["cat_brand"].length-1; m++) {
        const data_brand = array_data["cat_brand"][m];
        const key1 = `${data_brand._id.brand}-${data_brand._id.category}`;
        var primaryData5 = totalsP[key1]!== undefined ? totalsP[key1].toFixed(2)  : "0";
        var FGData5 = totalsFG[key1]!== undefined ? totalsFG[key1].toFixed(2)  : "0";
        var secondaryData5 = totalsS[key1]!== undefined ? totalsS[key1].toFixed(2)  : "0";



        var primaryData4 = totalsPK[key1]!== undefined ? totalsPK[key1].toFixed(2)  : "0";
        var FGData4 = totalsFGK[key1]!== undefined ? totalsFGK[key1].toFixed(2)  : "0";
        var secondaryData4 = totalsSK[key1]!== undefined ? totalsSK[key1].toFixed(2)  : "0";

        PrimTotalAllData = (parseFloat(primaryData5)+parseFloat(primaryData4));
        SecTotalAllData = (parseFloat(secondaryData5)+parseFloat(secondaryData4));
        FGTotalAllData = (parseFloat(FGData5)+parseFloat(FGData4));

        htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: right;"><b></b></td>`;
        htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: right;"><b></b></td>`;
        htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: right;"><b></b></td>`;
    }

    htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: left;"></td>`;
    htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: left;"></td>`;
    htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: left;"></td>`;
    htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: left;"></td>`;
    htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: left;"></td>`;
    htmlContent += `</tr>`


    htmlContent += `<tr>`;
    htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: center;"><b></b></td>`;
    htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: left;"><b>SALES TODAY</b></td>`;
    htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: left;"></td>`;

    for (let m = 0; m <= array_data["cat_brand"].length-1; m++) {
        const data_brand = array_data["cat_brand"][m];
        const key1 = `${data_brand._id.brand}-${data_brand._id.category}`;
        var primaryData5 = totalsP[key1]!== undefined ? totalsP[key1].toFixed(2)  : "";
        var FGData5 = totalsFG[key1]!== undefined ? totalsFG[key1].toFixed(2)  : "";
        var secondaryData5 = totalsS[key1]!== undefined ? totalsS[key1].toFixed(2)  : "";



        var primaryData4 = totalsPK[key1]!== undefined ? totalsPK[key1].toFixed(2)  : "";
        var FGData4 = totalsFGK[key1]!== undefined ? totalsFGK[key1].toFixed(2)  : "";
        var secondaryData4 = totalsSK[key1]!== undefined ? totalsSK[key1].toFixed(2)  : "";

        PrimTotalAllData = formatNumber((parseFloat(primaryData5)+parseFloat(primaryData4)));
        SecTotalAllData = formatNumber((parseFloat(secondaryData5)+parseFloat(secondaryData4)));
        FGTotalAllData = formatNumber((parseFloat(FGData5)+parseFloat(FGData4)));

        htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: right;"><b>${primaryData5}</b></td>`;
        htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: right;"><b>${secondaryData5}</b></td>`;
        htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: right;"><b>${FGData5}</b></td>`;
    }

    htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: left;"></td>`;
    htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: left;"></td>`;
    htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: left;"></td>`;
    htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: left;"></td>`;
    htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: left;"></td>`;
    htmlContent += `</tr>`


    htmlContent += `<tr>`;
    htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: center;"><b></b></td>`;
    htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: left;"><b>ENDING INVENTORY</b></td>`;
    htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: left;"></td>`;

    for (let m = 0; m <= array_data["cat_brand"].length-1; m++) {
        const data_brand = array_data["cat_brand"][m];
        const key1 = `${data_brand._id.brand}-${data_brand._id.category}`;
        var primaryData5 = totalsP[key1]!== undefined ? totalsP[key1].toFixed(2)  : "0";
        var FGData5 = totalsFG[key1]!== undefined ? totalsFG[key1].toFixed(2)  : "0";
        var secondaryData5 = totalsS[key1]!== undefined ? totalsS[key1].toFixed(2)  : "0";



        var primaryData4 = totalsPK[key1]!== undefined ? totalsPK[key1].toFixed(2)  : "0";
        var FGData4 = totalsFGK[key1]!== undefined ? totalsFGK[key1].toFixed(2)  : "0";
        var secondaryData4 = totalsSK[key1]!== undefined ? totalsSK[key1].toFixed(2)  : "0";

        PrimTotalAllData = (parseFloat(primaryData5)+parseFloat(primaryData4));
        SecTotalAllData = (parseFloat(secondaryData5)+parseFloat(secondaryData4));
        FGTotalAllData = (parseFloat(FGData5)+parseFloat(FGData4));

        htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: right;"><b></b></td>`;
        htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: right;"><b></b></td>`;
        htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: right;"><b></b></td>`;
    }

    htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: left;"></td>`;
    htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: left;"></td>`;
    htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: left;"></td>`;
    htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: left;"></td>`;
    htmlContent += `<td class="row_data" style="border: 1px solid black; text-align: left;"></td>`;
    htmlContent += `</tr>`


    
    
    htmlContent += `</tbody>`;
    htmlContent += `</table>`;
    // htmlContent += `<div style="page-break-after:always;"></div>`;
});


return htmlContent;
}

async function generateReferenceNumber(date, staff_id) {
    const currentYear = new Date(date).getFullYear();
    const currentMonth = ('0' + (new Date(date).getMonth() + 1)).slice(-2); // Adds leading zero
    const prefix = `${currentYear}${currentMonth}`; // YYYYMM format
  
    // Find the last inserted reference number for the current year and month
    const lastRef = await Reference.findOne({ referenceNumber: new RegExp(`^${prefix}`) })
      .sort({ createdAt: -1 });
  
    let sequenceNumber = '0001'; // Default starting sequence for a new month
  
    // If there is a reference for the current month, increment the sequence number
    if (lastRef) {
      const lastSequence = lastRef.referenceNumber.slice(-4); // Get the last 4 digits (XXXX)
      sequenceNumber = ('0000' + (parseInt(lastSequence) + 1)).slice(-4); // Increment and pad with leading zeros
    }
  
    const newReferenceNumber = `${prefix}${sequenceNumber}`;
  
    // Save the new reference number in the database
    const newRef = new Reference({ referenceNumber: newReferenceNumber, staff_id: staff_id });
    await newRef.save();
  
    return newReferenceNumber;
  }
router.post('/dsrr/pdf', auth, async (req, res) => {

    const {from_date} = req.body
    const role_data = req.user
    const stff_data = await staff.findOne({ email: role_data.email })
    const image = await master_shop.find();
    const isExcel = "";
//     const datatest = await agentsdataDSICheck_DSRR(from_date, stff_data._id.valueOf(), isExcel);
//     let htmlContent = `
//     <style>
//         table {
//             border-collapse: collapse;
//             width: 100%; /* Ensure table uses the full width */
//         }
//         th, td {
//             border: 1px solid black;
//             text-align: center;
//         }
//         th {
//             background-color: #d0cece;
//             padding: 8px;
//             color: black;
//         }
//         @media print {
//            table { page-break-inside: auto; }
//             tr { page-break-inside: avoid; page-break-after: auto; }
//             th { page-break-inside: avoid; page-break-after: auto; }
//         }

//         @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
//         body {
//             font-family: 'Roboto', sans-serif;
//             font-size: 12pt;
//         }

//         @media (max-width: 1024px) {
//             table {
//                 display: block;
//                 overflow-x: auto;
//             }
//         }

        
            
//     </style>
// `;

    
    var from_string_date = new Date(from_date);

    const options3 = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    const from_formattedDate = new Intl.DateTimeFormat('en-US', options3).format(from_string_date);
    // const to_formattedDate = new Intl.DateTimeFormat('en-US', options3).format(to_string_date);
    // htmlContent += `<div class="row">`;
    // htmlContent += `<div  id="table-conatainer">`;
    // htmlContent += `<table>`;
    // htmlContent += datatest;
    // htmlContent += `</table>`;
    // htmlContent += `</div>`;
    // htmlContent += `</div>`;

    // let dataImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxYxAAACD0S0HV4xFoAAAAAElFTkSuQmCC';
    // const options = {
    //     width: '15in',  // Set custom width (e.g., 11 inches)
    //     height: '8.5in',
    //     orientation: 'landscape', // Landscape mode
    //     border: {
    //         top: "0.1in",
    //         right: "0.1in",
    //         bottom: "0.1in",
    //         left: "0.1in"
    //     },
    //     header: {
    //         height: "60mm", // Adjust header height
    //         contents: `
    //         <div style="text-align: center;">
    //             <img src="${dataImage}" style="max-width: 100%; height: auto;" />
    //             <h1>JAKA EQUITIES CORP</h1>
    //             <p>SALES REPORTS - EXTRUCK</p>
    //             <p>${from_formattedDate}</p>
    //             <br><br><br><br><br><br><br><br><br><br>
    //         </div>
    //     `
    //     },
    //     footer: {
    //         height: "20mm", // Adjust footer height
    //         contents: {
    //             default: '<span style="color: #444;">{{page}}</span>/<span>{{pages}}</span>' // Page number
    //         }
    //     },
    //     dpi: 5,  // Set DPI for consistency
    //     zoomFactor: '1' // Ensure the same zoom level
    // };
    const checkingFile = await Reference.find({staff_id: stff_data._id.valueOf(), date_include: from_date});
    // console.log(checkingFile[0].html)
    // return
    if(checkingFile.length > 0){
        let htmldta = ``;
        htmldta += checkingFile[0].html;
       
        const $ = cheerio.load(htmldta);
 
        let data = [];
        let merges = [];
        let colSpans = []; // To track active column spans
        
        // Helper function to extract border styles from a cell's inline styles
        const getBorderStyle = (style) => {
            const borderStyle = {
                top: { style: 'thick', color: { rgb: '000000' } },
                bottom: { style: 'thick', color: { rgb: '000000' } },
                left: { style: 'thick', color: { rgb: '000000' } },
                right: { style: 'thick', color: { rgb: '000000' } }
            };
        
            // Extract border values from the inline style attribute if available
            if (style) {
                const styleObj = style.split(';').reduce((acc, rule) => {
                    const [property, value] = rule.split(':').map(str => str.trim());
                    acc[property] = value;
                    return acc;
                }, {});
        
                // Extract individual border styles (top, bottom, left, right)
                if (styleObj['border-top']) {
                    borderStyle.top.style = styleObj['border-top'].includes('thin') ? 'thin' : 'medium';
                }
                if (styleObj['border-bottom']) {
                    borderStyle.bottom.style = styleObj['border-bottom'].includes('thin') ? 'thin' : 'medium';
                }
                if (styleObj['border-left']) {
                    borderStyle.left.style = styleObj['border-left'].includes('thin') ? 'thin' : 'medium';
                }
                if (styleObj['border-right']) {
                    borderStyle.right.style = styleObj['border-right'].includes('thin') ? 'thin' : 'medium';
                }
            }
        
            return borderStyle;
        };
        
        $('table tr').each((i, row) => {
            let rowData = [];
            let colIndex = 0;
        
            // Adjust colIndex for any ongoing colspans from previous rows
            while (colSpans[colIndex]) {
                colSpans[colIndex]--;
                colIndex++;
            }
        
            $(row).find('td, th').each((j, cell) => {
                let cellText = $(cell).text().trim();
        
                // Attempt to convert cell text to a number if possible
                let cellValue = parseFloat(cellText.replace(/,/g, ''));
        
                // Use the cell text if it's not a valid number
                if (isNaN(cellValue)) {
                    cellValue = cellText;
                }
        
                // Parse colspan and rowspan
                let colspan = parseInt($(cell).attr('colspan')) || 1;
                let rowspan = parseInt($(cell).attr('rowspan')) || 1;
        
                // Get border style from inline style attribute in HTML
                const styleAttr = $(cell).attr('style');
                const borderStyle = getBorderStyle(styleAttr); // Extract border style from HTML
        
                // Add the cell value to the rowData array at the correct column index
                rowData[colIndex] = {
                    v: cellValue,
                    s: { border: borderStyle } // Apply the extracted border style
                };
        
                // Add merge information if colspan or rowspan is greater than 1
                if (colspan > 1 || rowspan > 1) {
                    merges.push({
                        s: { r: i, c: colIndex }, // start position
                        e: { r: i + rowspan - 1, c: colIndex + colspan - 1 } // end position
                    });
                }
        
                // Track colspans across rows (for correct placement in the next row)
                for (let k = 0; k < colspan; k++) {
                    if (rowspan > 1) {
                        colSpans[colIndex + k] = rowspan - 1; // Track how many rows this colspan affects
                    }
                }
        
                // Move to the next column index, considering colspan
                colIndex += colspan;
            });
        
            data.push(rowData);
        });
        
        // Create the worksheet and add merge information
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(data);
        
        // Apply merges to the worksheet
        if (merges.length > 0) {
            ws['!merges'] = merges;
        }
        
        // Optionally, set column widths or other formatting
        ws['!cols'] = data[0].map(() => ({ wpx: 100 })); // Set a fixed width of 100 pixels for all columns
        
        // Append the worksheet to the workbook
        XLSX.utils.book_append_sheet(wb, ws, "Sales Report");
        
        // Write the workbook to a buffer
        const fileBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
        
        // Send the file to the client as a download (if using Express.js)
        res.setHeader('Content-Disposition', 'attachment; filename="sales_report.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(fileBuffer);
    }else{
        generateReferenceNumber(from_date, stff_data._id.valueOf()).then( async (element) => {
            

            const datatest = await agentsdataDSICheck_DSRR(from_date, stff_data._id.valueOf(), isExcel, element);
            let htmlContent = `
            <style>
                table {
                    border-collapse: collapse;
                    width: 100%; /* Ensure table uses the full width */
                }
                th, td {
                    border: 1px solid black;
                    text-align: center;
                }
                th {
                    background-color: #d0cece;
                    padding: 8px;
                    color: black;
                }
                @media print {
                   table { page-break-inside: auto; }
                    tr { page-break-inside: avoid; page-break-after: auto; }
                    th { page-break-inside: avoid; page-break-after: auto; }
                }
        
                @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
                body {
                    font-family: 'Roboto', sans-serif;
                    font-size: 12pt;
                }
        
                @media (max-width: 1024px) {
                    table {
                        display: block;
                        overflow-x: auto;
                    }
                }
        
                
                    
            </style>
            `;

            htmlContent += `<div class="row">`;
            htmlContent += `<div  id="table-conatainer">`;
            htmlContent += `<table>`;
            htmlContent += datatest;
            htmlContent += `</table>`;
            htmlContent += `</div>`;
            htmlContent += `</div>`;

            const thecreatedFile = await Reference.findOne({staff_id: stff_data._id.valueOf(), referenceNumber: element});
            thecreatedFile.html = htmlContent;
            thecreatedFile.date_include = from_date
            await thecreatedFile.save();


            const $ = cheerio.load(htmlContent);
 
            let data = [];
            let merges = [];
            let colSpans = []; // To track active column spans
            
            // Helper function to extract border styles from a cell's inline styles
            const getBorderStyle = (style) => {
                const borderStyle = {
                    top: { style: 'thick', color: { rgb: '000000' } },
                    bottom: { style: 'thick', color: { rgb: '000000' } },
                    left: { style: 'thick', color: { rgb: '000000' } },
                    right: { style: 'thick', color: { rgb: '000000' } }
                };
            
                // Extract border values from the inline style attribute if available
                if (style) {
                    const styleObj = style.split(';').reduce((acc, rule) => {
                        const [property, value] = rule.split(':').map(str => str.trim());
                        acc[property] = value;
                        return acc;
                    }, {});
            
                    // Extract individual border styles (top, bottom, left, right)
                    if (styleObj['border-top']) {
                        borderStyle.top.style = styleObj['border-top'].includes('thin') ? 'thin' : 'medium';
                    }
                    if (styleObj['border-bottom']) {
                        borderStyle.bottom.style = styleObj['border-bottom'].includes('thin') ? 'thin' : 'medium';
                    }
                    if (styleObj['border-left']) {
                        borderStyle.left.style = styleObj['border-left'].includes('thin') ? 'thin' : 'medium';
                    }
                    if (styleObj['border-right']) {
                        borderStyle.right.style = styleObj['border-right'].includes('thin') ? 'thin' : 'medium';
                    }
                }
            
                return borderStyle;
            };
            
            $('table tr').each((i, row) => {
                let rowData = [];
                let colIndex = 0;
            
                // Adjust colIndex for any ongoing colspans from previous rows
                while (colSpans[colIndex]) {
                    colSpans[colIndex]--;
                    colIndex++;
                }
            
                $(row).find('td, th').each((j, cell) => {
                    let cellText = $(cell).text().trim();
            
                    // Attempt to convert cell text to a number if possible
                    let cellValue = parseFloat(cellText.replace(/,/g, ''));
            
                    // Use the cell text if it's not a valid number
                    if (isNaN(cellValue)) {
                        cellValue = cellText;
                    }
            
                    // Parse colspan and rowspan
                    let colspan = parseInt($(cell).attr('colspan')) || 1;
                    let rowspan = parseInt($(cell).attr('rowspan')) || 1;
            
                    // Get border style from inline style attribute in HTML
                    const styleAttr = $(cell).attr('style');
                    const borderStyle = getBorderStyle(styleAttr); // Extract border style from HTML
            
                    // Add the cell value to the rowData array at the correct column index
                    rowData[colIndex] = {
                        v: cellValue,
                        s: { border: borderStyle } // Apply the extracted border style
                    };
            
                    // Add merge information if colspan or rowspan is greater than 1
                    if (colspan > 1 || rowspan > 1) {
                        merges.push({
                            s: { r: i, c: colIndex }, // start position
                            e: { r: i + rowspan - 1, c: colIndex + colspan - 1 } // end position
                        });
                    }
            
                    // Track colspans across rows (for correct placement in the next row)
                    for (let k = 0; k < colspan; k++) {
                        if (rowspan > 1) {
                            colSpans[colIndex + k] = rowspan - 1; // Track how many rows this colspan affects
                        }
                    }
            
                    // Move to the next column index, considering colspan
                    colIndex += colspan;
                });
            
                data.push(rowData);
            });
            
            // Create the worksheet and add merge information
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(data);
            
            // Apply merges to the worksheet
            if (merges.length > 0) {
                ws['!merges'] = merges;
            }
            
            // Optionally, set column widths or other formatting
            ws['!cols'] = data[0].map(() => ({ wpx: 100 })); // Set a fixed width of 100 pixels for all columns
            
            // Append the worksheet to the workbook
            XLSX.utils.book_append_sheet(wb, ws, "Sales Report");
            
            // Write the workbook to a buffer
            const fileBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
            
            // Send the file to the client as a download (if using Express.js)
            res.setHeader('Content-Disposition', 'attachment; filename="sales_report.xlsx"');
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.send(fileBuffer);
        
            // console.log(thecreatedFile)
        }).catch(console.error);
    }
    
   

    // console.log()
    // res.send(htmlContent);
    // return
//    var isExcel = "on";
//     if(isExcel == "on"){
//         // const $ = cheerio.load(htmlContent);

//         // let data = [];
//         // $('table tr').each((i, row) => {
//         //     let rowData = [];
//         //     $(row).find('td, th').each((j, cell) => {
//         //         // rowData.push($(cell).text().trim());
//         //         let cellText = $(cell).text().trim();
//         //         let cellValue = parseFloat(cellText.replace(/,/g, ''));

//         //         if (!isNaN(cellValue)) {
//         //             rowData.push(cellValue);
//         //         } else {
//         //             rowData.push(cellText);
//         //         }
//         //     });
//         //     data.push(rowData);
//         // });

//         // const wb = XLSX.utils.book_new();
//         // const ws = XLSX.utils.aoa_to_sheet(data);
//         // XLSX.utils.book_append_sheet(wb, ws, "Sales Report");

//         // // Write the workbook to a buffer
//         // const fileBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

//         // // Send the file to the client as a download
//         // res.setHeader('Content-Disposition', 'attachment; filename="sales_report.xlsx"');
//         // res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
//         // res.send(fileBuffer);
//        ///////////END ORIGINAL/////////////////////
//         // const $ = cheerio.load(htmlContent);
//         // let data = [];
//         // let merges = [];

//         // $('table tr').each((i, row) => {
//         //     let rowData = [];
//         //     let rowIndex = i;
//         //     let colIndex = 0;

//         //     $(row).find('td, th').each((j, cell) => {
//         //         let cellText = $(cell).text().trim();
//         //         let cellValue = parseFloat(cellText.replace(/,/g, ''));

//         //         // Parse colspan and rowspan
//         //         let colspan = parseInt($(cell).attr('colspan')) || 1;
//         //         let rowspan = parseInt($(cell).attr('rowspan')) || 1;

//         //         // Add the cell value
//         //         if (!isNaN(cellValue)) {
//         //             rowData[colIndex] = cellValue;
//         //         } else {
//         //             rowData[colIndex] = cellText;
//         //         }

//         //         // Add merge information if colspan or rowspan is greater than 1
//         //         if (colspan > 1 || rowspan > 1) {
//         //             merges.push({
//         //                 s: { r: rowIndex, c: colIndex }, // start position
//         //                 e: { r: rowIndex + rowspan - 1, c: colIndex + colspan - 1 } // end position
//         //             });
//         //         }

//         //         // Move to the next column index considering colspan
//         //         colIndex += colspan;
//         //     });

//         //     data.push(rowData);
//         // });

//         // // Create the worksheet and add merge information
//         // const wb = XLSX.utils.book_new();
//         // const ws = XLSX.utils.aoa_to_sheet(data);

//         // // Apply merges to the worksheet
//         // ws['!merges'] = merges;

//         // XLSX.utils.book_append_sheet(wb, ws, "Sales Report");

//         // // Write the workbook to a buffer
//         // const fileBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

//         // // Send the file to the client as a download
//         // res.setHeader('Content-Disposition', 'attachment; filename="sales_report.xlsx"');
//         // res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
//         // res.send(fileBuffer);


//         // const $ = cheerio.load(htmlContent);

//         // let data = [];
//         // let merges = [];
//         // let colSpans = []; // To track active column spans

//         // $('table tr').each((i, row) => {
//         //     let rowData = [];
//         //     let colIndex = 0;

//         //     // Adjust colIndex for any ongoing colspans from previous rows
//         //     while (colSpans[colIndex]) {
//         //         colSpans[colIndex]--;
//         //         colIndex++;
//         //     }

//         //     $(row).find('td, th').each((j, cell) => {
//         //         let cellText = $(cell).text().trim();

//         //         // Attempt to convert cell text to a number if possible
//         //         let cellValue = parseFloat(cellText.replace(/,/g, ''));

//         //         // Use the cell text if it's not a valid number
//         //         if (isNaN(cellValue)) {
//         //             cellValue = cellText;
//         //         }

//         //         // Parse colspan and rowspan
//         //         let colspan = parseInt($(cell).attr('colspan')) || 1;
//         //         let rowspan = parseInt($(cell).attr('rowspan')) || 1;

//         //         // Add the cell value to the rowData array at the correct column index
//         //         rowData[colIndex] = cellValue;

//         //         // Add merge information if colspan or rowspan is greater than 1
//         //         if (colspan > 1 || rowspan > 1) {
//         //             merges.push({
//         //                 s: { r: i, c: colIndex }, // start position
//         //                 e: { r: i + rowspan - 1, c: colIndex + colspan - 1 } // end position
//         //             });
//         //         }

//         //         // Track colspans across rows (for correct placement in the next row)
//         //         for (let k = 0; k < colspan; k++) {
//         //             if (rowspan > 1) {
//         //                 colSpans[colIndex + k] = rowspan - 1; // Track how many rows this colspan affects
//         //             }
//         //         }

//         //         // Move to the next column index, considering colspan
//         //         colIndex += colspan;
//         //     });

//         //     data.push(rowData);
//         // });

//         // // Create the worksheet and add merge information
//         // const wb = XLSX.utils.book_new();
//         // const ws = XLSX.utils.aoa_to_sheet(data);

//         // // Apply merges to the worksheet
//         // if (merges.length > 0) {
//         //     ws['!merges'] = merges;
//         // }

//         // // Optionally, set column widths or other formatting
//         // ws['!cols'] = data[0].map(() => ({ wpx: 100 })); // Set a fixed width of 100 pixels for all columns

//         // // Append the worksheet to the workbook
//         // XLSX.utils.book_append_sheet(wb, ws, "Sales Report");

//         // // Write the workbook to a buffer
//         // const fileBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

//         // // Send the file to the client as a download (if using Express.js)
//         // res.setHeader('Content-Disposition', 'attachment; filename="sales_report.xlsx"');
//         // res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
//         // res.send(fileBuffer);


// //         const $ = cheerio.load(htmlContent);

// // let data = [];
// // let merges = [];
// // let colSpans = []; // To track active column spans

// // // Helper function to extract border styles from a cell's inline styles
// // const getBorderStyle = (style) => {
// //     const borderStyle = {
// //         top: { style: 'thick', color: { rgb: '000000' } },
// //         bottom: { style: 'thick', color: { rgb: '000000' } },
// //         left: { style: 'thick', color: { rgb: '000000' } },
// //         right: { style: 'thick', color: { rgb: '000000' } }
// //     };

// //     // Extract border values from the inline style attribute if available
// //     if (style) {
// //         const styleObj = style.split(';').reduce((acc, rule) => {
// //             const [property, value] = rule.split(':').map(str => str.trim());
// //             acc[property] = value;
// //             return acc;
// //         }, {});

// //         // Extract individual border styles (top, bottom, left, right)
// //         if (styleObj['border-top']) {
// //             borderStyle.top.style = styleObj['border-top'].includes('thin') ? 'thin' : 'medium';
// //         }
// //         if (styleObj['border-bottom']) {
// //             borderStyle.bottom.style = styleObj['border-bottom'].includes('thin') ? 'thin' : 'medium';
// //         }
// //         if (styleObj['border-left']) {
// //             borderStyle.left.style = styleObj['border-left'].includes('thin') ? 'thin' : 'medium';
// //         }
// //         if (styleObj['border-right']) {
// //             borderStyle.right.style = styleObj['border-right'].includes('thin') ? 'thin' : 'medium';
// //         }
// //     }

// //     return borderStyle;
// // };

// // $('table tr').each((i, row) => {
// //     let rowData = [];
// //     let colIndex = 0;

// //     // Adjust colIndex for any ongoing colspans from previous rows
// //     while (colSpans[colIndex]) {
// //         colSpans[colIndex]--;
// //         colIndex++;
// //     }

// //     $(row).find('td, th').each((j, cell) => {
// //         let cellText = $(cell).text().trim();

// //         // Attempt to convert cell text to a number if possible
// //         let cellValue = parseFloat(cellText.replace(/,/g, ''));

// //         // Use the cell text if it's not a valid number
// //         if (isNaN(cellValue)) {
// //             cellValue = cellText;
// //         }

// //         // Parse colspan and rowspan
// //         let colspan = parseInt($(cell).attr('colspan')) || 1;
// //         let rowspan = parseInt($(cell).attr('rowspan')) || 1;

// //         // Get border style from inline style attribute in HTML
// //         const styleAttr = $(cell).attr('style');
// //         const borderStyle = getBorderStyle(styleAttr); // Extract border style from HTML

// //         // Add the cell value to the rowData array at the correct column index
// //         rowData[colIndex] = {
// //             v: cellValue,
// //             s: { border: borderStyle } // Apply the extracted border style
// //         };

// //         // Add merge information if colspan or rowspan is greater than 1
// //         if (colspan > 1 || rowspan > 1) {
// //             merges.push({
// //                 s: { r: i, c: colIndex }, // start position
// //                 e: { r: i + rowspan - 1, c: colIndex + colspan - 1 } // end position
// //             });
// //         }

// //         // Track colspans across rows (for correct placement in the next row)
// //         for (let k = 0; k < colspan; k++) {
// //             if (rowspan > 1) {
// //                 colSpans[colIndex + k] = rowspan - 1; // Track how many rows this colspan affects
// //             }
// //         }

// //         // Move to the next column index, considering colspan
// //         colIndex += colspan;
// //     });

// //     data.push(rowData);
// // });

// // // Create the worksheet and add merge information
// // const wb = XLSX.utils.book_new();
// // const ws = XLSX.utils.aoa_to_sheet(data);

// // // Apply merges to the worksheet
// // if (merges.length > 0) {
// //     ws['!merges'] = merges;
// // }

// // // Optionally, set column widths or other formatting
// // ws['!cols'] = data[0].map(() => ({ wpx: 100 })); // Set a fixed width of 100 pixels for all columns

// // // Append the worksheet to the workbook
// // XLSX.utils.book_append_sheet(wb, ws, "Sales Report");

// // // Write the workbook to a buffer
// // const fileBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

// // // Send the file to the client as a download (if using Express.js)
// // res.setHeader('Content-Disposition', 'attachment; filename="sales_report.xlsx"');
// // res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
// // res.send(fileBuffer);


//     }else{
//         pdf.create(htmlContent, options).toStream(function(err, stream) {
//             if (err) {
//                 res.status(500).send('Error generating PDF');
//                 return;
//             }
//             res.setHeader('Content-Type', 'application/pdf');
//             stream.pipe(res);
//         });
//     }
    
    
});



router.get("/dsrr_admin/view", auth, async (req, res) => {
    try {
        const {username, email, role} = req.user
        const role_data = req.user
        
        const profile_data = await profile.findOne({email : role_data.email})
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const master = await master_shop.find()
        console.log("Products master" , master);

        const find_data = await product.find();
        console.log("Products find_data", find_data);


        const warehouse_data = await warehouse.aggregate([
            {
                $unwind: "$product_details"
            },
            {
                $lookup:
                {
                    from: "products",
                    localField: "product_details.product_name",
                    foreignField: "name",
                    as: "product_docs"
                }
            },
            {
                $unwind: "$product_docs"
            },
            {
                $project: 
                {
                    product_name: '$product_details.product_name',
                    product_stock: '$product_details.product_stock',
                }
            },
            {
                $group: {
                    _id: "$product_name",
                    product_stock: { $sum: "$product_stock" }
                }
            },
        ])
        console.log("Products warehouse_data", warehouse_data);


        warehouse_data.forEach(product_details => {

            const match_data = find_data.map((data) => {

                if (data.name == product_details._id) {
                    data.stock = parseInt(data.stock) + parseInt(product_details.product_stock)
                    
                }

            })
        })
        const all_stff = await staff.find({ account_category: "sa", type_of_acc_cat : "1" });
        const staff_data = await staff.findOne({email: role_data.email})

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

        res.render("dssr_view_admin", { 
            success: req.flash('success'),
            errors: req.flash('errors'),
            alldata: find_data,
            profile : profile_data,
            master_shop : master,
            role : role_data,
            product_stock : warehouse_data,
            language : lan_data,
            staff_arr: staff_data,
			staff_data_all: all_stff
        })
    } catch (error) {
        
    }
})


router.post("/getDSSR_no", auth, async (req, res) => {
    try {
        const { from, to, staff_data } = req.body
        const thedataFilter =  await Reference.aggregate([
            {
                $match:{
                    date_include: {
                        $gte: from,
                        $lte: to
                    },
                    staff_id: staff_data
                }
            },
            {
                $sort :{
                    "date_include": 1,
                }
            }
        ])
        
        res.json(thedataFilter)
    } catch (error) {
        res.json(error)
    }
})


router.get("/dsrr_admin/view_data/:id", auth, async (req, res) => {
    try {
        const _id = req.params.id;
        const thedataFilter =  await Reference.findById(_id);
        res.send(thedataFilter.html);
        // res.json(thedataFilter.html)
    } catch (error) {
        res.json(error)
    }
})


router.post("/dl_excel", auth, async (req, res) => {
    try {
        const { ref_data } = req.body;
        const array_data = ref_data.split("~");
        
        
        const cleanedArray = array_data.filter(item => item !== "");
        // console.log(cleanedArray)
        const dataref = await Reference.aggregate([
            {
                $match: {
                    referenceNumber: { 
                        $in: cleanedArray
                    }
                }
            }
        ]);

        const wb = XLSX.utils.book_new();
        dataref.forEach(ref => {
            // Load HTML content and process it
            const $ = cheerio.load(ref.html);

            let data = [];
            let merges = [];
            let colSpans = []; // To track active column spans

            $('table tr').each((i, row) => {
                let rowData = [];
                let colIndex = 0;

                // Adjust colIndex for any ongoing colspans from previous rows
                while (colSpans[colIndex]) {
                    colSpans[colIndex]--;
                    colIndex++;
                }

                $(row).find('td, th').each((j, cell) => {
                    let cellText = $(cell).text().trim();

                    // Attempt to convert cell text to a number if possible
                    let cellValue = parseFloat(cellText.replace(/,/g, ''));

                    // Use the cell text if it's not a valid number
                    if (isNaN(cellValue)) {
                        cellValue = cellText;
                    }

                    // Parse colspan and rowspan
                    let colspan = parseInt($(cell).attr('colspan')) || 1;
                    let rowspan = parseInt($(cell).attr('rowspan')) || 1;

                    // Add the cell value to the rowData array at the correct column index
                    rowData[colIndex] = cellValue;

                    // Add merge information if colspan or rowspan is greater than 1
                    if (colspan > 1 || rowspan > 1) {
                        merges.push({
                            s: { r: i, c: colIndex }, // start position
                            e: { r: i + rowspan - 1, c: colIndex + colspan - 1 } // end position
                        });
                    }

                    // Track colspans across rows (for correct placement in the next row)
                    for (let k = 0; k < colspan; k++) {
                        if (rowspan > 1) {
                            colSpans[colIndex + k] = rowspan - 1; // Track how many rows this colspan affects
                        }
                    }

                    // Move to the next column index, considering colspan
                    colIndex += colspan;
                });

                data.push(rowData);
            });

            // Create a worksheet from the processed data
            const ws = XLSX.utils.aoa_to_sheet(data);

            // Apply merges to the worksheet
            if (merges.length > 0) {
                ws['!merges'] = merges;
            }

            // Optionally, set column widths or other formatting
            ws['!cols'] = data[0].map(() => ({ wpx: 100 })); // Set a fixed width of 100 pixels for all columns

            // Append the worksheet to the workbook with the referenceNumber as sheet name
            XLSX.utils.book_append_sheet(wb, ws, ref.referenceNumber);
        });

        // Write the workbook to a buffer
        const fileBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

        // Send the file to the client as a download
        res.setHeader('Content-Disposition', 'attachment; filename="reports.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(fileBuffer);
    } catch (error) {
        res.json(error)
    }
})

router.post('/dsrr_admin/pdf_admin', auth, async (req, res) => {

    const {from_date, agent_id} = req.body
    // res.json(req.body);
    // return;
    const role_data = req.user
    const stff_data = await staff.findOne({ email: role_data.email })
    const image = await master_shop.find();
    const datatest = await agentsdataDSICheck_DSRR(from_date, agent_id, isExcel);
    let htmlContent = `
    <style>
        table {
            border-collapse: collapse;
            width: 100%; /* Ensure table uses the full width */
        }
        th, td {
            border: 1px solid black;
            text-align: center;
        }
        th {
            background-color: #d0cece;
            padding: 8px;
            color: black;
        }
        @media print {
           table { page-break-inside: auto; }
            tr { page-break-inside: avoid; page-break-after: auto; }
            th { page-break-inside: avoid; page-break-after: auto; }
        }

        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
        body {
            font-family: 'Roboto', sans-serif;
            font-size: 12pt;
        }

        @media (max-width: 1024px) {
            table {
                display: block;
                overflow-x: auto;
            }
        }

        
            
    </style>
`;

    
    var from_string_date = new Date(from_date);
    // var to_string_date = new Date(to_date);

    const options3 = { 
        // weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
    const from_formattedDate = new Intl.DateTimeFormat('en-US', options3).format(from_string_date);
    // const to_formattedDate = new Intl.DateTimeFormat('en-US', options3).format(to_string_date);
      
    htmlContent += `<div class="row">`;
    htmlContent += `<div  id="table-conatainer">`;
    htmlContent += `<table>`;
    htmlContent += datatest;
    htmlContent += `</table>`;
    htmlContent += `</div>`;
    htmlContent += `</div>`;

    let dataImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxYxAAACD0S0HV4xFoAAAAAElFTkSuQmCC';
    const options = {
        width: '15in',  // Set custom width (e.g., 11 inches)
        height: '8.5in',
        orientation: 'landscape', // Landscape mode
        border: {
            top: "0.1in",
            right: "0.1in",
            bottom: "0.1in",
            left: "0.1in"
        },
        header: {
            height: "60mm", // Adjust header height
            contents: `
            <div style="text-align: center;">
                <img src="${dataImage}" style="max-width: 100%; height: auto;" />
                <h1>JAKA EQUITIES CORP</h1>
                <p>SALES REPORTS - EXTRUCK</p>
                <p>${from_formattedDate}</p>
                <br><br><br><br><br><br><br><br><br><br>
            </div>
        `
        },
        footer: {
            height: "20mm", // Adjust footer height
            contents: {
                default: '<span style="color: #444;">{{page}}</span>/<span>{{pages}}</span>' // Page number
            }
        },
        dpi: 5,  // Set DPI for consistency
        zoomFactor: '1' // Ensure the same zoom level
    };
    // res.send(htmlContent);
    // return
   var isExcel = "on";
    if(isExcel == "on"){
        // const $ = cheerio.load(htmlContent);

        // let data = [];
        // $('table tr').each((i, row) => {
        //     let rowData = [];
        //     $(row).find('td, th').each((j, cell) => {
        //         // rowData.push($(cell).text().trim());
        //         let cellText = $(cell).text().trim();
        //         let cellValue = parseFloat(cellText.replace(/,/g, ''));

        //         if (!isNaN(cellValue)) {
        //             rowData.push(cellValue);
        //         } else {
        //             rowData.push(cellText);
        //         }
        //     });
        //     data.push(rowData);
        // });

        // const wb = XLSX.utils.book_new();
        // const ws = XLSX.utils.aoa_to_sheet(data);
        // XLSX.utils.book_append_sheet(wb, ws, "Sales Report");

        // // Write the workbook to a buffer
        // const fileBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

        // // Send the file to the client as a download
        // res.setHeader('Content-Disposition', 'attachment; filename="sales_report.xlsx"');
        // res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        // res.send(fileBuffer);
       ///////////END ORIGINAL/////////////////////
        // const $ = cheerio.load(htmlContent);
        // let data = [];
        // let merges = [];

        // $('table tr').each((i, row) => {
        //     let rowData = [];
        //     let rowIndex = i;
        //     let colIndex = 0;

        //     $(row).find('td, th').each((j, cell) => {
        //         let cellText = $(cell).text().trim();
        //         let cellValue = parseFloat(cellText.replace(/,/g, ''));

        //         // Parse colspan and rowspan
        //         let colspan = parseInt($(cell).attr('colspan')) || 1;
        //         let rowspan = parseInt($(cell).attr('rowspan')) || 1;

        //         // Add the cell value
        //         if (!isNaN(cellValue)) {
        //             rowData[colIndex] = cellValue;
        //         } else {
        //             rowData[colIndex] = cellText;
        //         }

        //         // Add merge information if colspan or rowspan is greater than 1
        //         if (colspan > 1 || rowspan > 1) {
        //             merges.push({
        //                 s: { r: rowIndex, c: colIndex }, // start position
        //                 e: { r: rowIndex + rowspan - 1, c: colIndex + colspan - 1 } // end position
        //             });
        //         }

        //         // Move to the next column index considering colspan
        //         colIndex += colspan;
        //     });

        //     data.push(rowData);
        // });

        // // Create the worksheet and add merge information
        // const wb = XLSX.utils.book_new();
        // const ws = XLSX.utils.aoa_to_sheet(data);

        // // Apply merges to the worksheet
        // ws['!merges'] = merges;

        // XLSX.utils.book_append_sheet(wb, ws, "Sales Report");

        // // Write the workbook to a buffer
        // const fileBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

        // // Send the file to the client as a download
        // res.setHeader('Content-Disposition', 'attachment; filename="sales_report.xlsx"');
        // res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        // res.send(fileBuffer);


        const $ = cheerio.load(htmlContent);

        let data = [];
        let merges = [];
        let colSpans = []; // To track active column spans

        $('table tr').each((i, row) => {
            let rowData = [];
            let colIndex = 0;

            // Adjust colIndex for any ongoing colspans from previous rows
            while (colSpans[colIndex]) {
                colSpans[colIndex]--;
                colIndex++;
            }

            $(row).find('td, th').each((j, cell) => {
                let cellText = $(cell).text().trim();

                // Attempt to convert cell text to a number if possible
                let cellValue = parseFloat(cellText.replace(/,/g, ''));

                // Use the cell text if it's not a valid number
                if (isNaN(cellValue)) {
                    cellValue = cellText;
                }

                // Parse colspan and rowspan
                let colspan = parseInt($(cell).attr('colspan')) || 1;
                let rowspan = parseInt($(cell).attr('rowspan')) || 1;

                // Add the cell value to the rowData array at the correct column index
                rowData[colIndex] = cellValue;

                // Add merge information if colspan or rowspan is greater than 1
                if (colspan > 1 || rowspan > 1) {
                    merges.push({
                        s: { r: i, c: colIndex }, // start position
                        e: { r: i + rowspan - 1, c: colIndex + colspan - 1 } // end position
                    });
                }

                // Track colspans across rows (for correct placement in the next row)
                for (let k = 0; k < colspan; k++) {
                    if (rowspan > 1) {
                        colSpans[colIndex + k] = rowspan - 1; // Track how many rows this colspan affects
                    }
                }

                // Move to the next column index, considering colspan
                colIndex += colspan;
            });

            data.push(rowData);
        });

        // Create the worksheet and add merge information
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(data);

        // Apply merges to the worksheet
        if (merges.length > 0) {
            ws['!merges'] = merges;
        }

        // Optionally, set column widths or other formatting
        ws['!cols'] = data[0].map(() => ({ wpx: 100 })); // Set a fixed width of 100 pixels for all columns

        // Append the worksheet to the workbook
        XLSX.utils.book_append_sheet(wb, ws, "Sales Report");

        // Write the workbook to a buffer
        const fileBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

        // Send the file to the client as a download (if using Express.js)
        res.setHeader('Content-Disposition', 'attachment; filename="sales_report.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(fileBuffer);

    }else{
        pdf.create(htmlContent, options).toStream(function(err, stream) {
            if (err) {
                res.status(500).send('Error generating PDF');
                return;
            }
            res.setHeader('Content-Type', 'application/pdf');
            stream.pipe(res);
        });
    }
    
    
});


module.exports = router;