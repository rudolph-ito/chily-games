########################################
# User
########################################

unless User.find_by(username: 'admin')
  User.create!(username: 'admin', email: 'admin@cyvasse.com', password: 'trustNO1', password_confirmation: 'trustNO1', admin: true)
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

%w( forest mountain water ).each do |tt|
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

########################################
# Discussions
########################################

data = [
  {title: 'Quotes', description: 'Discuss anything and everything regarding quotes from A Song of Ice and Fire.'},
  {title: 'Invariants and Rule Support', description: 'Discuss invariants and rule support and propose additions and removals.'},
  {title: 'Play', description: 'Discuss updates to the play interface. Please report bugs or anything that is not what you expected.'},
]

data.each do |datum|
  Discussion.find_by(datum) || Discussion.create(datum)
end
