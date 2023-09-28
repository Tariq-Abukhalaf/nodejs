const express    = require('express');
const app        = express();
const jobsRouter = require('./src/routes/api/jobs.route');

const dashboardRouter = require('./src/routes/web/dashboard.route');
/**
 * middleware
 */
const { checkUrl }      = require('./src/middlewares/url.middleware');
const { checkCallback } = require('./src/middlewares/callback.middleware');
const { checkWidth }    = require('./src/middlewares/width.middleware');
const { checkHeight }   = require('./src/middlewares/height.middleware');

require('dotenv').config();

const serverName = process.env.SERVER_NAME;
const port       = process.env.SERVER_PORT || 3000;

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/src/public'));
app.set('views', __dirname +'/src/views');

app.use(express.urlencoded({extended:true}));
app.use(express.json());

/**
 * web
 */
app.use('/',dashboardRouter);
/**
 * api
 */
app.use('/jobs',checkUrl,checkCallback,checkWidth,checkHeight,jobsRouter);

app.listen(port, () => {
  console.log(`${serverName} is running at http://localhost:${port}`);
});





