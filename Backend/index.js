const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
const categoryTableRoutes = require('./routes/categoryTable');
const productTableRoutes = require('./routes/productTable');
const cors = require('cors');

const corsOptions ={
    origin: 'http://localhost:5173', 
    credentials:true,            
    optionSuccessStatus:200,
 }
 
 
const app = express();
app.use(cors(corsOptions))
app.use(bodyParser.json());

app.use('/api/auth', authRoutes);
app.use('/api', categoryTableRoutes);
app.use('/api', productTableRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
