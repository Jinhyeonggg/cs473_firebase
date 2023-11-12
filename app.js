import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.3/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.6.3/firebase-firestore.js';
import { doc, collection, getDocs, getDoc, setDoc, addDoc, 
    updateDoc, increment, arrayUnion, query, where,
    orderBy, limit } from 'https://www.gstatic.com/firebasejs/9.6.3/firebase-firestore.js';
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
            deposits: {},
        })
        .then(() => {
            console.log(`new user ${name} is written`)
        })
        .catch(() => {
            console.error("Error adding document")
        })
        setTier(name);
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
        let teamDocSnap = await getDoc(teamRef);
        console.log(`       `, teamDocSnap.data().name);
    }
}

const teamUsers = async (userRefs) => {
    console.log(`       members:`);
    for (const userRef of userRefs) {
        let userDoc = await getDoc(userRef);
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
                [`deposits.${teamName}`]: entry_deposit,
                [`team_points.${teamName}`]: 0,
            })
            await setDoc(teamRef, {
                name: teamName,
                rules: rules,
                description: description,
                duration_start: new Date().toISOString().split('T')[0],
                duration: 21,
                total_deposit: 0,
                total_points: 0,
                team_points: { [userName]: 0},
                entry_deposit: 100,
                deduction_deposit: 20,
                team_ranking: 100,
                leader_ref: doc(collection(db, 'users'), userName),
                user_refs: [doc(collection(db, 'users'), userName)],
                increment: 5,
                decrement: 2,
            });
            await setTier(userName);
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
                [`deposits.${teamName}`]: entry_deposit,
                [`team_points.${teamName}`]: 0,
            })
            await updateDoc(teamRef, {
                user_refs: arrayUnion(doc(collection(db, 'users'), userName)),
                [`team_points.${userName}`]: 0,
            })
            await setTier(userName);
            console.log(`${userName} becomes a member of team ${teamName}`);
        } else {
            console.log(`${userName} has not enough social credit`);
        }
    }
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
        const progressMap = userDoc.data().progress || {};
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
        const MappingExist = await doesMappingExist(userName, date, teamName);
        if (MappingExist) {
            console.error("same mapping already exists");
        } else {
            if (userDoc.exists() && teamDoc.exists()) {
                const progress = userDoc.data().progress || {};
                const dateMap = progress[date] || {};
                dateMap[teamName] = result;

                // Update the user document with the new progress map
                await updateDoc(userRef, { [`progress.${date}`]: dateMap });

                console.log(`Progress mapping added successfully for user ${userName} on ${date} for team ${teamName}.`);
                const teamPts = await teamDoc.data().team_points[userName];
                const increment = await teamDoc.data().increment;
                const decrement = await teamDoc.data().decrement;
                const totalPoints = await teamDoc.data().total_points;
                if (result == 'success') {
                    await updateDoc(teamRef, {
                        [`team_points.${userName}`]: teamPts + increment,
                        total_points: totalPoints + increment,
                    })
                    await updateDoc(userRef, {
                        [`team_points.${teamName}`]: teamPts + increment,
                    })
                } else {
                    const current_deposit = userDoc.data().deposits[teamName];
                    const deduction_deposit = teamDoc.data().deduction_deposit;
                    if (current_deposit < deduction_deposit) {
                        console.log("OUT !!!!!!!!!!!!!!!!!!!!");
                        await updateDoc(userRef, {
                            [`deposits.${teamName}`]: 0,
                            [`team_points.${teamName}`]: teamPts - decrement,
                        })
                        await updateDoc(teamRef, {
                            [`team_points.${userName}`]: teamPts - decrement,
                            total_points: totalPoints - decrement,
                        })
                    } else {
                        await updateDoc(userRef, {
                            [`deposits.${teamName}`]: current_deposit - deduction_deposit,
                            [`team_points.${teamName}`]: teamPts - decrement,
                        })
                        await updateDoc(teamRef, {
                            [`team_points.${userName}`]: teamPts - decrement,
                            total_points: totalPoints - decrement,
                        })
                    }
                }
                setTier(userName);
            } else {
                console.log(`User ${userName} does not exist.`);
            }
        }
    } catch (error) {
        console.error('Error adding progress mapping:', error);
    }
}; 

// ranking in a team
async function ranking(team_name) {
    try {
        const usersCollectionRef = collection(db, 'users');
        const q = query(usersCollectionRef, where(`team_points.${team_name}`, '>', 0));
        const querySnapshot = await getDocs(q);
        const usersData = [];

        querySnapshot.forEach((userDoc) => {
            const userData = userDoc.data();

            usersData.push({
                id: userDoc.id,
                team_points: userData.team_points && userData.team_points[team_name] ? userData.team_points[team_name] : 0,
            });
        });

        const sortedUsers = usersData.sort((a, b) => b.team_points - a.team_points);
        return sortedUsers;
    } catch (error) {
        console.error('Error in rank function:', error);
        throw error; // Re-throw the error for handling in the calling code
    }
}

async function getTeamRanking(teamName) {
    try {
        const teamsCollectionRef = collection(db, 'teams');

        // Query teams with the specified teamName
        const q = query(teamsCollectionRef, orderBy('total_points', 'desc'));
        const querySnapshot = await getDocs(q);

        let ranking = 0;

        // Iterate through the query results to find the team's ranking
        for (const teamDoc of querySnapshot.docs){
            ranking++;
            if (teamDoc.id == teamName) {
                return ranking; // Stop the iteration when the team is found
            }
        };
        return false;
    } catch (error) {
        console.error('Error in getTeamRanking function:', error);
        throw error;
    }
}

async function getTopNRanking(N) {
    try {
        const teamsCollectionRef = collection(db, 'teams');

        // Query teams with non-zero team_points, order by team_points in descending order, and limit to the top N teams
        const q = query(teamsCollectionRef, where('total_points', '>', 0), orderBy('total_points', 'desc'), limit(N));
        const querySnapshot = await getDocs(q);

        const topNRanking = [];

        // Iterate through the query results to build the top N ranking
        querySnapshot.forEach((teamDoc) => {
            const teamData = teamDoc.data();
            topNRanking.push({
                teamName: teamDoc.id,
                totalPoints: teamData.total_points,
            });
        });

        return topNRanking;
    } catch (error) {
        console.error('Error in getTopNRanking function:', error);
        throw error;
    }
}

async function setTier(userName) {
    const userRef = doc(collection(db, 'users'), userName);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()){
        let score = userDoc.data().social_credit;
        for (const [team, deposit] of Object.entries(userDoc.data().deposits)) {
            score += deposit;
        }
        let tier;
        if (score <= 100) tier = 'Iron';
        else if (score <= 200) tier = 'Bronze';
        else if (score <= 400) tier = 'Silver';
        else if (score <= 600) tier = 'Gold';
        else if (score <= 800) tier = 'Platinum';
        else if (score <= 1000) tier = 'Emerald';
        else if (score <= 1200) tier = 'Diamond';
        else if (score <= 1400) tier = 'Master';
        else if (score <= 1600) tier = 'GrandMaster';
        else tier = 'Challenger';
        await updateDoc(userRef, { tier: tier });;
    }
    else {
        console.error(`no user named ${userName}`)
    }
}
const x = new Date().toISOString().split('T')[0]


// 이미 signup 되어있음
// signUp("jhjhjhjh@gmail.com", "jh31471375@", "jh")
// signUp("cmcmcmcmcmcmcm@gmail.com", "jh31471375@", "cm")
// signUp("jhjhjhjhjhjhjhjh@gmail.com", "jh31471375@", "hj")


/*
테스트 방법
1. firestore 들어가서
    - teams collection 전부 삭제
    - users collection 들어가서 progress, team_refs 필드 삭제
2. 아래 코드 주석해제하고 실행 (js만 따로 실행하는 법을 몰라서 index.html 새로고침으로 했습니다..)
*/

// await newTeam("jh", "crazy running", ["rule 1", "rule 2"], "this is crazy running");
// await newTeam("cm", "extreme running", ["extreme rule 1", "extreme rule 2"], "this is");
// await newTeam("hj", "running running", ["rule 1", "rule 2"], "hahaha");
// await joinTeam("jh", "extreme running");
// await joinTeam("cm", "crazy running");
// await joinTeam("hj", "crazy running");
// await addProgressMapping('jh', '2023-11-01', 'crazy running', 'success');
// await addProgressMapping('jh', '2023-11-02', 'crazy running', 'success');
// await addProgressMapping('jh', '2023-11-03', 'crazy running', 'fail');
// await addProgressMapping('jh', '2023-11-04', 'crazy running', 'success');
// await addProgressMapping('jh', '2023-11-05', 'crazy running', 'success');
// await addProgressMapping('jh', '2023-11-06', 'crazy running', 'fail');
// await addProgressMapping('jh', '2023-11-07', 'crazy running', 'success');
// await addProgressMapping('cm', '2023-11-01', 'crazy running', 'success');
// await addProgressMapping('cm', '2023-11-02', 'crazy running', 'success');
// await addProgressMapping('cm', '2023-11-03', 'crazy running', 'fail');
// await addProgressMapping('cm', '2023-11-04', 'crazy running', 'success');
// await addProgressMapping('hj', '2023-11-01', 'crazy running', 'success');
// await addProgressMapping('hj', '2023-11-02', 'crazy running', 'success');
// await addProgressMapping('hj', '2023-11-03', 'crazy running', 'success');
// await addProgressMapping('hj', '2023-11-04', 'crazy running', 'success');
// await addProgressMapping('jh', '2023-11-01', 'extreme running', 'success');
// await addProgressMapping('cm', '2023-11-01', 'extreme running', 'success');
// await addProgressMapping('hj', '2023-11-01', 'running running', 'success');

// const rankingResult = await ranking('crazy running')
// console.log(rankingResult)
// const crazyRanking = await getTeamRanking('crazy running');
// const top2Ranking = await getTopNRanking(2);
// console.log(crazyRanking);
// console.log(top2Ranking);

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