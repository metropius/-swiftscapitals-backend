// const mongoose = require('mongoose');
// const connectDB = async()=> {
//   try {
//     mongoose.set('strictQuery', false);
//     const conn = await mongoose.connect(process.env.MONGO_URI);
//     console.log(`Database Connected: ${conn.connection.host}`);
//   } catch (error) {
//     console.log(error);
//   }
// }



// module.exports = connectDB;


const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    mongoose.set('strictQuery', false);
    
    // Temporarily put your full connection string here for testing
    const conn = await mongoose.connect(process.env.MONGO_URI || "mongodb+srv://marcelpolocha1:081358pius@cluster0.f9a85hv.mongodb.net/switchswiftBank");
    
    console.log(`Database Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log("MongoDB Connection Error:", error.message);
  }
};

module.exports = connectDB;