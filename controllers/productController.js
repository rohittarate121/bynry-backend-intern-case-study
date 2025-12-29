const { Product, Inventory, sequelize } = require('../models');


const createProduct = async (req, res) => {
  const data = req.body;

  // Basic validation
  if (
    !data.name ||
    !data.sku ||
    !data.price ||
    !data.warehouse_id ||
    data.initial_quantity === undefined
  ) {
    return res.status(400).json({
      error: 'Missing required fields'
    });
  }

  try {
    // Check if SKU already exists
    const existingProduct = await Product.findOne({
      where: { sku: data.sku }
    });

    if (existingProduct) {
      return res.status(409).json({
        error: 'SKU already exists'
      });
    }

  // Use transaction to keep data safe
    const result = await sequelize.transaction(async (t) => {
      const product = await Product.create(
        {
          name: data.name,
          sku: data.sku,
          price: parseFloat(data.price)
        },
        { transaction: t }
      );

      await Inventory.create(
        {
          product_id: product.id,
          warehouse_id: data.warehouse_id,
          quantity: data.initial_quantity
        },
        { transaction: t }
      );

      return product;
    });

    return res.status(201).json({
      message: 'Product created successfully',
      product_id: result.id
    });

  } catch (error) {
    console.error
    return res.status(500).json({
      error: 'Something went wrong while creating product'
    });
  }
};

module.exports = { createProduct };
