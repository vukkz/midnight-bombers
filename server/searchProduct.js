import mongoose from 'mongoose';

mongoose.connect('mongodb://localhost:27017/spray');

const db = mongoose.connection;

db.once('open', async function() {
  try {
    const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
    
    // Search for products containing "MTN" and "94"
    const products = await Product.find({ 
      name: { $regex: 'MTN.*94', $options: 'i' } 
    }).limit(10);
    
    console.log('Products matching "MTN...94":');
    console.log('========================================');
    products.forEach((p, i) => {
      console.log(`${i + 1}. ${p.name} (variants: ${p.colorVariants ? p.colorVariants.length : 0})`);
    });
    
    if (products.length === 0) {
      console.log('No products found. Searching for just "MTN":');
      const mtnProducts = await Product.find({ 
        name: { $regex: 'MTN', $options: 'i' } 
      }).limit(10);
      
      mtnProducts.forEach((p, i) => {
        console.log(`${i + 1}. ${p.name} (variants: ${p.colorVariants ? p.colorVariants.length : 0})`);
      });
    }
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    mongoose.connection.close();
  }
});
