########################################
# User
########################################

unless User.find_by(username: 'admin')
  User.create!(username: 'admin', email: 'admin@cyvasse.com', password: '12345678', password_confirmation: '12345678', admin: true)
end

unless User.find_by(username: 'user1')
  User.create!(username: 'user1', email: 'user1@cyvasse.com', password: '12345678', password_confirmation: '12345678', admin: false)
end

unless User.find_by(username: 'user2')
  User.create!(username: 'user2', email: 'user2@cyvasse.com', password: '12345678', password_confirmation: '12345678', admin: false)
end

########################################
# Piece Types
########################################

%w( catapult crossbow dragon elephant king heavy_horse light_horse rabble spear trebuchet ).each do |pt|
  name = pt.titleize

  attrs = {
    alabaster_image: File.open("lib/assets/piece_types/#{pt}_alabaster.svg"),
    name: name,
    onyx_image: File.open("lib/assets/piece_types/#{pt}_onyx.svg")
  }

  piece_type = PieceType.find_by(name: name)

  if piece_type
    piece_type.update_attributes!(attrs) unless piece_type.valid?
  else
    PieceType.create!(attrs)
  end
end

########################################
# Terrain Types
########################################

%w( mountain ).each do |tt|
  name = tt.titleize

  attrs = {
    image: File.open("lib/assets/terrain_types/#{tt}.png"),
    name: name
  }

  terrain_type = TerrainType.find_by(name: name)

  if terrain_type
    terrain_type.update_attributes!(attrs) unless terrain_type.valid?
  else
    TerrainType.create!(attrs)
  end
end

########################################
# Variants
########################################

unless Variant.find_by(name: 'sv1')
  variant = Variant.create!(name: 'sv1', user: User.first, board_type: 'square', board_rows: 7, board_columns: 7, number_of_pieces: 3)
  variant.piece_rules.create!(piece_type: PieceType.find_by(name: 'Dragon'), count_minimum: 1, count_maximum: 1, movement_type: 'orthogonal_or_diagonal_line', movement_minimum: 1)
  variant.piece_rules.create!(piece_type: PieceType.find_by(name: 'Light Horse'), count_minimum: 0, count_maximum: 1, movement_type: 'orthogonal_with_turns', movement_minimum: 2, movement_maximum: 3)
  variant.piece_rules.create!(piece_type: PieceType.find_by(name: 'Heavy Horse'), count_minimum: 0, count_maximum: 1, movement_type: 'diagonal_with_turns', movement_minimum: 1, movement_maximum: 3)
  variant.terrain_rules.create!(terrain_type: TerrainType.find_by(name: 'Mountain'), count_minimum: 0, count: 3, block_movement: true)
end


unless Variant.find_by(name: 'hv1')
  variant = Variant.create!(name: 'hv1', user: User.first, board_type: 'hexagonal', board_size: 4, number_of_pieces: 3)
  variant.piece_rules.create!(piece_type: PieceType.find_by(name: 'Dragon'), count_minimum: 1, count_maximum: 1, movement_type: 'orthogonal_or_diagonal_line', movement_minimum: 1)
  variant.piece_rules.create!(piece_type: PieceType.find_by(name: 'Light Horse'), count_minimum: 0, count_maximum: 1, movement_type: 'orthogonal_with_turns', movement_minimum: 2, movement_maximum: 3)
  variant.piece_rules.create!(piece_type: PieceType.find_by(name: 'Heavy Horse'), count_minimum: 0, count_maximum: 1, movement_type: 'diagonal_with_turns', movement_minimum: 1, movement_maximum: 3)
  variant.terrain_rules.create!(terrain_type: TerrainType.find_by(name: 'Mountain'), count: 3, block_movement: true)
end
