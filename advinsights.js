'use strict'

require('dotenv').config();
const axios = require('axios');
const fs = require("fs");
const jwt = require('jsonwebtoken');


const ACCT_KEY = process.env.ACCT_KEY;
const ACCT_SECRET = process.env.ACCT_SECRET;
var startdate = process.env.START; // format "2023-01-01"
var enddate = process.env.END; // format "2023-01-01"

const url = "https://insights.opentok.com/graphql";
const projurl = "https://api.opentok.com/v2/project";
function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

//----------- Start of Real Code
function createTokenTokBox(apiKey, apiSecret, type) {
  const currentTime = Math.floor(new Date() / 1000);
  return jwt.sign({
    iss: apiKey,
    ist: type,
    iat: currentTime,
    exp: currentTime + (60 * 60) // 1 hour
  }, apiSecret);
};

async function doQuery(key, secret) {
  const token = createTokenTokBox(key, secret, 'project');
  var myQuery = `{
  project(projectId: ${key}) {
    sessionData {
      sessionSummaries(start:"${startdate}" , end: "${enddate}" ) {
        totalCount
        resources {
          sessionId
          mediaMode
          participantMinutes {
            from1To2Publishers
            from3To6Publishers
            from5To8Publishers
            from9To10Publishers
            from11To35Publishers
          }
        }
      }
    }
  }
}
`;
  const {
    data
  } = await axios.post(url, {
    query: myQuery
  },
    {
      headers: {
        'Content-Type': 'application/json',
        'X-OPENTOK-AUTH': token
      }
    }
  );
  //  console.log("Results: ", data?.data?.project?.sessionData?.sessionSummaries);
  return data.data?.project?.sessionData?.sessionSummaries;
}
async function getProjects() {
  const token = createTokenTokBox(process.env.ACCT_KEY, process.env.ACCT_SECRET, 'account');
  const
    { data }
      = await axios.get(projurl,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-OPENTOK-AUTH': token
          }
        }
      );
  writeLog("Total Projects: " + data?.length);
  return data;
}
async function getProject(key, secret) {
  var results = await doQuery(key, secret);
  writeLog(`Conferences in Project ${key}: ` + results?.resources?.length)
  if (results?.resources) {
    results.resources.forEach(entry => {
      console.log(`Entry ${key}: `, entry)
      total++;
      if (entry.mediaMode === 'routed') {
        routed++;
        if (entry.participantMinutes?.from1To2Publishers > 0) {
          from1To2Publishers++;
        };
        if (entry.participantMinutes?.from3To6Publishers > 0) {
          from3To6Publishers++;
        };
        if (entry.participantMinutes?.from5To8Publishers > 0) {
          from5To8Publishers++;
        };
        if (entry.participantMinutes?.from9To10Publishers > 0) {
          from9To10Publishers++;
        };
        if (entry.participantMinutes?.from11To35Publishers > 0) {
          from11To35Publishers++;
        };
      }
    });
  }
}
var totprojects = 0;
var total = 0;
var routed = 0;
var from1To2Publishers = 0;
var from3To6Publishers = 0;
var from5To8Publishers = 0;
var from9To10Publishers = 0;
var from11To35Publishers = 0;

let filename = startdate + '_to_' + enddate + '_' + (Math.floor(new Date().getTime() / 1000)) + '.out';
var logger = fs.createWriteStream(filename, {
  flags: 'a' // 'a' means appending (old data will be preserved)
})
writeLog("Filename: " + filename);

function writeLog(txt) {
  logger.write(txt + '\n');
  console.log(txt);
}
async function main() {
  let projects = await getProjects();
  let start = Date.now();
  if (projects?.length > 0) {
    for (const proj of projects) {
      let now = Date.now();
      console.log("===================================================================Project Call for ", proj.id, now)
      await getProject(proj.id, proj.secret);
      let elapsed = Date.now() - now;
      console.log("Elapsed: " + elapsed);
      if (elapsed < 300) {
        await sleep(300 - elapsed); // REST throttling at 300ms
      }
    }
  }
  writeLog('\n\n');
  writeLog("Start Date: " + startdate);
  writeLog("End Date: " + enddate);
  writeLog(`Total Time (s): ` + Math.floor((Date.now() - start) / 1000));
  writeLog(`Total Conferences: ` + total);
  writeLog(`Total Projects: ` + projects?.length);
  writeLog(`Total Routed: ` + routed);
  writeLog(`Total # with from1To2Publishers minutes: ` + from1To2Publishers);
  writeLog(`Total # with from3To6Publishers minutes: ` + from3To6Publishers);
  writeLog(`Total # with from5To8Publishers minutes: ` + from5To8Publishers);
  writeLog(`Total # with from9To10Publishers minutes: ` + from1To2Publishers);
  writeLog(`Total # with from11To35Publishers minutes: ` + from11To35Publishers);
  logger.end() // close string
}
main();
