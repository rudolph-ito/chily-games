object @game
attributes :action, :action_to_id, :alabaster_id, :onyx_id
node(:color) { |g| g.color(current_user.id) }
node(:alabaster_name) { |g| g.alabaster.username }
node(:onyx_name) { |g| g.onyx.username }

node :options do |g|
  out = g.variant.board_info

  if g.action == 'setup'
     out[:piece_types] = g.variant.piece_rules.pluck(:piece_type_id)
  end

  out
end

node(:message, :if => lambda { |g| g.action == 'setup' }) do |g|
  g.variant.setup_message
end

node(:pieces) do |g|
  pieces = g.pieces
  pieces = pieces.where(user_id: current_user.id) if g.action == 'setup'
  pieces.map do |p|
    { piece_type_id: p.piece_type_id, coordinate: p.coordinate, color: p.color }
  end
end
