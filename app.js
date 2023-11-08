import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.3/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.6.3/firebase-firestore.js';
import { doc, collection, getDocs, getDoc, setDoc, addDoc, 
    updateDoc, increment, arrayUnion } from 'https://www.gstatic.com/firebasejs/9.6.3/firebase-firestore.js';
import { getAuth, createUserWithEmailAndPassword,
signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/9.6.3/firebase-auth.js'

var firebaseConfig = {
    apiKey: "AIzaSyCDIvi8UHNnez7ckYwgIur_V1cxm0i9ezc",
    authDomain: "hifi-store.firebaseapp.com",
    projectId: "hifi-store",
    storageBucket: "hifi-store.appspot.com",
    messagingSenderId: "510679886996",
    appId: "1:510679886996:web:f7d3983c939ddc34061881",
    measurementId: "G-0LNW7XD6K0"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore();
const auth = getAuth();
async function signUp(email, password, name) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Signed in 
        const user = userCredential.user;
        console.log('User signed up:', user);
        const userRef = doc(db, 'user', name)
        setDoc(userRef, {
            name: name,
            social_points: 100,
            teams: []
        })
        .then((docRef) => {
            console.log(`new user ${name} is written`)
        })
        .catch((error) => {
            console.error("Error adding document")
        })
    } catch (error) {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log('Error signing up:', errorCode, errorMessage);
    }
}

// Sign in function
async function signIn(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        // Signed in
        const user = userCredential.user;
        console.log('User signed in:', user);
    } catch (error) {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error('Error signing in:', errorCode, errorMessage);
    }
}

async function printUsers() {
    const querySnapshot = await getDocs(collection(db, 'user'));
    querySnapshot.forEach((doc) => {
        console.log(`${doc.id} => 
        name: ${doc.data().name}, 
        social_points: ${doc.data().social_points}
        teams: ${doc.data().teams}`);
    });
}

async function printTeams() {
    const querySnapshot = await getDocs(collection(db, 'team'));
    querySnapshot.forEach((doc) => {
        console.log(`${doc.id} => 
        members: ${doc.data().members}`);
    });
}

async function increasePoints(docName, addPoint) {
    const docRef = doc(db, "user", docName);
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()){
        await updateDoc(docRef, {
            social_points: increment(addPoint)
        });
    } else {
        console.log(`document "${docName}" does not exist in collection user`)
    }
}

async function newTeam(userName, teamName, rules) {
    const teamRef = doc(db, 'team', teamName)
    const userRef = doc(db, 'user', userName);
    const teamDocSnap = await getDoc(teamRef)
    const userDocSnap = await getDoc(userRef);

    if (teamDocSnap.exists() && userDocSnap.exists()) {
        console.error("team name already exists");
    } else {
        await setDoc(teamRef, {
            name: teamName,
            rules: rules,
            team_points: 0,
            team_ranking: 100,
            members: [userName]
        });
        console.log(`team "${teamName}" is created`)
    }
}

async function joinTeam(userName, teamName) {
    const teamRef = doc(db, 'team', teamName);
    const userRef = doc(db, 'user', userName);
    const teamDocSnap = await getDoc(teamRef);
    const userDocSnap = await getDoc(userRef);

    if (teamDocSnap.exists() && userDocSnap.exists()) {
        if (teamDocSnap.get("members").includes(userName)) {
            console.log(`"${userName}" is already in the team`)
        } else {
            await updateDoc(teamRef, {
                members: arrayUnion(userName)
            })
            await updateDoc(userRef, {
                teams: arrayUnion(teamName)
            })
            console.log(`${userName} becomes a member of team ${teamName}`)
        }
    } else {
        console.error(`Team "${teamName}" or User "${userName}" does not exist.`);
    }
}


// signUp("hihihihihihi@gmail.com", "jh31471375@", "anonymous")
// signUp("jhjhjhjh@gmail.com", "jh31471375@", "jh")
// signUp("cmcmcmcmcmcmcm@gmail.com", "jh31471375@", "cm")
// signUp("jhjhjhjhjhjhjhjh@gmail.com", "jh31471375@", "hj")
// newTeam("jinhyeong", "crazy running", ["rule 1", "rule 2"])
// joinTeam("jinhyeong", "crazy running")
joinTeam("jh", "crazy running")
joinTeam("hj", "crazy running")

document.getElementById('testButton').addEventListener('click', async ()=>{
    const docName = 'jh';
    const addPoint = 50;
    await increasePoints(docName, addPoint)
})

document.getElementById('printUsers').addEventListener('click', async ()=>{
    printUsers();
})

document.getElementById('printTeams').addEventListener('click', async ()=>{
    printTeams();
})
// 1. 실행순서보장X, 챗지피티 도움 받아서 하고 있으나 확신없으므로 확인 필요
// 2. signup/signin 기능은 존재하는데, 여러 유저가 하는 행동을 어떻게 구분 ? 구분되는 identifier가 어디에 존재? (ex 유저1이 a팀에 참가버튼을 누르는 것과, 유저2가 a팀에 참가버튼을 누르는 것을 어떻게 구분)