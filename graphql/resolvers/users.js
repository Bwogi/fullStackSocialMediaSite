const User = require('../../models/User')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken')
const { validateRegisterInput, validateLoginInput } = require('../../utils/validators')

// import the secret key 
const { SECRET_KEY } = require('../../config')
// apollo server error handling on username check if taken or available
const { UserInputError } = require('apollo-server');

const generateToken = (user) => {
    return jwt.sign({
        id: user.id,
        email: user.email,
        username: user.username
    }, SECRET_KEY, { expiresIn: '1hr' }); // add the secret to the token which we store in the config file
}

module.exports = {
    Mutation: {

        // TODO: user login mutation
        async login(_, { username, password }) {
            const { errors, valid } = validateLoginInput(username, password);
            //we check if valid 
            if (!valid) {
                throw new UserInputError('Errors', { errors });
            }

            // then we check the database for this username and password
            const user = await User.findOne({ username });

            if (!user) {
                errors.general = 'User not found';
                throw new UserInputError('User not found', { errors });
            }
            const match = await bcrypt.compare(password, user.password);
            if (!match) {
                errors.general = 'Wrong credentials';
                throw new UserInputError('Wrong credentials', { errors });
            }
            const token = generateToken(user);

            return {
                ...user._doc,
                id: user._id,
                token
            };
        },
        
        // TODO: user registration mutation
        async register(_, { registerInput: { username, email, password, confirmPassword } }, context, info) {
            // TODO: validate user data
            const { valid, errors } = validateRegisterInput(username, email, password, confirmPassword);
            if (!valid) {
                throw new UserInputError('Errors',{ errors });
            }
            // TODO: make sure user doesn't already exist
            const user = await User.findOne({ username, email });
            if (user) {
                throw new UserInputError('Username is taken', {
                    errors: {
                        username: 'This name is already taken'
                    }
                });
            }
           
            // TODO: hash password and create an authentication token
            // bcrypt is asynchronous. so the register function must be asynchronous
            // import bcrypt from
            password = await bcrypt.hash(password, 12);

            // then we form our new user object
            const newUser = new User({
                email,
                username,
                password,
                createdAt: new Date().toISOString()
            });

            const res = await newUser.save();

            // we need to create a token for the user before we return this data to the user
            const token = generateToken(res)
            
            return {
                ...res._doc,
                id: res._id,
                token
            };
        }
    }
};