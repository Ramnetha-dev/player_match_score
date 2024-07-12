const express = require('express')
const app = express()
const path = require('path')
const dbPath = path.join(__dirname, 'cricketMatchDetails.db')
const sqlite3 = require('sqlite3')
let db = null
const {open} = require('sqlite')
const InitializationDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is running at http://localhost:3000')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
InitializationDBAndServer()

app.get('/players/', async (request, response) => {
  const getPlayersDetails = `SELECT * FROM player_details;`
  const value = await db.all(getPlayersDetails)
  const result = value.map(each => ({
    playerId: each.player_id,
    playerName: each.player_name,
  }))
  response.send(result)
})

app.get('/players/:playerId', async (request, response) => {
  const {playerId} = request.params
  const getPlayerDetails = `SELECT * FROM player_details WHERE player_id = ${playerId};`
  const result = await db.get(getPlayerDetails)
  response.send({
    playerId: result.player_id,
    playerName: result.player_name,
  })
})

app.put('/players/:playerId', async (request, response) => {
  const {playerId} = request.params
  const playerName = request.body

  const value = `UPDATE player_details 
  SET 
  player_name = "${playerName}"
  
  WHERE player_id = ${playerId} ;`
  await db.run(value)
  response.send('Player Details Updated')
})

app.get('/matches/:matchId', async (request, response) => {
  const {matchId} = request.params
  const value = `SELECT * FROM match_details WHERE match_id = ${matchId};`
  const result = await db.get(value)
  response.send({
    matchId: result.match_id,
    match: result.match,
    year: result.year,
  })
})

app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params
  const value = `SELECT * FROM player_match_score NATURAL JOIN match_details WHERE player_id = ${playerId};`
  const result = await db.all(value)

  const listOfResult = result.map(each => ({
    matchId: each.match_id,
    match: each.match,
    year: each.year,
  }))
  response.send(listOfResult)
})

app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params
  const getPlayerId = `SELECT * FROM player_match_score NATURAL JOIN player_details WHERE match_id = ${matchId};`
  const result = await db.all(getPlayerId)

  const listOfPlayers = result.map(each => ({
    playerId: each.player_id,
    playerName: each.player_name,
  }))
  response.send(listOfPlayers)
})

app.get('/players/:playerId/playerScores', async (request, response) => {
  const {playerId} = request.params
  const getPlayerQuery = `SELECT player_details.player_id AS playerId, player_details.player_name AS playerName, SUM(player_match_score.score) AS totalScore, SUM(fours) AS totalFours, SUM(sixes) AS totalSixes FROM player_details INNER JOIN player_match_score 
  ON player_details.player_id = player_match_score.player_id WHERE player_details.player_id = ${playerId}`
  const result = await db.get(getPlayerQuery)
  response.send(result)
})

module.exports = app
