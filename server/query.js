import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const productSchema = new mongoose.Schema({}, { strict: false });
const Product = mongoose.model('Product', productSchema, 'products');

async function queryProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Query Montana Black product
    const montanaBlack = await Product.findOne({ name: /Montana Black/i });
    if (montanaBlack) {
      console.log('\n=== MONTANA BLACK ===');
      console.log('Name:', montanaBlack.name);
      console.log('First 3 Color Variants:');
      if (montanaBlack.colorVariants && montanaBlack.colorVariants.length > 0) {
        montanaBlack.colorVariants.slice(0, 3).forEach((color, idx) => {
          console.log(`  ${idx + 1}. Code: ${color.code}, Name: ${color.name}`);
        });
      }
    } else {
      console.log('Montana Black product not found');
    }

    // Query MTN94 product
    const mtn94 = await Product.findOne({ name: /MTN94/i });
    if (mtn94) {
      console.log('\n=== MTN94 ===');
      console.log('Name:', mtn94.name);
      console.log('First 3 Color Variants:');
      if (mtn94.colorVariants && mtn94.colorVariants.length > 0) {
        mtn94.colorVariants.slice(0, 3).forEach((color, idx) => {
          console.log(`  ${idx + 1}. Code: ${color.code}, Name: ${color.name}`);
        });
      }
    } else {
      console.log('MTN94 product not found');
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

queryProducts();
