import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { corsHeaders } from '../_shared/cors.ts'

/**
 * Process CSV import from Supabase Storage
 * - Download CSV file
 * - Parse and validate rows
 * - Create product_analyses records
 * - Update import job status
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { jobId, fileName, supplierId } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log(`Processing CSV import: ${fileName} (Job: ${jobId})`)

    // Update job status to processing
    await supabase
      .from('import_jobs')
      .update({ status: 'processing', started_at: new Date().toISOString() })
      .eq('id', jobId)

    // Download CSV from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('supplier-imports')
      .download(fileName)

    if (downloadError) throw downloadError

    const csvText = await fileData.text()
    const lines = csvText.split('\n').filter((line) => line.trim())

    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header row and one data row')
    }

    // Parse header
    const delimiter = lines[0].includes(';') ? ';' : ','
    const headers = lines[0]
      .split(delimiter)
      .map((h) => h.trim().replace(/"/g, '').toLowerCase())

    console.log(`CSV Headers: ${headers.join(', ')}`)

    // Map common column names
    const columnMap: Record<string, string> = {
      ean: 'ean',
      ean13: 'ean',
      barcode: 'ean',
      'code ean': 'ean',
      name: 'product_name',
      nom: 'product_name',
      'nom du produit': 'product_name',
      product: 'product_name',
      produit: 'product_name',
      price: 'selling_price',
      prix: 'selling_price',
      'prix de vente': 'selling_price',
      cost: 'cost_price',
      'prix d\'achat': 'cost_price',
      category: 'category',
      catégorie: 'category',
      brand: 'brand',
      marque: 'brand',
      description: 'long_description',
      stock: 'stock_quantity',
    }

    // Find column indices
    const getColumnIndex = (fieldName: string): number => {
      const index = headers.findIndex((h) => columnMap[h] === fieldName)
      return index
    }

    const eanIndex = getColumnIndex('ean')
    const nameIndex = getColumnIndex('product_name')
    const priceIndex = getColumnIndex('selling_price')
    const costIndex = getColumnIndex('cost_price')
    const categoryIndex = getColumnIndex('category')
    const brandIndex = getColumnIndex('brand')
    const descriptionIndex = getColumnIndex('long_description')
    const stockIndex = getColumnIndex('stock_quantity')

    console.log(`Column mapping: EAN=${eanIndex}, Name=${nameIndex}, Price=${priceIndex}`)

    const results = {
      total_rows: lines.length - 1,
      imported: 0,
      skipped: 0,
      errors: [] as string[],
    }

    // Get user from supplier
    const { data: supplier } = await supabase
      .from('supplier_configurations')
      .select('user_id')
      .eq('id', supplierId)
      .single()

    const userId = supplier?.user_id

    // Process each row
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i]
          .split(delimiter)
          .map((v) => v.trim().replace(/^"|"$/g, ''))

        // Skip empty rows
        if (values.every((v) => !v)) {
          results.skipped++
          continue
        }

        const productData: Record<string, unknown> = {
          user_id: userId,
          source_supplier_id: supplierId,
        }

        // Extract values
        if (eanIndex >= 0 && values[eanIndex]) {
          productData.ean = values[eanIndex]
        }

        if (nameIndex >= 0 && values[nameIndex]) {
          productData.product_name = values[nameIndex]
        }

        if (priceIndex >= 0 && values[priceIndex]) {
          const price = parseFloat(values[priceIndex].replace(/[^\d.,]/g, '').replace(',', '.'))
          if (!isNaN(price)) productData.selling_price = price
        }

        if (costIndex >= 0 && values[costIndex]) {
          const cost = parseFloat(values[costIndex].replace(/[^\d.,]/g, '').replace(',', '.'))
          if (!isNaN(cost)) productData.cost_price = cost
        }

        if (categoryIndex >= 0 && values[categoryIndex]) {
          productData.category = values[categoryIndex]
        }

        if (brandIndex >= 0 && values[brandIndex]) {
          productData.brand = values[brandIndex]
        }

        if (descriptionIndex >= 0 && values[descriptionIndex]) {
          productData.long_description = values[descriptionIndex]
        }

        if (stockIndex >= 0 && values[stockIndex]) {
          const stock = parseInt(values[stockIndex], 10)
          if (!isNaN(stock)) productData.stock_quantity = stock
        }

        // Set initial enrichment status
        productData.enrichment_status = {
          amazon: { status: 'pending' },
          specifications: { status: 'pending' },
          rsgp: { status: 'pending' },
        }

        // Insert product
        const { error: insertError } = await supabase
          .from('product_analyses')
          .insert(productData)

        if (insertError) {
          console.error(`Error inserting row ${i}:`, insertError)
          results.errors.push(`Row ${i}: ${insertError.message}`)
          results.skipped++
        } else {
          results.imported++
        }
      } catch (error) {
        console.error(`Error processing row ${i}:`, error)
        results.errors.push(`Row ${i}: ${error.message}`)
        results.skipped++
      }
    }

    // Update job status
    await supabase
      .from('import_jobs')
      .update({
        status: results.imported > 0 ? 'completed' : 'failed',
        completed_at: new Date().toISOString(),
        total_rows_processed: results.total_rows,
        successful_imports: results.imported,
        failed_imports: results.skipped,
        error_log: results.errors.length > 0 ? results.errors : null,
      })
      .eq('id', jobId)

    console.log(`✓ CSV import completed: ${results.imported} products imported`)

    return new Response(
      JSON.stringify({
        success: true,
        job_id: jobId,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('CSV import error:', error)

    // Update job status to failed
    if (req.json && (await req.json()).jobId) {
      const { jobId } = await req.json()
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      await supabase
        .from('import_jobs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_log: [error.message],
        })
        .eq('id', jobId)
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
