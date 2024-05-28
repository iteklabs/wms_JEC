const express = require("express");
const res = require("express/lib/response");
const app = express();
const router = express.Router();
const multer = require('multer');
const { profile, master_shop, categories, brands, units, product, purchases, warehouse, sales_finished, sales, transfers_finished, adjustment_finished, purchases_finished, sales_return_finished, adjustment, transfers } = require("../models/all_models");
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




router.post('/balance/pdf', auth, (req, res) => {

    const {from_date, to_date} = req.body
    // let htmlContent =`
    //     <style>
    //         table {
    //             border-collapse: collapse;
    //             width: 100%; /* Adjust width as needed */
    //         }
    //     </style>
    // `;
    // htmlContent = "<h1>JAKA EQUITIES CORP</h1><p>WEEKLY FINISHED GOODS INVENTORY</p>";
    // htmlContent += "<p>"+from_date +" - "+ to_date +"</p>";

    // htmlContent += "<table  border='1'>";
    // htmlContent += "<tr style='background-color: gray; color: white;'>";
    // htmlContent += "<th rowspan='2'>Beginning Balance<br>"+from_date+"</th>";
    // htmlContent += "<th rowspan='2'>Production</th>";
    // htmlContent += "<th rowspan='1' colspan='2'>SOLD</th>";
    // htmlContent += "<th rowspan='2'>Ending Balance<br>"+to_date+"</th>";
    // htmlContent += "</tr>";


    // htmlContent += "<tr>";
    // htmlContent += "<td>Booking</td>";
    // htmlContent += "<td>X-Truck</td>";;
    // htmlContent += "</tr>";




    // htmlContent += "</table>";
    // const bootstrapCSSPath = path.resolve(__dirname, '../node_modules/bootstrap/dist/css/bootstrap.min.css');
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
            th, td {
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

    htmlContent += `<h1>JAKA EQUITIES CORP</h1>`;
    htmlContent += `<p>WEEKLY FINISHED GOODS INVENTORY</p>`;
    htmlContent += `<p>${from_date} - ${to_date}</p>`;
    htmlContent += `<div class="row">`;
    // htmlContent += `<div class="col-sm-2">`;
    // htmlContent += `</div>`;
    htmlContent += `<div class="col-sm-11">`;
    htmlContent += `<table>`;
    htmlContent += `<tr>`;
    htmlContent += `<th rowspan='2'>Category</th>`;
    htmlContent += `<th rowspan='2'>Products</th>`;
    htmlContent += `<th rowspan='2'>Beginning Balance<br>${from_date}</th>`;
    htmlContent += `<th rowspan='2'>Production</th>`;
    htmlContent += `<th colspan='2'>SOLD</th>`;
    htmlContent += `<th rowspan='2'>Ending Balance<br>${to_date}</th>`;
    htmlContent += `</tr>`;
    htmlContent += `<tr>`;
    htmlContent += `<th>Booking</th>`;
    htmlContent += `<th>X-Truck</th>`;
    htmlContent += `</tr>`;

    htmlContent += `<tr>`;
    htmlContent += `<td>Standard</td>`;
    htmlContent += `<td></td>`;
    htmlContent += `<td></td>`;
    htmlContent += `<td></td>`;
    htmlContent += `<td></td>`;
    htmlContent += `<td></td>`;
    htmlContent += `<td></td>`;
    htmlContent += `</tr>`;

    htmlContent += `<tr>`;
    htmlContent += `<td></td>`;
    htmlContent += `<td>Royal Red</td>`;
    htmlContent += `<td>6,859</td>`;
    htmlContent += `<td>0</td>`;
    htmlContent += `<td>495</td>`;
    htmlContent += `<td>97</td>`;
    htmlContent += `<td>6,267</td>`;
    htmlContent += `</tr>`;

    htmlContent += `<tr>`;
    htmlContent += `<td></td>`;
    htmlContent += `<td>Guitar</td>`;
    htmlContent += `<td>11,496</td>`;
    htmlContent += `<td>0</td>`;
    htmlContent += `<td>466</td>`;
    htmlContent += `<td>0</td>`;
    htmlContent += `<td>6,267</td>`;
    htmlContent += `</tr>`;

    htmlContent += `<tr>`;
    htmlContent += `<td></td>`;
    htmlContent += `<td>Emi</td>`;
    htmlContent += `<td>6,859</td>`;
    htmlContent += `<td>0</td>`;
    htmlContent += `<td>495</td>`;
    htmlContent += `<td>97</td>`;
    htmlContent += `<td>6,267</td>`;
    htmlContent += `</tr>`;

    htmlContent += `<tr>`;
    htmlContent += `<td></td>`;
    htmlContent += `<td>Fuego</td>`;
    htmlContent += `<td>6,859</td>`;
    htmlContent += `<td>0</td>`;
    htmlContent += `<td>495</td>`;
    htmlContent += `<td>97</td>`;
    htmlContent += `<td>6,267</td>`;
    htmlContent += `</tr>`;

    htmlContent += `<tr>`;
    htmlContent += `<td>Household</td>`;
    htmlContent += `<td></td>`;
    htmlContent += `<td></td>`;
    htmlContent += `<td></td>`;
    htmlContent += `<td></td>`;
    htmlContent += `<td></td>`;
    htmlContent += `<td></td>`;
    htmlContent += `</tr>`;

    htmlContent += `<tr>`;
    htmlContent += `<td></td>`;
    htmlContent += `<td>Royal Red</td>`;
    htmlContent += `<td>6,859</td>`;
    htmlContent += `<td>0</td>`;
    htmlContent += `<td>495</td>`;
    htmlContent += `<td>97</td>`;
    htmlContent += `<td>6,267</td>`;
    htmlContent += `</tr>`;

    htmlContent += `<tr>`;
    htmlContent += `<td></td>`;
    htmlContent += `<td>Guitar</td>`;
    htmlContent += `<td>6,859</td>`;
    htmlContent += `<td>0</td>`;
    htmlContent += `<td>495</td>`;
    htmlContent += `<td>97</td>`;
    htmlContent += `<td>6,267</td>`;
    htmlContent += `</tr>`;

    htmlContent += `<tr>`;
    htmlContent += `<td></td>`;
    htmlContent += `<td>Emi</td>`;
    htmlContent += `<td>6,859</td>`;
    htmlContent += `<td>0</td>`;
    htmlContent += `<td>495</td>`;
    htmlContent += `<td>97</td>`;
    htmlContent += `<td>6,267</td>`;
    htmlContent += `</tr>`;
    

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