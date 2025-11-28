const express = require('express');
const cors = require('cors');
const {connect} = require('mongoose')
require('dotenv').config();

const Routes = require('./routes/Routes')
const {notFound, errorHandler} = require('./middleware/errorMiddleware')

const app = express();
// express.json doesn't accept `extended` — that option is for urlencoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ credentials: true, origin: ['http://localhost:3000'] }));

const PORT = process.env.PORT || 5000;

app.use('/api', Routes);
app.use(notFound);
app.use(errorHandler);

connect(process.env.MONGO_URL)
    .then(() => app.listen(PORT, () => console.log(`Server started on port ${PORT}`)))
    .catch((error) => console.log(error.message));