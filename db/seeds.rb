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
    image: File.open("lib/assets/terrain_types/#{tt}.svg"),
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
  variant = Variant.create!(name: 'sv1', user: User.first, board_type: 'square', board_rows: 7, board_columns: 7)

  variant.piece_rules.create!(
    piece_type: PieceType.find_by(name: 'Dragon'), count: 1,
    movement_minimum: 1, movement_maximum: nil, movement_type: 'orthogonal_or_diagonal_line',
    capture_type: 'movement'
  )

  variant.piece_rules.create!(
    piece_type: PieceType.find_by(name: 'Crossbow'), count: 1,
    movement_minimum: 1, movement_maximum: 1, movement_type: 'orthogonal_line',
    capture_type: 'range',
    range_minimum: 1, range_maximum: 1, range_type: 'diagonal_line'
  )

  variant.piece_rules.create!(
    piece_type: PieceType.find_by(name: 'Trebuchet'), count: 1,
    movement_minimum: 1, movement_maximum: 1, movement_type: 'orthogonal_line',
    capture_type: 'range',
    range_minimum: 2, range_maximum: 4, range_type: 'orthogonal_line'
  )

  variant.piece_rules.create!(
    piece_type: PieceType.find_by(name: 'Light Horse'), count: 1,
    movement_minimum: 2, movement_maximum: 3, movement_type: 'orthogonal_with_turns',
    capture_type: 'movement'
  )

  variant.terrain_rules.create!(
    terrain_type: TerrainType.find_by(name: 'Mountain'), count: 3,
    block_movement_type: 'exclude', block_movement_piece_type_ids: [PieceType.find_by(name: 'Dragon').id.to_s],
    block_range_type: 'exclude', block_range_piece_type_ids: [PieceType.find_by(name: 'Trebuchet').id.to_s]
  )
end


unless Variant.find_by(name: 'hv1')
  variant = Variant.create!(name: 'hv1', user: User.first, board_type: 'hexagonal', board_size: 4)

  variant.piece_rules.create!(
    piece_type: PieceType.find_by(name: 'Dragon'), count: 1,
    movement_minimum: 1, movement_maximum: nil, movement_type: 'orthogonal_line',
    capture_type: 'movement',
  )

  variant.piece_rules.create!(
    piece_type: PieceType.find_by(name: 'Trebuchet'), count: 1,
    movement_minimum: 1, movement_maximum: 1, movement_type: 'orthogonal_line',
    capture_type: 'range',
    range_minimum: 2, range_maximum: 4, range_type: 'orthogonal_line'
  )

  variant.piece_rules.create!(
    piece_type: PieceType.find_by(name: 'Crossbow'), count: 1,
    movement_minimum: 1, movement_maximum: 1, movement_type: 'orthogonal_line',
    capture_type: 'range',
    range_minimum: 1, range_maximum: 1, range_type: 'diagonal_line'
  )

  variant.piece_rules.create!(
    piece_type: PieceType.find_by(name: 'Light Horse'), count: 1,
    movement_minimum: 2, movement_maximum: 3, movement_type: 'orthogonal_with_turns',
    capture_type: 'movement'
  )

  variant.terrain_rules.create!(
    terrain_type: TerrainType.find_by(name: 'Mountain'), count: 3,
    block_movement_type: 'exclude', block_movement_piece_type_ids: [PieceType.find_by(name: 'Dragon').id.to_s],
    block_range_type: 'exclude', block_range_piece_type_ids: [PieceType.find_by(name: 'Trebuchet').id.to_s]
  )
end


########################################
# Quotes
########################################

contents = File.read( Rails.root.join('references.md') )
contents = contents.split("\n\n---\n\n")
contents.each do |quote_section|
  lines = quote_section.split("\n")

  book_match = lines[0].match(/^Book\: (?<number>[0-9]+)\, (?<name>.*)$/)
  chapter_match = lines[1].match(/^Chapter\: (?<number>[0-9]+)\, (?<name>.*)$/)
  description_match = lines[2].match(/^Description\: (?<description>.*)$/)
  number_match = lines[3].match(/^Number\: (?<number>[0-9]+)$/)
  text = lines[5..-1].join("\n")

  quote_data = {
    book_number: book_match[:number], book_name: book_match[:name],
    chapter_number: chapter_match[:number], chapter_name: chapter_match[:name],
    description: description_match[:description], number: number_match[:number],
    text: text
  }

  Quote.find_by(quote_data) || Quote.create(quote_data)
end
