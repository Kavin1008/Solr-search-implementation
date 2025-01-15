const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('categories.db');
const express = require('express');
const router = express.Router();
const axios = require('axios');
const verifyToken = require('../middlewares/verifyToken');
const parseNaturalLanguageQuery = require('../utils/parseNaturalLanguageQuery');
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      productId INTEGER PRIMARY KEY AUTOINCREMENT,
      productName TEXT NOT NULL,
      categoryId INTEGER,
      categoryName TEXT NOT NULL,
      numberOfUnits INTEGER NOT NULL,
      mrp REAL NOT NULL,
      discountPrice REAL NOT NULL,
      description TEXT NOT NULL,
      FOREIGN KEY (categoryId) REFERENCES categories (categoryid) ON DELETE CASCADE
    )
  `);
});

router.post('/product', (req, res) => {
  console.log("Request received");

  const products = req.body; 

  if (!Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ error: 'Request body must be a non-empty array of product objects' });
  }

  for (const product of products) {
    const { productName, categoryId, categoryName, numberOfUnits, mrp, discountPrice, description } = product;

    if (!productName || !categoryId || !categoryName || !numberOfUnits || !mrp || !discountPrice || !description) {
      return res.status(400).json({ error: 'Each product must contain all required fields' });
    }
  }

  const query = `
    INSERT INTO products (productName, categoryId, categoryName, numberOfUnits, mrp, discountPrice, description)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  const insertPromises = products.map((product) => {
    const { productName, categoryId, categoryName, numberOfUnits, mrp, discountPrice, description } = product;

    return new Promise((resolve, reject) => {
      const params = [productName, categoryId, categoryName, numberOfUnits, mrp, discountPrice, description];

      db.run(query, params, function (err) {
        if (err) {
          reject(err.message); 
        } else {
          resolve({ productId: this.lastID, message: 'Product added successfully' });
        }
      });
    });
  });

  Promise.all(insertPromises)
    .then((results) => {
      res.status(201).json({
        message: 'All products added successfully',
        products: results,
      });
    })
    .catch((error) => {
      res.status(500).json({ error: `Failed to add products: ${error}` });
    });
});


router.get('/ptable', verifyToken, (req, res) => {
  const {
    categoryName = '',
    minPrice = 0,
    maxPrice = Infinity,
    minUnits = 0,
    maxUnits = Infinity,
    page = 0,
    limit = 10
  } = req.query;


  const categoryArray = categoryName ? categoryName.split(',').map((cat) => cat.trim()) : [];

  let query = `
    SELECT productId, productName, categoryName, numberOfUnits, mrp, discountPrice
    FROM products
    WHERE 1=1
  `;
  const params = [];

  if (categoryArray.length > 0) {
    const placeholders = categoryArray.map(() => '?').join(',');
    query += ` AND categoryName IN (${placeholders})`;
    params.push(...categoryArray);
  }

  query += ` AND discountPrice BETWEEN ? AND ?`;
  params.push(minPrice, maxPrice);

  query += ` AND numberOfUnits BETWEEN ? AND ?`;
  params.push(minUnits, maxUnits);

  const offset = page * limit;
  query += ` LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    let countQuery = `
      SELECT COUNT(*) AS totalProducts
      FROM products
      WHERE 1=1
    `;
    const countParams = [];

    if (categoryArray.length > 0) {
      const placeholders = categoryArray.map(() => '?').join(',');
      countQuery += ` AND categoryName IN (${placeholders})`;
      countParams.push(...categoryArray);
    }

    countQuery += ` AND discountPrice BETWEEN ? AND ?`;
    countParams.push(minPrice, maxPrice);
    countQuery += ` AND numberOfUnits BETWEEN ? AND ?`;
    countParams.push(minUnits, maxUnits);

    db.get(countQuery, countParams, (countErr, countRow) => {
      if (countErr) {
        return res.status(500).json({ error: countErr.message });
      }

      res.json({
        products: rows,
        totalProducts: countRow.totalProducts
      });
    });
  });
});
router.get('/search', verifyToken, async (req, res) => {
  const { query: userInput, categoryName, page = 1, limit = 10 } = req.query;
  const start = (page - 1) * limit;

  try {
    const { searchTerm, minPrice, maxPrice } = parseNaturalLanguageQuery(userInput);

    let solrQuery = `*${searchTerm}*` || '*:*';

    if (categoryName) {
      const categories = categoryName.split(',').map(cat => cat.trim());
      const categoryQuery = categories.map(cat => `categoryName:"${cat}"`).join(' OR ');
      solrQuery += ` AND (${categoryQuery})`;
    }

    if (minPrice !== null && maxPrice !== null) {
      solrQuery += ` AND discountPrice:[${minPrice} TO ${maxPrice}]`;
    } else if (minPrice !== null) {
      solrQuery += ` AND discountPrice:[${minPrice} TO *]`;
    } else if (maxPrice !== null) {
      solrQuery += ` AND discountPrice:[* TO ${maxPrice}]`;
    }

    const solrUrl = `http://localhost:8983/solr/products/select?q=${encodeURIComponent(solrQuery)}&start=${start}&rows=${limit}&wt=json&defType=edismax&qf=productName^3 description^2 categoryName&pf=productName^5 description^3`;

    const solrResponse = await axios.get(solrUrl);

    const { docs, numFound } = solrResponse.data.response;
    res.json({
      products: docs,
      totalProducts: numFound,
      currentPage: parseInt(page),
      totalPages: Math.ceil(numFound / limit),
    });
  } catch (error) {
    console.error('Error querying Solr:', error.message);
    res.status(500).json({ error: 'Search failed' });
  }
});



  
  
module.exports = router;
