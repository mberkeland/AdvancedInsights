# AdvancedInsights

> Script for traversing through all Projects and gathering Session Data

## Build Setup

``` bash
# install dependencies
npm install

# Set up .env variables, based on the sample sample_env
ACCT_KEY = xxxxxx
ACCT_SECRET = xxxxxxxxxxxxxxx
START = "2023-01-01"
END = "2023-05-01"

# Run the script.  It will write to the console. as well as output to a file with the filename "START_to_END_XXXXX.out", where START is the start date from .env, END is the end date from .env, and XXXXX is a random number
node advinsights.js

Output to (example): 2023-01-01_to_2023-05-01_1684342453.out
```
