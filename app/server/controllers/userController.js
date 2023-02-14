const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const Player = require('../models/playerModel');
const { createCollection } = require('../models/userModel');
require('dotenv').config();

const TOKEN = process.env.NODE_TOKEN;

//function to generate a token in the signin and signup user 
const createToken = (_id) => {//id =  is part of the payload of the token 
    return jwt.sign({ _id }, TOKEN, { expiresIn: '3d' });//the second is the secret string only know by the server, the third means the user stays logged in for 3 days before the token expires
}

// functions to regulate the leaf amout
// Add player trees x Leafs every 15 min
const addLeafs = async (username) => {
    const player = await Player.findOne({username: username});

    const leafAmout = player.leafs;

    const pipeline = [
        {
            "$match": {
                "owner": username
            }
        }, 
        {
            "$count": "treeCount"
        }
    ];
    
    const treeCount = Tree.aggregate(pipeline).exec();
    console.log(treeCount);

    const newLeafAmount = Math.floor(leafAmout +  treeCount);
    return newLeafAmount;
}
setTimeout(addLeafs, 900000);

// Take back half of leafs every hour
const takeLeafs = async (username) => {
    const player = await Player.findOne({username: username});

    const leafAmout = player.leafs;
    const newLeafAmout = Math.floor(leafAmout/2);

    return newLeafAmout;
}

setTimeout(takeLeafs, 3600000);

//login user 
const signInUser = async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.signin(username, password);

        const signInToken = createToken(user._id);
        res.cookie('planty', signInToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'None',
        })
        res.status(200).json({ username, signInToken });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

//signup user 
const signUpUser = async (req, res) => {
    const { username, email, password, color } = req.body;

    try {

        const user = await User.signup(username, email, password, color);
        
        // leaf count start :
        addLeafs(username);
        takeLeafs(username);

        //create token
        const signInToken = createToken(user._id);
        res.status(200).json({ email, signInToken });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}
const signOutUser = async (req, res) => {
    res.cookie('jwt', 'expiredtoken');
    //res.redirect('/');
    res.json("User successully log out");
}

module.exports = { signInUser, signUpUser, signOutUser };