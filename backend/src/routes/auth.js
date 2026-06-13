const express = require('express');
const router = express.Router();
const {OAuth2Client} = require('google-auth-library');
const jwt = require('jsonwebtoken');
const {pool} = require('../models/db');
const {encrypt, decrypt} = require('../utils/encryption');
const authMiddleware = require('../middleware/auth');

const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

// Scopes
// openid + profile + email = user info from Google
// gmail.readonly = read emails for transaction parsing
const SCOPES = [
    'openid',
    'profile',
    'email',
    'https://www.googleapis.com/auth/gmail.readonly',
];

// Step 1: Generate google OAuth URL (Authorization URL) -> this is used by google to show the users exactly which app is asking for what permissions.
// Frontend calls this to get the URL to redirect user to 
router.get('/google', (req, res)=>{
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline', // offline -> we get refresh token
        scope: SCOPES,
        prompt: 'consent', // force consent screen so we always get refresh token 
    });
    res.json({url});
});

// step 2: Google redirects back here with a code
// question: What is the code that Google sends back to /api/auth/google/callback — what is it and why can't we just use it directly?
// ans: the code is a one-time-use, short-lived authorization code (exp~~10min). Google doesn't give tokens directly in the browser b/c that would expose them in the url - anyone who sees your browser history gets your tokens.
// so what it does (flow is) is browser gets code (safe, one-time) -> server exchanges code for tokens (happens server side, never in browser) -> Tokens never touches the browser
// this is called Authorization Code Flow.
router.get('/google/callback', async (req, res)=>{
    const {code} = req.query;
    if(!code){
        return res.status(400).json({error: 'Authorization code missing'});
    }
    try{
        // exchange code for token
        const {tokens} = await oauth2Client.getToken(code);
        // Access token — short-lived (1 hour). Used to make API calls to Gmail right now.
        // Refresh token — long-lived (until revoked). Used to get a new access token when the old one expires — without asking the user to log in again.
        const {access_token, refresh_token, id_token} = tokens;
        // Verify the ID token and get user info
        const ticket = await oauth2Client.verifyIdToken({
            idToken: id_token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const {sub: google_id, email, name} = payload;

        // encrypt tokens before storing
        const encryptedAccess = encrypt(access_token);
        const encryptedRefresh = refresh_token ? encrypt(refresh_token) : null;

        // Upsert user - insert if new, update token if existing 
        const result = await pool.query(`
            INSERT INTO users (email, name, google_id, gmail_access_token, gmail_refresh_token)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (google_id) DO UPDATE SET
                email = EXCLUDED.email,
                name = EXCLUDED.name,
                gmail_access_token = EXCLUDED.gmail_access_token,
                gmail_refresh_token = COALESCE(EXCLUDED.gmail_refresh_token, users.gmail_refresh_token),
                updated_at = NOW()
            RETURNING id, email, name, created_at
            `, [email, name, google_id, encryptedAccess, encryptedRefresh]);

        const user = result.rows[0];

        // generate our own JWT for frontend to use
        // question: We then issue our own JWT — why? Google already gave us a token, why create another one?
        // ans: Google's token is for google's services. our jwt is for our own API, they serve diffrent purposes:
        // Google token -> proves identity to Google (gmail api)
        // our jwt -> proves identity to our node.js backend.
        // also our jwt contains exactly what we need - userid, email, name - so every api doesn't need a database lookup to know who's asking.
        const jwtToken = jwt.sign(
            {userId: user.id, email: user.email, name: user.name},
            process.env.JWT_SECRET,
            {expiresIn: process.env.JWT_EXPIRES_IN || '24h'}
        );

        // redirect to frontend with token
        // frontend reads this url and stores it
        res.redirect(`http://localhost:80/auth/success?token=${jwtToken}`);
    }catch(err){
        console.error('OAuth callback error:', err);
        res.redirect('http://localhost:80/auth/error?message=Authentication failed');
    }
});

// get current user (protected route)
router.get('/me', authMiddleware, async (req, res)=>{
    try{
        const result = await pool.query(
            'SELECT id, email, name, gmail_sync_enabled, last_synced_at, created_at FROM users WHERE id = $1',
            [req.user.userId]
        );
        if (!result.rows[0]){
            return res.status(404).json({error: 'User not found'});
        }
        res.json({user: result.rows[0]});
    }catch (err){
        console.error('Get user error:', err);
        res.status(500).json({error: 'Failed to get user'});
    }
});

// logout
router.post('/logout', authMiddleware, (req, res)=>{
    // JWT is stateless - client just deletes the token
    // we could blacklist in redis here for extra security
    res.json({message: 'Logged out Successfully'});
})


module.exports = router;
