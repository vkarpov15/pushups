const firebase = require('firebase/app');
require('firebase/database');

const firebaseApp = firebase.initializeApp(require('./firebaseConfig.js'));

const db = firebaseApp.database();

module.exports = { db };
