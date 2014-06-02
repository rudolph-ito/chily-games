object @game
attributes :action, :action_to_id, :alabaster_id, :boneyard, :onyx_id
node(:color) { |g| g.color(current_user.id) }
node(:alabaster_name) { |g| g.alabaster.username }
node(:onyx_name) { |g| g.onyx.username }
node(:variant_id) { |g| g.variant_id }

node :options do |g|
  out = g.variant.board_info

  if g.action == 'setup' && (g.action_to_id == nil || g.action_to_id == current_user.id)
    piece_types = g.variant.piece_rules.select([:piece_type_id, :count]).map do |pr|
      count = pr.count - @pieces.count{ |p| p.type_id == pr.piece_type_id }
      { id: pr.piece_type_id, count: count }
    end

    terrain_types = g.variant.terrain_rules.select([:terrain_type_id, :count]).map do |tr|
      count = tr.count - @terrains.count{ |t| t.type_id == tr.terrain_type_id }
      { id: tr.terrain_type_id, count: count }
    end

    out[:setup_data] = { piece_types: piece_types, terrain_types: terrain_types }
  end

  out
end

node(:pieces) do
  @pieces.map do |p|
    { piece_type_id: p.type_id, coordinate: p.coordinate, color: p.color }
  end
end

node(:terrains) do
  @terrains.map do |t|
    { terrain_type_id: t.type_id, coordinate: t.coordinate }
  end
end

node(:range_capture_piece_type_ids) do |g|
  g.variant.piece_rules.select do |pr|
    pr.range_capture?
  end.map(&:piece_type_id)
end

node(:move_and_range_capture_piece_type_ids) do |g|
  g.variant.piece_rules.select do |pr|
    pr.range_capture? && pr.move_and_range_capture?
  end.map(&:piece_type_id)
end

node :last_ply do |g|
  g.plies.to_a.last
end

node :piece_types do |g|
  g.variant.piece_rules.select([:piece_type_id, :count]).map do |pr|
    { id: pr.piece_type_id, count: pr.count }
  end
end

node :terrain_types do |g|
  g.variant.terrain_rules.select([:terrain_type_id, :count]).map do |tr|
    { id: tr.terrain_type_id, count: tr.count }
  end
end
