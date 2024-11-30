const Order = require("../../models/orderSchema");
const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const excel = require('exceljs');
const pdf = require('pdfkit');
const moment = require('moment');

const loadSalesReport = async(req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const skip = (page - 1) * limit;
        let filter = {};
        const filterType = req.query.filterType || 'yearly';
        const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
        const endDate = req.query.endDate ? new Date(req.query.endDate) : null;
        switch (filterType) {
            case 'daily':
                filter.createdAt = {
                    $gte: moment().startOf('day').toDate(),
                    $lt: moment().endOf('day').toDate(),
                };
                break;
            case 'weekly':
                filter.createdAt = {
                    $gte: moment().startOf('week').toDate(),
                    $lt: moment().endOf('week').toDate(),
                };
                break;
            case 'yearly':
                filter.createdAt = {
                    $gte: moment().startOf('year').toDate(),
                    $lt: moment().endOf('year').toDate(),
                };
                break;
            case 'custom':
                if (startDate && endDate) {
                    filter.createdAt = {
                        $gte: startDate,
                        $lt: endDate,
                    };
                }
                break;
            default:
                break;
        }

        const overallOrderAmount = await Order.aggregate([
            { $match: filter }, { $group: { _id: null, totalAmount: { $sum: "$finalPrice" } } }
        ]);
        const overallDiscount = await Order.aggregate([
            { $match: filter }, { $group: { _id: null, totalDiscount: { $sum: "$discount" } } }
        ]);
        const totalAmount = overallOrderAmount.length > 0 ? overallOrderAmount[0].totalAmount : 0;
        const totalDiscount = overallDiscount.length > 0 ? overallDiscount[0].totalDiscount : 0;
        const salesReport = await Order.find(filter)
            .skip(skip)
            .limit(limit)
            .populate('userId', 'name email')
            .populate('orderedItems.productId', 'productName category price').sort({ createdAt: -1 })
            .lean();
        const salesCount = await Order.countDocuments(filter);
        const totalPages = Math.ceil(salesCount / limit);

        res.render('dashboard', {
            salesCount,
            totalAmount,
            totalDiscount,
            salesReport,
            currentPage: page,
            totalPages,
            limit,
            filterType,
            startDate,
            endDate
        });
    } catch (error) {
        console.log("Error loading sales report:", error);
        res.redirect("/admin/pageError")
    }
};

const downloadSalesReportExcel = async(req, res) => {
    try {
        const filterType = req.query.filterType || 'yearly';
        const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
        const endDate = req.query.endDate ? new Date(req.query.endDate) : null;
        let filter = {};
        switch (filterType) {
            case 'daily':
                filter.createdAt = {
                    $gte: moment().startOf('day').toDate(),
                    $lt: moment().endOf('day').toDate(),
                };
                break;
            case 'weekly':
                filter.createdAt = {
                    $gte: moment().startOf('week').toDate(),
                    $lt: moment().endOf('week').toDate(),
                };
                break;
            case 'yearly':
                filter.createdAt = {
                    $gte: moment().startOf('year').toDate(),
                    $lt: moment().endOf('year').toDate(),
                };
                break;
            case 'custom':
                if (startDate && endDate) {
                    filter.createdAt = {
                        $gte: startDate,
                        $lt: endDate,
                    };
                }
                break;
            default:
                break;
        }

        const salesReport = await Order.find(filter)
            .populate('userId', 'name email')
            .populate('orderedItems.productId', 'productName category price').sort({ createdAt: -1 })
            .lean();

        const workbook = new excel.Workbook();
        const worksheet = workbook.addWorksheet('Sales Report');

        worksheet.addRow(['Order ID', 'Customer Name', 'Customer Email', 'Order Date', 'Discount', 'Final Price']);

        console.log(salesReport,"salesReport")
        salesReport.forEach(order => {
                worksheet.addRow([
                    order._id,
                    order.userId.name,
                    order.userId.email,
                    moment(order.createdAt).format('YYYY-MM-DD HH:mm:ss'),
                    order.discount,
                    order.finalPrice
                ]);
        });

        // Set column widths
        worksheet.columns.forEach(column => {
            column.width = 20;
        });


        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=sales_report.xlsx');
        workbook.xlsx.write(res).then(() => {
            res.end();
        });
    } catch (error) {
        console.log("Error downloading sales report:", error);
        res.redirect("/admin/pageError")
    }
};

const downloadSalesReportPDF = async(req, res) => {
    try {
        const filterType = req.query.filterType || 'yearly';
        const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
        const endDate = req.query.endDate ? new Date(req.query.endDate) : null;
        let filter = {};
        switch (filterType) {
            case 'daily':
                filter.createdAt = {
                    $gte: moment().startOf('day').toDate(),
                    $lt: moment().endOf('day').toDate(),
                };
                break;
            case 'weekly':
                filter.createdAt = {
                    $gte: moment().startOf('week').toDate(),
                    $lt: moment().endOf('week').toDate(),
                };
                break;
            case 'yearly':
                filter.createdAt = {
                    $gte: moment().startOf('year').toDate(),
                    $lt: moment().endOf('year').toDate(),
                };
                break;
            case 'custom':
                if (startDate && endDate) {
                    filter.createdAt = {
                        $gte: startDate,
                        $lt: endDate,
                    };
                }
                break;
            default:
                break;
        }

        const salesReport = await Order.find(filter)
            .populate('userId', 'name email')
            .populate('orderedItems.productId', 'productName category price').sort({ createdAt: -1 })
            .lean();

        const doc = new pdf();
        doc.pipe(res);

        // Title
        doc.fontSize(16).text('Sales Report', { align: 'center' });
        doc.moveDown(1);

        // Table headers
        const headers = ['Order ID', 'Customer Name', 'Customer Email', 'Order Date', 'Total Amount', 'Discount', 'Final Price'];
        const positions = [50, 200, 300, 450, 550, 650, 750];

        headers.forEach((header, index) => {
            doc.fontSize(12).text(header, positions[index], doc.y-7, { width: 100, align: 'left' });
        });
        doc.moveDown(-0.5);

        // Draw line below headers
        doc.moveTo(50, doc.y).lineTo(800, doc.y).stroke();

        salesReport.forEach(order => {
                doc.moveDown(0.9);
                // Table rows (order details)
                const values = [
                    order._id,
                    order.userId.name,
                    order.userId.email,
                    moment(order.createdAt).format('YYYY-MM-DD HH:mm:ss'),
                    order.discount || 0,
                    order.finalPrice
                ];

                values.forEach((value, index) => {
                    doc.fontSize(10).text(value, positions[index], doc.y-7, { width: 100, align: 'left' });
                });
                doc.moveDown(0.2);
        });

        doc.end();
    } catch (error) {
        console.log("Error downloading sales report:", error);
        res.redirect("/admin/pageError");
    }
};

const salesChart = async (req, res) => {
    try {
        const periods = ['daily', 'weekly', 'yearly'];
        const salesData = {};

        for (const period of periods) {
            let filter = {};

            switch (period) {
                case 'daily':
                    filter.createdAt = {
                        $gte: moment().startOf('day').toDate(),
                        $lt: moment().endOf('day').toDate(),
                    };
                    break;
                case 'weekly':
                    filter.createdAt = {
                        $gte: moment().startOf('week').toDate(),
                        $lt: moment().endOf('week').toDate(),
                    };
                    break;
                case 'yearly':
                    filter.createdAt = {
                        $gte: moment().startOf('year').toDate(),
                        $lt: moment().endOf('year').toDate(),
                    };
                    break;
            }

            const orderAmount = await Order.aggregate([
                { $match: filter },
                { $group: { _id: null, totalAmount: { $sum: "$finalPrice" } } }
            ]);

            salesData[period] = orderAmount.length > 0 ? orderAmount[0].totalAmount : 0;
        }

        const topProducts = await Order.aggregate([
            { $unwind: "$orderedItems" },
            {
                $group: {
                    _id: "$orderedItems.productId",
                    orderCount: { $sum: "$orderedItems.quantity" }
                }
            },
            { $sort: { orderCount: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "_id",
                    as: "product"
                }
            },
            { $unwind: "$product" },
            {
                $lookup: {
                    from: "categories",
                    localField: "product.category",
                    foreignField: "_id",
                    as: "category"
                }
            },
            { $unwind: "$category" },
            {
                $project: {
                    productName: "$product.productName",
                    productImage: { $arrayElemAt: ["$product.productImage", 0] }, 
                    categoryName: "$category.name",
                    orderCount: 1
                }
            }
        ]);
        

        // Top 5 Ordered Categories
        const topCategories = await Order.aggregate([
            { $unwind: "$orderedItems" },
            {
                $lookup: {
                    from: "products",
                    localField: "orderedItems.productId",
                    foreignField: "_id",
                    as: "product"
                }
            },
            { $unwind: "$product" },
            {
                $group: {
                    _id: "$product.category",
                    orderCount: { $sum: "$orderedItems.quantity" }
                }
            },
            { $sort: { orderCount: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: "categories",
                    localField: "_id",
                    foreignField: "_id",
                    as: "category"
                }
            },
            { $unwind: "$category" },
            {
                $project: {
                    categoryName: "$category.name",
                    orderCount: 1
                }
            }
        ]);

        res.render("salesChart", { salesData, topProducts, topCategories });
    } catch (error) {
        console.log("Error in sales chart:", error);
        res.status(500).send("Internal server error");
    }
};


module.exports = {
    loadSalesReport,
    downloadSalesReportExcel,
    downloadSalesReportPDF,
    salesChart
}
