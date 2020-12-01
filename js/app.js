var userObj;
blogin();

/* Your web app's Firebase configuration */
var firebaseConfig = {
    apiKey: "AIzaSyBvDwnFtfHuNYb3PMQNfLEh6-WKf4PFqkY",
    authDomain: "mental-arithmatic.firebaseapp.com",
    databaseURL: "https://mental-arithmatic.firebaseio.com",
    projectId: "mental-arithmatic",
    storageBucket: "mental-arithmatic.appspot.com",
    messagingSenderId: "1058394091077",
    appId: "1:1058394091077:web:590b3a9841776c761f3d2c"
};
/* Initialize Firebase */
firebase.initializeApp(firebaseConfig);

/* login Function */
function login() {
    $('#loginButton').html('<div class="spinner-border spinner-border-sm" role="status"><span class="sr-only"></span></div> Processing')
    var email = $('#sign-in-email').val()
    var password = $('#sign-in-pass').val()
    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((user) => {
            userObj = user;
        })
        .catch((error) => {
            if (error.code == "auth/user-not-found") {
                $('#signupModal').modal('show')
            } else if (error.code == "auth/wrong-password") {
                alert("Wrong Password. Please Check your Password again.")
            }
            $('#loginButton').html('Log In')
        });
}

/* authentication check */
firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
        userObj = user;
        alogin();
    } else {
        blogin();
    }
});

/* After Login */
function alogin() {
    $(".blogin").fadeOut(500)
    $(".alogin").fadeIn(500)
    setpar()
    retrieveData()
}

/* Before Login */
function blogin() {
    $(".blogin").fadeIn(500)
    $(".alogin").fadeOut(500)
}

/* Sign out function */
function signOut() {
    firebase.auth().signOut().then(function () {}).catch(function (error) {
        alert(error.message)
    });
}

/* Setting Parameters */
function setpar() {
    $(".email").html(userObj.email)
}
/* Getting Data */
function retrieveData() {
    /* dataTable */
    firebase.database().ref(`valid_accounts`).on('value', function (snapshot) {
        var a = snapshot.val();
        dataObj = a;
        var b = [`<tr><th>ID</th><th>Paid Month</th><th>Remove</th></tr>`]
        for (i in a) {
            b.push(`<tr><td>${i}</td><td>${ a[i]["paidFor"] }</td><td><a href="#" class="btn btn-danger" onclick="revoke('${i}')">Revoke</a></td></tr>`)
        }
        $('#dataTable').html(b.join(''));
    });
    /* MonitorTable */
    firebase.database().ref(`smat`).on('value', function (snapshot) {
        var a = snapshot.val();
        dataObj = a;
        var b = [`<tr><th>ID</th><th></th><th>Name</th><th>E-Mail</th><th>Attempts</th><th>Last CPS</th><th></th></tr>`]

        for (i in a) {
            var dis;
            try {
                lastCPS = a[i].Attempts[a[i].Attempts.length - 1].cps
                dis = ""
            } catch {
                lastCPS = "Never Started"
                dis = "disabled"
            }

            b.push(`<tr><td>${i}</td><td><button onclick="monitor('${i}')" class="btn btn-primary" ${dis}>Monitor</button></td><td>${ a[i]["name"] }</td><td>${ a[i]["email"] }</td><td>${ a[i]["currentAttempt"] || "Never Started" }</td><td>${lastCPS}</td><td><button onclick="massMonitor('${i}')" class="btn btn-primary" ${dis}>Add To Mass Monitor</button></td></tr>`)
        }

        $('#monitorTable').html(b.join(''));
    });
}

/* search dataTable */
$(document).ready(function () {
    $("#searchbox").on("keyup", function () {
        var value = $(this).val().toLowerCase();
        $("#dataTable tr").filter(function () {
            $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
        });
    });
});

/* Monitor search dataTable */
$(document).ready(function () {
    $("#monitorSearch").on("keyup", function () {
        var value = $(this).val().toLowerCase();
        $("#monitorTable tr").filter(function () {
            $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
        });
    });
});

/* Revoking System */
function revoke(dir) {
    if (confirm(`Are you sure you want to Revoke ${dir}?`)) {
        firebase.database().ref(`valid_accounts/${dir}/`).remove()
    } else {
        alert(`Revoke for ${dir} Cancelled`)
    }
}

/* Bulk Revoking */
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

/* Payment Submission */
function submitPayment() {
    firebase.database().ref(`valid_accounts/${$('#ID').val()}/`).update({
        paidFor: $('#Month').val()
    });
    $("#payment")[0].reset()
}

/* Setup Monitor */
function monitor(ID) {
    /* Setting Name */
    firebase.database().ref(`smat/${ID}/name/`).once('value', function (snap) {
        $('.statName').html(snap.val());
    })
    /* Average Mark */
    firebase.database().ref(`smat/${ID}/Attempts/`).limitToLast(100).once('value', function (snapshot) {
        var lab = [];
        var avg = [];
        var lar = [];
        var dar = [];
        var cnt = 0;
        /* retrieving values from database */
        snapshot.forEach(function (childSnapshot) {
            var childKey = childSnapshot.key;
            var childData = childSnapshot.val();
            lab.push(childKey)
            avg.push(parseFloat(childData.cps));
        });
        $('.avg').text(math.mean(avg).toFixed(3));
        /* Preparing for the chart */
        for (var i = avg.length - 1; i >= 0; i--) {
            if (cnt == 20) {
                break
            } else {
                lar.push(lab[i]);
                dar.push(avg[i]);
                cnt += 1;
            }
        }
        lar.reverse();
        dar.reverse();

        /* Add a basic data series with six labels and values */
        var data = {
            labels: lar,
            series: [{
                data: dar
            }]
        };

        /* Set some base options (settings will override the default settings in Chartist.js *see default settings*). We are adding a basic label interpolation function for the xAxis labels. */
        var options = {
            axisX: {
                labelInterpolationFnc: function (value) {
                    return 'A' + value;
                }
            }
        };

        /* Now we can specify multiple responsive settings that will override the base settings based on order and if the media queries match. In this example we are changing the visibility of dots and lines as well as use different label interpolations for space reasons. */
        var responsiveOptions = [
            ['screen and (min-width: 641px) and (max-width: 1024px)', {
                showPoint: false,
                axisX: {
                    labelInterpolationFnc: function (value) {
                        return 'A' + value;
                    }
                }
            }],
            ['screen and (max-width: 640px)', {
                showPoint: false,
                axisX: {
                    labelInterpolationFnc: function (value) {
                        return 'A' + value;
                    }
                }
            }]
        ];
        new Chartist.Line('#progressionChart', data, options, responsiveOptions);
    });
}

/* Mass Monitoring Mechanic */
function massMonitor(ID) {
    $('#massMonitoringSection').append(`<div style="margin:10px;" class="card conDiv" id="${ID}main"><h3>Statics Of <span class="${ID}statName">The User</span><a style="color:red;float:right;" onclick="$('#${ID}main').remove()"> X</a></h3><em>Average <span class="${ID}avg">0</span></em><div id="${ID}progressionChart" style="width: 100%;"></div></div>`)
    /* Setting Name */
    firebase.database().ref(`smat/${ID}/name/`).once('value', function (snap) {
        $(`.${ID}statName`).html(snap.val());
    })
    /* Average Mark */
    firebase.database().ref(`smat/${ID}/Attempts/`).limitToLast(100).on('value', function (snapshot) {
        var lab = [];
        var avg = [];
        var lar = [];
        var dar = [];
        var cnt = 0;
        /* retrieving values from database */
        snapshot.forEach(function (childSnapshot) {
            var childKey = childSnapshot.key;
            var childData = childSnapshot.val();
            lab.push(childKey)
            avg.push(parseFloat(childData.cps));
        });
        $(`.${ID}avg`).text(math.mean(avg).toFixed(3));
        /* Preparing for the chart */
        for (var i = avg.length - 1; i >= 0; i--) {
            if (cnt == 20) {
                break
            } else {
                lar.push(lab[i]);
                dar.push(avg[i]);
                cnt += 1;
            }
        }
        lar.reverse();
        dar.reverse();

        /* Add a basic data series with six labels and values */
        var data = {
            labels: lar,
            series: [{
                data: dar
            }]
        };

        /* Set some base options (settings will override the default settings in Chartist.js *see default settings*). We are adding a basic label interpolation function for the xAxis labels. */
        var options = {
            axisX: {
                labelInterpolationFnc: function (value) {
                    return 'A' + value;
                }
            }
        };

        /* Now we can specify multiple responsive settings that will override the base settings based on order and if the media queries match. In this example we are changing the visibility of dots and lines as well as use different label interpolations for space reasons. */
        var responsiveOptions = [
            ['screen and (min-width: 641px) and (max-width: 1024px)', {
                showPoint: false,
                axisX: {
                    labelInterpolationFnc: function (value) {
                        return 'A' + value;
                    }
                }
            }],
            ['screen and (max-width: 640px)', {
                showPoint: false,
                axisX: {
                    labelInterpolationFnc: function (value) {
                        return 'A' + value;
                    }
                }
            }]
        ];
        new Chartist.Line(`#${ID}progressionChart`, data, options, responsiveOptions);
    });
}