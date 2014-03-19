object @game
attributes :action, :action_to_id, :alabaster_id, :onyx_id
node(:color) { |g| g.color(current_user.id) }
node(:alabaster_name) { |g| g.alabaster.username }
node(:onyx_name) { |g| g.onyx.username }
node(:variant_id) { |g| g.variant_id }

node :options do |g|
  out = g.variant.board_info

  if g.action == 'setup'
     out[:piece_types] = g.variant.piece_rules.pluck(:piece_type_id)
     out[:terrain_types] = g.variant.terrain_rules.pluck(:terrain_type_id)
  end

  out
end

node(:message, :if => lambda { |g| g.action == 'setup' }) do |g|
  g.variant.setup_message
end

node(:pieces) do |g|
  pieces = g.setup_for_user(current_user).for_class(Piece)
  pieces.map do |p|
    { piece_type_id: p.type_id, coordinate: p.coordinate, color: p.color }
  end
end

node(:terrains) do |g|
  terrains = g.setup_for_user(current_user).for_class(Terrain)
  terrains.map do |t|
    { terrain_type_id: t.type_id, coordinate: t.coordinate }
  end
end
