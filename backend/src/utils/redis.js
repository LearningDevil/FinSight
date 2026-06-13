const { createClient } = require('redis');

let client;

const getRedisClient = () =>{
    if (!client){
        client = createClient({
            socket: {
                host: process.env.REDIS_HOST || 'redis',
                port: parseInt(process.env.REDIS_PORT) || 6379,
            },
        });
        client.on('error', (err) => console.error('Redis error: ', err));
        client.connect();
    }
    return client;
};

// Helper: get cached value
const cacheGet = async (key) =>{
    try{
        const val = await getRedisClient().get(key);
        return val ? JSON.parse(val) : null;
    }catch {return null;}
};

// Helper: set Cached value with TTL (seconds)
const cacheSet = async (key, value, ttlSeconds = 3600) =>{
    try{
        await getRedisClient().setEx(key, ttlSeconds, JSON.stringify(value));
    }catch(e){console.error('Cache set error: ', e)}
};

// Helper: delete cached value
const cacheDel = async (key) => {
    try{ await getRedisClient().del(key); }
    catch(e){ console.error('Cache del error: ', e); }
};

module.exports = { getRedisClient, cacheGet, cacheSet, cacheDel }