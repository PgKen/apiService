var express = require('express');
var router = express.Router();

var moment = require('moment');

var unirest = require('unirest');
//var rfid = require('node-rfid');


//var mysql = require('mysql')


const apiKey = "1a2b3c4d5e6d"
const contTitle = "ระบบจัดการโปรแกรม"
const contFnTitle = "ระบบงานแจ้งซ่อม"
let login

const urlChkLogin = "http://172.16.1.188:4400/fn-chkLogin"
//const urlChkLogin = "http://localhost:4400/fn-chkLogin"
//const urlChkLogin = "http://taladsrimuang.com:4400/fn-chkLogin"
/******* sendJob */
const urlSendJob = "http://172.16.1.188:4400/fn-sendJob"
//const urlChkLogin = "http://localhost:4400/fn-chkLogin"
//const urlChkLogin = "http://taladsrimuang.com:4400/fn-chkLogin"
/***** End SendJob */

/***** RFID */




// create an instance of the rpi-mfrc522 class using the default settings
router.get('/readCard', (req, res) => {
  const RPiMfrc522 = require('rpi-mfrc522');

  let mfrc522 = new RPiMfrc522();

  // initialize the class instance then start the detect card loop
  mfrc522.init()
    .then(() => {
      loop();
    })
    .catch(error => {
      console.log('ERROR:', error.message)
    });


  // loop method to start detecting a card
  function loop() {
    console.log('Loop start...');
    cardDetect()
      .catch(error => {
        console.log('ERROR', error.message);
      });
  }


  // delay then call loop again
  function reLoop() {
    setTimeout(loop, 25);
  }

  // call the rpi-mfrc522 methods to detect a card
  async function cardDetect() {
    // use the cardPresent() method to detect if one or more cards are in the PCD field
    if (!(await mfrc522.cardPresent())) {
      console.log('No card')
      return reLoop();
    }
    // use the antiCollision() method to detect if only one card is present and return the cards UID
    let uid = await mfrc522.antiCollision();
    if (!uid) {
      // there may be multiple cards in the PCD field
      console.log('Collision');
      return reLoop();
    }
    console.log('Card detected, UID ' + uidToString(uid));
    await mfrc522.resetPCD()
    reLoop();
  }


  // convert the array of UID bytes to a hex string
  function uidToString(uid) {
    return uid.reduce((s, b) => {
      return s + (b < 16 ? '0' : '') + b.toString(16);
    }, '');
  }
  /***** END RFID */

})




let dateNow = new Date();
// Conver Time
function convertDateInDBFormate(timestamp) {
  //If input date is not valid date then assign a default value
  if ((new Date(timestamp)).getTime() > 0) {
    var date = new Date(timestamp);
    return (date.getFullYear() + '-' + (date.getMonth() + 01) + '-' + date.getDate());
  } else {
    return '1900-01-01';
  }
}



/* GET home page. */
router.get('/', function (req, res, next) {
  /*
  res.render('index', {
    title: 'Express2'
  });
  */
  res.redirect('service-login')
});




router.get('/login', (req, res) => {
  let statusLogin = req.cookies['loginCookie']
  //console.log('xx =' + statusLogin);
  if (statusLogin == 'yes') {
    res.redirect('account')
  } else {
    res.render('login', {
      title: contTitle,
      subTitle: 'Login'
    })
  }
})


router.get('/job', (req, res) => {
  let statusLogin = req.cookies['loginCookie']
  if (statusLogin == 'yes') {
    res.render('job', {
      title: contTitle,
      subTitle: 'แบบฟอร์มแจ้งซ่อม',
      moment: moment,
      dateNow: dateNow
    })
  } else {
    res.render('login', {
      title: contTitle,
      subTitle: 'Login'
    })
  }
})


router.get('/logout', (req, res) => {
  //res.clearCookie("loginCookie");
  res.clearCookie("statusLogin");
  let val_statusLogin = req.cookies['statusLogin']
  console.log(val_statusLogin);

  res.redirect('service-login')
  //res.send('test')
})

router.post('/addJob', (req, res) => {
  let data = req.body
  console.log(data);

  // let sql = "INSERT INTO job (mode_id,detail_job,user_id,date_job,time_job,tel_job,service)"
  // sql += "VALUES("
  // sql += "'"+data.+"',"
  // sql += ")"

  res.render('jobSuccess', {
    title: contTitle,
    subTitle: 'กำลังบันทึก'
  })

})

router.get('/jobSuccess2', (req, res) => {
  //console.log(data);

  res.render('jobSuccess2', {
    title: contTitle,
    subTitle: 'บันทึกสำเร็จ'
  })
})

router.get('/service-login', (req, res) => {
  res.render('serviceLogin', {
    title: contFnTitle,
    subTitle: "login"
  })
})


// ส่งเช็ค User password
router.post('/service-chkLogin', (req, res) => {
  let data = req.body
  let user = data.user
  let password = data.password
  //console.log(data);


  const response = new Promise(resolve => {
    unirest.post(urlChkLogin)
      .headers({
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      })
      .send(data)
      .end(function (response) {
        resolve(response.body); // ส่งเข้ามาแค่ body ส่งต่อ then()
        //resolve(response); //  ส่งเข้ามาจาก Host ทั้งหมด
      });
  });

  response.then(function (resp) {
    console.log(resp);
    if (resp.statusLogin == 'autPass') {

      res.cookie('statusLogin', resp.statusLogin)
      //res.send('okPass')
      let val_statusLogin = req.cookies['statusLogin'] // set Cookie statusLogin
      console.log(val_statusLogin);
      res.render('fnService', {
        title: contFnTitle,
        subTitle: "ฟอร์มแจ้งซ่อม",
        moment: moment,
        dateNow: dateNow,
        data: resp
      })
      // res.redirect('fn-service')
    } else {
      res.redirect('service-login')
    }
    // expected output: "Success!"
  });
})


router.post('/sendJob', (req, res) => {
  let data = req.body
  // console.log(data);
  // res.send("ok")
  const response = new Promise(resolve => {
    unirest.post(urlSendJob)
      .headers({
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      })
      .send(data)
      .end(function (response) {
        resolve(response.body); // ส่งเข้ามาแค่ body ส่งต่อ then()
        //resolve(response); //  ส่งเข้ามาจาก Host ทั้งหมด
      });
  });

  response.then(function (resp) {
    console.log(resp);
  })
  res.redirect('service-login')
  //res.send("testJob")

})

router.get('/rfid', (req, res) => {
  rfid.readintime(5000, function (err, result) {
    if (err) console.log("Sorry, some hardware error occurred"); //some kind of hardware/wire error
    if (result == "timeout") {
      console.log("Sorry, You timed out"); //check if time exceeded the time you passed as argument and print timeout message
    } else {
      console.log(result); //print rfid tag UID
    }
  });
  res.send("RFID2")
})


router.get('/api/podcasts', (req, res) => {
  let url = "http://taladsrimuang.com:4300/1a2b3c4d5e6d/dataJobMode"
  unirest.get(url).end((response) => {
    //make sure response should be a JSON object
    res.status(200).send(response)
  });
});



module.exports = router;