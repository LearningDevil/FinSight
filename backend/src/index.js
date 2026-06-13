require('dotenv').config();
const express = require("express");
const cors = require('cors');
const { createLogger, format, transports } = require('winston');

// logger
const logger = createLogger({
    level: "info",
    format: format.combine(
        format.timestamp(),
        format.printf(({timestamp, level, message})=> `[${timestamp}] [Instance ${process.env.INSTANCE_ID}] ${level.toUpperCase()}: ${message}`)
    ),
    transports: [new transports.Console()],
});

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Request logger
app.use((req, res, next)=>{
    logger.info(`${req.method} ${req.url}`);
    next();
});

// health check
app.get('/health', async(req,res)=>{
    const {pool} = require('./models/db');
    const {getRedisClient} = require('./utils/redis');

    let dbStatus = 'ok';
    let redisStatus = 'ok';

    try{
        await pool.query('SELECT 1');
    }catch(e){
        dbStatus = 'error: ' + e.message;
    }

    try{
        const redis = getRedisClient();
        await redis.ping();
    }catch(e){
        redisStatus = 'error: ' + e.message;
    }

    res.json({
        status: 'ok',
        instance: process.env.INSTANCE_ID,
        timestamp: new Date().toISOString(),
        services: {database: dbStatus, redis: redisStatus},
    });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/sync', require('./routes/sync'));
app.use('/api/policies', require('./routes/policies'));
app.use('/api/insights', require('./routes/insights'));
app.use('/api/budgets', require('./routes/budgets'));

// 404
app.use((req, res)=>{
    res.status(404).json({error: 'Route not found'});
});

// global error handler
app.use((err, req, res, next)=>{
    logger.error(err.stack);
    res.status(500).json({error: 'Internal server error'});
});

// start
const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>{
    logger.info(`Server running on port ${PORT}`);
});

module.exports = { logger };