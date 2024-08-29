const express = require("express");
const res = require("express/lib/response");
const app = express();
const router = express.Router();
const multer = require('multer');
const { profile, master_shop, categories, brands, units, product, purchases, warehouse, sales_finished, sales, transfers_finished, adjustment_finished, purchases_finished, sales_return_finished, adjustment, transfers, sales_sa, staff, sales_inv_data } = require("../models/all_models");
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

                            xtotalqty += parseInt(x_data.totalQTY,10);
                            
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
                totalQTY: { $sum: "$sale_product.quantity"},
                products:{
                    $push:{
                        qty: "$sale_product.quantity",
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
                htmlContent += `<td class="row_data">${totalData}</td>`;
            }else{
                totalData = 0;
                htmlContent += `<td class="row_data">${totalData}</td>`;
            }
            totalQTY += totalData;
        }

        htmlContent += `<td class="row_data">${totalQTY}</td>`;
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


    // const sales_sa_data =  await sales_sa.aggregate([
    //     {
    //         $match:{
    //             date: {
    //                 $gte: from,
    //                 $lte: to
    //             }
    //         }
    //     },
    //     {
    //         $unwind: "$sale_product"
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
    //             _id:{
    //                 dsi: "$dsi",
    //                 date: "$date",
    //                 customer: "$customer"
    //             },
    //             totalQty: { $sum: "$sale_product.quantity" }, 
    //             products:{
    //                 $push:{
    //                     qty: "$sale_product.quantity",
    //                     product_details: {
    //                         prod_name: "$product_info.name",
    //                         product_code: "$product_info.product_code",
    //                         category: "$product_info.category",
    //                         brand: "$product_info.brand",
    //                     }
    //                 }
    //             }
    //         }
    //     }
    // ])
   
    const sales_sa_data = await sales_sa.aggregate([
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
                totalQty: { $sum: "$sale_product.quantity" },
                products: {
                    $push: {
                        qty: "$sale_product.quantity",
                        product_details: {
                            prod_name: "$product_info.name",
                            product_code: "$product_info.product_code",
                            category: "$product_info.category",
                            brand: "$product_info.brand"
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
    
    

// console.log(sales_sa_data[0].products)
let arrdata = {
    // name: [],
    dataqty: {}
};

for (let a = 0; a < array_data["cat_brand"].length; a++) {
    const element = array_data["cat_brand"][a];
    const brand = element._id.brand;
    const category = element._id.category;
    // console.log(element)
    if (!arrdata["dataqty"][brand]) {
        arrdata["dataqty"][brand] = {};
    }
    
    if (!arrdata["dataqty"][brand][category]) {
        arrdata["dataqty"][brand][category] = [];
    }

    for (let b = 0; b <= sales_sa_data.length-1; b++) {
        const thedata = sales_sa_data[b];

        for(let l = 0; l <= thedata.products.length - 1; l++ ){
            const data_detl = thedata.products[l];
            
            // console.log(data_detl.qty)
            if (brand == data_detl.brand && category == data_detl.category) {
                // console.log(data_detl.qty)
                if (!arrdata["dataqty"][brand][category][thedata._id.dsi]) {
                    arrdata["dataqty"][brand][category][thedata._id.dsi] = [];
                }

                if (!arrdata["dataqty"][brand][category][thedata._id.dsi][thedata._id.date]) {
                    arrdata["dataqty"][brand][category][thedata._id.dsi][thedata._id.date] = [];
                }

                if (!arrdata["dataqty"][brand][category][thedata._id.dsi][thedata._id.date][thedata._id.customer]) {
                    arrdata["dataqty"][brand][category][thedata._id.dsi][thedata._id.date][thedata._id.customer] = [];
                }

                arrdata["dataqty"][brand][category][thedata._id.dsi][thedata._id.date][thedata._id.customer].push(data_detl.qty);
            }
        }
        
        
    }
}


    let htmlContent = "";
    htmlContent += `<tr>`;
    htmlContent += `<td colspan="17" class="cat_data">QUANTITY SOLD</td>`;
    htmlContent += `</tr>`;
    htmlContent += `<tr>`;
    htmlContent += `<td class="cat_data" colspan="3"></td>`;
    // htmlContent += `<td class="cat_data"></td>`;
    // htmlContent += `<td class="cat_data"></td>`;
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
    htmlContent += `<td colspan="1" class="cat_data">DSI Number</td>`;
    htmlContent += `<td colspan="1" class="cat_data" style="width:100px">Date</td>`;
    htmlContent += `<td colspan="1" class="cat_data" style="width:100px">Customer</td>`;
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


// console.log(sales_sa_data);

// console.log(arrdata['dataqty'])
    // for (let z = 0; z <= sales_sa_data.length - 1; z++) {
    //     const sales_data_element = sales_sa_data[z];
    //     htmlContent += `<tr>`;
    //     htmlContent += `<td class="row_data">${sales_data_element._id.dsi}</td>`;
    //     htmlContent += `<td class="row_data">${sales_data_element._id.date}</td>`;
    //     htmlContent += `<td class="row_data">${sales_data_element._id.customer}</td>`;
       
    //     for(let p = 0; p <= sales_data_element.products.length -1; p++){
    //         const data_final = sales_data_element.products[p];
    //         // console.log(array_data["cat_brand"].length)
    //         for (let a = 0; a <= array_data["cat_brand"].length-1; a++) {
    //             const data_brand = array_data["cat_brand"][a];
    //             if(data_brand._id.brand == data_final.brand && data_brand._id.category == data_final.category){
    //                 htmlContent += `<td class="row_data">${data_final.qty}</td>`;

    //                 console.log(data_brand._id.brand +" == " + data_final.brand + " && " + data_brand._id.category + " == " + data_final.category)
    //             }else{
    //                 htmlContent += `<td class="row_data">0</td>`;
    //             }
    //         }
    //         // console.log(data_brand._id)
    //     }
    //     // htmlContent += `<td class="row_data">${sales_data_element.totalQty}</td>`;
    //     htmlContent += `</tr>`;
    //     // console.log(sales_data_element)
        
    // }


    for (let z = 0; z < sales_sa_data.length; z++) {
        const sales_data_element = sales_sa_data[z];
        
        htmlContent += `<tr>`;
        htmlContent += `<td class="row_data">${sales_data_element._id.dsi}</td>`;
        htmlContent += `<td class="row_data">${sales_data_element._id.date}</td>`;
        htmlContent += `<td class="row_data">${sales_data_element._id.customer}</td>`;
        // for (let p = 0; p < sales_data_element.products.length; p++) {
        //     const data_final = sales_data_element.products[p];
        //     // console.log(data_final.category)
        //     var totalqty = 0;
        //     if(arrdata["dataqty"][data_final.brand][data_final.category][sales_data_element._id.dsi][sales_data_element._id.date][sales_data_element._id.customer][0] > 0){
        //         totalqty = arrdata["dataqty"][data_final.brand][data_final.category][sales_data_element._id.dsi][sales_data_element._id.date][sales_data_element._id.customer][0];
        //         htmlContent += `<td class="row_data">${totalqty}</td>`;
        //     }else{
        //         htmlContent += `<td class="row_data">${totalqty}</td>`;
        //         console.log(totalqty)
        //     }
             
            
        // }
        // Initialize an object to keep track of quantities for each brand-category pair
        let quantities = {};
    
        // Fill quantities with actual data
        for (let p = 0; p < sales_data_element.products.length; p++) {
            const data_final = sales_data_element.products[p];
            quantities[`${data_final.brand}-${data_final.category}`] = data_final.qty;
        }
    
        // Iterate over all possible brand-category pairs
        for (let a = 0; a < array_data["cat_brand"].length; a++) {
            const data_brand = array_data["cat_brand"][a];
            const key = `${data_brand._id.brand}-${data_brand._id.category}`;
            if (quantities[key] !== undefined) {
                htmlContent += `<td class="row_data">${quantities[key]}</td>`;
            } else {
                htmlContent += `<td class="row_data">0</td>`;
            }
        }
        // console.log(arrdata["dataqty"][])


        htmlContent += `<td class="row_data">${sales_data_element.totalQty}</td>`;
        htmlContent += `</tr>`;
    }
    
    
    return htmlContent;
}

router.post('/agent_reports/pdf', auth, async (req, res) => {

    const {from_date, to_date, isExcel} = req.body
    const role_data = req.user
    const stff_data = await staff.findOne({ email: role_data.email })
    // console.log(stff_data._id.valueOf());
    const datatest = await agentsdataDSICheck(from_date, to_date, stff_data._id.valueOf(), isExcel);
    // res.send(req.body);
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
    htmlContent += `<p>SALES REPORTS - EXTRUCK</p>`;
    htmlContent += `<p>${from_formattedDate} - ${to_formattedDate}</p>`;
    htmlContent += `<div class="row">`;
    htmlContent += `<div class="col-sm-11" id="table-conatainer">`;
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
            $group:{
                _id:{
                    product_name: "$sale_product.product_name",
                    product_code: "$sale_product.product_code",
                },
                sumqty: { $sum:"$sale_product.quantity" },
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
        htmlContent += `<td class="row_data">${sumqtyfixed}</td>`;
        htmlContent += `<td class="row_data">${totalPriceFixed}</td>`;
        htmlContent += `</tr>`;

        qtytotal += parseInt(element.sumqty);
        pricetotal += parseInt(element.totalPrice);
        console.log(element)
        
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
    htmlContent += `<td class="row_data">${sumqtyfixedAll}</td>`;
    htmlContent += `<td class="row_data">${totalPriceFixedAll}</td>`;
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
    htmlContent += `<h1>JAKA EQUITIES CORP</h1>`;
    htmlContent += `<p>TOTAL SALES REPORTS - EXTRUCK</p>`;
    htmlContent += `<p><b>${stff_data.name}</b></p>`;
    htmlContent += `<p>${from_formattedDate} - ${to_formattedDate}</p>`;
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
    const options = {
        format: 'Letter', // Set size to Letter
        orientation: 'landscape' // Set orientation to landscape
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

module.exports = router;