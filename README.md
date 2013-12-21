Overview
========

A web application that allows people to create and play their own variants of Cyvasse, a board game introduced by George RR Martin in his series of "Song of Fire and Ice".

Model Overview
==============

Variant - collection of rules for a game
  PieceRule - defines a rule for a piece type
    PieceType - building block, specifics for a pieces (name, image)
  TerrainRule - defines a rule for a terrain type
    TerrainType - building block, specifics for a terrain (name, color)

Game - two users playing a particular variant
  Piece - instance of a piece type in the game
  Terrain - instance of a terrain type in the game

Challenge - created by a single user for a particular variant,
  when accepted by another player a game is created

User