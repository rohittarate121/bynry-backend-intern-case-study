const express = require('express');
const app = express();
const { sequelize } = require('./models');

app.use(express.json());

// Routes
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/companies', require('./routes/alertRoutes'));

const PORT = 3000;

sequelize.sync({ force: true }).then(() => {
  console.log('Database synced');
  app.listen(PORT, () => {
    console.log(`http://localhost:3000/ ${PORT}`);
  });
});
