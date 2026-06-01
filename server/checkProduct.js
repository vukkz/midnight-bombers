import mongoose from 'mongoose';

mongoose.connect('mongodb://localhost:27017/spray', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', async function() {
  try {
    const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
    
    const product = await Product.findOne({ name: 'MTN Cans 94 400ml' });
    
    if (product) {
      console.log('Product found: ' + product.name);
      console.log('Total color variants: ' + product.colorVariants.length);
      console.log('\nFirst 5 color variants:');
      console.log('========================================');
      
      const first5 = product.colorVariants.slice(0, 5);
      first5.forEach((variant, index) => {
        const prefix = variant.code.substring(0, 3);
        const isCorrect = prefix === 'RV' ? '✓ CORRECT' : (prefix === 'BLK' ? '✗ WRONG' : '? UNKNOWN');
        console.log(`${index + 1}. Code: ${variant.code} [${isCorrect}] - Name: ${variant.name}`);
      });
      
      console.log('========================================');
      const correctCount = first5.filter(v => v.code.startsWith('RV')).length;
      const wrongCount = first5.filter(v => v.code.startsWith('BLK')).length;
      console.log(`Summary: ${correctCount} correct (RV), ${wrongCount} wrong (BLK)`);
    } else {
      console.log('Product "MTN Cans 94 400ml" not found');
    }
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    mongoose.connection.close();
  }
});
