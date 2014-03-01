object @opponent_setup

node(:pieces) do |setup|
  setup.for_class(Piece).map do |p|
    { piece_type_id: p.piece_type_id, coordinate: p.coordinate, color: p.color }
  end
end

node(:terrains) do |setup|
  setup.for_class(Terrain).map do |t|
    { terrain_type_id: t.terrain_type_id, coordinate: t.coordinate }
  end
end