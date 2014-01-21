object @game
attributes :action, :action_to_id, :alabaster_id, :onyx_id

node do |g|
  g.variant.board_info
end

node(:color) { |g| g.color(current_user.id) }
node(:alabaster_name) { |g| g.alabaster.username }
node(:onyx_name) { |g| g.onyx.username }

node(:piece_types, :if => lambda { |g| g.action == 'setup' }) do |g|
  g.variant.piece_rules.map(&:piece_type_id)
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
