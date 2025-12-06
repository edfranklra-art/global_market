// ====================================================
// 1. REPORTE DE VENTAS POR CATEGORÍA Y MES
// ====================================================

const pipelineReporteVentas = [
  {
    $match: {
      payment_status: "completed",
      sale_date: { $exists: true },
      category: { $exists: true },
      total_amount: { $gt: 0 }
    }
  },
  {
    $group: {
      _id: {
        categoria: "$category",
        año: { $year: "$sale_date" },
        mes: { $month: "$sale_date" }
      },
      total_ventas: { $sum: 1 },
      total_ingresos: { $sum: "$total_amount" },
      cantidad_total: { $sum: "$quantity" },
      precio_promedio: { $avg: "$unit_price" }
    }
  },
  {
    $project: {
      _id: 0,
      categoria: "$_id.categoria",
      año: "$_id.año",
      mes: "$_id.mes",
      total_ventas: 1,
      total_ingresos: 1,
      cantidad_total: 1,
      precio_promedio: { $round: ["$precio_promedio", 2] },
      ticket_promedio: {
        $round: [
          { $divide: ["$total_ingresos", "$total_ventas"] },
          2
        ]
      },
      unidades_por_venta: {
        $round: [
          { $divide: ["$cantidad_total", "$total_ventas"] },
          2
        ]
      },
      mes_nombre: {
        $switch: {
          branches: [
            { case: { $eq: ["$_id.mes", 1] }, then: "Enero" },
            { case: { $eq: ["$_id.mes", 2] }, then: "Febrero" },
            { case: { $eq: ["$_id.mes", 3] }, then: "Marzo" },
            { case: { $eq: ["$_id.mes", 4] }, then: "Abril" },
            { case: { $eq: ["$_id.mes", 5] }, then: "Mayo" },
            { case: { $eq: ["$_id.mes", 6] }, then: "Junio" },
            { case: { $eq: ["$_id.mes", 7] }, then: "Julio" },
            { case: { $eq: ["$_id.mes", 8] }, then: "Agosto" },
            { case: { $eq: ["$_id.mes", 9] }, then: "Septiembre" },
            { case: { $eq: ["$_id.mes", 10] }, then: "Octubre" },
            { case: { $eq: ["$_id.mes", 11] }, then: "Noviembre" },
            { case: { $eq: ["$_id.mes", 12] }, then: "Diciembre" }
          ],
          default: "Mes desconocido"
        }
      }
    }
  },
  {
    $sort: {
      año: -1,
      mes: -1,
      total_ingresos: -1
    }
  }
];

// ====================================================
// 2. TOP PRODUCTOS CON MEJOR CALIFICACIÓN
// ====================================================

const pipelineTopProductos = [
  {
    $match: {
      "rating.count": { $gte: 50 },
      "rating.average": { $gte: 0 }
    }
  },
  {
    $project: {
      _id: 0,
      product_id: 1,
      nombre: "$name",
      rating_promedio: { $round: ["$rating.average", 2] },
      total_resenas: "$rating.count",
      precio_actual: "$price.discounted",
      categoria_principal: { $arrayElemAt: ["$category", 0] },
      score_ponderado: {
        $round: [
          {
            $multiply: [
              "$rating.average",
              { $log10: { $add: [1, "$rating.count"] } }
            ]
          },
          3
        ]
      }
    }
  },
  {
    $sort: {
      score_ponderado: -1,
      rating_promedio: -1,
      total_resenas: -1
    }
  }
];

// ====================================================
// 3. AGRUPACIÓN DE PRODUCTOS POR RANGOS DE PRECIO
// ====================================================

const pipelineRangosPrecio = [
  {
    $match: {
      "price.discounted": { $gt: 0 }
    }
  },
  {
    $bucket: {
      groupBy: "$price.discounted",
      boundaries: [0, 1000, 5000, 10000, 50000, 100000],
      default: "Premium (100,000+)",
      output: {
        cantidad_productos: { $sum: 1 },
        precio_minimo: { $min: "$price.discounted" },
        precio_maximo: { $max: "$price.discounted" },
        precio_promedio: { $avg: "$price.discounted" },
        rating_promedio: { $avg: "$rating.average" },
        total_resenas: { $sum: "$rating.count" }
      }
    }
  },
  {
    $project: {
      _id: 0,
      rango_precio: {
        $switch: {
          branches: [
            { case: { $eq: ["$_id", 0] }, then: "Muy Bajo (0-999)" },
            { case: { $eq: ["$_id", 1000] }, then: "Bajo (1,000-4,999)" },
            { case: { $eq: ["$_id", 5000] }, then: "Medio (5,000-9,999)" },
            { case: { $eq: ["$_id", 10000] }, then: "Medio-Alto (10,000-49,999)" },
            { case: { $eq: ["$_id", 50000] }, then: "Alto (50,000-99,999)" }
          ],
          default: "Premium (100,000+)"
        }
      },
      cantidad_productos: 1,
      precio_minimo: { $round: ["$precio_minimo", 2] },
      precio_maximo: { $round: ["$precio_maximo", 2] },
      precio_promedio: { $round: ["$precio_promedio", 2] },
      rating_promedio: { $round: ["$rating_promedio", 2] },
      total_resenas: 1
    }
  },
  {
    $sort: {
      precio_promedio: 1
    }
  }
];

// ====================================================
// FUNCIONES PARA EJECUTAR LOS PIPELINES
// ====================================================

/**
 * Ejecuta el pipeline de reporte de ventas
 * @param {Collection} collection - Colección de MongoDB
 * @returns {Promise<Array>} Resultados del pipeline
 */
async function generarReporteVentas(collection) {
  try {
    const resultados = await collection.aggregate(pipelineReporteVentas).toArray();
    console.log(`✓ Reporte de ventas generado: ${resultados.length} registros`);
    return resultados;
  } catch (error) {
    console.error("✗ Error al generar reporte de ventas:", error);
    throw error;
  }
}

/**
 * Ejecuta el pipeline de top productos
 * @param {Collection} collection - Colección de productos de MongoDB
 * @returns {Promise<Array>} Resultados del pipeline
 */
async function obtenerTopProductos(collection) {
  try {
    const resultados = await collection.aggregate(pipelineTopProductos).toArray();
    console.log(`✓ Top productos generado: ${resultados.length} productos`);
    return resultados;
  } catch (error) {
    console.error("✗ Error al obtener top productos:", error);
    throw error;
  }
}

/**
 * Ejecuta el pipeline de rangos de precio
 * @param {Collection} collection - Colección de productos de MongoDB
 * @returns {Promise<Array>} Resultados del pipeline
 */
async function analizarRangosPrecio(collection) {
  try {
    const resultados = await collection.aggregate(pipelineRangosPrecio).toArray();
    console.log(`✓ Análisis por rangos de precio: ${resultados.length} rangos`);
    return resultados;
  } catch (error) {
    console.error("✗ Error al analizar rangos de precio:", error);
    throw error;
  }
}