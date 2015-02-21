Install dependencies:

cd eruka
# Will take a few seconds
npm install



curl -s localhost:8080/game/1 | underscore print

curl -s -d opp=2 localhost:8080/game | underscore print
