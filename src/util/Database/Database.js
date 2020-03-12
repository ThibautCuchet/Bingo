import firebase from "firebase";

const firebaseConfig = {
  apiKey: "AIzaSyCZKUDgg1cUGUy_CbdWWGAnmnQjKWQQiF8",
  authDomain: "bingo-3e03d.firebaseapp.com",
  databaseURL: "https://bingo-3e03d.firebaseio.com",
  projectId: "bingo-3e03d",
  storageBucket: "bingo-3e03d.appspot.com",
  messagingSenderId: "721358082968",
  appId: "1:721358082968:web:b0904c3a1a3955f02fd1ed"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
export default database;
