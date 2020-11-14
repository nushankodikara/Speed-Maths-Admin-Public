/* Initialization */
var provider = new firebase.auth.GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/contacts.readonly');
var userObj;
var dataObj;

/* authentication check */
firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
        userObj = user;
        loggedIn()
    } else {
        loggedOut()
    }
});

/* login function */
function login() {

    firebase.auth().signInWithPopup(provider).then(function (result) {
        var user = result.user;
    }).catch(function (error) {
        var errorMessage = error.message;
        alert(errorMessage)
    });

}


/* Sign out function */
function signOut() {
    firebase.auth().signOut().then(function () {
        alert('Signed Out Successfully!')
    }).catch(function (error) {
        alert(error.message)
    });
}

/* After logging in */
function loggedIn() {
    retrieveData();
    $('.alogin').fadeIn();
    $('.blogin').fadeOut();
    $('.name').text(userObj.displayName);
}

/* After Logging Out */
function loggedOut() {
    $('.alogin').fadeOut();
    $('.blogin').fadeIn();
}

var s;

function retrieveData() {
    firebase.database().ref(`valid_accounts`).on('value', function (snapshot) {
        var a = snapshot.val();
        dataObj = a;
        var b = [`<tr><th>ID</th><th>Paid Month</th><th>Remove</th></tr>`]
        for (i in a) {
            b.push(`<tr><td>${i}</td><td>${ a[i]["paidFor"] }</td><td><a href="#" onclick="revoke('${i}')">Revoke</a></td></tr>`)
        }
        $('#dataTable').html(b.join(''));
    });
}

function revoke(dir) {
    if (confirm(`Are you sure you want to Revoke ${dir}?`)) {
        firebase.database().ref(`valid_accounts/${dir}/`).remove()
    } else {
        alert(`Revoke for ${dir} Cancelled`)
    }
}

function bulkRevoke() {
    if (confirm(`Are you sure you want to Revoke ${$('#SMonth').val()} Month?`)) {
        for (i in dataObj) {
            if (dataObj[i]['paidFor'] == $('#SMonth').val()) {
                firebase.database().ref(`valid_accounts/${i}/`).remove()
            }
        }
    } else {
        alert('Bulk Revoke Cancelled')
    }
}

function submitPayment() {
    firebase.database().ref(`valid_accounts/${$('#ID').val()}/`).update({
        paidFor: $('#Month').val()
    });
    $("#payment")[0].reset()
}

/* search */
$(document).ready(function () {
    $("#searchbox").on("keyup", function () {
        var value = $(this).val().toLowerCase();
        $("#dataTable tr").filter(function () {
            $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
        });
    });
});