import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.3/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.6.3/firebase-firestore.js';
import { doc, collection, getDocs, getDoc, setDoc, addDoc, 
    updateDoc, increment, arrayUnion, query, where } from 'https://www.gstatic.com/firebasejs/9.6.3/firebase-firestore.js';
import { getAuth, createUserWithEmailAndPassword,
signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/9.6.3/firebase-auth.js'

// var firebaseConfig = {
//     apiKey: "AIzaSyCDIvi8UHNnez7ckYwgIur_V1cxm0i9ezc",
//     authDomain: "hifi-store.firebaseapp.com",
//     projectId: "hifi-store",
//     storageBucket: "hifi-store.appspot.com",
//     messagingSenderId: "510679886996",
//     appId: "1:510679886996:web:f7d3983c939ddc34061881",
//     measurementId: "G-0LNW7XD6K0"
// };

const firebaseConfig = {
    apiKey: "AIzaSyDgXIlbNj-LheKdER9a29ZDJO20Ik6lCOw",
    authDomain: "achievalab-hifi.firebaseapp.com",
    databaseURL: "https://achievalab-hifi-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "achievalab-hifi",
    storageBucket: "achievalab-hifi.appspot.com",
    messagingSenderId: "862067171806",
    appId: "1:862067171806:web:185cca6c85fb0bb81dbd4f",
    measurementId: "G-DBKZ3NHNCL"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore();
const auth = getAuth();
async function signUp(email, password, name) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const userRef = doc(db, 'users', name)
        setDoc(userRef, {
            name: name,
            social_credit: 100,
            team_refs: [],
            tier: [],
            progress_log: [],
            deposits: {},
        })
        .then(() => {
            console.log(`new user ${name} is written`)
        })
        .catch(() => {
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

const userTeams = async (teamRefs) => {
    console.log(`       teams:`);
    for (const teamRef of teamRefs) {
        var teamDocSnap = await getDoc(teamRef);
        console.log(`       `, teamDocSnap.data().name);
    }
}

const teamUsers = async (userRefs) => {
    console.log(`       members:`);
    for (const userRef of userRefs) {
        var userDoc = await getDoc(userRef);
        console.log(`       `, userDoc.data().name);
    }
}
async function printUsers() {
    const querySnapshot = await getDocs(collection(db, 'users'));
    for (const doc of querySnapshot.docs) {
        console.log(`${doc.id} => 
        name: ${doc.data().name}, 
        social_credit: ${doc.data().social_credit}`);
        if (doc.data().deposits != undefined) {
            const deposits = doc.data().deposits;
            console.log(`       deposit:`);
            await Object.keys(deposits).forEach((teamName) => {
                console.log(`       ${teamName}, ${deposits[teamName]}`);
            })
        }
        await userTeams(doc.data().team_refs);
    };
}
async function printTeams() {
    const querySnapshot = await getDocs(collection(db, 'teams'));
    for (const doc of querySnapshot.docs) {
        console.log(`${doc.id} => `);
        await teamUsers(doc.data().user_refs)
    };
}

async function increasePoints(docName, addPoint) {
    const docRef = doc(db, "users", docName);
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()){
        await updateDoc(docRef, {
            social_credit: increment(addPoint)
        });
    } else {
        console.log(`document "${docName}" does not exist in collection user`)
    }
}

const doesMappingExist = async (userName, date, teamName) => {
    const userRef = doc(db, 'users', userName);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
        const progressMap = userDoc.data().progresses || {};
        const dateMap = progressMap[date] || {};
        return (dateMap[teamName] != undefined);
    } else {
        console.error(`${userName} does not exist`)
    }
};

const addProgressMapping = async (userName, date, teamName, result) => {
    try {
        const userRef = doc(db, 'users', userName);
        const teamRef = doc(db, 'teams', teamName);
        const userDoc = await getDoc(userRef);
        const teamDoc = await getDoc(teamRef);
        
        const MappingExist = await doesMappingExist(userName, date, teamName); ///////////////////////////////////////////////// if 안에 await 없이 그냥 넣으면 대체 왜 안될까 ? ? ? ? ? ? ? 
        if (MappingExist) {
            console.error("same mapping already exists");
        } else {
            if (userDoc.exists() && teamDoc.exists()) {
                const progresses = userDoc.data().progresses || {};
                const dateMap = progresses[date] || {};
                dateMap[teamName] = result;

                // Update the user document with the new progresses map
                await updateDoc(userRef, { [`progresses.${date}`]: dateMap });

                console.log(`Progress mapping added successfully for user ${userName} on ${date} for team ${teamName}.`);
                if (result == 'success') {
                    
                } else {
                    const current_deposit = userDoc.data().deposits[teamName];
                    const deduction_deposit = teamDoc.data().deduction_deposit;
                    console.log(current_deposit, deduction_deposit)
                    if (current_deposit < deduction_deposit) {
                        console.log("OUT !!!!!!!!!!!!!!!!!!!!");
                        await updateDoc(userRef, {
                            [`deposits.${teamName}`]: 0
                        })
                    } else {
                        console.log(`deducted, remaning deposit: ${current_deposit - deduction_deposit}`)
                        await updateDoc(userRef, {
                            [`deposits.${teamName}`]: current_deposit - deduction_deposit
                        })
                    }
                }
            } else {
                console.log(`User ${userName} does not exist.`);
            }
        }
    } catch (error) {
        console.error('Error adding progress mapping:', error);
    }
}; 
const x = new Date().toISOString().split('T')[0]

  

async function newTeam(userName, teamName, rules, description, entry_deposit=100) {
    const teamRef = doc(db, 'teams', teamName);
    const userRef = doc(db, 'users', userName);
    const teamDoc = await getDoc(teamRef);
    const userDoc = await getDoc(userRef);

    if (teamDoc.exists()) {
        console.log(`team ${teamName} already exists`);
    } else {
        const current_social_credit = userDoc.data().social_credit;
        if (current_social_credit >= entry_deposit) {
            await updateDoc(userRef, {
                team_refs: arrayUnion(doc(collection(db, 'teams'), teamName)),
                social_credit: current_social_credit - entry_deposit,
                [`deposits.${teamName}`]: entry_deposit
            })
            await setDoc(teamRef, {
                name: teamName,
                rules: rules,
                description: description,
                duration_start: new Date().toISOString().split('T')[0],
                duration: 21,
                total_deposit: 0,
                team_points: 0,
                entry_deposit: 100,
                deduction_deposit: 20,
                team_ranking: 100,
                leader_ref: doc(collection(db, 'users'), userName),
                user_refs: [doc(collection(db, 'users'), userName)]
            });
            console.log(`${userName} created team ${teamName}`);
        } else {
            console.log(`${userName} has not enough social credit`);
        }
    }
}

async function joinTeam(userName, teamName) {
    const teamRef = doc(db, 'teams', teamName);
    const userRef = doc(db, 'users', userName);
    const teamDoc = await getDoc(teamRef);
    const userDoc = await getDoc(userRef);
    
    const memberRefs = teamDoc.data().user_refs;
    const memberExistsInTeam = memberRefs.some((memberRef) => memberRef.path == userRef.path);
    if (!teamDoc.exists()) {
        console.log(`${teamName} does not exist`)
    }
    else if (memberExistsInTeam) {
        console.log(`${userName} is already in the team ${teamName}`)
    } 
    else if (teamDoc.exists() && !memberExistsInTeam) {
        const entry_deposit = teamDoc.data().entry_deposit;
        const current_social_credit = userDoc.data().social_credit;
        if (current_social_credit >= entry_deposit) {
            await updateDoc(userRef, {
                team_refs: arrayUnion(doc(collection(db, 'teams'), teamName)),
                social_credit: current_social_credit - entry_deposit,
                [`deposits.${teamName}`]: entry_deposit
            })
            await updateDoc(teamRef, {
                user_refs: arrayUnion(doc(collection(db, 'users'), userName))
            })
            console.log(`${userName} becomes a member of team ${teamName}`);
        } else {
            console.log(`${userName} has not enough social credit`);
        }
    }
}


// signUp("hihihihihihi@gmail.com", "jh31471375@", "anonymous")
// signUp("jhjhjhjh@gmail.com", "jh31471375@", "jh")
// signUp("cmcmcmcmcmcmcm@gmail.com", "jh31471375@", "cm")
// signUp("jhjhjhjhjhjhjhjh@gmail.com", "jh31471375@", "hj")
// await newTeam("jh", "crazy running", ["rule 1", "rule 2"], "this is crazy running")
// await newTeam("cm", "extreme running", ["extreme rule 1", "extreme rule 2"], "this is")
// await newTeam("hj", "running running", ["rule 1", "rule 2"], "hahaha")
// await joinTeam("jh", "extreme running")
// await joinTeam("cm", "crazy running")
await addProgressMapping('jh', '2023-11-01', 'crazy running', 'success');
await addProgressMapping('jh', '2023-11-02', 'crazy running', 'fail');
await addProgressMapping('jh', '2023-11-03', 'crazy running', 'fail');
await addProgressMapping('jh', '2023-11-04', 'crazy running', 'fail');
await addProgressMapping('jh', '2023-11-05', 'crazy running', 'fail');
await addProgressMapping('jh', '2023-11-06', 'crazy running', 'fail');
await addProgressMapping('jh', '2023-11-07', 'crazy running', 'fail');


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