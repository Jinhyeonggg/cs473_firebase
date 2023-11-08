import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';    // for realtime database

var firebaseConfig = {
    apiKey: "AIzaSyCDIvi8UHNnez7ckYwgIur_V1cxm0i9ezc",
    authDomain: "hifi-store.firebaseapp.com",
    projectId: "hifi-store",
    storageBucket: "hifi-store.appspot.com",
    messagingSenderId: "510679886996",
    appId: "1:510679886996:web:f7d3983c939ddc34061881",
    measurementId: "G-0LNW7XD6K0"
};

firebase.initializeApp(firebaseConfig);
export const db = firebase.firestore();
export default firebase;