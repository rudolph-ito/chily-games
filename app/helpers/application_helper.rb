module ApplicationHelper

  def available_piece_types(variant)
    PieceType.where.not(id: variant.piece_rules.pluck(:piece_type_id))
  end

  def available_terrain_types(variant)
    TerrainType.where.not(id: variant.terrain_rules.pluck(:terrain_type_id))
  end

end
