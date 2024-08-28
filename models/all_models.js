const mongoose = require('mongoose');
const autoIncrement = require('mongoose-auto-increment');
autoIncrement.initialize(mongoose.connection);


// ========= sing_up ========= //

const sing_up_data = new mongoose.Schema({
    name: {
        type: String,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    mobile: {
        type: Number,
    },
    role: {
        type: String,
        require: true
    },
    code: {
        type: String
    },
    isUsed: {
        type: String,
        default: "False"
    },
    
})

const sing_up = new mongoose.model("sing_up", sing_up_data);


// ======== profile ======== //

const profile_data = new mongoose.Schema({
    firstname: {
        type: String,
    },
    lastname: {
        type: String,
    },
    email: {
        type: String,
    },
    image: {
        type: String
    }
})

const profile = new mongoose.model("profile", profile_data);


// ======== categories ========== //

const categories_data = new mongoose.Schema({
    name: {
        type: String,
    },
    products: {
        type: Number,
    }
})

const categories = new mongoose.model("categories", categories_data);

// ========= brands =========== //

const brands_data = new mongoose.Schema({
    name: {
        type: String,
    },
    products: {
        type: Number,
    }
})

const brands = new mongoose.model("brands", brands_data);



// ========= units =========== //

const units_data = new mongoose.Schema({
    name: {
        type: String,
    },
    secondary_unit:{
        type: String
    },
    products: {
        type: Number,
    }
})

const units = new mongoose.model("units", units_data);


// ========= products =========== //

const product_data = new mongoose.Schema({
    image: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true,
        // unique : true
    },
    category: {
        type: String,
        required: true
    },
    brand: {
        type: String,
        required: true
    },
    sku: {
        type: String,
        // required: true
    },
    unit: {
        type: String,
        required: true
    },
    second_unit:{
        type: String
    },
    stock: {
        type: Number
    },
    alertquantity: {
        type: Number
    },
    product_code: {
        type: String,
        unique: true
    },
    warehouse: {
        type: String
    },
    secondary_unit:{
        type: String
    },
    sub_category:{
        type: String
    },
    primary_code:{
        type: String
    },
    secondary_code:{
        type: String
    },
    maxStocks:{
        type: Number,
        default: 9999
    },
    maxProdPerUnit:{
        type: Number
    },
    product_category:{
        type: String
    },
    sales_category:{
        type: String
    },
    gross_price:{
        type: Number,
        default: 0
    },
    type_products: {
        type: String
    }
    
})

const product = new mongoose.model("product", product_data);


// ========= warehouse =========== //

const warehouse_data = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    room: {
        type: String
    },
    status: {
        type: String,
        default: "Enabled"
    },
    main_category:{
        type: String
    },
    category: {
        type: String
    },
    warehouse_category:{
        type: String
    },
    isStaging: {
        type: String,
        default: "false"
    },
    product_details: [
        {
            product_name: {
                type: String,
                default: "no product"
            },
            product_stock: {
                type: Number,
                min: 0,
                default: 0
            },
            primary_code: {
                type: String
            },
            secondary_code: {
                type: String
            },
            product_code: {
                type: String
            },
            level:{
                type: String
            },
            bay:{
                type: Number
            },
            maxProducts:{
                type: Number,
                default: 9999
            },
            unit:{
                type: String
            },
            secondary_unit: {
                type: String
            },
            expiry_date:{
                type: String
            },
            production_date: {
                type: String
            },
            maxPerUnit:{
                type: Number
            },
            batch_code: {
                type: String
            },
            alertQTY:{
                type: Number
            },
            production_date:{
                type: String
            },
            delivery_date:{
                type: String
            },
            delivery_code:{
                type: String
            },
            product_cat:{
                type: String
            },
            invoice: {
                type: String
            },
            actual_qty:{
                type: String
            },
            actual_uom:{
                type: String
            },
            id_incoming: {
                type: String
            },
            uuid: {
                type: String
            },
            gross_price:{
                type: Number
            },
            sales_category:{
                type: String
            },
            type_products: {
                type: String
            }
        }
    ]
})

const warehouse = new mongoose.model("warehouse", warehouse_data);


// ========= staff =========== //

const staff_data = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    mobile: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        default: "Enabled"
    },
    warehouse:{
        type: String
    },
    position:{
        type: String
    },
    warehouse_category:{
        type: String 
    },
    account_category: {
        type: String
    },
    type_of_acc_cat:{
        type: String
    },
    sales_man_code:{
        type: String,
        unique: true
    },
    district: {
        type: String
    },
    product_list: [
        {
            product_name: {
                type: String,
                default: "no product"
            },
            product_stock: {
                type: Number,
                min: 0,
                default: 0
            },
            primary_code: {
                type: String
            },
            secondary_code: {
                type: String
            },
            product_code: {
                type: String
            },
            storage:{
                type: String
            },
            rack:{
                type: String
            },
            bay:{
                type: Number
            },
            bin:{
                type: mongoose.Schema.Types.Mixed
            },
            type:{
                type: String
            },
            floorlevel:{
                type: Number
            },
            maxProducts:{
                type: Number,
                default: 9999
            },
            unit:{
                type: String
            },
            secondary_unit: {
                type: String
            },
            expiry_date:{
                type: String
            },
            production_date: {
                type: String
            },
            maxPerUnit:{
                type: Number
            },
            batch_code: {
                type: String
            },
            alertQTY:{
                type: Number
            },
            production_date:{
                type: String
            },
            delivery_date:{
                type: String
            },
            delivery_code:{
                type: String
            },
            product_cat:{
                type: String
            },
            invoice: {
                type: String
            },
            actual_qty:{
                type: String
            },
            actual_uom:{
                type: String
            },
            id_incoming: {
                type: String
            },
            warehouse_id:{
                type: String
            },
            isConfirm: {
                type: String,
                default: "false"
            },
            uuid: {
                type: String
            },
            gross_price:{
                type: Number
            },
            date_incoming:{
                type: String
            },
            date_confirm: {
                type: String
            },
            outgoing_invoice: {
                type: String
            }
        }
    ]
})

const staff = new mongoose.model("staff", staff_data);


// ========= customer =========== //

const customer_data = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    address: {
        type: String,
        // required: true
    },
    mobile: {
        type: Number,
        // required: true
    },
    email: {
        type: String,
        // required: true
    },
    receivable: {
        type: Number,
    },
    payable: {
        type: Number,
    },
    ID: {
        type: String
    },
    SalesmanCode: {
        type: String
    },SalesmanName: {
        type: String
    },
    contactperson:{
        type: String
    },
    landline:{
        type: String
    },
    agent_id:{
        type: String
    },
    customer_discount: [
        {
            less: {
                type: Number,
                default: 0
            },
        }
    ],
    type_organization:{
        type: String
    },
    business_start_year: {
        type: String
    },
    credit_limit: {
        type: String
    },
    terms_of_payments: {
        type: String
    },
    res_address:{
        type: String
    }

})

const customer = new mongoose.model("customer", customer_data);


const customer_data_sa = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    address: {
        type: String,
        // required: true
    },
    mobile: {
        type: Number,
        // required: true
    },
    email: {
        type: String,
        // required: true
    },
    receivable: {
        type: Number,
    },
    payable: {
        type: Number,
    },
    ID: {
        type: String
    },
    SalesmanCode: {
        type: String
    },SalesmanName: {
        type: String
    },
    contactperson:{
        type: String
    },
    landline:{
        type: String
    },
    customer_discount: [
        {
            less: {
                type: Number,
                default: 0
            },
        }
    ]
})

const customer_sa = new mongoose.model("customer_sa", customer_data_sa);


// ========= c_payment_data =========== //

const c_payment = new mongoose.Schema({
    invoice: {
        type: String,
    },
    date: {
        type: String,
    },
    customer: {
        type: String,
    },
    reason: {
        type: String,
    },
    amount: {
        type: Number,
    }
})

const c_payment_data = new mongoose.model("c_payment", c_payment);


// ========= c_payment_data end =========== //



// ========= customer payment =========== //

const customer_payment_data = new mongoose.Schema({
    invoice: {
        type: String,
    },
    date: {
        type: String,
    },
    customer: {
        type: String,
    },
    reason: {
        type: String,
    },
    amount: {
        type: Number,
    }
})

const customer_payment = new mongoose.model("customer_payment", customer_payment_data);



// ========= suppliers =========== //

const suppliers_data = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    mobile: {
        type: Number,
        required: true
    },
    company: {
        type: String,
    },
    address: {
        type: String,
    },
    receivable: {
        type: Number,
    },
    payable: {
        type: Number,
    },
    suppliers_code: {
        type: String,
    },
    contactperson:{
        type: String
    },
    landline:{
        type: String
    }
})

const suppliers = new mongoose.model("suppliers", suppliers_data);

// ========= suppliers end =========== //


// ========= s_payment_data =========== //

const s_payment = new mongoose.Schema({
    invoice: {
        type: String,
    },
    date: {
        type: String,
    },
    suppliers: {
        type: String,
    },
    reason: {
        type: String,
    },
    amount: {
        type: Number,
    }
})

const s_payment_data = new mongoose.model("s_payment", s_payment);


// ========= s_payment_data end =========== //



// ========= suppliers payment =========== //

const suppliers_payment_data = new mongoose.Schema({
    invoice: {
        type: String,
    },
    date: {
        type: String,
    },
    suppliers: {
        type: String,
    },
    reason: {
        type: String,
    },
    amount: {
        type: Number,
    }
})

const suppliers_payment = new mongoose.model("suppliers_payment", suppliers_payment_data);

// ========= suppliers payment end =========== //



// ========= purchases =========== //

const purchases_data = new mongoose.Schema({
    invoice: {
        type: String,
    },
    suppliers: {
        type: String,
    },
    date: {
        type: String,
    },
    warehouse_name: {
        type: String,
    },
    product:[{
        product_name: {
            type: String
        },
        product_code: {
            type: String
        },
        quantity: {
            type: Number
        },
        standard_unit: {
            type: String
        },
        secondary_unit:{
            type: String
        },
        storage:{
            type: String
        },
        rack:{
            type: String
        },
        bay:{
           type: Number 
        },
        bin:{
            type: mongoose.Schema.Types.Mixed
        },
        type:{
            type: String
        },
        floorlevel:{
            type: Number
        },
        primary_code:{
            type: String
        },
        secondary_code:{
            type: String
        },
        maxStocks:{
            type: Number
        },
        batch_code: {
            type: String
        },
        expiry_date: {
            type: String
        },
        maxperunit:{
            type: Number
        },
        alertQTY:{
            type: Number
        },
        production_date:{
            type: String
        },
        product_cat:{
            type: String
        },
        room_name: {
            type: String
        },
        delivery_code: {
            type: String
        },
        invoice: {
            type: String
        },
        actual_qty:{
            type: String
        },
        actual_uom:{
            type: String
        }
    }],
    note: {
        type: String
    },
    paid_amount: {
        type: Number,
        default: 0
    },
    due_amount: {
        type: Number,
    },
    return_data: {
        type: String,
        default: "False"
    },
    room:{
        type: String
    },
    POnumber:{
        type: String
    },
    SCRN: {
        type: String
    },
    JO_number: {
        type: String
    },
    finalize: {
        type: String,
        default: "False"
    },
    isAllowEdit: {
        type: String,
        default: "False"
    },
    roomList:[{
        room_name: {
            type: String
        }
    }]
})



const purchases = new mongoose.model("purchases", purchases_data);
// ========= purchases finished goods========= //
const purchases_data_finished = new mongoose.Schema({
    invoice: {
        type: String,
        unique: true
    },
    suppliers: {
        type: String,
    },
    date: {
        type: String,
    },
    warehouse_name: {
        type: String,
    },
    typeOfProducts: {
        type: String,
        default : "own"
    },
    product:[{
        product_id: {
            type: String
        },
        product_name: {
            type: String
        },
        product_code: {
            type: String
        },
        quantity: {
            type: Number
        },
        standard_unit: {
            type: String
        },
        secondary_unit:{
            type: String
        },
        level:{
            type: String
        },
        bay:{
            type: Number 
        },
        primary_code:{
            type: String
        },
        secondary_code:{
            type: String
        },
        maxStocks:{
            type: Number
        },
        batch_code: {
            type: String
        },
        expiry_date: {
            type: String
        },
        production_date: {
            type: String
        },
        maxperunit:{
            type: Number
        },
        alertQTY:{
            type: Number
        },
        product_cat: {
            type: String
        },
        room_name: {
            type: String
        },
        invoice: {
            type: String
        },
        uuid: {
            type: String
        },
        gross_price: {
            type: Number
        },
        sales_category: {
            type: String
        },
        type_of_products: {
            type: String
        },
        date_recieved:{
            type: String
        }
    }],
    note: {
        type: String
    },
    batch_code: {
        type: String
    },
    paid_amount: {
        type: Number,
        default: 0
    },
    due_amount: {
        type: Number,
    },
    return_data: {
        type: String,
        default: "False"
    },
    room:{
        type: String
    },
    POnumber:{
        type: String
    },
    SCRN: {
        type: String
    },
    JO_number: {
        type: String
    },
    ReqBy:{
        type: String
    },
    dateofreq: {
        type: String
    },
    typeservicesData: {
        type: String
    },
    van:{
        type: String
    },
    typevehicle: {
        type: String
    },
    driver: {
        type: String
    },
    plate: {
        type: String
    },
    DRSI: {
        type: String
    },
    TSU: {
        type: String
    },
    TFU: {
        type: String
    },
    isAllowEdit: {
        type: String,
        default: "False"
    },
    isProcess: {
        type: String,
        default: "false"
    }
})




const purchases_finished = new mongoose.model("purchases_finished", purchases_data_finished);


// ========= return purchases =========== //

const purchases_return_data = new mongoose.Schema({
    invoice: {
        type: String,
    },
    suppliers: {
        type: String,
    },
    date: {
        type: String,
    },
    warehouse_name: {
        type: String,
    },
    room: {
        type: String
    },
    to_warehouse_name: {
        type: String,
    },
    to_room: {
        type: String
    },
    return_product:[{
        product_name: {
            type: String
        },
        purchase_quantity: {
            type: Number
        },
        return_qty: {
            type: Number
        },
        stock_quantity: {
            type: Number
        },
        bay: {
            type: Number
        },
        bin: {
            type: mongoose.Schema.Types.Mixed
        },
        type: {
            type: String
        },
        floorlevel: {
            type: Number
        },
        primary_code: {
            type: String
        },
        secondary_code: {
            type: String
        },
        product_code: {
            type: String
        },
        maxProducts:{
            type: Number,
            default: 9999
        },
        unit:{
            type: String
        },
        secondary_unit: {
            type: String
        },
        expiry_date:{
            type: String
        }
    }],
    note: {
        type: String
    },
    isProcess: {
        type: String,
        default: "false"
    }
})

const purchases_return = new mongoose.model("return_purchases", purchases_return_data);

// ============== return purchases end =============== //



// ========= return purchases =========== //

const purchases_return_data_finished = new mongoose.Schema({
    invoice: {
        type: String,
    },
    suppliers: {
        type: String,
    },
    date: {
        type: String,
    },
    warehouse_name: {
        type: String,
    },
    room: {
        type: String
    },
    to_warehouse_name: {
        type: String,
    },
    to_room: {
        type: String
    },
    return_product:[{
        product_name: {
            type: String
        },
        purchase_quantity: {
            type: Number
        },
        return_qty: {
            type: Number
        },
        stock_quantity: {
            type: Number
        },
        bay: {
            type: Number
        },
        secondary_code: {
            type: String
        },
        product_code: {
            type: String
        },
        maxProducts:{
            type: Number,
            default: 9999
        },
        unit:{
            type: String
        },
        secondary_unit: {
            type: String
        },
        expiry_date:{
            type: String
        }
    }],
    note: {
        type: String
    }
})

const purchases_return_finished = new mongoose.model("return_purchases_finish", purchases_return_data_finished);

// ============== return purchases end =============== //


// ============ sales =============== //

const sales_data = new mongoose.Schema({
    invoice: {
        type: String,
    },
    customer: {
        type: String,
    },
    date: {
        type: String,
    },
    warehouse_name: {
        type: String,
    },
    room:{
        type: String
    },
    ToWarehouse:{
        type: String
    },
    Toroom:{
        type: String
    },
    sale_product:[{
        product_name: {
            type: String
        },
        quantity: {
            type: Number
        },
        stock: {
            type: Number
        },
        primary_code: {
            type: String
        },
        secondary_code: {
            type: String
        },
        product_code: {
            type: String
        },
        storage:{
            type: String
        },
        rack:{
            type: String
        },
        bay:{
           type: Number 
        },
        bin:{
            type: mongoose.Schema.Types.Mixed
        },
        type:{
            type: String
        },
        floorlevel:{
            type: Number
        }, 
        unit: {
            type : String
        },
        secondary_unit:{
            type: String
        },
        batch_code:{
            type: String
        }, 
        expiry_date: {
            type: String
        },
        maxperunit:{
            type: Number
        },
        alertQTY:{
            type: Number
        },
        production_date:{
            type: String
        },
        requested_qty:{
            type: Number
        },
        delivery_date:{
            type: String
        },
        delivery_code:{
            type: String
        },
        prod_cat:{
            type: String
        },
        room_name: {
            type: String
        },
        invoice: {
            type: String
        },
        actual_qty:{
            type: String
        },
        actual_uom:{
            type: String
        },
        id_transaction_from : {
            type: String
        }
    }],
    note: {
        type: String
    },
    return_data: {
        type: String,
        default: "False"
    },
    SCRN: {
        type: String
    },
    finalize: {
        type: String,
        default: "False"
    },
    isAllowEdit: {
        type: String,
        default: "False"
    },
})
const sales = new mongoose.model("sales", sales_data);

// ============ sales end =============== //


// ============ sales finished =============== //

const sales_data_finished = new mongoose.Schema({
    invoice: {
        type: String,
    },
    customer: {
        type: String,
    },
    date: {
        type: String,
    },
    warehouse_name: {
        type: String,
    },
    room:{
        type: String
    },
    ToWarehouse:{
        type: String
    },
    Toroom:{
        type: String
    },
    sales_data:{
        type: String
    },
    sale_product:[{
        product_name: {
            type: String
        },
        quantity: {
            type: Number
        },
        stock: {
            type: Number
        },
        primary_code: {
            type: String
        },
        secondary_code: {
            type: String
        },
        product_code: {
            type: String
        },
        level:{
            type: String
        },
        bay:{
            type: Number 
        },
        type:{
            type: String
        },
        floorlevel:{
            type: Number
        }, 
        unit: {
            type : String
        },
        secondary_unit:{
            type: String
        },
        batch_code:{
            type: String
        }, 
        expiry_date: {
            type: String
        },
        production_date: {
            type: String
        },
        maxperunit:{
            type: Number
        },
        alertQTY:{
            type: Number
        },
        prod_cat:{
            type: String
        },
        room_name: {
            type: String
        },
        invoice: {
            type: String
        },
        id_transaction_from: {
            type: String
        },
        agent_id:{
            type: String
        },
        uuid: {
            type: String
        },
        gross_price: {
            type: String
        },
        date_data:{
            type:String
        },
        sales_category:{
            type: String
        },
        outgoing_invoice: {
            type: String
        }
    }],
    note: {
        type: String
    },
    return_data: {
        type: String,
        default: "False"
    },
    SCRN: {
        type: String
    },
    finalize:{
        type: String,
        default: "False"
    },
    isAllowEdit: {
        type: String,
        default: "False"
    },
    ReqBy:{
        type: String
    },
    dateofreq: {
        type: String
    },
    typeservicesData: {
        type: String
    },
    van:{
        type: String
    },
    typevehicle: {
        type: String
    },
    driver: {
        type: String
    },
    plate: {
        type: String
    },
    DRSI: {
        type: String
    },
    TSU: {
        type: String
    },
    TFU: {
        type: String
    },
    PO_number: {
        type: String
    },
    destination : {
        type: String
    },
    deliverydate: {
        type: String
    },
    isRecieved: {
        type: String,
        default: "false"
    },
    RecievedDate: {
        type: String
    },
    typeOfProducts: {
        type: String
    },
    pullout_date: {
        type: String
    },
    actualdelivery_date: {
        type: String
    }
})


const sales_finished = new mongoose.model("sales_finished", sales_data_finished);

// ============ sales end =============== //


// ========= return sales =========== //

const sales_return_data = new mongoose.Schema({
    invoice: {
        type: String,
    },
    customer: {
        type: String,
    },
    date: {
        type: String,
    },
    warehouse_name: {
        type: String,
    },
    room:{
        type: String
    },
    ToWarehouse:{
        type: String
    },
    ToRoom:{
        type: String
    },
    return_sale:[{
        product_name: {
            type: String
        },
        sale_qty: {
            type: Number
        },
        return_qty: {
            type: Number
        },
        primary_code:{
            type: String
        },
        secondary_code:{
            type: String
        },
        product_code:{
            type: String
        },
        bay: {
            type: Number
        },
        bin: {
            type: mongoose.Schema.Types.Mixed
        },
        type:{
            type: String
        },
        floorlevel:{
            type: Number
        }

    }],
    note: {
        type: String
    }
})

const sales_return = new mongoose.model("return_sales", sales_return_data);

// ============== return sales end =============== //


// ========= return sales =========== //

const sales_return_data_finished = new mongoose.Schema({
    invoice: {
        type: String,
    },
    customer: {
        type: String,
    },
    date: {
        type: String,
    },
    warehouse_name: {
        type: String,
    },
    room:{
        type: String
    },
    warehouse_cat:{
        type: String
    },
    ToWarehouse:{
        type: String
    },
    ToRoom:{
        type: String
    },
    return_sale:[{
        product_name: {
            type: String
        },
        sale_qty: {
            type: Number
        },
        return_qty: {
            type: Number
        },
        primary_code:{
            type: String
        },
        secondary_code:{
            type: String
        },
        product_code:{
            type: String
        },
        bay:{
            type: String
        },
        production_date:{
            type: String
        },
        expiry_date:{
            type: String
        },
        batch_code:{
            type: String
        },
        maxPerUnit:{
            type: Number
        },
        maxProducts:{
            type: Number
        },
        secondary_unit:{
            type: String
        },
        unit:{
            type: String
        }

    }],
    return_sale_QA:[{
        product_name: {
            type: String
        },
        sale_qty: {
            type: Number
        },
        return_qty: {
            type: Number
        },
        primary_code:{
            type: String
        },
        secondary_code:{
            type: String
        },
        product_code:{
            type: String
        },
        production_date:{
            type: String
        },
        expiry_date:{
            type: String
        },
        batch_code:{
            type: String
        },
        maxPerUnit:{
            type: Number
        },
        maxProducts:{
            type: Number
        },
        secondary_unit:{
            type: String
        },
        unit:{
            type: String
        },
        bay:{
            type: Number,
            default: 1
        }

    }],
    note: {
        type: String
    }
})

const sales_return_finished = new mongoose.model("return_sales_finished", sales_return_data_finished);

// ============== return sales end =============== //


// ========= All Transfers =========== //

const transfers_data = new mongoose.Schema({
    date: {
        type: String,
    },
    invoice: {
        type: String,
    },
    from_warehouse: {
        type: String,
    },
    from_room:{
        type: String
    },
    to_warehouse: {
        type: String
    },
    to_room: {
        type: String
    },
    product:[{
        product_name: {
            type: String
        },
        primary_code:{
            type: String
        },
        secondary_code:{
            type: String
        },
        product_code:{
            type: String
        },
        from_quantity:{
          type: Number  
        },
        from_bay:{
            type: Number  
        },
        from_bin:{
          type: mongoose.Schema.Types.Mixed  
        },
        from_types: {
            type: String
        },
        from_floorlevel:{
            type: Number
        },
        to_quantity:{
            type: Number
        },
        to_bay:{
            type: Number
        },
        to_bin:{
            type: mongoose.Schema.Types.Mixed 
        },
        to_types: {
            type: String
        },
        to_floorlevel:{
            type: Number
        },
        maxProducts: {
            type: Number,
            default: 9999
        },
        unit:{
            type: String
        },
        secondary_unit:{
            type: String
        },
        batch_code:{
            type: String
        },
        expiry_date: {
            type: String
        },
        storage:{
            type: String
        },
        rack:{
            type: String
        },
        from_storage:{
            type: String
        },
        from_rack:{
            type: String
        },
        maxperunit: {
            type: Number
        },
        alertQTY:{
            type: Number
        },
        production_date:{
            type: String
        },
        prod_cat:{
            type: String
        },
        from_room_name:{
            type:String
        },
        to_room_name:{
            type:String
        },
        from_invoice: {
            type: String
        },
        To_invoice: {
            type: String
        },
        id_transaction_id : {
            type: String
        }
    }],
    note: {
        type: String
    },
    expiry_date:{
        type: String
    },
    finalize:{
        type: String,
        default: "False"
    },
    isAllowEdit: {
        type: String,
        default: "False"
    },
})

const transfers = new mongoose.model("transfer", transfers_data);

// ========= All Transfers end =========== //


// ========= All Transfers =========== //

const transfers_data_finished = new mongoose.Schema({
    date: {
        type: String,
    },
    invoice: {
        type: String,
    },
    from_warehouse: {
        type: String,
    },
    from_room:{
        type: String
    },
    to_warehouse: {
        type: String
    },
    to_room: {
        type: String
    },
    product:[{
        product_name: {
            type: String
        },
        primary_code:{
            type: String
        },
        secondary_code:{
            type: String
        },
        product_code:{
            type: String
        },
        from_quantity:{
          type: Number  
        },
        from_level:{
            type: String  
        },
        from_bay:{
            type: String  
        },
        to_quantity:{
            type: Number
        },
        to_level:{
            type: String  
        },
        to_bay:{
            type: String  
        },
        maxProducts: {
            type: Number,
            default: 9999
        },
        unit:{
            type: String
        },
        secondary_unit:{
            type: String
        },
        batch_code:{
            type: String
        },
        expiry_date: {
            type: String
        },
        production_date: {
            type: String
        },
        maxProducts:{
            type: Number
        },
        maxPerUnit:{
            type: Number
        },
        alertQTY:{
            type: Number
        },
        prod_cat: {
            type: String
        },
        from_room_name:{
            type:String
        },
        to_room_name:{
            type:String
        },
        from_invoice: {
            type: String
        },
        To_invoice: {
            type: String
        },
        id_transaction:{
            type: String
        }
    }],
    note: {
        type: String
    },
    expiry_date:{
        type: String
    },
    finalize:{
        type: String,
        default: "False"
    },
    isAllowEdit: {
        type: String,
        default: "False"
    },
    type_of_transaction: {
        type: String,
        default: "own"
    },
    type_of_process: {
        type: String
    },
    RequestedBy: {
        type: String
    },
    DateofRequest: {
        type: String
    },
    typeservices: {
        type: String
    },
    typevehicle: {
        type: String
    },
    destination: {
        type: String
    },
    deliverydate: {
        type: String
    },
    driver: {
        type: String
    },
    plate: {
        type: String
    },
    van: {
        type: String
    },
    DRSI: {
        type: String
    },
    PO_number: {
        type: String
    },
    TSU: {
        type: String
    },
    TFU: {
        type: String
    },
    to_recieved:{
        type: String,
        default: "false"
    }
})

const transfers_finished = new mongoose.model("transfer_finished", transfers_data_finished);

// ========= All Transfers end =========== //


// ========= Expenses Type =========== //

const expenses = new mongoose.Schema({
    name: {
        type: String,
    }
})

const expenses_type = new mongoose.model("expenses_type", expenses);

// ========= Expenses Type end =========== //


// ========= Expenses =========== //

const expenses_data = new mongoose.Schema({
    type: {
        type: String,
    },
    date: {
        type: String,
    },
    amount: {
        type: Number,
    },
    note: {
        type: String,
    },
})

const all_expenses = new mongoose.model("expenses", expenses_data);

// ========= Expenses end =========== //


// ========= Adjustment =========== //

const adjustment_data = new mongoose.Schema({
    warehouse_name: {
        type: String
    },
    room: {
        type : String
    },
    date: {
        type: String
    },
    product:[{
        product_name:{
            type: String
        },
        product_code:{
            type: String
        },
        storage:{
            type: String
        },
        rack:{
            type: String
        },
        bay:{
            type: Number
        },
        bin:{
            type: mongoose.Schema.Types.Mixed
        },
        type:{
            type: String
        },
        floorlevel:{
            type: Number
        },
        stockBefore:{
            type: Number
        },
        types:{
            type: String
        },
        adjust_qty:{
            type : Number
        },
        new_adjust_qty:{
            type: Number
        },
        unit:{
            type: String
        },
        secondary_unit:{
            type: String
        },
        batch_code:{
            type: String
        },
        expiry_date: {
            type: String
        },
        production_date: {
            type: String
        },
        alertQTY:{
            type: Number
        },
        prod_cat:{
            type: String
        },
        room_names:{
            type: String
        },
        primary_code: {
            type: String
        },
        secondary_code: {
            type: String
        },
        invoice: {
            type: String
        },
        id_transaction_from : {
            type: String
        }
    }],
    note:{
        type: String,
    },
    invoice: {
        type: String
    },
    JO_number:{
        type: String
    },
    finalize: {
        type: String,
        default: "False"
    },
    isAllowEdit: {
        type: String,
        default: "False"
    },
})

const adjustment = new mongoose.model("adjustment", adjustment_data);


// ========= Adjustment end =========== //


// ========= Adjustment =========== //

const adjustment_data_finished = new mongoose.Schema({
    warehouse_name: {
        type: String
    },
    room: {
        type : String
    },
    date: {
        type: String
    },
    product:[{
        product_name:{
            type: String
        },
        product_code:{
            type: String
        },
        bay:{
            type: String
        },
        level:{
            type: String
        },
        stockBefore:{
            type: Number
        },
        types:{
            type: String
        },
        adjust_qty:{
            type : Number
        },
        new_adjust_qty:{
            type: Number
        },
        unit:{
            type: String
        },
        secondary_unit:{
            type: String
        },
        batch_code:{
            type: String
        },
        expiry_date: {
            type: String
        },
        production_date: {
            type: String
        },
        alertQTY:{
            type: Number
        },
        prod_cat:{
            type: String
        },
        room_names:{
            type: String
        },
        maxPerUnit: {
            type: Number
        },
        invoice: {
            type: String
        },
        id_transaction:{
            type: String
        }
    }],
    note:{
        type: String,
    },
    invoice: {
        type: String
    },
    JO_number:{
        type: String
    },
    finalize:{
        type: String,
        default: "False"
    },
    isAllowEdit: {
        type: String,
        default: "False"
    },
    type_of_transaction : {
        type: String,
        default: "own"
    },
    RequestedBy: {
        type: String
    },
    DateofRequest: {
        type: String
    },
    typeservices: {
        type: String
    },
    typevehicle: {
        type: String
    },
    destination: {
        type: String
    },
    deliverydate: {
        type: String
    },
    driver: {
        type: String
    },
    plate: {
        type: String
    },
    van: {
        type: String
    },
    DRSI: {
        type: String
    },
    PO_number: {
        type: String
    },
    TSU: {
        type: String
    },
    TFU: {
        type: String
    },

})

const adjustment_finished = new mongoose.model("adjustment_finished", adjustment_data_finished);


// ========= Adjustment end =========== //


// ========= master_settings =========== //

const master_settings_data = new mongoose.Schema({
    site_title: {
        type: String,
    },
    image: {
        type: String,
    },
    currency: {
        type: String,
        default: "$"
    },
    currency_placement: {
        type: String,
        default: 2
    },
    timezone: {
        type: String,
    },
    language: {
        type: String,
        default: "English"
    },
})

const master_shop = new mongoose.model("master_shop", master_settings_data);

// ========= master_settings end =========== //


// ========= master_settings =========== //

const supervisor_settings_data = new mongoose.Schema({
    RMSName: {
        type: String,
    },
    RMSEmail: {
        type: String,
    },
    RMSnumber: {
        type: String,
    },
    FGSName: {
        type: String,
    },
    FGSEmail: {
        type: String,
    },
    FGSnumber: {
        type: String,
    },
})

const supervisor_settings = new mongoose.model("supervisor_setup", supervisor_settings_data);

// ========= master_settings end =========== //



// ========= email_settings =========== //

const email_settings_data = new mongoose.Schema({
    host: {
        type: String,
    },
    port: {
        type: String,
    },
    email: {
        type: String,
    },
    password: {
        type: String,
    },
})

const email_settings = new mongoose.model("email_settings", email_settings_data);

// ========= email_settings end =========== //




const sales_sa_data = new mongoose.Schema({
    invoice: {
        type: String,
    },
    customer: {
        type: String,
    },
    date: {
        type: String,
    },
    dsi:{
        type: String
    },
    sale_product:[{
        product_name: {
            type: String
        },
        quantity: {
            type: Number
        },
        stock: {
            type: Number
        },
        primary_code: {
            type: String
        },
        secondary_code: {
            type: String
        },
        product_code: {
            type: String
        },
        unit: {
            type : String
        },
        secondary_unit:{
            type: String
        },
        batch_code:{
            type: String
        }, 
        expiry_date: {
            type: String
        },
        production_date:{
            type: String
        },
        prod_cat:{
            type: String
        },
        discount:{
            type: Number
        },
        adj_discount: {
            type: Number
        },
        total_price:{
            type: Number
        },
        id_transaction_from : {
            type: String
        },
        price: {
            type: Number
        },
        totalprice: {
            type: Number
        },
        gross_price:{
            type: Number
        },
        isFG:{
            type: String
        },
        ewt:{
            type: String
        },
        spwp:{
            type: String
        },
        fin_disc:{
            type: String
        },
        vol_deals:{
            type: String
        },
        bo_disc:{
            type: String
        }

    }],
    note: {
        type: String
    },
    return_data: {
        type: String,
        default: "False"
    },
    paid: {
        type: String,
        default: "False"
    },
    sales_staff_id: {
        type: String
    },
    collection_price:{
        type: Number,
        default:0
    },
    collectionnumber: {
        type: String,
        default: ""
    },
    cash_date: {
        type: String
    },
    type_of_payment: {
        type: String
    },
    typeofprocess: {
        type: String
    }
})
const sales_sa = new mongoose.model("sales_sas", sales_sa_data);


const invoice_sa_data = new mongoose.Schema({
    invoice_starts: {
        type: Number,
        default : 0
    },
})


invoice_sa_data.plugin(autoIncrement.plugin, {
    model: 'invoice_incs',  // Name of the model
    field: 'invoice_starts', // Field to increment
    startAt: 1, // Initial value
    incrementBy: 1 
});


const invoice_sa = new mongoose.model("invoice_incs", invoice_sa_data);


const invoice_incoming = new mongoose.Schema({
    invoice_init: {
        type: Number,
        default : 0
    },
});
invoice_incoming.plugin(autoIncrement.plugin, {
    model: 'invoice_incomings',  // Name of the model
    field: 'invoice_init', // Field to increment
    startAt: 1, // Initial value
    incrementBy: 1 
});

const invoice_for_incoming = new mongoose.model("invoice_incomings", invoice_incoming);


const invoice_outgoing = new mongoose.Schema({
    invoice_init: {
        type: Number,
        default : 0
    },
})


invoice_outgoing.plugin(autoIncrement.plugin, {
    model: 'invoice_outgoings',  // Name of the model
    field: 'invoice_init', // Field to increment
    startAt: 1, // Initial value
    incrementBy: 1 
});

const invoice_for_outgoing = new mongoose.model("invoice_outgoings", invoice_outgoing);


const invoice_adjustment = new mongoose.Schema({
    invoice_init: {
        type: Number,
        default : 0
    },
})


invoice_adjustment.plugin(autoIncrement.plugin, {
    model: 'invoice_adjustments',  // Name of the model
    field: 'invoice_init', // Field to increment
    startAt: 1, // Initial value
    incrementBy: 1 
});
const invoice_for_adjustment = new mongoose.model("invoice_adjustments", invoice_adjustment);


const invoice_transfer = new mongoose.Schema({
    invoice_init: {
        type: Number,
        default : 0
    },
})


invoice_transfer.plugin(autoIncrement.plugin, {
    model: 'invoice_transfers',  // Name of the model
    field: 'invoice_init', // Field to increment
    startAt: 1, // Initial value
    incrementBy: 1 
});
const invoice_for_transfer = new mongoose.model("invoice_transfers", invoice_transfer);


const inventory_transfer = new mongoose.Schema({
    invoice_init: {
        type: Number,
        default : 0
    },
})


inventory_transfer.plugin(autoIncrement.plugin, {
    model: 'inventory_transfers',  // Name of the model
    field: 'invoice_init', // Field to increment
    startAt: 1, // Initial value
    incrementBy: 1 
});


const invoice_for_inventory = new mongoose.model("inventory_transfers", inventory_transfer);



const sales_inv = new mongoose.Schema({
    invoice: {
        type: String
    },
    date: {
        type: String
    },
    sales_staff_id: {
        type: String
    },
    sale_product:[{
        product_name: {
            type: String
        },
        quantity: {
            type: Number
        },
        stock: {
            type: Number
        },
        primary_code: {
            type: String
        },
        secondary_code: {
            type: String
        },
        product_code: {
            type: String
        },
        unit: {
            type : String
        },
        secondary_unit:{
            type: String
        },
        batch_code:{
            type: String
        }, 
        expiry_date: {
            type: String
        },
        production_date:{
            type: String
        },
        prod_cat:{
            type: String
        },
        discount:{
            type: Number
        },
        total_price:{
            type: Number
        },
        id_transaction : {
            type: String
        },
        price: {
            type: Number
        },
        totalprice: {
            type: Number
        },
        gross_price:{
            type: Number
        },
        outgoing_invoice: {
            type: String
        }
    }],
    note: {
        type: String
    }
})
const sales_inv_data = new mongoose.model("sales_invs", sales_inv);


const sales_order_data = new mongoose.Schema({
    invoice: {
        type: String,
    },
    customer: {
        type: String,
    },
    date: {
        type: String,
    },
    JD:{
        type: String
    },
    sale_product:[{
        product_name: {
            type: String
        },
        quantity: {
            type: Number
        },
        stock: {
            type: Number
        },
        primary_code: {
            type: String
        },
        secondary_code: {
            type: String
        },
        product_code: {
            type: String
        },
        unit: {
            type : String
        },
        secondary_unit:{
            type: String
        },
        batch_code:{
            type: String
        }, 
        expiry_date: {
            type: String
        },
        production_date:{
            type: String
        },
        prod_cat:{
            type: String
        },
        discount:{
            type: Number
        },
        adjustment_discount:{
            type: Number,
            default: 0
        },
        accounting_discount:{
            type: Number,
            default: 0
        },
        total_price:{
            type: Number
        },
        product_id : {
            type: String
        },
        price: {
            type: Number
        },
        totalprice: {
            type: Number
        },
        gross_price:{
            type: Number
        },
        isFG:{
            type: String
        },
        ewt:{
            type: String
        },
        spwp:{
            type: String
        },
        fin_disc:{
            type: String
        },
        vol_deals:{
            type: String
        },
        bo_disc:{
            type: String
        }
    }],
    note: {
        type: String
    },
    return_data: {
        type: String,
        default: "False"
    },
    paid: {
        type: String,
        default: "False"
    },
    sales_staff_id: {
        type: String
    },
    collection_price:{
        type: String,
        default: "0"
    },
    collectionnumber: {
        type: String,
        default: ""
    },
    cash_date: {
        type: String
    },
    type_of_payment: {
        type: String
    },
    wms_account_confirm:{
        type: String,
        default: "false"
    },
    wms_account_id:{
        type: String
    },
    wms_account_date:{
        type: String
    },
    accounting_account_confirm:{
        type: String,
        default: "false"
    },
    accounting_account_id:{
        type: String
    },
    accounting_account_date:{
        type: String
    },
    document_number_out: {
        type: String
    },
    outgoing_id: {
        type: String
    }, 
    po_number: {
        type: String
    },
    desired_delivery: {
        type: String
    }
})
const sales_order = new mongoose.model("sales_orders", sales_order_data);


const sales_order_inv = new mongoose.Schema({
    invoice_init: {
        type: Number,
        default : 0
    },
})

sales_order_inv.plugin(autoIncrement.plugin, {
    model: 'sales_order_invs',  // Name of the model
    field: 'invoice_init', // Field to increment
    startAt: 1, // Initial value
    incrementBy: 1 
});


const invoice_for_sales_order = new mongoose.model("sales_order_invs", sales_order_inv);





const approving_body_accounting = new mongoose.Schema({
    head_id_staff: {
        type: String
    },
    warehouse_staff_id:{
        type: String
    },
    warehouse_name:{
        type: String
    },
    members:[{
        id_member: {
            type: String
        },
        name:{
            type: String
        }
    }]

});
const approver_acct = new mongoose.model("approvers_accountings", approving_body_accounting);


const discount_volume = new mongoose.Schema({
    volume_discount: [
        {
            min_car: {
                type: Number,
                default: 0
            },
            max_car: {
                type: Number,
                default: 0
            },
            discount_price: {
                type: Number,
                default: 0
            },
        }
    ]

});

const discount_volume_db = new mongoose.model("discount_volumes", discount_volume);



const logs_purchases = new mongoose.Schema({
    invoice_init: {
        type: Number,
        default : 0
    },
})

logs_purchases.plugin(autoIncrement.plugin, {
    model: 'purchases_logs',  // Name of the model
    field: 'invoice_init', // Field to increment
    startAt: 1, // Initial value
    incrementBy: 1 
});

const purchases_logs = new mongoose.model("purchases_logs", logs_purchases);

const log_sales = new mongoose.Schema({
    invoice_init: {
        type: Number,
        default : 0
    },
})

log_sales.plugin(autoIncrement.plugin, {
    model: 'sales_logs',  // Name of the model
    field: 'invoice_init', // Field to increment
    startAt: 1, // Initial value
    incrementBy: 1 
});

const sales_logs = new mongoose.model("sales_logs", log_sales);



const log_adjustments = new mongoose.Schema({
    invoice_init: {
        type: Number,
        default : 0
    },
})

log_adjustments.plugin(autoIncrement.plugin, {
    model: 'adjustment_logs',  // Name of the model
    field: 'invoice_init', // Field to increment
    startAt: 1, // Initial value
    incrementBy: 1 
});

const adjustment_logs = new mongoose.model("adjustment_logs", log_adjustments);


const log_transfers = new mongoose.Schema({
    invoice_init: {
        type: Number,
        default : 0
    },
})

log_transfers.plugin(autoIncrement.plugin, {
    model: 'transfers_logs',  // Name of the model
    field: 'invoice_init', // Field to increment
    startAt: 1, // Initial value
    incrementBy: 1 
});

const transfers_logs = new mongoose.model("transfers_logs", log_transfers);


const locationCounterSchema = new mongoose.Schema({
    prefix: {
        type: String,
        required: true,
        unique: true
    },
    seq: {
        type: Number,
        default: 0
    }
});

const LocationCounter = mongoose.model('LocationCounter', locationCounterSchema);

const logTransfersSchema = new mongoose.Schema({
    invoice_init: {
        type: String, // Change to String to accommodate prefix + number
        required: true
    },
    location: {
        type: String, // Prefix, e.g., 'AA', 'BB'
        required: true
    }
});

autoIncrement.initialize(mongoose.connection);

logTransfersSchema.plugin(autoIncrement.plugin, {
    model: 'trf_incomings',
    field: 'invoice_init',
    startAt: 1,
    incrementBy: 1
});

logTransfersSchema.pre('save', async function (next) {
    const doc = this;

    try {
        // Find or create the location counter for the given prefix
        const locationCounter = await LocationCounter.findOneAndUpdate(
            { prefix: doc.location },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );
        
        const seq = locationCounter.seq;
        const paddedSeq = String(seq).padStart(8, '0'); // Pad the sequence with leading zeros
        // console.log(`${doc.location}-${paddedSeq}`)
        // Combine the prefix and the sequence number
        doc.invoice_init = `${doc.location}-${paddedSeq}`;

        next();
    } catch (error) {
        next(error);
    }
});

const datalogs = mongoose.model('trf_incomings', logTransfersSchema);


const purchases_data_incoming = new mongoose.Schema({
    invoice: {
        type: String,
    },
    suppliers: {
        type: String,
    },
    date: {
        type: String,
    },
    warehouse_name: {
        type: String,
    },
    product:[{
        product_name: {
            type: String
        },
        product_code: {
            type: String
        },
        quantity: {
            type: Number
        },
        standard_unit: {
            type: String
        },
        secondary_unit:{
            type: String
        },
        storage:{
            type: String
        },
        rack:{
            type: String
        },
        bay:{
           type: Number 
        },
        bin:{
            type: mongoose.Schema.Types.Mixed
        },
        type:{
            type: String
        },
        floorlevel:{
            type: Number
        },
        primary_code:{
            type: String
        },
        secondary_code:{
            type: String
        },
        maxStocks:{
            type: Number
        },
        batch_code: {
            type: String
        },
        expiry_date: {
            type: String
        },
        maxperunit:{
            type: Number
        },
        alertQTY:{
            type: Number
        },
        production_date:{
            type: String
        },
        product_cat:{
            type: String
        },
        room_name: {
            type: String
        },
        delivery_code: {
            type: String
        },
        invoice: {
            type: String
        },
        actual_qty:{
            type: String
        },
        actual_uom:{
            type: String
        },
        level: {
            type: String
        }
    }],
    note: {
        type: String
    },
    paid_amount: {
        type: Number,
        default: 0
    },
    due_amount: {
        type: Number,
    },
    return_data: {
        type: String,
        default: "False"
    },
    room:{
        type: String
    },
    POnumber:{
        type: String
    },
    SCRN: {
        type: String
    },
    JO_number: {
        type: String
    },
    finalize: {
        type: String,
        default: "False"
    },
    isAllowEdit: {
        type: String,
        default: "False"
    },
    roomList:[{
        room_name: {
            type: String
        }
    }]
})

const purchases_incoming = new mongoose.model("purchases_incoming", purchases_data_incoming);

const warehouse_data_validation = new mongoose.Schema({
    warehouse_id: {
        type: String
    },
    warehouse_name:{
        type: String
    },
    room: {
        type: String
    },
    product_data:[{
        product_id: {
            type: String
        },
        product_name: {
            type: String
        },
        product_code: {
            type: String
        },
        min: {
            type: Number
        },
        max: {
            type: String
        },
        bay:{
            type: String
        },
        bin:{
            type: String
        },
       
    }],
})

const warehouse_validation_setup = new mongoose.model("warehouse_validation", warehouse_data_validation);




const warehouse_data_temporary = new mongoose.Schema({
    warehouse: {
        type: String,
        required: true
    },
    room_name: {
        type: String
    },
    product_name: {
        type: String,
        default: "no product"
    },
    product_stock: {
        type: Number,
        min: 0,
        default: 0
    },
    primary_code: {
        type: String
    },
    secondary_code: {
        type: String
    },
    product_code: {
        type: String
    },
    level:{
        type: String
    },
    bay:{
        type: Number
    },
    maxProducts:{
        type: Number,
        default: 9999
    },
    unit:{
        type: String
    },
    secondary_unit: {
        type: String
    },
    expiry_date:{
        type: String
    },
    production_date: {
        type: String
    },
    maxPerUnit:{
        type: Number
    },
    batch_code: {
        type: String
    },
    alertQTY:{
        type: Number
    },
    production_date:{
        type: String
    },
    delivery_date:{
        type: String
    },
    delivery_code:{
        type: String
    },
    product_cat:{
        type: String
    },
    invoice: {
        type: String
    },
    actual_qty:{
        type: String
    },
    actual_uom:{
        type: String
    },
    id_incoming: {
        type: String
    },
    uuid: {
        type: String
    },
    gross_price:{
        type: Number
    },
    sales_category:{
        type: String
    },
    type_products: {
        type: String
    },
    purchases_id: {
        type: String
    },
    createdDate: {
        type: Date,
        default: Date.now
    }
})

const warehouse_temporary = new mongoose.model("warehouse_temporaries", warehouse_data_temporary);

module.exports = { sing_up, profile, categories, brands, units, product, warehouse, staff, customer, customer_sa, invoice_for_sales_order, approver_acct, discount_volume_db,  purchases_logs, sales_logs, adjustment_logs, transfers_logs, datalogs,
                    suppliers, suppliers_payment, s_payment_data, purchases, purchases_return, sales, sales_return, sales_sa, invoice_sa, purchases_incoming,
                    invoice_for_incoming, invoice_for_outgoing, invoice_for_adjustment, invoice_for_transfer, invoice_for_inventory, sales_inv_data, sales_order, 
                    customer_payment, c_payment_data, transfers, expenses_type, all_expenses, adjustment, master_shop, email_settings, 
                    purchases_finished, sales_finished, adjustment_finished, transfers_finished, purchases_return_finished, sales_return_finished, 
                    supervisor_settings, warehouse_validation_setup, warehouse_temporary };