import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, AlignmentType, WidthType, HeadingLevel } from 'docx'
import { saveAs } from 'file-saver'
import { format } from 'date-fns'

/**
 * Export orders data to DOCX format
 * @param {Array} orders - Array of order objects
 * @param {Object} options - Export options
 * @returns {Promise} - Promise that resolves when export is complete
 */
export const exportOrdersToDocx = async (orders, options = {}) => {
  const {
    title = 'Metro Manila Hills Hardware - Order Report',
    includeCustomerDetails = true,
    includeSummary = true,
    fileName = `orders-report-${format(new Date(), 'yyyy-MM-dd-HHmm')}.docx`
  } = options

  if (!orders || orders.length === 0) {
    throw new Error('No orders to export')
  }

  // Helper function to format price
  const formatPrice = (amount) => {
    return amount.toLocaleString('en-PH')
  }

  // Helper function to format date
  const formatDate = (date) => {
    return format(date, 'MMM d, yyyy h:mm a')
  }

  // Create document header
  const children = [
    new Paragraph({
      text: title,
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      text: `Generated on: ${format(new Date(), 'MMMM d, yyyy h:mm a')}`,
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      text: `Total Orders: ${orders.length}`,
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph(""),
  ]

  // Create table headers
  const headers = [
    { text: "Order #", width: 15 },
    { text: "Date", width: 15 },
    { text: "Customer", width: 20 },
    { text: "Items", width: 25 },
    { text: "Total", width: 10 },
    { text: "Status", width: 15 }
  ]

  const tableRows = [
    new TableRow({
      children: headers.map(header => 
        new TableCell({
          children: [new Paragraph({ text: header.text, alignment: AlignmentType.CENTER })],
          width: { size: header.width, type: WidthType.PERCENTAGE },
        })
      ),
    }),
  ]

  // Add order data rows
  orders.forEach(order => {
    const itemsText = order.items && order.items.length > 0 
      ? order.items.map(item => `${item.name} (x${item.quantity})`).join(', ')
      : 'No items'
    
    const customerInfo = includeCustomerDetails && order.customer
      ? [
          new Paragraph(order.customer.name || 'N/A'),
          new Paragraph({
            children: [
              new TextRun({
                text: order.customer.phone || '',
                size: 18,
                color: "666666",
              }),
            ],
          }),
        ]
      : [new Paragraph(order.customer?.name || 'N/A')]
    
    tableRows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph(`#${order.id.slice(-6)}`)],
          }),
          new TableCell({
            children: [new Paragraph(formatDate(order.createdAt))],
          }),
          new TableCell({
            children: customerInfo,
          }),
          new TableCell({
            children: [new Paragraph(itemsText)],
          }),
          new TableCell({
            children: [new Paragraph(`₱${formatPrice(order.total || 0)}`)],
          }),
          new TableCell({
            children: [new Paragraph(order.status || 'Unknown')],
          }),
        ],
      })
    )
  })

  // Create the table
  const table = new Table({
    rows: tableRows,
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
  })

  children.push(table)

  // Add summary section if requested
  if (includeSummary) {
    const totalAmount = orders.reduce((sum, order) => sum + (order.total || 0), 0)
    const statusCounts = orders.reduce((counts, order) => {
      const status = order.status || 'Unknown'
      counts[status] = (counts[status] || 0) + 1
      return counts
    }, {})

    children.push(
      new Paragraph(""),
      new Paragraph({
        text: "Summary",
        heading: HeadingLevel.HEADING_2,
      }),
      new Paragraph(`Total Revenue: ₱${formatPrice(totalAmount)}`),
      new Paragraph(`Average Order Value: ₱${formatPrice(totalAmount / orders.length)}`),
      new Paragraph(""),
      new Paragraph({
        text: "Orders by Status:",
        heading: HeadingLevel.HEADING_3,
      })
    )

    Object.entries(statusCounts).forEach(([status, count]) => {
      children.push(new Paragraph(`${status}: ${count} orders`))
    })
  }

  // Create the document
  const doc = new Document({
    sections: [
      {
        children: children,
      },
    ],
  })

  // Generate and save the document
  const blob = await Packer.toBlob(doc)
  saveAs(blob, fileName)
  
  return fileName
}

/**
 * Export a single order to DOCX format
 * @param {Object} order - Order object
 * @param {Object} options - Export options
 * @returns {Promise} - Promise that resolves when export is complete
 */
export const exportSingleOrderToDocx = async (order, options = {}) => {
  const {
    title = 'Metro Manila Hills Hardware - Order Details',
    fileName = `order-${order.id.slice(-6)}-${format(new Date(), 'yyyy-MM-dd-HHmm')}.docx`
  } = options

  if (!order) {
    throw new Error('No order to export')
  }

  // Helper function to format price
  const formatPrice = (amount) => {
    return amount.toLocaleString('en-PH')
  }

  // Helper function to format date
  const formatDate = (date) => {
    return format(date, 'MMMM d, yyyy h:mm a')
  }

  const children = [
    new Paragraph({
      text: title,
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      text: `Order #${order.id.slice(-6)}`,
      heading: HeadingLevel.HEADING_2,
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph(""),
    
    // Customer Details
    new Paragraph({
      text: "Customer Information",
      heading: HeadingLevel.HEADING_3,
    }),
    new Paragraph(`Name: ${order.customer?.name || 'N/A'}`),
    new Paragraph(`Phone: ${order.customer?.phone || 'N/A'}`),
    new Paragraph(`Address: ${order.customer?.address || 'N/A'}`),
    new Paragraph(`Delivery Option: ${order.customer?.deliveryOption || 'N/A'}`),
    new Paragraph(`Payment Method: ${order.customer?.paymentMethod || 'N/A'}`),
    new Paragraph(""),
    
    // Order Details
    new Paragraph({
      text: "Order Details",
      heading: HeadingLevel.HEADING_3,
    }),
    new Paragraph(`Order Date: ${formatDate(order.createdAt)}`),
    new Paragraph(`Status: ${order.status || 'Unknown'}`),
    new Paragraph(""),
    
    // Items
    new Paragraph({
      text: "Items Ordered",
      heading: HeadingLevel.HEADING_3,
    }),
  ]

  // Add items table
  if (order.items && order.items.length > 0) {
    const itemTableRows = [
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ text: "Item Name", alignment: AlignmentType.CENTER })],
            width: { size: 50, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [new Paragraph({ text: "Quantity", alignment: AlignmentType.CENTER })],
            width: { size: 20, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [new Paragraph({ text: "Unit Price", alignment: AlignmentType.CENTER })],
            width: { size: 15, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [new Paragraph({ text: "Total", alignment: AlignmentType.CENTER })],
            width: { size: 15, type: WidthType.PERCENTAGE },
          }),
        ],
      }),
    ]

    order.items.forEach(item => {
      itemTableRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph(item.name || 'N/A')],
            }),
            new TableCell({
              children: [new Paragraph({ text: String(item.quantity || 0), alignment: AlignmentType.CENTER })],
            }),
            new TableCell({
              children: [new Paragraph({ text: `₱${formatPrice(item.price || 0)}`, alignment: AlignmentType.RIGHT })],
            }),
            new TableCell({
              children: [new Paragraph({ text: `₱${formatPrice((item.price || 0) * (item.quantity || 0))}`, alignment: AlignmentType.RIGHT })],
            }),
          ],
        })
      )
    })

    const itemsTable = new Table({
      rows: itemTableRows,
      width: {
        size: 100,
        type: WidthType.PERCENTAGE,
      },
    })

    children.push(itemsTable)
  } else {
    children.push(new Paragraph("No items in this order"))
  }

  // Order Summary
  children.push(
    new Paragraph(""),
    new Paragraph({
      text: "Order Summary",
      heading: HeadingLevel.HEADING_3,
    }),
    new Paragraph(`Subtotal: ₱${formatPrice(order.subtotal || 0)}`),
    new Paragraph(`Delivery Fee: ₱${formatPrice(order.deliveryFee || 0)}`),
    new Paragraph({
      children: [
        new TextRun({
          text: `Total: ₱${formatPrice(order.total || 0)}`,
          bold: true,
          size: 24,
        }),
      ],
    })
  )

  // Create the document
  const doc = new Document({
    sections: [
      {
        children: children,
      },
    ],
  })

  // Generate and save the document
  const blob = await Packer.toBlob(doc)
  saveAs(blob, fileName)
  
  return fileName
}