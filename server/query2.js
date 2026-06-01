import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const productSchema = new mongoose.Schema({}, { strict: false });
const Product = mongoose.model('Product', productSchema, 'products');

async function queryProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // List all product names
    const allProducts = await Product.find({}, { name: 1 });
    console.log('All Products in Database:');
    allProducts.forEach((p, idx) => {
      console.log(`  ${idx + 1}. ${p.name}`);
    });

    // Try different MTN94 search patterns
    console.log('\n=== Searching for MTN94 ===');
    const mtn94Variants = await Product.find({ name: { $regex: 'MTN', $options: 'i' } });
    console.log(`Found ${mtn94Variants.length} products with "MTN" in name`);
    mtn94Variants.forEach(p => console.log(`  - ${p.name}`));

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

queryProducts();
