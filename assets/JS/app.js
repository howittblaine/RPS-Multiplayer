$(function() {
    $('#startGame').modal('show');  // Open the Bootrap 4 modal on start

  // Your web app's Firebase configuration
  var firebaseConfig = {
    apiKey: "AIzaSyCBBg4zwG5wfDzm6elTsZ4fWx62l-jTDAI",
    authDomain: "rockpaperscissors-45da4.firebaseapp.com",
    databaseURL: "https://rockpaperscissors-45da4.firebaseio.com",
    projectId: "rockpaperscissors-45da4",
    storageBucket: "rockpaperscissors-45da4.appspot.com",
    messagingSenderId: "401500284833",
    appId: "1:401500284833:web:37b90c86970d176a"
  };
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);


    // Reference the database
    var db = firebase.database();

    // Firebase Reference collections
    var playersRef = db.ref('players'); // Reference entire players folder 
    var p1Ref = playersRef.child('p1'); // Reference entire P1 folder
    var p2Ref = playersRef.child('p2'); // Reference entire P2 folder
    var winsRef = db.ref('win');    // Reference both player losses
    var losesRef = db.ref('losses');    // Reference both player wins
    var turnRef = db.ref('turn'); // to track the turns
    var connectionsRef = db.ref("connections"); // Folder to store each connection
    var connectedRef = db.ref(".info/connected");// Firebase's default Ref to track connections (boolean)
    var chatRef = db.ref('chat'); // Reference chat

    // Variables
    let p2NameVal = '';
    let p1NameVal = '';
    let p1Wins = 0;
    let p1Losses = 0;
    let p1Choice = '';
    let p2Wins = 0;
    let p2Losses = 0;
    let p2Choice = '';
    let turn = '';
    let activePnum = 0;
    let resultsin = '';

    // DOM caching
    var $lego = $('#lego');
    var $pName = $('#name');
    var $p1Panel = $('#playerOne');
    var $p2Panel = $('#playerTwo');
    var $p1Badge = $p1Panel.find('.badge');
    var $p2Badge = $p2Panel.find('.badge'); 
    var $p1NameSpan = $('.playerOneName');
    var $p2NameSpan = $('.playerTwoName');
    var $pNameSpan = $('span.playerName');
    var $p1choice = $('#p1ChoiceDiv');
    var $p2choice = $('#p2ChoiceDiv');
    var $imgP1 = $p1Panel.find('img');
    var $imgP2 = $p2Panel.find('img');
    var $rPanel = $('#resultsPanel').find('h4');
    var $p1LoseCountSpan = $('#p1LoseCountSpan');
    var $p1WinCountSpan = $('#p1WinCountSpan');
    var $p2LoseCountSpan = $('#p2LoseCountSpan');
    var $p2WinCountSpan = $('#p2WinCountSpan');
    var $chatBtn = $('#chatSend');
    var $chatInput = $('#message');
    var $chatUl = $('#chat').find('ul');

    // Functions
    var playerName = () => {
        connectedRef.on('value', (snap) => { // Check if someone connected/disconnected
            if(snap.val()){ // If someone connected
                connectionsRef.push(true);
                connectionsRef.onDisconnect().remove(); // Remove user from the connection list when they disconnect
            }
        });
        connectionsRef.on('value', (snap) => { // If I just moved someone to my connection folder
            console.log(`Number of players online ${snap.numChildren()}`); 
            activePnum = snap.numChildren();    // Get the number of connections at the moment
            pNameVal = $pName.val(); // Get the name of the user
            $pNameSpan.html(` ${pNameVal}`); // Greet current player

            if(activePnum == 1) { // If you're the 1st player
                chatRef.set({}); // If there's only one user, clear the chat history in the db
                $chatUl.empty(); // Clear the HTML
                
                p1NameVal = pNameVal;   // Store the current name into a new variable to keep track inside the app
                // Create the object
                var p1 = {
                    choice: '',
                    name: p1NameVal, 
                };
                var t = { whoseturn: turn };

                // Sync object
                p1Ref.set(p1);
                turnRef.set(t);

                // Wait for player two
                $rPanel.html('Waiting for player 2');
                console.log('Waiting for player 2');

                turn = 'p2turn';
                turnRef.update({ whoseturn: turn }); // Update the turn in the db

            }
            else if(activePnum == 2) {  // If you are the 2nd player
                p2NameVal = pNameVal;   // Store the current name into a different variable to keep track
                // Create the object
                var p2 = {
                    choice: '',
                    name: p2NameVal
                };
                var w = {
                    p1: p1Wins,
                    p2: p2Wins
                }
                var l = {
                    p1: p1Losses,
                    p2: p2Losses
                }
                // Sync object
                p2Ref.set(p2); 
                winsRef.set(w);
                losesRef.set(l);

                // Inform user
                $rPanel.html('Play Now!');
                console.log('play now');
                turn = 'p1turn';
                turnRef.update({ whoseturn: turn });
            }
        });
    }

    turnRef.on('child_changed', (snap) => { // Listen for turn changes
        let pturn = snap.val();
        console.log(`It's ${pturn}`);
        if(pturn == 'p1turn' && activePnum == 2) {  // If it's p1 turn and there's 2 players online
            $p1choice.on('click', getPchoice(pturn)); // Listen for p1 click events on the choice btns
        }
        else if(pturn == 'p2turn' && activePnum == 2) { //If it's p1 turn and there's 2 players online
            $p2choice.on('click', getPchoice(pturn)); // Liste for p2 click events
        }
    });

    playersRef.on('value', (snap) => {   // When P2 makes a choice
        if(turn == 'p2turn' && activePnum == 2) {   // Only compute results when is player 2's turn and there are 2 people connected
            let p1name = snap.val().p1.name;
            let p2name = snap.val().p2.name;
            let p1hand = snap.val().p1.choice;
            let p2hand = snap.val().p2.choice;

            if( p1hand == 'Rock' && p2hand == 'Rock'){
                resultsin = 'Tie';
                $rPanel.html(resultsin);
            }
            else if( p1hand == 'Rock' && p2hand == 'Paper'){
                resultsin = `Player 2:<br>${p2name}<br>Won`;
                p1Losses++;
                p2Wins++;
                winsRef.update({ p1: p1Wins, p2: p2Wins});
                losesRef.update({ p1: p1Losses, p2: p2Losses });
                $p1LoseCountSpan.html(p1Losses);
                $p2WinCountSpan.html(p2Wins);
                $rPanel.html(resultsin);
            }
            else if( p1hand == 'Rock' && p2hand == 'Scissors'){
                resultsin = `Player 1:<br>${p1name}<br>Won`;
                p2Losses++;
                p1Wins++;
                winsRef.update({ p1: p1Wins, p2: p2Wins});
                losesRef.update({ p1: p1Losses, p2: p2Losses });
                $p1WinCountSpan.html(p1Wins);
                $p2LoseCountSpan.html(p2Losses);
                $rPanel.html(resultsin);
            }
            else if( p1hand == 'Paper' && p2hand == 'Paper'){
                resultsin = 'Tie';
                $rPanel.html(resultsin);
            }
            else if( p1hand == 'Paper' && p2hand == 'Rock'){
                resultsin = `Player 1:<br>${p1name}<br>Won`;
                p2Losses++;
                p1Wins++;
                winsRef.update({ p1: p1Wins, p2: p2Wins });
                losesRef.update({ p1: p1Losses, p2: p2Losses });
                $p1WinCountSpan.html(p1Wins);
                $p2LoseCountSpan.html(p2Losses);
                $rPanel.html(resultsin);
            }
            else if( p1hand == 'Paper' && p2hand == 'Scissors'){
                resultsin = `Player 2:<br>${p2name}<br>Won`;
                p1Losses++;
                p2Wins++;
                winsRef.update({ p1: p1Wins, p2: p2Wins });
                losesRef.update({ p1: p1Losses, p2: p2Losses });
                $p1LoseCountSpan.html(p1Losses);
                $p2WinCountSpan.html(p2Wins);
                $rPanel.html(resultsin);
            }
            else if( p1hand == 'Scissors' && p2hand == 'Scissors'){
                resultsin = 'Tie';
                $rPanel.html(resultsin);
            }
            else if( p1hand == 'Scissors' && p2hand == 'Rock'){
                resultsin = `Player 2:<br>${p2name}<br>Won`;
                p1Losses++;
                p2Wins++;
                winsRef.update({ p1: p1Wins, p2: p2Wins });
                losesRef.update({ p1: p1Losses, p2: p2Losses });
                $p1LoseCountSpan.html(p1Losses);
                $p2WinCountSpan.html(p2Wins);
                $rPanel.html(resultsin);
            }
            else if( p1hand == 'Scissors' && p2hand == 'Paper'){
                resultsin = `Player 1:<br>${p1name}<br>Won`;
                p2Losses++;
                p1Wins++;
                winsRef.update({ p1: p1Wins, p2: p2Wins });
                losesRef.update({ p1: p1Losses, p2: p2Losses });
                $p1WinCountSpan.html(p1Wins);
                $p2LoseCountSpan.html(p2Losses);
                $rPanel.html(resultsin);
            }
        }
    });

    var getPchoice = (pturn) => {  // Save user choice to Firebase
        return e => {
            let leTarget = $(e.target);
            let pChoice = leTarget.attr('data-userChoice');    // Get player choice attr from the clicked button
            leTarget.closest('div.card').find('img').attr('src', `./assets/Images/${pChoice}.png`); // Change the img to match the user's choice
            if (pturn == 'p1turn'){
                p1Choice = pChoice; // store the the data-userChoice attr value in a variable
                p1Ref.update({ choice: p1Choice }); //Update the database with the user choice
                turn = 'p2turn';    // Change the turn and store the value in a variable
                turnRef.update({ whoseturn: turn });    // Update the turn in the database
                $p1Badge.toggleClass('yourturn');
                $p2Badge.toggleClass('yourturn');
                $p1choice.off('click'); // Removes the event listener 
            }
            else {
                p2Choice = pChoice;
                p2Ref.update({ choice: p2Choice }); //Update the user choice
                turn = 'p1turn';
                turnRef.update({ whoseturn: turn });
                $p1Badge.toggleClass('yourturn');
                $p2Badge.toggleClass('yourturn');
                $p2choice.off('click');
            }
        }
    }

    var chat = () => {
        let leMsg = $chatInput.val();   // Get the msg from the chat input
        chatRef.push({  // Push the message
            msg: leMsg
        });
        $chatInput.val(''); // Empty input
    }

    chatRef.on('child_added', (snap) => {   // Listen for changes in the chat Reference in the db
        let msgStr = `<li class="list-group-item list-group-item-dark">${snap.val().msg}`;  // Create a string with the msg
        $chatUl.prepend(msgStr);    // Prepend the msg so it's at the top
    });

    // Event Binders
    $lego.on('click', playerName);
    $chatBtn.on('click', chat);


   
});
