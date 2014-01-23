object @game

node(:pieces) do |g|
  pieces = g.pieces
  pieces = pieces.where.not(user_id: current_user.id)
  pieces.map do |p|
    { piece_type_id: p.piece_type_id, coordinate: p.coordinate, color: p.color }
  end
end