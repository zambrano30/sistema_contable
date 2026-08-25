import html2pdf from 'html2pdf.js'

/**
 * Generate PDF invoice in SRI format (Ecuador)
 * @param {Object} invoice - Invoice data
 * @param {Array} items - Invoice items
 * @param {Object} client - Client data
 * @param {Object} company - Company data
 * @returns {void} - Downloads PDF
 */
export function generateInvoicePDF(invoice, items, client, company = {}) {
  try {
    const companyData = {
      name: 'Pasteles Don Chris',
      ruc: '0940805997011',
      address: 'Quevedo, Los Ríos, Ecuador',
      ...company,
    }
    // Format numbers
    const formatCurrency = (num) => {
      return new Intl.NumberFormat('es-EC', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(num)
    }

    const formatNumber = (num) => num.toFixed(2)

    // Calculate totals
    const subtotal = items.reduce((sum, item) => {
      const itemTotal = item.quantity * item.unit_price
      return sum + itemTotal
    }, 0)

    const taxAmount = 0
    const total = invoice.total_amount || subtotal

    // Generate HTML for PDF - MEJORADO
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            color: #000000 !important;
          }
          body {
            font-family: 'Courier New', monospace;
            width: 80mm;
            font-size: 10px;
            color: #000000 !important;
            background: #ffffff !important;
            line-height: 1.5;
          }
          .container {
            width: 80mm;
            min-height: 120mm;
            padding: 4mm;
            color: #000000 !important;
            background: #ffffff !important;
          }
          .header {
            border-bottom: none;
            padding-bottom: 4mm;
            margin-bottom: 4mm;
          }
          .header-top {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 3mm;
          }
          .company-info h1 {
            font-size: 16px;
            font-weight: bold;
            color: #000000;
            margin-bottom: 3px;
          }
          .company-info p {
            font-size: 12px;
            color: #000000;
            margin: 1px 0;
            font-weight: normal;
          }
          .invoice-title {
            width: 100%;
            text-align: left;
          }
          .invoice-title .title {
            font-size: 15px;
            font-weight: bold;
            color: #000000;
            margin-bottom: 5px;
          }
          .invoice-title .number {
            font-size: 12px;
            font-weight: bold;
            color: #000000;
          }
          .invoice-title .date {
            font-size: 12px;
            color: #000000;
            margin-top: 5px;
          }
          .section {
            margin: 5mm 0;
          }
          .section-title {
            font-size: 13px;
            font-weight: bold;
            color: #000000;
            border-bottom: none;
            padding-bottom: 3px;
            margin-bottom: 6px;
          }
          .two-column {
            display: flex;
            flex-direction: column;
            gap: 3mm;
          }
          .column {
            flex: 1;
          }
          .info-row {
            display: flex;
            margin: 3px 0;
            font-size: 12px;
          }
          .label {
            font-weight: bold;
            color: #000000;
            width: 85px;
            min-width: 85px;
          }
          .value {
            color: #000000;
            flex: 1;
            word-break: break-word;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 5mm 0;
            font-size: 9px;
          }
          table thead {
            background: #e0e0e0;
            border: none;
          }
          table th {
            padding: 6px;
            text-align: left;
            font-weight: bold;
            color: #000000;
            border: none;
          }
          table td {
            padding: 6px;
            border: none;
            color: #000000;
          }
          table tbody tr:nth-child(even) {
            color: #000000 !important;
            background: transparent !important;
          }
          .text-right {
            text-align: right;
          }
          .text-center {
            text-align: center;
          }
          .totals {
            margin: 5mm 0;
            display: flex;
            justify-content: flex-end;
          }
          .totals-content {
            width: 280px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            font-size: 12px;
            color: #000000;
            border-bottom: none;
          }
          .total-row.subtotal {
            font-weight: normal;
          }
          .total-row.tax {
            font-weight: normal;
          }
          .total-row.grand-total {
            font-weight: bold;
            font-size: 14px;
            border: none;
            padding: 8px 0;
            background: transparent;
          }
          .total-label {
            font-weight: normal;
            color: #000000;
          }
          .total-value {
            text-align: right;
            color: #000000;
            font-weight: normal;
          }
          .grand-total-label {
            color: #000000;
            font-weight: bold;
          }
          .grand-total-value {
            color: #000000;
            font-weight: bold;
          }
          .footer {
            margin-top: 8mm;
            border-top: none;
            padding-top: 5mm;
            font-size: 11px;
            text-align: center;
            color: #000000;
          }
          .authorization-box {
            border: none;
            padding: 8px;
            margin: 10mm 0;
            text-align: center;
            font-size: 12px;
            color: #000000;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- ENCABEZADO -->
          <div class="header">
            <div class="header-top">
              <div class="company-info">
                <h1>${companyData.name || 'MI EMPRESA'}</h1>
                <p><span class="label">RUC:</span> ${companyData.ruc || '___________________'}</p>
                <p><span class="label">Dirección:</span> ${companyData.address || '___________________'}</p>
                <p><span class="label">Teléfono:</span> ${companyData.phone || '___________________'}</p>
                <p><span class="label">Email:</span> ${companyData.email || '___________________'}</p>
              </div>
              <div class="invoice-title">
                <div class="title">FACTURA</div>
                <div class="number">${invoice.invoice_number || 'INV-0000001'}</div>
                <div class="date">Fecha: ${new Date(invoice.invoice_date).toLocaleDateString('es-ES')}</div>
              </div>
            </div>
          </div>

          <!-- CLIENTE E INFORMACIÓN -->
          <div class="two-column">
            <div class="column">
              <div class="section-title">CLIENTE</div>
              <div class="info-row">
                <span class="label">Nombre:</span>
                <span class="value">${client.name || 'Cliente'}</span>
              </div>
              <div class="info-row">
                <span class="label">RUC/CI:</span>
                <span class="value">${client.tax_id || '___________________'}</span>
              </div>
              <div class="info-row">
                <span class="label">Dirección:</span>
                <span class="value">${client.address || '___________________'}</span>
              </div>
              <div class="info-row">
                <span class="label">Ciudad:</span>
                <span class="value">${client.city || '___________________'}</span>
              </div>
              <div class="info-row">
                <span class="label">Teléfono:</span>
                <span class="value">${client.phone || '___________________'}</span>
              </div>
              <div class="info-row">
                <span class="label">Email:</span>
                <span class="value">${client.email || '___________________'}</span>
              </div>
            </div>
            <div class="column">
              <div class="section-title">INFORMACIÓN FACTURA</div>
              <div class="info-row">
                <span class="label">Fecha Emisión:</span>
                <span class="value">${new Date(invoice.invoice_date).toLocaleDateString('es-ES')}</span>
              </div>
              <div class="info-row">
                <span class="label">Fecha Vencimiento:</span>
                <span class="value">${invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('es-ES') : 'Pago inmediato'}</span>
              </div>
              <div class="info-row">
                <span class="label">Condición:</span>
                <span class="value">Contado</span>
              </div>
              <div class="info-row">
                <span class="label">Estado:</span>
                <span class="value">${invoice.status || 'Emitida'}</span>
              </div>
            </div>
          </div>

          <!-- TABLA DE PRODUCTOS -->
          <table>
            <thead>
              <tr>
                <th style="width: 10%;">Código</th>
                <th style="width: 40%;">Descripción</th>
                <th style="width: 15%; text-align: center;">Cantidad</th>
                <th style="width: 18%; text-align: right;">Valor Unit.</th>
                <th style="width: 17%; text-align: right;">Valor Total</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((item, idx) => {
                const itemTotal = item.quantity * item.unit_price
                return `
                  <tr>
                    <td>${item.product_id || idx + 1}</td>
                    <td>${item.description || 'Producto'}</td>
                    <td class="text-center">${formatNumber(item.quantity)}</td>
                    <td class="text-right">${formatCurrency(item.unit_price)}</td>
                    <td class="text-right">${formatCurrency(itemTotal)}</td>
                  </tr>
                `
              }).join('')}
            </tbody>
          </table>

          <!-- TOTALES -->
          <div class="totals">
            <div class="totals-content">
              <div class="total-row subtotal">
                <span class="total-label">Subtotal:</span>
                <span class="total-value">${formatCurrency(subtotal)}</span>
              </div>
              <div class="total-row grand-total">
                <span class="grand-total-label">TOTAL:</span>
                <span class="grand-total-value">${formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          <!-- SECCIÓN SRI -->
          <div class="authorization-box">
            <div style="font-weight: bold; margin-bottom: 5px;">NÚMERO DE AUTORIZACIÓN SRI</div>
            <div style="height: 8px;"></div>
            <div style="font-size: 10px; margin-top: 5px; color: #666666;">Se completará cuando obtenga autorización del SRI</div>
          </div>

          <!-- PIE DE PÁGINA -->
          <div class="footer">
            <p>Esta factura ha sido emitida por FacturaPro Sistema Contable</p>
            <p>Conserve esta copia para sus registros contables y fiscales</p>
            <p style="font-size: 10px; margin-top: 5px;">Impreso: ${new Date().toLocaleString('es-ES')}</p>
          </div>
        </div>
      </body>
      </html>
    `

    // PDF Options
    const options = {
      margin: [0, 0, 0, 0],
      filename: `Factura-${invoice.invoice_number || 'XXXXXX'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 4,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      },
      jsPDF: { 
        orientation: 'portrait', 
        unit: 'mm', 
        format: [80, 220],
        compress: false
      }
    }

    // Render from an isolated DOM node so the application theme cannot override the invoice.
    const renderRoot = document.createElement('div')
    renderRoot.innerHTML = htmlContent
    renderRoot.style.position = 'fixed'
    renderRoot.style.left = '-10000px'
    renderRoot.style.top = '0'
    renderRoot.style.width = '80mm'
    renderRoot.style.backgroundColor = '#ffffff'
    renderRoot.style.color = '#000000'
    document.body.appendChild(renderRoot)

    const invoiceElement = renderRoot.querySelector('.container')
    html2pdf().set(options).from(invoiceElement).save().then(() => {
      renderRoot.remove()
    }).catch((error) => {
      renderRoot.remove()
      console.error('Error generating invoice PDF:', error)
    })
  } catch (error) {
    console.error('Error generating invoice PDF:', error)
    throw error
  }
}

/**
 * Generate multiple invoices PDFs as ZIP
 * Useful for batch exports
 */
export function generateMultipleInvoicesPDF(invoices) {
  try {
    invoices.forEach((invoice) => {
      generateInvoicePDF(
        invoice.invoice,
        invoice.items,
        invoice.client,
        invoice.company
      )
    })
  } catch (error) {
    console.error('Error generating multiple PDFs:', error)
    throw error
  }
}
