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
