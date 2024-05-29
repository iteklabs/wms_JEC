const express = require("express");
const res = require("express/lib/response");
const app = express();
const router = express.Router();
const multer = require('multer');
const { profile, master_shop, categories, brands, units, product, purchases, warehouse, sales_finished, sales, transfers_finished, adjustment_finished, purchases_finished, sales_return_finished, adjustment, transfers, sales_sa } = require("../models/all_models");
const auth = require("../middleware/auth");
const users = require("../public/language/languages.json");
const excelJS = require("exceljs");
const xlsx = require('xlsx');
const PDFDocument = require('pdfkit-table');
const fs = require('fs');
const blobStream  = require('blob-stream');
const JsBarcode = require('jsbarcode');
const { Canvas } = require("canvas");
const pdf = require('html-pdf');
const path = require('path');
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


router.post("/balance/pdf2", auth, async (req, res) => {
    try {
        const {from_date, to_date} = req.body;
        const doc = new PDFDocument({ margin: 30, size: 'Letter', layout : 'landscape', bufferPages: true });
        res.setHeader('Content-disposition', 'inline; filename="'+from_date+to_date+'.pdf"');
        res.setHeader('Content-type', 'application/pdf');
        var x=20;
        var y=20;
        doc.pipe(res);
        doc
        .fontSize(20)
        .text('JAKA EQUITIES CORPORATION', x, y);
        doc
        .fontSize(15)
        .text('WEEKLY FINISHED GOODS INVENTORY', x, y+=20);
        doc
        .fontSize(10)
        .text(from_date + ' - ' + to_date, x, y+=20);
        const table = {
            headers: [
              { label: "Beginning Balance \n" + from_date, property: 'balance', width: 100, renderer: null },
              { label: "Production", property: 'prod', width: 100, renderer: null },
              { label: "SOLD", subHeaders: [ // Added subHeaders array for two sub-columns
                { label: "Sub-Column 1", property: 'sold_sub1', width: 110, renderer: null }, // First sub-column
                { label: "Sub-Column 2", property: 'sold_sub2', width: 110, renderer: null }, // Second sub-column
            ], width: 220, renderer: null },
              { label: "Ending Balance \n" + to_date, property: 'endbal', width: 100, renderer: null },
            ],
            datas: [],
          };
          var totalQTY = 0; 
          let warecode = "";
          var totalPerUnit =0;

          var rowCheck = 0;
        //   user_id.sale_product.forEach((ProductDetl) => {
        //     console.log(ProductDetl)
        //     let dataUnit = '';
            
        //     const qtydata = ProductDetl.quantity;
        //     for (let index = 1; index <= qtydata; index++) {
              
        //       if(qtydata == index){
        //         dataUnit += ProductDetl.maxperunit;
        //       }else{
        //         dataUnit += ProductDetl.maxperunit+',';
        //       }
              
              
        //       totalPerUnit +=ProductDetl.maxperunit;
        //     }
        //     dataUnit += ' / ' + ProductDetl.secondary_unit ;
        //     const rowData = {

              
        //       itemcode: ProductDetl.product_code,
        //       itemdescription: ProductDetl.product_name,
        //       qty: ProductDetl.quantity,
        //       unit: ProductDetl.unit,
        //       // unitConversion:dataUnit,
        //       proddate: ProductDetl.production_date,
        //       batchno: ProductDetl.batch_code,
        //       binloc: ProductDetl.level+ProductDetl.bay,
              
        //     };
        //     totalQTY += ProductDetl.quantity 
        //     rowCheck +=1;
        //     table.datas.push(rowData);
        //   });

        doc.table(table, {
            x: 200,
            y: y+=50,
            prepareHeader: () => doc.font("Helvetica-Bold").fontSize(8),
            prepareRow: (row, indexColumn, indexRow, rectRow) => doc.font("Helvetica").fontSize(8),
        });
        

        let pages = doc.bufferedPageRange();

        for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);

        let oldBottomMargin = doc.page.margins.bottom;
        doc.page.margins.bottom = 0 
        doc
            .text(
            `Page: ${i + 1} of ${pages.count}`,
            0,
            doc.page.height - (oldBottomMargin/2), 
            { align: 'center' }
            );
        doc.page.margins.bottom = oldBottomMargin; 
        }
      
        
        const lasttextY = doc.y
        const lasttextX = doc.x
        doc.end();
    } catch (error) {
        console.log(error);
        res.status(500).send("An error occurred while generating the PDF.");
    }
});


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
    console.log(array_data["sales_ext"])
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
    htmlContent += `<p>WEEKLY FINISHED GOODS INVENTORY</p>`;
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
    // htmlContent += `<tr>`;
    // htmlContent += `<td>Standard</td>`;
    // htmlContent += `<td></td>`;
    // htmlContent += `<td></td>`;
    // htmlContent += `<td></td>`;
    // htmlContent += `<td></td>`;
    // htmlContent += `<td></td>`;
    // htmlContent += `<td></td>`;
    // htmlContent += `</tr>`;

    // htmlContent += `<tr>`;
    // htmlContent += `<td></td>`;
    // htmlContent += `<td>Royal Red</td>`;
    // htmlContent += `<td>1,000</td>`;
    // htmlContent += `<td>0</td>`;
    // htmlContent += `<td>0</td>`;
    // htmlContent += `<td>0</td>`;
    // htmlContent += `<td>1,000</td>`;
    // htmlContent += `</tr>`;

    // htmlContent += `<tr>`;
    // htmlContent += `<td></td>`;
    // htmlContent += `<td>Guitar</td>`;
    // htmlContent += `<td>1,000</td>`;
    // htmlContent += `<td>0</td>`;
    // htmlContent += `<td>0</td>`;
    // htmlContent += `<td>0</td>`;
    // htmlContent += `<td>1,000</td>`;
    // htmlContent += `</tr>`;

    // htmlContent += `<tr>`;
    // htmlContent += `<td></td>`;
    // htmlContent += `<td>Emi</td>`;
    // htmlContent += `<td>1,000</td>`;
    // htmlContent += `<td>0</td>`;
    // htmlContent += `<td>0</td>`;
    // htmlContent += `<td>0</td>`;
    // htmlContent += `<td>1,000</td>`;
    // htmlContent += `</tr>`;

    // htmlContent += `<tr>`;
    // htmlContent += `<td></td>`;
    // htmlContent += `<td>Fuego</td>`;
    // htmlContent += `<td>6,859</td>`;
    // htmlContent += `<td>0</td>`;
    // htmlContent += `<td>495</td>`;
    // htmlContent += `<td>97</td>`;
    // htmlContent += `<td>6,267</td>`;
    // htmlContent += `</tr>`;

    // htmlContent += `<tr>`;
    // htmlContent += `<td>Household</td>`;
    // htmlContent += `<td></td>`;
    // htmlContent += `<td></td>`;
    // htmlContent += `<td></td>`;
    // htmlContent += `<td></td>`;
    // htmlContent += `<td></td>`;
    // htmlContent += `<td></td>`;
    // htmlContent += `</tr>`;

    // htmlContent += `<tr>`;
    // htmlContent += `<td></td>`;
    // htmlContent += `<td>Royal Red</td>`;
    // htmlContent += `<td>6,859</td>`;
    // htmlContent += `<td>0</td>`;
    // htmlContent += `<td>495</td>`;
    // htmlContent += `<td>97</td>`;
    // htmlContent += `<td>6,267</td>`;
    // htmlContent += `</tr>`;

    // htmlContent += `<tr>`;
    // htmlContent += `<td></td>`;
    // htmlContent += `<td>Guitar</td>`;
    // htmlContent += `<td>6,859</td>`;
    // htmlContent += `<td>0</td>`;
    // htmlContent += `<td>495</td>`;
    // htmlContent += `<td>97</td>`;
    // htmlContent += `<td>6,267</td>`;
    // htmlContent += `</tr>`;

    // htmlContent += `<tr>`;
    // htmlContent += `<td></td>`;
    // htmlContent += `<td>Emi</td>`;
    // htmlContent += `<td>6,859</td>`;
    // htmlContent += `<td>0</td>`;
    // htmlContent += `<td>495</td>`;
    // htmlContent += `<td>97</td>`;
    // htmlContent += `<td>6,267</td>`;
    // htmlContent += `</tr>`;
    

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
module.exports = router;