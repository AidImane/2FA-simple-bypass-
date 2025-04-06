const fs = require('fs');
const path = require('path');

const USERS_FILE = path.join(__dirname, 'users.json');

const userModel = {
    add: ({ username, email, password }) => {
        const data = JSON.parse(fs.readFileSync(USERS_FILE));
        const user = { 
            id: data.nextId++,
            username, 
            email, 
            password 
        };
        
        data.users.push(user);
        fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
        
        console.log('\n=== New User Added ===');
        console.table([user]);
        return user;
    },
    findByUsername: (username) => {
        const data = JSON.parse(fs.readFileSync(USERS_FILE,'utf8'));
        return data.users.find(user => user.username === username);
    },
    findByEmail: (email) => {
        const data = JSON.parse(fs.readFileSync(USERS_FILE));
        return data.users.find(user => user.email === email);
    },
    getAll: () => {
        const data = JSON.parse(fs.readFileSync(USERS_FILE));
        console.log('\n=== Current Users ===');
        console.table(data.users);
        return data.users;
    }
};

module.exports = userModel;